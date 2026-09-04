import { GoogleGenAI } from "@google/genai";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { adminDb, adminStorage } from "@/lib/firebase/admin";

const embeddingClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const EMBEDDING_DIMENSION = 768;

export async function extractText(buffer: Buffer, contentType: string, name: string) {
  if (contentType === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try { return (await parser.getText()).text; } finally { await parser.destroy(); }
  }
  if (contentType.includes("wordprocessingml") || name.toLowerCase().endsWith(".docx")) {
    return (await mammoth.extractRawText({ buffer })).value;
  }
  return buffer.toString("utf8");
}

export function splitIntoChunks(text: string, size = 1200, overlap = 150) {
  const clean = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);
    if (end < clean.length) {
      const boundary = Math.max(clean.lastIndexOf("\n", end), clean.lastIndexOf("。", end), clean.lastIndexOf(". ", end));
      if (boundary > start + size * 0.55) end = boundary + 1;
    }
    chunks.push(clean.slice(start, end).trim());
    start = Math.max(end - overlap, start + 1);
  }
  return chunks.filter(chunk => chunk.length > 30);
}

export async function embed(text: string) {
  const result = await embeddingClient.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
    config: { outputDimensionality: EMBEDDING_DIMENSION },
  });
  const values = result.embeddings?.[0]?.values;
  if (!values?.length) throw new Error("Embedding generation returned no values");
  return values;
}

export async function indexDocument(args: { organizationId: string; botId: string; documentId: string }) {
  const documentRef = adminDb.doc(`organizations/${args.organizationId}/bots/${args.botId}/documents/${args.documentId}`);
  const snapshot = await documentRef.get();
  if (!snapshot.exists) throw new Error("Document not found");
  const data = snapshot.data()!;
  await documentRef.update({ status: "processing" });
  const [buffer] = await adminStorage.bucket().file(data.storagePath).download();
  const text = await extractText(buffer, data.contentType || "", data.name || "document");
  const chunks = splitIntoChunks(text);
  if (!chunks.length) throw new Error("No readable text found");

  const chunksCollection = documentRef.parent.parent!.collection("chunks");
  for (let offset = 0; offset < chunks.length; offset += 10) {
    const group = chunks.slice(offset, offset + 10);
    const vectors = await Promise.all(group.map(chunk => embed(chunk)));
    const batch = adminDb.batch();
    group.forEach((content, index) => {
      batch.set(chunksCollection.doc(), {
        documentId: args.documentId, documentName: data.name, content,
        embedding: vectors[index], order: offset + index, createdAt: new Date(),
      });
    });
    await batch.commit();
  }
  await documentRef.update({ status: "ready", chunkCount: chunks.length, indexedAt: new Date() });
  return chunks.length;
}

export async function getBotKnowledge(organizationId: string, botId: string, question: string) {
  const vector = await embed(question);
  const chunks = adminDb.collection(`organizations/${organizationId}/bots/${botId}/chunks`);
  try {
    const nearest = await chunks.findNearest({ vectorField: "embedding", queryVector: vector, limit: 5, distanceMeasure: "COSINE", distanceResultField: "distance" }).get();
    return nearest.docs.map(item => `文件：${item.data().documentName}\n${item.data().content}`).join("\n\n");
  } catch (error) {
    console.warn("Vector index unavailable; using recent chunks", error);
    const fallback = await chunks.limit(5).get();
    return fallback.docs.map(item => `文件：${item.data().documentName}\n${item.data().content}`).join("\n\n");
  }
}
