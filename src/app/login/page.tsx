"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { FormEvent, useState } from "react";
import { ArrowLeft, Bot, Loader2 } from "lucide-react";
import { auth, isFirebaseConfigured } from "@/lib/firebase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [registering, setRegistering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function withLogin(action: () => Promise<unknown>) {
    if (!isFirebaseConfigured) { setError("請先在 .env.local 填入 Firebase Web App 設定。你仍可查看後台預覽。"); return; }
    setBusy(true); setError("");
    try { await action(); router.push("/dashboard"); }
    catch { setError("登入失敗，請檢查帳號或 Firebase Authentication 設定。"); }
    finally { setBusy(false); }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void withLogin(async () => {
      if (!registering) return signInWithEmailAndPassword(auth, email, password);
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName.trim()) await updateProfile(credential.user, { displayName: displayName.trim() });
      return credential;
    });
  }

  return <main className="grid min-h-screen bg-[#f7f8fb] lg:grid-cols-2">
    <section className="hidden bg-zinc-950 p-14 text-white lg:flex lg:flex-col lg:justify-between"><Link href="/" className="flex items-center gap-3 font-semibold"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-400 text-zinc-950">A</span>Alice Platform</Link><div><Bot size={46} className="mb-8 text-cyan-300" /><h1 className="max-w-lg text-5xl font-semibold leading-tight tracking-tight">讓每個團隊，都擁有自己的 AI 客服。</h1><p className="mt-6 max-w-md text-lg leading-8 text-zinc-400">管理知識、品牌與每一次顧客對話。</p></div><p className="text-sm text-zinc-600">Powered by Firebase & Gemini</p></section>
    <section className="flex items-center justify-center p-6"><div className="w-full max-w-md">
      <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-zinc-500"><ArrowLeft size={16} />回首頁</Link><h2 className="text-3xl font-semibold tracking-tight">{registering ? "建立 Alice 帳號" : "登入 Alice"}</h2><p className="mt-2 text-zinc-500">{registering ? "免費建立第一個 AI 客服" : "繼續管理你的 AI 客服"}</p>
      {!isFirebaseConfigured && <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Firebase 尚未連線。<Link className="ml-1 underline" href="/dashboard">先查看後台預覽</Link></div>}
      <button onClick={() => void withLogin(() => signInWithPopup(auth, new GoogleAuthProvider()))} disabled={busy} className="mt-8 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3.5 font-medium hover:bg-zinc-50">使用 Google 登入</button>
      <div className="my-6 flex items-center gap-3 text-xs text-zinc-400"><span className="h-px flex-1 bg-zinc-200" />或使用 Email<span className="h-px flex-1 bg-zinc-200" /></div>
      <form onSubmit={submit} className="space-y-4">{registering && <label className="block text-sm font-medium">顯示名稱<input value={displayName} onChange={e => setDisplayName(e.target.value)} required className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-cyan-500" placeholder="你的名字或公司名稱" /></label>}<label className="block text-sm font-medium">Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-cyan-500" placeholder="you@company.com" /></label><label className="block text-sm font-medium">密碼<input value={password} onChange={e => setPassword(e.target.value)} type="password" minLength={6} required className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-cyan-500" placeholder="至少 6 個字元" /></label>{error && <p className="text-sm text-red-600">{error}</p>}<button disabled={busy} className="flex w-full items-center justify-center rounded-2xl bg-zinc-950 px-4 py-3.5 font-semibold text-white disabled:opacity-60">{busy ? <Loader2 className="animate-spin" /> : registering ? "建立免費帳號" : "登入"}</button></form>
      <button onClick={() => { setRegistering(value => !value); setError(""); }} className="mt-5 w-full text-center text-sm text-zinc-500">{registering ? "已經有帳號？登入" : "還沒有帳號？免費註冊"}</button>
    </div></section>
  </main>;
}
