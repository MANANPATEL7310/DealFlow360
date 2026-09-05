import { env } from "../config/env.js";
import { db } from "../lib/db.js";
import { llm } from "./llm.js";

type SimilarRow = {
  refId: string;
  content: string;
  score: number;
};

export async function embed(text: string): Promise<number[]> {
  const res = await llm.embeddings.create({
    model: env.AI_EMBEDDING_MODEL,
    input: text,
  });
  const first = res.data[0];
  if (!first) {
    throw new Error("AI_EMBEDDING_EMPTY");
  }

  return first.embedding;
}

export async function upsertEmbedding(
  kind: string,
  refId: string,
  content: string,
) {
  const vector = await embed(content);
  const literal = `[${vector.join(",")}]`;

  await db.$executeRaw`
    INSERT INTO "Embedding" ("id", "kind", "refId", "content", "vector", "createdAt")
    VALUES (gen_random_uuid()::text, ${kind}, ${refId}, ${content}, ${literal}::vector, now())
  `;
}

export async function similar(kind: string, queryVector: number[], k = 5) {
  const literal = `[${queryVector.join(",")}]`;

  return db.$queryRaw<SimilarRow[]>`
    SELECT "refId", content, 1 - (vector <=> ${literal}::vector) AS score
    FROM "Embedding"
    WHERE kind = ${kind}
    ORDER BY vector <=> ${literal}::vector
    LIMIT ${k}
  `;
}
