import fs from "fs";
import path from "path";

/**
 * 簡易的關鍵字檢索優化 (Lite RAG)
 * 根據使用者問題，篩選出最相關的知識庫內容，節省 Token
 */
export async function getKnowledgeBase(query?: string) {
  const baseDir = path.join(process.cwd(), "src/data/knowledge");
  let allContentBlocks: { title: string; body: string }[] = [];

  const readFiles = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        readFiles(fullPath);
      } else if (item.endsWith(".md") || item.endsWith(".txt")) {
        allContentBlocks.push({
          title: path.relative(baseDir, fullPath),
          body: fs.readFileSync(fullPath, "utf-8"),
        });
      }
    }
  };

  try {
    if (fs.existsSync(baseDir)) {
      readFiles(baseDir);
    }
  } catch (err) {
    console.error("Error scanning knowledge base:", err);
  }

  // 如果沒給問題，或是檔案數量很少，就直接回傳全部 (低於 3 個檔案)
  if (!query || allContentBlocks.length <= 3) {
    return allContentBlocks.map(b => `文件: ${b.title}\n${b.body}`).join("\n\n");
  }

  // --- 優化邏輯：關鍵字匹配 ---
  // 將問題拆解成較小的字串/關鍵字
  const keywords = query.toLowerCase().split(/[ ,，。？?]/).filter(k => k.length > 1);
  
  // 計算每個區塊的權重 (標題有匹配加更多分，內容有匹配加分)
  const scoredBlocks = allContentBlocks.map(block => {
    let score = 0;
    const textToSearch = (block.title + " " + block.body).toLowerCase();
    
    keywords.forEach(keyword => {
      if (textToSearch.includes(keyword)) {
        score += 10;
        // 額外獎勵：如果標題就有關鍵字，增加權重
        if (block.title.toLowerCase().includes(keyword)) score += 20;
      }
    });

    return { ...block, score };
  });

  // 只選取分數最高的 5 個區塊，強制節省 Token
  const relevantBlocks = scoredBlocks
    .filter(b => b.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // 如果過濾完沒東西，保底回傳最重要的 2 個檔案
  if (relevantBlocks.length === 0) {
    return allContentBlocks.slice(0, 2).map(b => `文件: ${b.title}\n${b.body}`).join("\n\n");
  }

  return relevantBlocks.map(b => `文件: ${b.title}\n${b.body}`).join("\n\n");
}
