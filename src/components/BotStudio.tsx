"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { addDoc, collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { ArrowLeft, Bot as BotIcon, BookOpen, Check, Copy, ExternalLink, Loader2, MessageSquare, Save, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { db, storage } from "@/lib/firebase/client";
import type { Bot } from "@/types/platform";

type KnowledgeDocument = { id: string; name: string; size: number; status: string; downloadUrl?: string };
type Conversation = { id: string; lastMessage?: string; messageCount?: number; totalTokens?: number; language?: string; origin?: string; updatedAt?: { toDate(): Date } };
const allowedTypes = ["text/plain", "text/markdown", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export default function BotStudio({ botId, organizationId }: { botId: string; organizationId: string }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [bot, setBot] = useState<Bot | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!user || !organizationId) return;
    const botRef = doc(db, "organizations", organizationId, "bots", botId);
    const stopBot = onSnapshot(botRef, snapshot => setBot(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Bot) : null));
    const stopDocs = onSnapshot(collection(botRef, "documents"), snapshot => setDocuments(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as KnowledgeDocument))));
    const stopConversations = onSnapshot(query(collection(botRef, "conversations"), orderBy("updatedAt", "desc"), limit(8)), snapshot => setConversations(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as Conversation))));
    return () => { stopBot(); stopDocs(); stopConversations(); };
  }, [user, organizationId, botId]);

  function change<K extends keyof Bot>(key: K, value: Bot[K]) { setBot(current => current ? { ...current, [key]: value } : current); }

  async function save() {
    if (!bot) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "organizations", organizationId, "bots", botId), {
        name: bot.name, description: bot.description, primaryColor: bot.primaryColor,
        welcomeMessage: bot.welcomeMessage, systemPrompt: bot.systemPrompt,
        defaultLanguage: bot.defaultLanguage,
        allowedDomains: bot.allowedDomains.filter(Boolean), updatedAt: serverTimestamp(),
      });
      setNotice("設定已儲存");
    } finally { setSaving(false); setTimeout(() => setNotice(""), 1800); }
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!allowedTypes.includes(file.type) && !/\.(md|txt)$/i.test(file.name)) { setNotice("目前支援 PDF、DOCX、TXT、Markdown"); return; }
    if (file.size > 20 * 1024 * 1024) { setNotice("檔案不可超過 20 MB"); return; }
    setUploading(true);
    try {
      const path = `organizations/${organizationId}/bots/${botId}/${crypto.randomUUID()}-${file.name}`;
      const object = await uploadBytes(ref(storage, path), file, { contentType: file.type });
      const downloadUrl = await getDownloadURL(object.ref);
      const metadata = await addDoc(collection(db, "organizations", organizationId, "bots", botId, "documents"), {
        name: file.name, size: file.size, contentType: file.type, storagePath: path, downloadUrl,
        status: "uploaded", uploadedBy: user.uid, createdAt: serverTimestamp(),
      });
      setNotice("文件已上傳，正在建立知識索引…");
      const response = await fetch(`/api/bots/${botId}/documents/${metadata.id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ organizationId }),
      });
      if (!response.ok) throw new Error("Processing failed");
      setNotice("文件已完成索引，Bot 現在可以使用這份知識");
    } catch { setNotice("上傳失敗，請確認 Firebase Storage 設定"); }
    finally { setUploading(false); event.target.value = ""; }
  }

  async function publish() {
    if (!user || !bot) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/bots/${botId}/publish`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` }, body: JSON.stringify({ organizationId }) });
      if (!response.ok) throw new Error();
      setNotice("Bot 已發布");
    } catch { setNotice("發布失敗，請確認 Firebase Admin 設定"); }
    finally { setSaving(false); }
  }

  async function removeDocument(documentId: string) {
    if (!user || !confirm("確定刪除這份文件及所有知識片段？")) return;
    const response = await fetch(`/api/bots/${botId}/documents/${documentId}?organizationId=${encodeURIComponent(organizationId)}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    });
    setNotice(response.ok ? "文件與知識索引已刪除" : "刪除失敗");
  }

  async function removeBot() {
    if (!user || !confirm(`確定永久刪除「${bot?.name}」及其文件與對話？`)) return;
    setSaving(true);
    const response = await fetch(`/api/bots/${botId}?organizationId=${encodeURIComponent(organizationId)}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    });
    if (response.ok) router.push("/dashboard");
    else { setNotice("刪除失敗；只有團隊擁有者可以刪除 Bot"); setSaving(false); }
  }

  function copyEmbed() {
    void navigator.clipboard.writeText(`<script src="${window.location.origin}/widget.js" data-bot-id="${botId}" async></script>`);
    setNotice("嵌入碼已複製"); setTimeout(() => setNotice(""), 1800);
  }

  if (loading || (user && !bot)) return <main className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-cyan-600" /></main>;
  if (!user) return <main className="grid min-h-screen place-items-center bg-[#f7f8fb] p-6 text-center"><div><BotIcon className="mx-auto text-cyan-600" size={42} /><h1 className="mt-5 text-2xl font-semibold">請先登入管理 Bot</h1><Link href="/login" className="mt-6 inline-block rounded-full bg-zinc-950 px-6 py-3 text-white">前往登入</Link></div></main>;
  if (!bot) return null;

  return <main className="min-h-screen bg-[#f7f8fb] text-zinc-950">
    <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between border-b border-zinc-200 bg-white/90 px-5 backdrop-blur lg:px-10"><div className="flex items-center gap-4"><Link href="/dashboard" className="rounded-xl border border-zinc-200 p-2"><ArrowLeft size={18} /></Link><div><p className="text-xs text-zinc-400">BOT STUDIO</p><h1 className="font-semibold">{bot.name}</h1></div></div><div className="flex gap-2"><button onClick={() => void removeBot()} disabled={saving} className="hidden rounded-full border border-red-200 p-2.5 text-red-600 sm:block" title="刪除 Bot"><Trash2 size={16} /></button><button onClick={copyEmbed} className="hidden items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm sm:flex"><Copy size={16} />嵌入碼</button><button onClick={() => void publish()} disabled={saving} className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold">發布 Bot</button></div></header>
    <div className="mx-auto grid max-w-7xl gap-8 p-5 lg:grid-cols-[1fr_380px] lg:p-10">
      <section className="space-y-7">
        {notice && <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><Check size={16} />{notice}</div>}
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 lg:p-8"><h2 className="text-xl font-semibold">基本設定</h2><p className="mt-1 text-sm text-zinc-500">定義客服的品牌與回答方式。</p><div className="mt-7 grid gap-5 sm:grid-cols-2"><Field label="Bot 名稱"><input value={bot.name} onChange={e => change("name", e.target.value)} className="field" /></Field><Field label="品牌顏色"><div className="flex gap-2"><input type="color" value={bot.primaryColor} onChange={e => change("primaryColor", e.target.value)} className="h-12 w-14 rounded-xl border border-zinc-200 bg-white p-1" /><input value={bot.primaryColor} onChange={e => change("primaryColor", e.target.value)} className="field" /></div></Field><Field label="用途說明" wide><input value={bot.description} onChange={e => change("description", e.target.value)} className="field" /></Field><Field label="歡迎訊息" wide><textarea value={bot.welcomeMessage} onChange={e => change("welcomeMessage", e.target.value)} className="field min-h-24" /></Field><Field label="回答原則" wide><textarea value={bot.systemPrompt} onChange={e => change("systemPrompt", e.target.value)} className="field min-h-28" /></Field><Field label="允許嵌入網域" wide><input value={bot.allowedDomains.join(", ")} onChange={e => change("allowedDomains", e.target.value.split(",").map(value => value.trim()))} className="field" placeholder="example.com, shop.example.com" /></Field></div><button onClick={() => void save()} disabled={saving} className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white"><Save size={16} />儲存設定</button></div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 lg:p-8"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">知識文件</h2><p className="mt-1 text-sm text-zinc-500">上傳公司文件，讓 Bot 學會正確回答。</p></div><label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-zinc-950 px-4 py-2.5 text-sm text-white"><Upload size={16} />{uploading ? "上傳中" : "上傳文件"}<input type="file" accept=".pdf,.docx,.txt,.md" onChange={e => void upload(e)} disabled={uploading} className="hidden" /></label></div><div className="mt-6 space-y-3">{documents.length ? documents.map(item => <div key={item.id} className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4"><div className="flex min-w-0 items-center gap-3"><BookOpen className="shrink-0 text-cyan-600" /><div className="min-w-0"><p className="truncate text-sm font-medium">{item.name}</p><p className="text-xs text-zinc-400">{(item.size / 1024).toFixed(1)} KB · {item.status}</p></div></div><div className="flex">{item.downloadUrl && <a href={item.downloadUrl} target="_blank" rel="noreferrer" className="p-2 text-zinc-400"><ExternalLink size={16} /></a>}<button onClick={() => void removeDocument(item.id)} className="p-2 text-zinc-400 hover:text-red-600" title="刪除文件"><Trash2 size={16} /></button></div></div>) : <div className="rounded-2xl border border-dashed border-zinc-300 py-12 text-center text-sm text-zinc-400">尚未上傳知識文件</div>}</div></div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 lg:p-8"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">最近對話</h2><p className="mt-1 text-sm text-zinc-500">掌握顧客最近向 Bot 詢問的內容。</p></div><MessageSquare className="text-cyan-600" /></div><div className="mt-6 space-y-3">{conversations.length ? conversations.map(item => <div key={item.id} className="grid gap-2 rounded-2xl border border-zinc-200 p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.lastMessage || "新對話"}</p><p className="mt-1 text-xs text-zinc-400">{item.origin || "直接測試"} · {item.language || "zh"} · {item.updatedAt?.toDate().toLocaleString("zh-TW") || "剛剛"}</p></div><div className="flex gap-4 text-xs text-zinc-500"><span>{item.messageCount || 0} 則</span><span>{item.totalTokens || 0} tokens</span></div></div>) : <div className="rounded-2xl border border-dashed border-zinc-300 py-10 text-center text-sm text-zinc-400">尚未有顧客對話</div>}</div></div>
      </section>
      <aside className="lg:sticky lg:top-28 lg:h-fit"><div className="rounded-[30px] bg-zinc-950 p-4 shadow-xl"><div className="rounded-3xl border border-white/10 bg-zinc-900 p-5 text-white"><div className="flex items-center gap-3 border-b border-white/10 pb-4"><span style={{ backgroundColor: bot.primaryColor }} className="grid h-10 w-10 place-items-center rounded-xl font-bold text-zinc-950">{bot.name.slice(0, 1)}</span><div><p className="text-sm font-semibold">{bot.name}</p><p className="text-xs text-emerald-400">● 預覽中</p></div></div><div className="min-h-72 py-6"><div className="rounded-2xl rounded-tl-sm bg-white/10 p-4 text-sm leading-6 text-zinc-200">{bot.welcomeMessage}</div></div><Link href={`/widget?botId=${botId}`} className="block rounded-xl text-center text-sm text-cyan-300">開啟完整測試 <ExternalLink className="ml-1 inline" size={14} /></Link></div></div></aside>
    </div>
  </main>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <label className={`block text-sm font-medium ${wide ? "sm:col-span-2" : ""}`}>{label}<div className="mt-2">{children}</div></label>; }
