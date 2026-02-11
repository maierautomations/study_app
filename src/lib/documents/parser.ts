import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export async function extractText(
  buffer: Buffer,
  fileType: "pdf" | "docx" | "txt"
): Promise<string> {
  switch (fileType) {
    case "pdf": {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      return result.text;
    }
    case "docx": {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case "txt": {
      return buffer.toString("utf-8");
    }
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}
