import { NextRequest, NextResponse } from "next/server";
import { getGeminiResponse } from "@/lib/gemini";
import { getKnowledgeBase } from "@/lib/docs";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1. 獲取篩選後的相關知識庫內容 (優化 Token 消耗)
    const context = await getKnowledgeBase(message);

    // 2. 呼叫 Gemini
    const reply = await getGeminiResponse(message, context);

    // 🏆 收集題庫邏輯：同步到 Google 表格
    const googleSheetUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (googleSheetUrl && googleSheetUrl.startsWith('http')) {
      console.log("嘗試同步到 Google 表格...");
      fetch(googleSheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: message,
          answer: reply,
          timestamp: new Date().toISOString()
        })
      })
      .then(res => {
        if (res.ok) console.log("✅ 同步成功！");
        else console.error(`❌ 同步失敗，HTTP 狀態碼: ${res.status}`);
      })
      .catch(err => console.error("❌ 同步發生錯誤 (網路或網址問題):", err.message));
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
