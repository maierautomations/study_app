export interface TextChunk {
  content: string;
  chunkIndex: number;
}

const DEFAULT_CHUNK_SIZE = 3000; // ~750 tokens
const DEFAULT_OVERLAP = 500; // ~125 tokens

export function chunkText(
  text: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
  overlap = DEFAULT_OVERLAP
): TextChunk[] {
  const cleanedText = text.replace(/\n{3,}/g, "\n\n").trim();

  if (!cleanedText) return [];
  if (cleanedText.length <= chunkSize) {
    return [{ content: cleanedText, chunkIndex: 0 }];
  }

  const paragraphs = cleanedText.split(/\n\n+/);
  const chunks: TextChunk[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    // If adding this paragraph would exceed chunk size, save current and start new
    if (currentChunk && currentChunk.length + trimmed.length + 2 > chunkSize) {
      chunks.push({ content: currentChunk.trim(), chunkIndex });
      chunkIndex++;

      // Start new chunk with overlap from end of previous chunk
      if (overlap > 0 && currentChunk.length > overlap) {
        const overlapText = currentChunk.slice(-overlap);
        const lastSentenceBreak = overlapText.search(/[.!?]\s/);
        currentChunk =
          lastSentenceBreak > 0
            ? overlapText.slice(lastSentenceBreak + 2)
            : overlapText;
      } else {
        currentChunk = "";
      }
    }

    // If a single paragraph is longer than chunk size, split it by sentences
    if (trimmed.length > chunkSize) {
      const sentences = trimmed.match(/[^.!?]+[.!?]+\s*/g) || [trimmed];
      for (const sentence of sentences) {
        if (
          currentChunk &&
          currentChunk.length + sentence.length > chunkSize
        ) {
          chunks.push({ content: currentChunk.trim(), chunkIndex });
          chunkIndex++;
          currentChunk = "";
        }
        currentChunk += sentence;
      }
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmed;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push({ content: currentChunk.trim(), chunkIndex });
  }

  return chunks;
}
