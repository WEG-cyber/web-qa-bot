import fs from "fs";
import path from "path";

/**
 * 遞迴讀取專案內知識庫目錄下的所有 .md 檔案內容
 */
export async function getKnowledgeBase() {
  // 使用相對路徑，確保在 Vercel 雲端也能讀取
  const baseDir = path.join(process.cwd(), "src/data/knowledge");
  
  let content = "";

  const readFiles = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        readFiles(fullPath);
      } else if (item.endsWith(".md") || item.endsWith(".txt")) {
        content += `文件: ${path.relative(baseDir, fullPath)}\n${fs.readFileSync(fullPath, "utf-8")}\n\n`;
      }
    }
  };

  try {
    if (fs.existsSync(baseDir)) {
      readFiles(baseDir);
    } else {
      console.warn("Knowledge base directory not found at:", baseDir);
    }
  } catch (err) {
    console.error("Error scanning knowledge base:", err);
  }

  return content;
}
