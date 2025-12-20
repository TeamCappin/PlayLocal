import re
from dataclasses import dataclass, field
from typing import Any, Iterable, List, Optional, Sequence, Tuple

import dspy
from attachments import split as split_namespace
from attachments.core import Attachment as AttachmentItem
from attachments.core import AttachmentCollection
from attachments.dspy import Attachments
from dotenv import load_dotenv
import os 
import logging

logger = logging.getLogger(__name__)

load_dotenv()


@dataclass
class DocumentChunk:
    """Structured representation of a semantic span of the document."""

    chunk_id: str
    text: str
    title: str = ""
    summary: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class DocumentMetadata:
    """Metadata bundle returned alongside the high-level summary."""

    source_paths: List[str]
    split_strategy: str
    chunk_count: int
    chunk_size_hint: Optional[int] = None
    average_characters_per_chunk: Optional[int] = None
    images_extracted: int = 0
    chunk_details: List[DocumentChunk] = field(default_factory=list)
    notes: dict[str, Any] = field(default_factory=dict)


LM_MODEL = os.getenv("LLM_MODEL", "openai/gpt-4o-mini")
LLM_API_KEY = os.getenv("LLM_API_KEY")

_LM_READY = False
_LM_ERROR: Optional[Exception] = None

_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")


def _configure_language_model() -> bool:
    """Configure DSPy with the requested language model once per process."""
    global _LM_READY, _LM_ERROR

    if _LM_READY:
        logger.debug("Language model already configured. Skipping re-init.")
        return True

    if _LM_ERROR is not None:
        logger.error(f"Previous LM configuration failed: {_LM_ERROR}")
        return False

    lm_kwargs = {}
    if LLM_API_KEY:
        lm_kwargs["api_key"] = LLM_API_KEY
        logger.debug("Using provided LLM_API_KEY in lm_kwargs")

    logger.info(f"Configuring language model: {LM_MODEL} ...")

    try:
        dspy.configure(lm=dspy.LM(LM_MODEL, **lm_kwargs))
        _LM_READY = True
        logger.info(f"Language model `{LM_MODEL}` configured successfully.")
    except Exception as exc:
        _LM_ERROR = exc
        logger.exception(f"Failed to configure language model `{LM_MODEL}`")

    return _LM_READY


class ChunkSummarySignature(dspy.Signature):
    """Summarize a single semantic chunk of the document."""

    chunk_text: str = dspy.InputField(desc="A coherent span of the original document.")
    chunk_title: str = dspy.OutputField(
        desc="Short heading (<=8 words) that captures the main idea of the chunk."
    )
    chunk_summary: str = dspy.OutputField(
        desc="One or two sentences describing the essential points in the chunk."
    )


class DocumentSummarySignature(dspy.Signature):
    """Compress chunk-level summaries into a document-level overview."""

    chunk_summaries: str = dspy.InputField(
        desc="List of chunk headings and synopses covering the entire document."
    )
    overall_summary: str = dspy.OutputField(
        desc="Concise paragraph (<=8 sentences) summarizing the whole document."
    )


