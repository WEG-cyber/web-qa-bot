"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Loader2, Sparkles, Smartphone, ShieldCheck } from 'lucide-react';
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

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      text: '您好，我是 Cellbedell 智慧系統與硬體專家。關於 Edge AI 門禁或 APP 操作，有什麼我可以協助您的？',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: data.reply || '系統偵測到異常，請檢查網路連線或稍後再試。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans selection:bg-cyan-500/30">
      {/* Premium Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0, 255, 213, 0.4)" }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-16 h-16 bg-[#000000] border border-cyan-500/30 rounded-2xl flex items-center justify-center text-cyan-400 cursor-pointer overflow-hidden group shadow-[0_0_15px_rgba(0,0,0,0.5)]"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        {isOpen ? (
          <X size={28} className="relative z-10" />
        ) : (
          <div className="relative z-10 flex flex-col items-center">
            <MessageSquare size={28} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-black" />
          </div>
        )}
      </motion.button>

      {/* Futuristic Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[400px] h-[620px] bg-[#0a0a0b]/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden border border-white/10 flex flex-col"
          >
            {/* Header: Cyber Design */}
            <div className="relative p-6 bg-[#000000] border-b border-white/5 overflow-hidden">
              {/* Circuit Pattern Background Decoration */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0 20 H100 M20 0 V100 M80 0 V100 M0 50 H100" stroke="currentColor" fill="none" className="text-cyan-500" strokeWidth="0.5" />
                </svg>
              </div>
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                    <Smartphone size={24} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full" title="Online" />
                </div>
                <div>
                  <h3 className="font-bold text-white tracking-tight flex items-center gap-2">
                    Cellbedell AI 專員
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30 uppercase">Enterprise</span>
                  </h3>
                  <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                    <ShieldCheck size={12} className="text-cyan-500" />
                    安全連線已建立
                  </p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Message Area: Dark Theme */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.98, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "px-4 py-3 rounded-2xl text-[14px] leading-relaxed transition-all",
                      msg.role === 'user'
                        ? "bg-cyan-500 text-black font-medium rounded-tr-none shadow-[0_10px_20px_-5px_rgba(6,182,212,0.3)]"
                        : "bg-zinc-900/50 border border-white/5 text-zinc-200 rounded-tl-none backdrop-blur-sm"
                    )}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-zinc-600 mt-2 px-1 uppercase tracking-widest font-mono">
                    {msg.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-3 text-cyan-500/70 p-2">
                  <div className="flex gap-1">
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1.5 h-1.5 bg-current rounded-full" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 bg-current rounded-full" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 bg-current rounded-full" />
                  </div>
                  <span className="text-[11px] font-mono tracking-tighter uppercase">Analyzing Data Stream...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area: Glass Style */}
            <div className="p-6 pt-2 bg-gradient-to-t from-[#000000] to-transparent">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="輸入您的技術諮詢..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="w-full bg-zinc-900/80 border border-white/5 focus:border-cyan-500/50 outline-none rounded-2xl py-4 pl-5 pr-14 text-sm text-white placeholder:text-zinc-600 transition-all shadow-inner"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className={cn(
                    "absolute right-2 top-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    input.trim() 
                      ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95" 
                      : "bg-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed"
                  )}
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-4 px-1">
                <div className="flex gap-4">
                  <Sparkles size={14} className="text-zinc-700 hover:text-cyan-500 cursor-help transition-colors" title="AI Powered" />
                </div>
                <p className="text-[9px] text-zinc-700 uppercase tracking-[0.2em] font-mono">
                  Cellbedell Ecosystem Pro
                </p>
              </div>
            </div>
            
            {/* Glow Decorative Line */}
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
