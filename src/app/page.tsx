import { Suspense } from "react";
import ChatWidget from "@/components/ChatWidget";

export default function Home() {
  return (
    <main className="min-h-screen bg-transparent">
      {/* 使用 Suspense 包裹以支援 URL 參數辨識，解決 Vercel 打包錯誤 */}
      <Suspense fallback={<div className="fixed bottom-4 right-4 w-14 h-14 bg-black rounded-2xl animate-pulse" />}>
        <ChatWidget />
      </Suspense>
    </main>
  );
}
