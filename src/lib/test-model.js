import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  console.log("Testing model...");
  try {
    await result.generateContent("test");
    console.log("Success!");
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
  }
}
listModels();
