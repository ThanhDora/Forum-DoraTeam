"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ShieldCheck,
  Zap,
  Cpu,
  Globe,
  Lock,
  User as UserIcon,
  ChevronRight,
  Activity,
  Layers,
  ArrowRight,
  Shield,
  Info,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMe } from "@/lib/api";
import type { AuthUser } from "@/lib/api";

export default function Page() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = typeof window !== "undefined" ? (localStorage.getItem("accessToken") ?? localStorage.getItem("token")) : null;
    if (token) {
      getMe()
        .then((data) => {
          setUser(data);
          if (typeof window !== "undefined") localStorage.setItem("user", JSON.stringify(data));
        })
        .catch(() => {
          const rawUser = localStorage.getItem("user");
          if (rawUser) {
            try {
              setUser(JSON.parse(rawUser));
            } catch {
              setUser(null);
            }
          }
        });
    } else {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        try {
          setUser(JSON.parse(rawUser));
        } catch {
          localStorage.removeItem("user");
        }
      }
    }
  }, [mounted]);

  if (!mounted) return <div className="min-h-screen bg-[#050505]" />;

  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 overflow-hidden font-sans">
      {/* Visual Background: Cyber Grid & Data Streams */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-linear-to-t from-[#050505] via-transparent to-transparent" />

        {/* Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-emerald-500/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-500/5 blur-[120px]" />

        {/* Animated Scanning Line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-transparent via-emerald-500/20 to-transparent animate-scan pointer-events-none" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:py-24 min-h-screen flex flex-col items-center justify-center">

        {user ? (
          /* AUTHENTICATED STATE: THE NEXUS COMMAND CENTER */
          <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1 mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">DoraTeam: Connected</span>
                </div>
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none mb-2">
                  WELCOME BACK, <br />
                  <span className="bg-linear-to-r from-emerald-400 via-blue-500 to-purple-500 bg-clip-text text-transparent uppercase italic">
                    {user.name?.split(' ')[0] ?? 'OPERATOR'}
                  </span>
                </h1>
                <p className="text-white/40 text-[10px] md:text-sm font-medium tracking-tight">System permissions: level_access_{user.role}</p>
              </div>

              <Link href="/profile" className="group relative shrink-0">
                <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-emerald-500 to-blue-500 opacity-20 blur-md transition group-hover:opacity-100" />
                <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-2xl md:rounded-3xl border border-white/10 bg-black/50 p-1 backdrop-blur-xl">
                  <div className="h-full w-full rounded-[1rem] md:rounded-[1.2rem] overflow-hidden bg-white/5">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="User" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center"><UserIcon className="h-8 w-8 md:h-10 md:w-10 text-white/10" /></div>
                    )}
                  </div>
                </div>
              </Link>
            </div>

            {/* Quick Access Dashboard — Admin (profile) + INFO (user) from API */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(user.role === "admin" || user.role === "superadmin") && (
                <Link href="/profile" className="group/card relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03] p-6 transition-all hover:bg-white/[0.07] hover:border-blue-500/30">
                  <Shield className="h-8 w-8 text-blue-500 mb-4 transition-transform group-hover/card:scale-110" />
                  <h3 className="text-lg font-bold">Admin</h3>
                  <p className="text-sm text-white/40 mt-1">Profile of Admin (you). Credentials and identity.</p>
                  <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 opacity-0 -translate-x-4 transition-all group-hover/card:opacity-100 group-hover/card:translate-x-0" />
                </Link>
              )}

              <Link href="/profile" className="group/card relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03] p-6 transition-all hover:bg-white/[0.07] hover:border-emerald-500/30">
                <Info className="h-8 w-8 text-emerald-500 mb-4 transition-transform group-hover/card:scale-110" />
                <h3 className="text-lg font-bold">INFO</h3>
                <p className="text-sm text-white/40 mt-1">User information: {user.email} · {user.name ?? "—"} · {user.role}</p>
                <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 opacity-0 -translate-x-4 transition-all group-hover/card:opacity-100 group-hover/card:translate-x-0" />
              </Link>

              {(user.role === "admin" || user.role === "superadmin") && (
                <Link href="/admin" className="group/card relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03] p-6 transition-all hover:bg-white/[0.07] hover:border-purple-500/30">
                  <ShieldCheck className="h-8 w-8 text-purple-500 mb-4 transition-transform group-hover/card:scale-110" />
                  <h3 className="text-lg font-bold">DoraTeam Control</h3>
                  <p className="text-sm text-white/40 mt-1">Manage users and administrative overrides.</p>
                  <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 opacity-0 -translate-x-4 transition-all group-hover/card:opacity-100 group-hover/card:translate-x-0" />
                </Link>
              )}

              <Link href="/tutorials" className="group/card relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03] p-6 transition-all hover:bg-white/[0.07] hover:border-emerald-500/30">
                <BookOpen className="h-8 w-8 text-emerald-500 mb-4 transition-transform group-hover/card:scale-110" />
                <h3 className="text-lg font-bold">Tutorials</h3>
                <p className="text-sm text-white/40 mt-1">Access technical guides and mission documentation.</p>
                <div className="mt-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 group-hover/card:translate-x-1 transition-transform">
                  Xem blogs hướng dẫn <ChevronRight className="h-3 w-3" />
                </div>
              </Link>

              <Link href="/forum" className="group/card relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03] p-6 transition-all hover:bg-white/[0.07] hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                <Activity className="h-8 w-8 text-emerald-500 mb-4 transition-transform group-hover/card:scale-110 group-hover/card:rotate-12" />
                <h3 className="text-lg font-bold flex items-center gap-2">
                  Diễn đàn
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </h3>
                <p className="text-sm text-white/40 mt-1">Hệ thống thảo luận và chia sẻ kinh nghiệm bypass.</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[8px] font-black text-emerald-500/40 uppercase tracking-widest">Handshaking</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-2 w-0.5 bg-emerald-500/30 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms`, animationDuration: '1s' }} />)}
                  </div>
                </div>
                <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 opacity-0 -translate-x-4 transition-all group-hover/card:opacity-100 group-hover/card:translate-x-0 text-emerald-500" />
              </Link>
            </div>
          </div>
        ) : (
          /* GUEST STATE: THE ENTRY POINT */
          <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-1000">
            {/* Glitchy Logo Header */}
            <div className="relative inline-flex mb-8">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-2xl animate-pulse" />
              <div className="relative bg-[#0a0a0a] border border-emerald-500/20 p-4 md:p-5 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.15)] group-hover:border-emerald-500/40 transition-colors">
                <img src="/icon.png" alt="DoraTeam Logo" className="h-10 w-10 md:h-14 md:w-14 object-contain opacity-90 group-hover:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
            </div>

            <h2 className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/60 mb-2">Establishing Secure Connection...</h2>
            <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[12rem] font-black tracking-tighter leading-[0.8] mb-4 italic px-4">
              DoraTeam <br className="sm:hidden" />
              <span className="text-emerald-500/10 stroke-text">PROJECT</span>
            </h1>

            <p className="max-w-md text-white/30 text-[11px] md:text-sm font-medium leading-relaxed mb-8 px-8">
              Bypass limitations. Redefine execution. The ultimate ecosystem for <span className="text-white/60 border-b border-white/10 whitespace-nowrap">game modification</span> and technical overrides.
            </p>

            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 sm:gap-4 w-full max-w-xl px-8">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "col-span-2 sm:flex-1 h-12 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_15px_40px_rgba(255,255,255,0.1)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(255,255,255,0.15)] active:translate-y-0 group relative overflow-hidden"
                )}
              >
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
                <span className="relative flex items-center justify-center gap-2">
                  Access Dora
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <Link
                href="/forum"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 rounded-2xl border-white/5 bg-white/[0.03] text-white/50 font-black uppercase tracking-[0.2em] text-[9px] transition-all hover:-translate-y-1 hover:bg-white/10 hover:border-emerald-500/30 hover:text-emerald-500 shadow-[0_5px_15px_rgba(0,0,0,0.3)] backdrop-blur-md flex items-center justify-center"
                )}
              >
                Forum
              </Link>

              <Link
                href="/tutorials"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 rounded-2xl border-white/5 bg-white/[0.03] text-white/50 font-black uppercase tracking-[0.2em] text-[9px] hover:bg-white/10 transition-all hover:-translate-y-1 hover:border-white/20 shadow-[0_5px_15px_rgba(0,0,0,0.3)] backdrop-blur-md flex items-center justify-center"
                )}
              >
                Archives
              </Link>
            </div>

            {/* Feature Pills */}
            <div className="mt-16 grid grid-cols-2 md:flex md:flex-wrap justify-center gap-3 opacity-30 px-6">
              {[
                { icon: <Lock className="h-3 w-3" />, label: "Encrypted Path" },
                { icon: <Globe className="h-3 w-3" />, label: "Global Bypass" },
                { icon: <Cpu className="h-3 w-3" />, label: "Kernel Execution" },
                { icon: <Layers className="h-3 w-3" />, label: "Multi-mod Support" },
                { icon: <BookOpen className="h-3 w-3" />, label: "Public Archives" }
              ].map((f, i) => (
                <div key={i} className={cn(
                  "flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-[9px] font-bold uppercase tracking-widest",
                  i === 4 && "col-span-2 flex justify-center md:col-auto"
                )}>
                  {f.icon}
                  {f.label}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Interactive Decoration: Side Text */}
      <div className="fixed left-6 top-1/2 -rotate-90 origin-left hidden xl:block">
        <span className="text-[10px] font-black uppercase tracking-[0.8em] text-white/10">Project DoraTeam // v0.4.19</span>
      </div>
      <div className="fixed right-6 top-1/2 rotate-90 origin-right hidden xl:block">
        <span className="text-[10px] font-black uppercase tracking-[0.8em] text-white/10">Bypass protocol active</span>
      </div>

      <style jsx global>{`
        @keyframes scan {
          from { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          to { top: 100%; opacity: 0; }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
        .animate-scan {
          animation: scan 4s linear infinite;
        }
        .stroke-text {
          -webkit-text-stroke: 1px rgba(255,255,255,0.1);
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
