# Alice AI 客服平台

Alice 是以 Next.js、Firebase 與 Gemini 建立的多租戶 AI 客服平台。現有 Cellbedell Alice 是預設示範 Bot。

## Firebase 設定

1. 在 Firebase Console 建立專案及 Web App。
2. 啟用 Authentication 的 Google 與 Email/Password 登入方式。
3. 建立 Firestore Database 與 Storage bucket。
4. 將 `.env.example` 複製為 `.env.local`，填入 Firebase Web App 設定及 `GEMINI_API_KEY`。
5. 執行 `firebase deploy --only firestore:rules,storage` 發布安全規則。

知識庫使用 Firestore Vector Search。第一次建立索引後，請依 Firebase 錯誤訊息提供的指令建立 `chunks.embedding` 向量索引；索引完成前系統會暫時使用最近的五個知識片段回答。

正式環境使用 `apphosting.yaml` 限制執行個體與記憶體。`GEMINI_API_KEY` 必須以 App Hosting Secret 設定，不可寫入 YAML 或提交至 Git。

沒有 Firebase 設定時，首頁與 Dashboard 仍可用預覽模式開啟，但不會寫入任何資料。

## 本機啟動

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
