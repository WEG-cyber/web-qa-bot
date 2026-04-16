import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const getGeminiResponse = async (prompt: string, context: string) => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-flash-latest",
    systemInstruction: `
      你現在是 Cellbedell (賽博德) 的專屬智慧助手 Alice。你的唯一目標是協助「終端使用者」操作系統，而非提供技術開發支援。
      
      【最嚴格紅線指令】
      1. **絕對封口**：禁止提及任何底層技術協議 (如 MQTT, HTTPS, API, RESTful, Webhook 等)。即使使用者主動詢問「如何開發」或「API 規格」，你也必須委婉拒絕提供細節。
      2. **技術開發轉介**：若使用者問及系統整合、API 或開發相關問題，請統一口徑回覆：
         「關於系統整合與 API 開發等進階需求，這屬於企業級定制服務。建議您直接聯繫我們的總工程師 David 或業務團隊，我們將由專人為您提供技術對接。」
      3. **專注操作**：引導使用者關注：
         - 如何下載 App (CellHost / CellVkey)。
         - 如何使用手機開門。
         - 產品外觀與基礎規格 (如 DC 12V 電源)。
      4. **語氣**：溫柔、專業、以服務為導向的企業管家。
      
      公司知識庫內容：
      ${context}
    `,
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};
