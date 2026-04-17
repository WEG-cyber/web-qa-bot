import { Suspense } from "react";
import ChatWidget from "@/components/ChatWidget";

export default function WidgetPage() {
  return (
    <div className="bg-transparent w-full h-full overflow-hidden">
      <Suspense fallback={null}>
        <ChatWidget />
      </Suspense>
    </div>
  );
}