class DocumentAnalyzer(dspy.Module):
    """Analyze documents by splitting them into semantic chunks and summarizing each piece."""

    def __init__(
        self,
        split_strategy: str = "tokens",
        chunk_token_target: int = 450,
        max_chunks: Optional[int] = None,
    ):
        super().__init__()
        self.split_strategy = split_strategy
        self.chunk_token_target = chunk_token_target
        self.max_chunks = max_chunks

        self._lm_available = _configure_language_model()
        self.chunk_summarizer = (
            dspy.ChainOfThought(ChunkSummarySignature) if self._lm_available else None
        )
        self.document_summarizer = (
            dspy.ChainOfThought(DocumentSummarySignature) if self._lm_available else None
        )

    def forward(self, document: Attachments | str | Sequence[str]) -> dspy.Prediction:
        attachments = self._ensure_attachments(document)
        chunk_attachments = self._split_attachments(attachments)

        chunk_details: List[DocumentChunk] = []
        total_chars = 0
        skipped_chunks = 0

        for index, chunk in enumerate(chunk_attachments, start=1):
            chunk_text = (chunk.text or "").strip()
            if not chunk_text:
                skipped_chunks += 1
            else:
                total_chars += len(chunk_text)

            title, summary = self._summarize_chunk(chunk, index)

            chunk_details.append(
                DocumentChunk(
                    chunk_id=chunk.path or f"chunk-{index}",
                    text=chunk_text,
                    title=title,
                    summary=summary,
                    metadata=dict(chunk.metadata or {}),
                )
            )

        overall_summary = self._summarize_document(chunk_details)
        average_chars = (
            int(total_chars / (len(chunk_details) - skipped_chunks))
            if chunk_details and (len(chunk_details) - skipped_chunks) > 0
            else None
        )

        metadata = DocumentMetadata(
            source_paths=[att.path for att in attachments.attachments],
            split_strategy=self.split_strategy,
            chunk_count=len(chunk_details),
            chunk_size_hint=self.chunk_token_target if self.split_strategy == "tokens" else None,
            average_characters_per_chunk=average_chars,
            images_extracted=sum(len(att.images) for att in attachments.attachments),
            chunk_details=chunk_details,
            notes={
                "lm_available": self._lm_available,
                "lm_error": str(_LM_ERROR) if _LM_ERROR else None,
                "skipped_chunks": skipped_chunks,
            },
        )

        return dspy.Prediction(summary=overall_summary, metadata=metadata)

    def _ensure_attachments(self, document: Attachments | str | Sequence[str]) -> Attachments:
        """Convert input into an Attachments object if needed."""
        if isinstance(document, Attachments):
            return document
        if isinstance(document, str):
            return Attachments(document)
        if isinstance(document, Iterable):
            return Attachments(*document)

        raise TypeError(
            "DocumentAnalyzer expects an Attachments object, a single path string, "
            "or an iterable of path strings."
        )

    def _split_attachments(self, attachments: Attachments) -> List[AttachmentItem]:
        """Apply the configured split strategy to every attachment."""
        splitter = getattr(split_namespace, self.split_strategy, None)
        if splitter is None:
            raise ValueError(f"Unknown split strategy '{self.split_strategy}'.")

        all_chunks: List[AttachmentItem] = []

        for att in attachments.attachments:
            chunks = self._apply_splitter(att, splitter)
            all_chunks.extend(chunks)
            if self.max_chunks and len(all_chunks) >= self.max_chunks:
                return all_chunks[: self.max_chunks]

        return all_chunks or attachments.attachments

    def _apply_splitter(
        self,
        attachment: AttachmentItem,
        splitter,
    ) -> List[AttachmentItem]:
        """Apply a splitter while respecting custom chunk size hints."""
        command_key = {
            "tokens": "tokens",
            "characters": "characters",
            "lines": "lines",
            "paragraphs": None,
            "sentences": None,
            "pages": None,
        }.get(self.split_strategy, None)

        commands = getattr(attachment, "commands", None)

        original_value: Optional[Any] = None
        if command_key and commands is not None:
            original_value = commands.get(command_key)
            if self.split_strategy == "tokens":
                commands[command_key] = str(self.chunk_token_target)


        result = splitter(attachment)

        if command_key and hasattr(attachment, "commands"):
            if original_value is None:
                attachment.commands.pop(command_key, None)
            else:
                attachment.commands[command_key] = original_value

        if isinstance(result, AttachmentCollection):
            return list(result.attachments)
        if isinstance(result, AttachmentItem):
            return [result]

        raise TypeError(
            f"Splitter '{self.split_strategy}' returned unsupported type: {type(result)}"
        )

    def _summarize_chunk(self, chunk: AttachmentItem, index: int) -> Tuple[str, str]:
        """Summarize a chunk using the LLM when available, otherwise fall back to heuristics."""
        text = (chunk.text or "").strip()
        if not text:
            title = chunk.metadata.get("chunk_type") or f"Chunk {index}"
            return title, ""

        if self.chunk_summarizer is None:
            return self._fallback_chunk_summary(text, index)

        try:
            response = self.chunk_summarizer(chunk_text=text)
            title = getattr(response, "chunk_title", "").strip()
            summary = getattr(response, "chunk_summary", "").strip()
            if not title:
                title = chunk.metadata.get("chunk_type") or self._derive_title_from_text(text)
            if not summary:
                _, summary = self._fallback_chunk_summary(text, index)
            return title, summary
        except Exception:  # pragma: no cover - only hit when LLM call fails
            return self._fallback_chunk_summary(text, index)

    def _summarize_document(self, chunks: List[DocumentChunk]) -> str:
        """Combine chunk-level insight into a single document summary."""
        if not chunks:
            return "No textual content detected in the provided document."

        if self.document_summarizer is None:
            return self._fallback_document_summary(chunks)

        context_lines = [
            f"{chunk.title or chunk.chunk_id}: {chunk.summary or chunk.text[:160]}"
            for chunk in chunks
        ]
        context = "\n".join(line.strip() for line in context_lines if line.strip())

        try:
            response = self.document_summarizer(chunk_summaries=context)
            summary = getattr(response, "overall_summary", "").strip()
            return summary or self._fallback_document_summary(chunks)
        except Exception:  
            return self._fallback_document_summary(chunks)

    def _fallback_chunk_summary(self, text: str, index: int) -> Tuple[str, str]:
        """Create a deterministic chunk title and summary without LLM support."""
        sentences = [s.strip() for s in _SENTENCE_SPLIT.split(text) if s.strip()]
        if not sentences:
            sentences = [text.strip()]

        title = self._derive_title_from_text(sentences[0]) if sentences else f"Chunk {index}"
        summary = " ".join(sentences[:2]) if sentences else text[:200]
        return title, summary

    def _fallback_document_summary(self, chunks: List[DocumentChunk]) -> str:
        """Summarize the document heuristically when the LLM is unavailable."""
        highlights = []
        for chunk in chunks[:5]: 
            descriptor = chunk.title or chunk.chunk_id
            content = chunk.summary or (chunk.text[:160] + "…" if chunk.text else "")
            if content:
                highlights.append(f"{descriptor}: {content}")

        if not highlights:
            return "Document contains content that could not be summarized automatically."

        return "Key highlights:\n" + "\n".join(f"- {entry}" for entry in highlights)

    @staticmethod
    def _derive_title_from_text(text: str) -> str:
        """Generate a short title from chunk text."""
        trimmed = text.strip().split("\n", 1)[0]
        if len(trimmed) > 80:
            trimmed = trimmed[:77].rstrip() + "..."
        return trimmed or "Chunk"


def analyze_document(
    document: Attachments | str | Sequence[str],
    split_strategy: str = "tokens",
    chunk_token_target: int = 450,
    max_chunks: Optional[int] = None,
) -> dspy.Prediction:
    """Convenience helper for one-off analyses."""
    analyzer = DocumentAnalyzer(
        split_strategy=split_strategy,
        chunk_token_target=chunk_token_target,
        max_chunks=max_chunks,
    )
    return analyzer(document)


if __name__ == "__main__":
    sample_path = os.getenv("SEMANTIC_ANALYZER_SAMPLE", "./data/prolongement-rue-desbalades-rue-leonise-valois.pdf")
    if sample_path and os.path.exists(sample_path):
        analysis = analyze_document(sample_path)
        print(analysis.summary)
    else:
        print(
            "Set the SEMANTIC_ANALYZER_SAMPLE environment variable to a document path "
            "to run a quick semantic analysis."
        )