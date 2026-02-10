import { embedMany } from "ai";
import { getEmbeddingModel } from "./provider";

const BATCH_SIZE = 100;

export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const model = getEmbeddingModel();
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const { embeddings } = await embedMany({ model, values: batch });
    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}
