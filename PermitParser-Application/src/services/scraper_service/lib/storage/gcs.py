"""Helpers for uploading scraper artifacts to Google Cloud Storage."""

from __future__ import annotations

import gzip
import os
import re
import shutil
import tempfile
import time
import unicodedata
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from google.api_core import exceptions as google_exceptions

try:  # pragma: no cover - optional dependency when mocking
    from google.cloud import storage
except ImportError:  # pragma: no cover
    storage = None  # type: ignore


class StorageClient:
    """Thin wrapper around ``google-cloud-storage`` with scraper defaults."""

    _DEFAULT_RESUMABLE_THRESHOLD = 8 * 1024 * 1024
    _DEFAULT_RESUMABLE_CHUNK_SIZE = 8 * 1024 * 1024
    _RETRYABLE_EXCEPTIONS = (
        google_exceptions.TooManyRequests,
        google_exceptions.ServiceUnavailable,
        google_exceptions.InternalServerError,
        google_exceptions.BadGateway,
    )

    def __init__(
        self,
        bucket_name: Optional[str] = None,
        *,
        client: Optional["storage.Client"] = None,
        max_attempts: int = 3,
        base_delay: float = 1.0,
        resumable_threshold: Optional[int] = None,
        resumable_chunk_size: Optional[int] = None,
        enable_gzip_for_text: bool = False,
    ) -> None:
        resolved_bucket = bucket_name or self._resolve_bucket_from_env()
        if not resolved_bucket:
            raise ValueError(
                "bucket_name must be provided or set via GCS_RAW_BUCKET/GCS_BUCKET/GCS_OPEN_BUCKET"
            )
        self.bucket_name = resolved_bucket
        if client is not None:
            self.client = client
        else:
            if storage is None:  # pragma: no cover - only triggered without dependency
                raise RuntimeError("google-cloud-storage must be installed to create a StorageClient")
            self.client = storage.Client()

        self.max_attempts = max(1, int(max_attempts))
        self.base_delay = max(0.0, float(base_delay))
        self.resumable_threshold = (
            self._DEFAULT_RESUMABLE_THRESHOLD if resumable_threshold is None else int(resumable_threshold)
        )
        self.resumable_chunk_size = (
            self._DEFAULT_RESUMABLE_CHUNK_SIZE if resumable_chunk_size is None else int(resumable_chunk_size)
        )
        self.enable_gzip_for_text = enable_gzip_for_text
        self._bucket = None

    def _get_bucket(self):
        if self._bucket is None:
            self._bucket = self.client.bucket(self.bucket_name)
        return self._bucket

    @staticmethod
    def _resolve_bucket_from_env() -> Optional[str]:
        for key in ("GCS_RAW_BUCKET", "GCS_BUCKET", "GCS_OPEN_BUCKET"):
            value = os.environ.get(key)
            if value:
                return value
        return None

    def upload_file(
        self,
        source: Path | str,
        object_name: Optional[str] = None,
        *,
        content_type: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
        resumable: Optional[bool] = None,
        enable_gzip: Optional[bool] = None,
        chunk_size: Optional[int] = None,
        timeout: Optional[float] = None,
        if_generation_match: Optional[int] = None,
        retry: Any = None,
    ) -> str:
        source_path = Path(source)
        if not source_path.exists():
            raise FileNotFoundError(source_path)

        if object_name is None:
            object_name = self._default_object_name(source_path)

        blob = self._get_bucket().blob(object_name)
        original_chunk_size = blob.chunk_size
        desired_chunk_size = self._determine_chunk_size(source_path, chunk_size, resumable)
        if desired_chunk_size is not None:
            blob.chunk_size = desired_chunk_size

        metadata_payload = dict(metadata or {})
        blob.metadata = metadata_payload or None

        upload_path = source_path
        temp_path: Optional[Path] = None
        compressed = self._should_gzip(content_type, enable_gzip)
        if compressed:
            upload_path = self._gzip_to_tempfile(source_path)
            temp_path = upload_path
            blob.content_encoding = "gzip"
        else:
            blob.content_encoding = None

        attempt = 0
        delay = self.base_delay
        try:
            while True:
                try:
                    blob.upload_from_filename(
                        upload_path.as_posix(),
                        content_type=content_type,
                        timeout=timeout,
                        if_generation_match=if_generation_match,
                        retry=retry,
                    )
                    break
                except self._RETRYABLE_EXCEPTIONS:
                    attempt += 1
                    if attempt >= self.max_attempts:
                        raise
                    if delay:
                        time.sleep(delay)
                        delay *= 2
        finally:
            blob.chunk_size = original_chunk_size
            if temp_path and temp_path.exists():
                temp_path.unlink()

        return f"gs://{self.bucket_name}/{object_name}"

    def upload_pdf(
        self,
        *,
        municipality_name: str,
        scraped_file: Path | str,
        project_id: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
    ) -> str:
        if not municipality_name:
            raise ValueError("municipality_name is required")

        metadata_payload = dict(metadata or {})
        muni_slug = self._slugify(municipality_name, separator="-") or "misc"
        metadata_payload["municipality"] = muni_slug
        if project_id and "projectId" not in metadata_payload:
            metadata_payload["projectId"] = project_id

        object_name = self._build_pdf_object_name(Path(scraped_file), muni_slug=muni_slug, project_id=project_id)
        return self.upload_file(
            scraped_file,
            object_name=object_name,
            content_type="application/pdf",
            metadata=metadata_payload,
        )

    def _determine_chunk_size(
        self,
        source_path: Path,
        chunk_size: Optional[int],
        resumable: Optional[bool],
    ) -> Optional[int]:
        if chunk_size:
            return chunk_size
        if self._should_use_resumable(source_path, resumable):
            return self.resumable_chunk_size
        return None

    def _should_use_resumable(self, source_path: Path, override: Optional[bool]) -> bool:
        if override is not None:
            return override
        try:
            size = source_path.stat().st_size
        except FileNotFoundError:
            return False
        return size >= self.resumable_threshold

    def _should_gzip(self, content_type: Optional[str], enable_gzip: Optional[bool]) -> bool:
        flag = enable_gzip if enable_gzip is not None else self.enable_gzip_for_text
        if not flag or not content_type:
            return False
        content_type = content_type.lower()
        if content_type.startswith("text/"):
            return True
        return content_type in {"application/json", "application/xml"}

    @staticmethod
    def _gzip_to_tempfile(source: Path) -> Path:
        fd, temp_name = tempfile.mkstemp(suffix=f"{source.suffix}.gz")
        os.close(fd)
        temp_path = Path(temp_name)
        with open(source, "rb") as src, gzip.open(temp_path, "wb") as dst:
            shutil.copyfileobj(src, dst)
        return temp_path

    @staticmethod
    def _slugify(value: str, *, separator: str = "_") -> str:
        normalized = unicodedata.normalize("NFKD", value)
        ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
        ascii_value = ascii_value.lower()
        ascii_value = re.sub(r"[^a-z0-9]+", separator, ascii_value)
        return ascii_value.strip(separator)

    @classmethod
    def _sanitize_filename(cls, path: Path, *, separator: str = "_") -> str:
        stem = cls._slugify(path.stem, separator=separator) or "document"
        suffix = path.suffix.lower()
        return f"{stem}{suffix}" if suffix else stem

    @classmethod
    def _default_object_name(cls, path: Path) -> str:
        now = datetime.now(timezone.utc)
        uuid_section = uuid.uuid4().hex[:8]
        filename = cls._sanitize_filename(path)
        return f"misc/{now:%Y/%m/%d}/{uuid_section}_{filename}"

    @classmethod
    def _build_pdf_object_name(
        cls,
        path: Path,
        *,
        muni_slug: str,
        project_id: Optional[str] = None,
    ) -> str:
        muni_segment = cls._slugify(muni_slug, separator="-") or "misc"
        project_segment = cls._slugify(project_id, separator="-") if project_id else None
        now = datetime.now(timezone.utc)
        uuid_section = uuid.uuid4().hex[:8]
        filename = cls._sanitize_filename(path)

        parts = [muni_segment]
        if project_segment:
            parts.append(project_segment)
        parts.append(f"{now:%Y/%m/%d}")
        object_suffix = f"{uuid_section}_{filename}"
        return "/".join(parts + [object_suffix])


