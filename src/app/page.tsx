import Link from "next/link";
import { Bot, BookOpen, BarChart3, ArrowRight, Check } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-zinc-950">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-zinc-950 text-cyan-300">A</span>Alice Platform</Link>
        <div className="flex items-center gap-3"><Link href="/widget" className="hidden text-sm text-zinc-600 sm:block">查看原版 Alice</Link><Link href="/login" className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white">開始建立</Link></div>
      </nav>
      <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pt-24">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm text-cyan-800">AI 客服，幾分鐘就能上線</div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-7xl">把你的知識，變成會服務客戶的 AI。</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-600">建立自己的客服機器人、上傳企業文件，再貼上一段程式碼，就能把 24 小時 AI 客服放進網站。</p>
          <div className="mt-9 flex flex-wrap gap-3"><Link href="/login" className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3.5 font-semibold text-zinc-950 shadow-lg shadow-cyan-200">免費建立 Bot <ArrowRight size={18} /></Link><Link href="/dashboard" className="rounded-full border border-zinc-300 bg-white px-6 py-3.5 font-medium">查看管理後台</Link></div>
          <div className="mt-8 flex flex-wrap gap-5 text-sm text-zinc-500">{["免費方案", "多語支援", "Firebase 安全架構"].map(item => <span key={item} className="flex items-center gap-2"><Check size={16} className="text-emerald-500" />{item}</span>)}</div>
        </div>
        <div className="rounded-[36px] bg-zinc-950 p-4 shadow-2xl shadow-zinc-300"><div className="rounded-[28px] border border-white/10 bg-zinc-900 p-6 text-white">
          <div className="flex items-center justify-between border-b border-white/10 pb-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400 font-bold text-zinc-950">A</span><div><p className="font-semibold">你的品牌客服</p><p className="text-xs text-emerald-400">● 線上服務中</p></div></div><span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">AI Agent</span></div>
          <div className="space-y-4 py-8"><div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white/10 p-4 text-sm leading-6 text-zinc-200">您好！我是您的專屬 AI 客服。產品、服務或安裝問題都可以問我。</div><div className="ml-auto max-w-[75%] rounded-2xl rounded-tr-sm bg-cyan-400 p-4 text-sm font-medium text-zinc-950">如何把客服安裝到我的網站？</div><div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white/10 p-4 text-sm leading-6 text-zinc-200">發布 Bot 後，複製專屬嵌入碼貼到網站即可。通常只需要一分鐘。</div></div>
          <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-500">輸入訊息…</div>
        </div></div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-6 pb-24 md:grid-cols-3">{[
        { icon: Bot, title: "打造專屬客服", text: "設定品牌、語氣、語言與歡迎訊息。" },
        { icon: BookOpen, title: "上傳企業知識", text: "用文件與 FAQ 教會 AI 回答產品問題。" },
        { icon: BarChart3, title: "掌握每次對話", text: "追蹤熱門問題、使用量與待改善回答。" },
      ].map(({ icon: Icon, title, text }) => <article key={title} className="rounded-3xl border border-zinc-200 bg-white p-7"><Icon className="mb-8 text-cyan-600" /><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 leading-7 text-zinc-600">{text}</p></article>)}</section>
    </main>
  );
}
