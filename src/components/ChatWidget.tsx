"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Smartphone, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

type PublicBotConfig = { name: string; primaryColor: string; welcomeMessage: string };

type SupportedLang = 'zh' | 'en' | 'ja' | 'th';

const uiCopy: Record<SupportedLang, {
  welcome: string;
  status: string;
  processing: string;
  placeholder: string;
  error: string;
}> = {
  zh: {
    welcome: '您好，我是 Alice。很榮幸為您提供 Cellbedell 專業技術與產品支援，有什麼我可以協助您的？',
    status: '企業級安全連線 v2.5',
    processing: 'AI 思考中...',
    placeholder: '詢問技術細節...',
    error: '您好，我是 Alice。您可以詢問 Cellbedell 的智慧門禁、手機開門、Wallet 憑證、自助入住或建置費用。若您需要估算建置費用，也可以先使用：https://www.cellbedell.com/#calculator',
  },
  en: {
    welcome: 'Hello, I am Alice. I am honored to provide professional technical and product support for Cellbedell. How can I help you today?',
    status: 'Enterprise Secure v2.5',
    processing: 'Processing...',
    placeholder: 'Ask a question...',
    error: 'Hello, I am Alice. You can ask me about Cellbedell smart access, mobile keys, Wallet credentials, self check-in, or setup costs. For pricing estimates: https://www.cellbedell.com/#calculator',
  },
  ja: {
    welcome: 'こんにちは、Aliceです。Cellbedellの製品と技術について、専門的にサポートいたします。どのようなご用件でしょうか？',
    status: 'エンタープライズ安全接続 v2.5',
    processing: 'AI が考えています...',
    placeholder: '技術的な内容を質問...',
    error: 'こんにちは、Aliceです。Cellbedell のスマートアクセス、モバイルキー、Wallet 認証、自動チェックイン、概算費用についてご相談いただけます。お見積もりはこちら：https://www.cellbedell.com/#calculator',
  },
  th: {
    welcome: 'สวัสดีค่ะ ฉันชื่อ Alice ยินดีให้บริการข้อมูลผลิตภัณฑ์และการสนับสนุนด้านเทคนิคของ Cellbedell ต้องการให้ช่วยเรื่องใดคะ?',
    status: 'การเชื่อมต่อระดับองค์กร v2.5',
    processing: 'AI กำลังประมวลผล...',
    placeholder: 'สอบถามรายละเอียดทางเทคนิค...',
    error: 'สวัสดีค่ะ ฉันชื่อ Alice คุณสามารถสอบถามเรื่องระบบประตูอัจฉริยะ Mobile Key, Wallet, ระบบเช็กอินอัตโนมัติ หรือการประเมินค่าใช้จ่ายได้ค่ะ: https://www.cellbedell.com/#calculator',
  },
};

function normalizeLang(value: string | null): SupportedLang {
  const lang = (value || 'zh').toLowerCase();

  if (lang.startsWith('en')) return 'en';
  if (lang.startsWith('ja') || lang.startsWith('jp')) return 'ja';
  if (lang.startsWith('th')) return 'th';
  return 'zh';
}

const urlPattern = /(https?:\/\/[^\s<>"']+)/g;
const trailingUrlPunctuation = /[.,，。!?！？;；:：)）\]]+$/;

