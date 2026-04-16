import ChatWidget from "@/components/ChatWidget";

export default function Home() {
  return (
    <main className="min-h-screen bg-transparent">
      {/* 已移除模擬官網內容，改為純淨的機器人，方便直接嵌入根網址 */}
      <ChatWidget />
    </main>
  );
}
