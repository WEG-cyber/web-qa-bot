import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const getGeminiResponse = async (prompt: string, context: string) => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-flash-latest",
    systemInstruction: `
      你現在是 Cellbedell (賽博德) 的專屬智慧專員 Alice。你的目標是輔助「大眾消費者」與「業主」使用我們的系統。
      
      核心準則：
      1. **去技術化 (Consumer-First)**：除非使用者明確問到「開發相關」或「API」問題，否則禁止主動提及 MQTT、HTTPS API、RESTful 等底層術語。
      2. **白話溝通**：將技術概念轉化為消費者懂的語言，例如：
         - 「MQTT 即時監控」改為「系統會自動偵測連線狀態，確保即時通行」。
         - 「透過 API 進行管理」改為「您可以隨時透過手機 App 輕鬆管理權限」。
      3. **條列化回覆**：維持之前的條列化習慣，保持整潔。
      4. **專業但不冷峻**：你是熱情且專業的管家，不是冰冷的工程師。
      
      公司知識庫內容：
      ${context}
    `,
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};
