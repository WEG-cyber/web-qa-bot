import ChatWidget from "@/components/ChatWidget";

export default function WidgetPage() {
  return (
    <div className="bg-transparent min-h-screen">
      {/* 這裡只放機器人組件，沒有任何多餘的背景文字 */}
      <ChatWidget />
    </div>
  );
}
