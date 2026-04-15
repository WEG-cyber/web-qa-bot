const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  console.log("Testing model...");
  try {
    const res = await result.generateContent("test");
    console.log("Success!");
  } catch (e) {
    console.error(e.message);
  }
}
listModels();
