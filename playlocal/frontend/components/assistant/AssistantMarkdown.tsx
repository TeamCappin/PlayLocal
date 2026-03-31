"use client";

import { Fragment } from "react";

/**
 * Renders PlayLocal assistant text (headings, bold, inline code, links, lists).
 * We avoid a full Markdown parser: CommonMark treats indented text as code blocks,
 * which wrapped entire replies in &lt;pre&gt; and looked like a JSON "pretty print" view.
 */
export function parseInline(text: string): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  let pos = 0;
  let key = 0;

  while (pos < text.length) {
    if (text.startsWith("**", pos)) {
      const end = text.indexOf("**", pos + 2);
      if (end !== -1) {
        nodes.push(
          <strong key={key++} className="font-semibold text-gray-900">
            {text.slice(pos + 2, end)}
          </strong>,
        );
        pos = end + 2;
        continue;
      }
    }
    if (text[pos] === "`") {
      const end = text.indexOf("`", pos + 1);
      if (end !== -1) {
        nodes.push(
          <code
            key={key++}
            className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[12px] text-gray-800"
          >
            {text.slice(pos + 1, end)}
          </code>,
        );
        pos = end + 1;
        continue;
      }
    }
    const rest = text.slice(pos);
    const linkMatch = rest.match(/^\[([^\]]*)\]\(([^)\s]+)\)/);
    if (linkMatch) {
      nodes.push(
        <a
          key={key++}
          href={linkMatch[2]}
          className="font-medium text-emerald-700 underline decoration-emerald-600/35 underline-offset-2 hover:text-emerald-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkMatch[1]}
        </a>,
      );
      pos += linkMatch[0].length;
      continue;
    }

    const searchFrom = pos + 1;
    let nextPos = text.length;
    const candidates = [
      text.indexOf("**", pos),
      text.indexOf("`", pos),
      text.indexOf("[", pos),
    ];
    for (const idx of candidates) {
      if (idx > pos && idx < nextPos) {
        nextPos = idx;
      }
    }
    const plain = text.slice(pos, nextPos);
    if (plain.length > 0) {
      nodes.push(plain);
    }
    pos = nextPos === pos ? pos + 1 : nextPos;
  }

  if (nodes.length === 0) {
    return null;
  }
  if (nodes.length === 1) {
    return nodes[0];
  }
  return <Fragment>{nodes}</Fragment>;
}

export function AssistantMarkdown({ text }: { text: string }) {
  const rawBlocks = text.split(/\n\n+/);
  const blocks: React.ReactNode[] = [];
  let blockKey = 0;

  for (const chunk of rawBlocks) {
    const b = chunk.trim();
    if (!b) {
      continue;
    }
    const k = blockKey++;

    if (b.startsWith("### ")) {
      blocks.push(
        <h3
          key={k}
          className="mt-3 text-sm font-semibold text-gray-900 first:mt-0"
        >
          {parseInline(b.slice(4).trim())}
        </h3>,
      );
      continue;
    }

    const lines = b.split("\n").map((l) => l.trimEnd());
    const listLines = lines.filter((l) => l.length > 0);
    if (
      listLines.length > 0 &&
      listLines.every((l) => l.trimStart().startsWith("- "))
    ) {
      blocks.push(
        <ul key={k} className="my-2 list-disc space-y-1 pl-5 text-[13px] text-gray-900">
          {listLines.map((line, j) => (
            <li key={j} className="leading-relaxed">
              {parseInline(line.trimStart().slice(2).trim())}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    const paragraph = lines.map((l) => l.trim()).join(" ");
    blocks.push(
      <p key={k} className="mb-2 text-[13px] leading-relaxed last:mb-0 text-gray-900">
        {parseInline(paragraph)}
      </p>,
    );
  }

  return (
    <div className="assistant-markdown min-w-0 break-words text-gray-900">
      {blocks}
    </div>
  );
}
