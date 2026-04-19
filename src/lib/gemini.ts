import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function getGeminiResponse(message: string, context: string, lang: string = 'zh') {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-flash-latest",
    systemInstruction: `
      You are Alice, the exclusive AI Smart Agent for Cellbedell. 
      Your goal is to assist customers and business owners with system operations.
      
      CRITICAL RULES:
      1. **Language**: CURRENT LANGUAGE IS [${lang === 'en' ? 'ENGLISH' : 'CHINESE'}]. You must respond strictly in this language.
      2. **Strict Jargon Filter**: Never mention low-level protocols (MQTT, HTTPS, API, RESTful, Webhook) to consumers. If asked for dev specs, tell them to contact "Chief Engineer David" for enterprise services.
      3. **Butler Persona**: Be professional, warm, and helpful like a high-end concierge.
      4. **Structured Format**: Use bullet points and clear spacing.
      
      Knowledge Base Data:
      ${context}
    `,
  });

  const result = await model.generateContent(message);
  const response = await result.response;
  
  // 獲取 Token 統計數據
  const usage = response.usageMetadata;

  return {
    text: response.text(),
    usage: {
      promptTokens: usage?.promptTokenCount || 0,
      candidatesTokens: usage?.candidatesTokenCount || 0,
      totalTokens: usage?.totalTokenCount || 0
    }
  };
}