def upload_scraped_pdf(
    *,
    scraped_file: Path | str,
    municipality_name: str,
    bucket_name: Optional[str] = None,
    project_id: Optional[str] = None,
    metadata: Optional[Dict[str, str]] = None,
    client: Optional["storage.Client"] = None,
    **storage_kwargs: Any,
) -> str:
    """Convenience helper used directly by scrapers."""

    storage_client = StorageClient(bucket_name=bucket_name, client=client, **storage_kwargs)
    return storage_client.upload_pdf(
        municipality_name=municipality_name,
        scraped_file=scraped_file,
        project_id=project_id,
        metadata=metadata,
    )


if __name__ == "__main__":  # pragma: no cover
    import argparse

    parser = argparse.ArgumentParser(description="Upload a document to GCS using StorageClient")
    parser.add_argument("file", type=Path, help="Path to the local file to upload")
    parser.add_argument("municipality", help="Municipality name used for folder structure")
    parser.add_argument("--project-id", help="Optional project identifier to segment files")
    parser.add_argument(
        "--bucket",
        help=(
            "Override the destination bucket. If omitted, StorageClient will read "
            "GCS_RAW_BUCKET/GCS_BUCKET/GCS_OPEN_BUCKET in that order."
        ),
    )
    parser.add_argument(
        "--content-type",
        default="application/pdf",
        help="MIME type to set on the uploaded file (default: application/pdf)",
    )
    parser.add_argument(
        "--metadata",
        nargs="*",
        metavar="KEY=VALUE",
        help="Optional metadata entries (repeat as KEY=VALUE).",
    )

    args = parser.parse_args()
    metadata = {}
    if args.metadata:
        for item in args.metadata:
            if "=" not in item:
                parser.error(f"Invalid metadata entry '{item}'. Expected KEY=VALUE format.")
            key, value = item.split("=", 1)
            metadata[key] = value

    client = StorageClient(bucket_name=args.bucket)
    uploader = client.upload_pdf if args.content_type == "application/pdf" else client.upload_file
    if uploader is client.upload_pdf:
        uri = uploader(
            municipality_name=args.municipality,
            scraped_file=args.file,
            project_id=args.project_id,
            metadata=metadata or None,
        )
    else:
        uri = uploader(
            args.file,
            object_name=None,
            content_type=args.content_type,
            metadata=metadata or None,
        )
    print(f"Uploaded to {uri}")
