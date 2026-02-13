// Generates Anki-compatible tab-separated text file
// Format: front\tback (one card per line)
// Users can import this directly into Anki via File → Import

type Flashcard = {
  front: string;
  back: string;
};

function sanitize(text: string): string {
  // Replace tabs and newlines with spaces (Anki uses tabs as delimiter)
  return text.replace(/\t/g, " ").replace(/\n/g, "<br>");
}

export function generateAnkiExport(
  flashcards: Flashcard[],
  deckName: string
): string {
  // Anki import header (optional but helpful)
  const header = `#separator:tab\n#html:true\n#deck:${sanitize(deckName)}\n#notetype:Basic\n`;

  const lines = flashcards.map(
    (fc) => `${sanitize(fc.front)}\t${sanitize(fc.back)}`
  );

  return header + lines.join("\n") + "\n";
}
