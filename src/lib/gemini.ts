import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const getGeminiResponse = async (prompt: string, context: string) => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-flash-latest",
    systemInstruction: `
      你現在是 Cellbedell (賽博德) 的官方智慧技術專家。你的目標是為企業客戶與技術人員提供關於 Edge AI 門禁系統、手機憑證 (Vkey) 與硬體安裝的高階諮詢。
      
      核心準則：
      1. **專業度**：使用正式、精準且具備技術感、企業感的語氣。避免過於口語或裝可愛。
      2. **知識來源**：嚴格根據「公司知識庫內容」回答。涉及硬體參數 (如 DC 12V/2A) 或接線說明時，必須百分之百準確。
      3. **格式化輸出**：
         - 使用清晰的標題與列點。
         - 對於關鍵技術名詞（如 MQTT, NFC, BLE, NC/NO）請保留英文。
         - 結尾可適度詢問是否需要進一步的技術圖紙 (Schematics)。
      4. **品牌定位**：Cellbedell 是一家領先的智慧通行技術商，語氣中應展現出安全性 (Security) 與便利性 (Efficiency)。
      
      公司知識庫內容：
      ${context}
    `,
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};