function renderMessageText(text: string, isUser: boolean) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(urlPattern)) {
    const rawUrl = match[0];
    const startIndex = match.index ?? 0;
    let url = rawUrl;
    let trailing = '';
    const trailingMatch = url.match(trailingUrlPunctuation);

    if (trailingMatch) {
      trailing = trailingMatch[0];
      url = url.slice(0, -trailing.length);
    }

    if (startIndex > lastIndex) {
      parts.push(text.slice(lastIndex, startIndex));
    }

    parts.push(
      <a
        key={`${url}-${startIndex}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "break-all underline underline-offset-2 transition-colors",
          isUser ? "text-black hover:text-zinc-700" : "text-cyan-300 hover:text-cyan-200"
        )}
      >
        {url}
      </a>
    );

    if (trailing) {
      parts.push(trailing);
    }

    lastIndex = startIndex + rawUrl.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length ? parts : text;
}

export default function ChatWidget() {
  const searchParams = useSearchParams();
  const lang = normalizeLang(searchParams.get('lang'));
  const botId = searchParams.get('botId') || undefined;
  const embedOrigin = searchParams.get('origin') || undefined;
  const copy = uiCopy[lang];
  const [botConfig, setBotConfig] = useState<PublicBotConfig | null>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef('');

  useEffect(() => {
    conversationIdRef.current = crypto.randomUUID();
  }, []);

  // 根據語言設定初始歡迎詞
  useEffect(() => {
    setMessages([
      {
        id: '1',
        role: 'bot',
        text: botConfig?.welcomeMessage || copy.welcome,
        timestamp: new Date(),
      },
    ]);
  }, [copy.welcome, botConfig?.welcomeMessage]);

  useEffect(() => {
    if (!botId) return;
    fetch(`/api/bots/${encodeURIComponent(botId)}/config`)
      .then(response => response.ok ? response.json() : null)
      .then(data => data && setBotConfig(data))
      .catch(() => undefined);
  }, [botId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (window.parent !== window && botId) {
      window.parent.postMessage({ type: 'alice-widget-resize', botId, open: isOpen }, '*');
    }
  }, [isOpen, botId]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          botId,
          origin: embedOrigin,
          conversationId: conversationIdRef.current || crypto.randomUUID(),
          lang: lang // 將語系傳給後端
        }),
      });

      const data = await response.json();
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: data.reply || copy.error,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: copy.error,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans">
      {/* Premium Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-16 h-16 sm:w-14 sm:h-14 bg-black border border-white/20 rounded-2xl flex items-center justify-center text-cyan-400 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-50 overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {isOpen ? <X className="w-7 h-7 sm:w-6 sm:h-6 text-white" /> : <MessageSquare className="w-8 h-8 sm:w-[26px] sm:h-[26px]" fill="currentColor" />}
        {!isOpen && (
          <div className="absolute top-2 right-2 w-2.5 h-2.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
        )}
      </motion.button>

      {/* Pop-up Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8, originX: '100%', originY: '100%' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="absolute bottom-16 right-0 w-[calc(100vw-2rem)] sm:w-[400px] h-[80vh] sm:h-[580px] bg-[#0c0c0e]/95 backdrop-blur-3xl rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.4)] overflow-hidden border border-white/10 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 bg-black/40 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-zinc-700 to-black rounded-xl border border-white/10 flex items-center justify-center shadow-inner">
                  <Smartphone size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm tracking-wide">{(botConfig?.name || 'ALICE').toUpperCase()} – SMART AGENT</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter">
                      {copy.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "px-4 py-3 rounded-2xl text-[15px] sm:text-[13.5px] leading-relaxed whitespace-pre-wrap",
                      msg.role === 'user'
                        ? "bg-cyan-500 text-black font-semibold rounded-tr-none shadow-[0_5px_15px_rgba(6,182,212,0.3)]"
                        : "bg-zinc-900 border border-white/5 text-zinc-100 rounded-tl-none shadow-xl"
                    )}
                  >
                    {renderMessageText(msg.text, msg.role === 'user')}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-cyan-500 p-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-[10px] font-mono tracking-widest uppercase">
                    {copy.processing}
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-5 bg-black/40 border-t border-white/5">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-1 flex items-center">
                <input
                  type="text"
                  placeholder={copy.placeholder}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-[15px] sm:text-sm text-white placeholder:text-zinc-600"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    input.trim() ? "bg-white text-black hover:scale-105" : "bg-white/5 text-zinc-700"
                  )}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
