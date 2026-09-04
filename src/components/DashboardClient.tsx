"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, doc, getDocs, limit, onSnapshot, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { Bot as BotIcon, BookOpen, BarChart3, MessagesSquare, Plus, Settings, LogOut, Copy, Check, X, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { auth, db } from "@/lib/firebase/client";
import type { Bot } from "@/types/platform";

const demoBot: Bot = {
  id: "alice-cellbedell", organizationId: "demo", name: "Alice｜Cellbedell 客服", description: "智慧門禁、Wallet 與自助入住產品客服", status: "active", primaryColor: "#22d3ee", welcomeMessage: "您好，我是 Alice，有什麼可以協助您的？", systemPrompt: "以專業、溫暖的方式回答顧客問題。", defaultLanguage: "zh-TW", supportedLanguages: ["zh-TW", "en", "ja", "th"], allowedDomains: ["cellbedell.com"], createdBy: "demo",
};

export default function DashboardClient() {
  const router = useRouter();
  const { user, loading, configured } = useAuth();
  const [organizationId, setOrganizationId] = useState("");
  const [bots, setBots] = useState<Bot[]>(configured ? [] : [demoBot]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState("");
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!user || !configured) return;
    let unsubscribe = () => {};
    void (async () => {
      const owned = await getDocs(query(collection(db, "organizations"), where("ownerId", "==", user.uid), limit(1)));
      let orgId = owned.docs[0]?.id;
      if (!orgId) {
        orgId = doc(collection(db, "organizations")).id;
        await setDoc(doc(db, "organizations", orgId), { name: user.displayName ? `${user.displayName} 的團隊` : "我的團隊", ownerId: user.uid, plan: "free", createdAt: serverTimestamp() });
        await setDoc(doc(db, "organizations", orgId, "members", user.uid), { role: "owner", email: user.email, joinedAt: serverTimestamp() });
      }
      setOrganizationId(orgId);
      unsubscribe = onSnapshot(collection(db, "organizations", orgId, "bots"), snapshot => setBots(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as Bot))));
    })();
    return () => unsubscribe();
  }, [user, configured]);

  async function createBot() {
    if (!user || !organizationId || !name.trim()) return;
    setSaving(true);
    try {
      setCreateError("");
      const response = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ organizationId, name: name.trim(), description: description.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setCreateError(data.error === "BOT_LIMIT_REACHED" ? "Free 方案最多建立 1 個 Bot。" : "建立失敗，請稍後再試。");
        return;
      }
      setName(""); setDescription(""); setShowCreate(false);
      router.push(`/dashboard/bots/${data.id}?org=${organizationId}`);
    } finally { setSaving(false); }
  }

  function copyEmbed(botId: string) {
    const code = `<script src="${window.location.origin}/widget.js" data-bot-id="${botId}" async></script>`;
    void navigator.clipboard.writeText(code); setCopied(botId); setTimeout(() => setCopied(""), 1800);
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#f7f8fb]"><Loader2 className="animate-spin text-cyan-600" /></main>;

  return <main className="min-h-screen bg-[#f7f8fb] text-zinc-950">
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-zinc-950 p-5 text-white lg:flex">
      <Link href="/" className="flex items-center gap-3 px-2 py-3 font-semibold"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-400 text-zinc-950">A</span>Alice Platform</Link>
      <nav className="mt-10 space-y-2 text-sm"><Link href="/dashboard" className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3"><BarChart3 size={18} />總覽</Link><span className="flex items-center gap-3 px-4 py-3 text-zinc-400"><BotIcon size={18} />客服機器人</span><span className="flex items-center gap-3 px-4 py-3 text-zinc-400"><BookOpen size={18} />知識庫</span><span className="flex items-center gap-3 px-4 py-3 text-zinc-400"><MessagesSquare size={18} />對話紀錄</span><span className="flex items-center gap-3 px-4 py-3 text-zinc-400"><Settings size={18} />團隊設定</span></nav>
      <div className="mt-auto rounded-2xl bg-white/5 p-4"><p className="text-xs text-zinc-500">目前方案</p><div className="mt-2 flex items-center justify-between"><strong>Free</strong><span className="text-xs text-cyan-300">100 則／月</span></div></div>
    </aside>
    <div className="lg:pl-64">
      <header className="flex min-h-20 items-center justify-between border-b border-zinc-200 bg-white px-6 lg:px-10"><div><p className="text-sm text-zinc-500">工作空間</p><p className="font-semibold">{user?.displayName || "Alice 示範團隊"}</p></div><div className="flex items-center gap-3">{!configured && <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs text-amber-800">預覽模式</span>}{user ? <button onClick={() => void signOut(auth)} className="rounded-xl border border-zinc-200 p-2 text-zinc-500" title="登出"><LogOut size={18} /></button> : <Link href="/login" className="rounded-full bg-zinc-950 px-4 py-2 text-sm text-white">登入</Link>}</div></header>
      <section className="mx-auto max-w-7xl p-6 lg:p-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-cyan-700">管理中心</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">早安，開始打造你的 AI 客服</h1><p className="mt-2 text-zinc-500">集中管理機器人、知識與顧客對話。</p></div>{user ? <button onClick={() => setShowCreate(true)} className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white"><Plus size={17} />建立 Bot</button> : <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white"><Plus size={17} />登入後建立 Bot</Link>}</div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">{[{ label: "客服機器人", value: bots.length, note: "Free 最多 1 個" }, { label: "本月對話", value: 0, note: "尚未有新對話" }, { label: "知識文件", value: 0, note: "等待上傳文件" }].map(card => <div key={card.label} className="rounded-3xl border border-zinc-200 bg-white p-6"><p className="text-sm text-zinc-500">{card.label}</p><p className="mt-3 text-4xl font-semibold">{card.value}</p><p className="mt-3 text-xs text-zinc-400">{card.note}</p></div>)}</div>
        <div className="mt-10 flex items-center justify-between"><h2 className="text-xl font-semibold">我的客服機器人</h2><span className="text-sm text-zinc-400">{bots.length} 個 Bot</span></div>
        <div className="mt-4 grid gap-5 xl:grid-cols-2">{bots.map(bot => <article key={bot.id} className="rounded-3xl border border-zinc-200 bg-white p-6"><div className="flex items-start justify-between gap-4"><div className="flex gap-4"><span style={{ backgroundColor: bot.primaryColor }} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-bold text-zinc-950">{bot.name.slice(0, 1)}</span><div><h3 className="font-semibold">{bot.name}</h3><p className="mt-1 text-sm text-zinc-500">{bot.description || "尚未填寫說明"}</p></div></div><span className={`rounded-full px-3 py-1 text-xs ${bot.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>{bot.status === "active" ? "已發布" : "草稿"}</span></div><div className="mt-7 grid grid-cols-3 gap-3 border-t border-zinc-100 pt-5 text-center text-sm"><div><strong className="block">0</strong><span className="text-xs text-zinc-400">文件</span></div><div><strong className="block">0</strong><span className="text-xs text-zinc-400">對話</span></div><div><strong className="block">{bot.supportedLanguages.length}</strong><span className="text-xs text-zinc-400">語言</span></div></div><div className="mt-5 flex gap-2">{user && organizationId ? <Link href={`/dashboard/bots/${bot.id}?org=${organizationId}`} className="flex-1 rounded-xl bg-zinc-950 px-4 py-2.5 text-center text-sm text-white">管理 Bot</Link> : <Link href={`/widget?botId=${bot.id}`} className="flex-1 rounded-xl bg-zinc-950 px-4 py-2.5 text-center text-sm text-white">測試 Bot</Link>}<button onClick={() => copyEmbed(bot.id)} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm">{copied === bot.id ? <Check size={16} /> : <Copy size={16} />}嵌入碼</button></div></article>)}</div>
        {!user && <div className="mt-8 rounded-3xl border border-cyan-200 bg-cyan-50 p-6"><h3 className="font-semibold text-cyan-950">這是尚未連線 Firebase 的平台預覽</h3><p className="mt-2 text-sm leading-6 text-cyan-800">設定 Firebase 環境變數並登入後，即可建立真正的 Workspace 和 Bot。</p></div>}
      </section>
    </div>
    {showCreate && <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-5"><div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">建立客服機器人</h2><button onClick={() => setShowCreate(false)}><X /></button></div><label className="mt-6 block text-sm font-medium">Bot 名稱<input value={name} onChange={e => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-500" placeholder="例如：產品客服 Alice" /></label><label className="mt-4 block text-sm font-medium">用途說明<textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-500" placeholder="這個 Bot 要協助客戶處理什麼？" /></label>{createError && <p className="mt-4 text-sm text-red-600">{createError}</p>}<button onClick={() => void createBot()} disabled={saving || !name.trim()} className="mt-6 flex w-full items-center justify-center rounded-xl bg-zinc-950 px-4 py-3 text-white disabled:opacity-50">{saving ? <Loader2 className="animate-spin" /> : "建立並繼續設定"}</button></div></div>}
  </main>;
}
