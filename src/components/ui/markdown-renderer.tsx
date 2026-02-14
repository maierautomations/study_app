"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

function preprocessLatex(content: string): string {
  // Convert \( ... \) to $ ... $ (inline math)
  let processed = content.replace(/\\\((.+?)\\\)/g, "$$$1$$");
  // Convert \[ ... \] to $$ ... $$ (block math, multiline)
  processed = processed.replace(/\\\[([\s\S]+?)\\\]/g, "$$$$$1$$$$");
  return processed;
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
  compact?: boolean;
}

export function MarkdownRenderer({
  content,
  className = "",
  compact = false,
}: MarkdownRendererProps) {
  const processed = preprocessLatex(content);

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none
        [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
        prose-headings:font-semibold
        prose-code:before:content-[''] prose-code:after:content-['']
        prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm
        prose-pre:bg-muted prose-pre:border prose-pre:border-border
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-blockquote:border-primary/50
        prose-strong:text-foreground
        ${compact ? "prose-p:my-1 prose-headings:my-2" : ""}
        ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {processed}
      </ReactMarkdown>
    </div>
  );
}
