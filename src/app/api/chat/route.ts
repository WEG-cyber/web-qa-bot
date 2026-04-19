import { NextRequest, NextResponse } from "next/server";
import { getGeminiResponse } from "@/lib/gemini";
import { getKnowledgeBase } from "@/lib/docs";

export async function POST(req: NextRequest) {
  try {
    const { message, lang } = await req.json();
    
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1. 獲取篩選後的相關知識庫內容 (優化 Token 消耗)
    const context = await getKnowledgeBase(message);

    // 2. 呼叫 Gemini (傳入語系)
    const { text: reply, usage } = await getGeminiResponse(message, context, lang);

    // 🏆 收集題庫邏輯：同步到 Google 表格 (包含 Token 監控)
    const googleSheetUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (googleSheetUrl && googleSheetUrl.startsWith('http')) {
      const estimatedCost = (usage.promptTokens * 0.000000075) + (usage.candidatesTokens * 0.0000003);
      
      console.log(`正在同步到 Google... Token 總計: ${usage.totalTokens}`);

      fetch(googleSheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: message,
          answer: reply,
          promptTokens: usage.promptTokens,
          responseTokens: usage.candidatesTokens,
          totalTokens: usage.totalTokens,
          cost: estimatedCost.toFixed(8)
        })
      })
      .then(res => {
        if (res.ok) console.log("✅ Google 表格同步成功！");
        else console.error(`❌ Google 表格同步失敗，返回碼: ${res.status}`);
      })
      .catch(err => console.error("❌ Google 表格同步網路錯誤:", err.message));
    } else {
      console.warn("⚠️ 警告：未設定 GOOGLE_SHEET_WEBHOOK_URL 或網址不正確。");
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
