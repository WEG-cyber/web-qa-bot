import ChatWidget from "@/components/ChatWidget";
import { ArrowRight, Box, Cpu, Shield, Smartphone, Globe, Lock } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Circuit Pattern Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none -z-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="cyan" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-5xl w-full text-center space-y-12">
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-cyan-500/10 text-cyan-400 rounded-full text-xs font-bold border border-cyan-500/20 uppercase tracking-[0.2em] animate-fade-in shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <Globe size={14} />
          <span>Next-Gen Access Control Systems</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] animate-fade-in">
          Unlock the <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-600">
            Future of Entry
          </span>
        </h1>
        
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light">
          Cellbedell 提供基於 Edge AI 的智慧門禁解決方案。<br />
          無需物理鑰匙，僅需手機感應，即可實現無感通行。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
          <FeatureCard icon={<Smartphone className="text-cyan-400" />} title="Mobile Vkey" desc="手機即是門禁卡" />
          <FeatureCard icon={<Cpu className="text-blue-400" />} title="Edge AI" desc="邊緣運算即時辨識" />
          <FeatureCard icon={<Lock className="text-cyan-400" />} title="Eco-Security" desc="金融級加密保護" />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <button className="px-10 py-5 bg-cyan-500 text-black rounded-xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-cyan-400 transition-all shadow-[0_10px_30px_rgba(6,182,212,0.4)] group">
            探索產品線
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="px-10 py-5 bg-transparent text-white border border-white/10 rounded-xl font-bold hover:bg-white/5 transition-all">
            查看技術文檔
          </button>
        </div>
      </div>

      {/* The Redesigned Chat Widget */}
      <ChatWidget />
      
      <footer className="absolute bottom-8 left-0 w-full text-center text-zinc-600 text-[10px] uppercase tracking-widest font-mono">
        &copy; 2026 Cellbedell Technology. All systems operational.
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 bg-zinc-900/40 backdrop-blur-md rounded-3xl border border-white/5 text-left transition-all hover:bg-zinc-900/60 hover:border-cyan-500/20 group">
      <div className="mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed font-light">{desc}</p>
    </div>
  );
}
