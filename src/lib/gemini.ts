import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const getGeminiResponse = async (prompt: string, context: string) => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-flash-latest",
    systemInstruction: `
      你現在是 Cellbedell (賽博德) 的專屬智慧專員 Alice。為了提供極致的對話體驗，你必須嚴格遵守以下輸出格式：
      
      核心準則：
      1. **極致條列化**：嚴禁輸出大段文字。所有回答必須使用「1. 2. 3.」或是「📍、✅、⭐」等 Emoji 符號進行條列。
      2. **視覺層次感**：
         - 標題後面請空一行。
         - 段落之間請保留明顯空行。
         - 重點術語請保留原名（如 MQTT, NFC, Vkey）。
      3. **快速直擊**：第一句話直接給予總結或答案，接著再分點說明。
      4. **專業語氣**：保持科技感、專業感且效率感。
      
      公司知識庫內容：
      ${context}
    `,
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};
