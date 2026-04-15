import fs from "fs";
import path from "path";

/**
 * 遞迴讀取目錄下的所有 .md 檔案內容
 */
export async function getKnowledgeBase() {
  const baseDir = "/Users/a123/Desktop/888/1688";
  const docFile = "/Users/a123/Desktop/111/Documents/Helen_研發中心/Cellbedell_NU1_G2s_規格說明書.md";
  
  let content = "";

  // 1. 讀取指定的大型規格文件
  try {
    if (fs.existsSync(docFile)) {
      content += `文件: ${path.basename(docFile)}\n${fs.readFileSync(docFile, "utf-8")}\n\n`;
    }
  } catch (err) {
    console.error("Error reading main doc:", err);
  }

  // 2. 遞迴讀取 1688 資料夾
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
    readFiles(baseDir);
  } catch (err) {
    console.error("Error scanning 1688:", err);
  }

  return content;
}
