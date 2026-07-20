import { NextRequest, NextResponse } from "next/server";
import { getGeminiResponse } from "@/lib/gemini";
import { getKnowledgeBase } from "@/lib/docs";

const GEMINI_TIMEOUT_MS = 25000;
const pricingPattern = /價格|報價|詢價|費用|預算|估價|估算|建置成本|price|quote|quotation|cost|budget|estimate|pricing|見積|費用|価格|予算|ราคา|ค่าใช้จ่าย|งบประมาณ|ประเมินราคา/i;

function normalizeLang(lang: string = 'zh') {
  const normalized = String(lang || 'zh').toLowerCase();

  if (normalized.startsWith('en')) return 'en';
  if (normalized.startsWith('ja') || normalized.startsWith('jp')) return 'ja';
  if (normalized.startsWith('th')) return 'th';
  return 'zh';
}

function getPricingReply(lang: string = 'zh') {
  const normalizedLang = normalizeLang(lang);
  const pricingReplies = {
    zh: '您可以使用 Cellbedell 線上價格估算工具，依房間數與需求快速評估建置費用：https://www.cellbedell.com/#calculator',
    en: 'You can use the Cellbedell online price estimator to calculate an initial budget based on your room count and requirements: https://www.cellbedell.com/#calculator',
    ja: '客室数やご要望に応じた概算費用は、Cellbedell のオンライン価格見積もりツールでご確認いただけます：https://www.cellbedell.com/#calculator',
    th: 'คุณสามารถใช้เครื่องมือประเมินราคาออนไลน์ของ Cellbedell เพื่อคำนวณงบประมาณเบื้องต้นตามจำนวนห้องและความต้องการได้ที่: https://www.cellbedell.com/#calculator',
  };

  return pricingReplies[normalizedLang];
}

function getFallbackReply(message: string, lang: string = 'zh') {
  const normalizedLang = normalizeLang(lang);

  const genericReplies = {
    zh: '抱歉，Alice 目前回覆時間較長，請稍後再試。若您需要估算建置費用，請使用 Cellbedell 線上價格估算工具：https://www.cellbedell.com/#calculator',
    en: 'Sorry, Alice is taking longer than expected right now. Please try again shortly. For pricing estimates, you can use the Cellbedell online price estimator: https://www.cellbedell.com/#calculator',
    ja: '申し訳ございません。現在 Alice の応答に通常より時間がかかっています。しばらくしてからもう一度お試しください。お見積もりは、Cellbedell のオンライン価格見積もりツールをご利用ください：https://www.cellbedell.com/#calculator',
    th: 'ขออภัยค่ะ ขณะนี้ Alice ใช้เวลาตอบกลับนานกว่าปกติ กรุณาลองใหม่อีกครั้งภายหลัง หากต้องการประเมินราคา สามารถใช้เครื่องมือประเมินราคาออนไลน์ของ Cellbedell ได้ที่: https://www.cellbedell.com/#calculator',
  };

  return pricingPattern.test(message) ? getPricingReply(normalizedLang) : genericReplies[normalizedLang];
}

function withTimeout<T>(promise: Promise<T>, fallback: T) {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), GEMINI_TIMEOUT_MS);
    }),
  ]);
}

export async function POST(req: NextRequest) {
  let requestBody: { message?: string; lang?: string } = {};

  try {
    requestBody = await req.json();
    const { message, lang } = requestBody;
    
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (pricingPattern.test(message)) {
      return NextResponse.json({ reply: getPricingReply(lang) });
    }

    // 1. 獲取篩選後的相關知識庫內容 (優化 Token 消耗)
    const context = await getKnowledgeBase(message);

    // 2. 呼叫 Gemini (傳入語系)，並提供逾時 fallback，避免使用者等待到空白回覆
    const fallbackReply = getFallbackReply(message, lang);
    const { text: reply, usage } = await withTimeout(
      getGeminiResponse(message, context, lang),
      {
        text: fallbackReply,
        usage: {
          promptTokens: 0,
          candidatesTokens: 0,
          totalTokens: 0,
        },
      }
    );

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
    const fallbackReply = getFallbackReply(requestBody.message || '', requestBody.lang || 'zh');
    return NextResponse.json({ reply: fallbackReply });
  }
}
