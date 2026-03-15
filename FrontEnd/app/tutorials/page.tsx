"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getPublicTutorials,
  Tutorial
} from "@/lib/api";
import { getSocket } from "@/lib/socket";
import {
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Tag,
  Calendar,
  Zap,
  Loader2,
  UserCircle,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export default function TutorialsPage() {
  const router = useRouter();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchTutorials();

    const socket = getSocket();
    socket.on("new_tutorial", (tut: Tutorial) => {
      setTutorials(prev => [tut, ...prev]);
    });
    socket.on("update_tutorial", (tut: Tutorial) => {
      setTutorials(prev => prev.map(t => t.id === tut.id ? tut : t));
    });
    socket.on("delete_tutorial", (id: string) => {
      setTutorials(prev => prev.filter(t => t.id !== id));
    });

    return () => {
      socket.off("new_tutorial");
      socket.off("update_tutorial");
      socket.off("delete_tutorial");
    };
  }, []);

  const fetchTutorials = async () => {
    try {
      setLoading(true);
      const data = await getPublicTutorials();
      if (Array.isArray(data)) {
        setTutorials(data);
      } else {
        console.error("Expected array from getPublicTutorials, got:", data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-1/4 right-1/4 h-96 w-96 rounded-full bg-emerald-500/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-12 lg:py-24">
        <header className="mb-12 lg:mb-20 animate-in fade-in slide-in-from-top-8 duration-700">
          <Link href="/profile" className="inline-flex items-center gap-2 text-white/40 hover:text-emerald-50 transition-colors mb-6 group">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Profile</span>
          </Link>

          <div className="flex items-center gap-4 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <BookOpen className="h-5 w-5" />
            </div>
            <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500/60">Knowledge Archives</h2>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] italic mb-6">
            KNOWLEDGE <br />
            <span className="text-emerald-500/10 stroke-text">TRANSFERS</span>
          </h1>
          <p className="max-w-md text-white/30 text-[13px] md:text-lg font-medium leading-relaxed">
            Access technical documentation and implementation guides for the Project DoraTeam ecosystem.
          </p>
        </header>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : tutorials.length === 0 ? (
          <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-12 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <Zap className="h-12 w-12 text-white/10 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No archived knowledge found</h3>
            <p className="text-white/40 text-sm">The libraries are currently being populated. Check back shortly.</p>
          </div>
        ) : (
          <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            {tutorials.map((tut, i) => (
              <div
                key={tut.id}
                onClick={() => {
                  if (!tut.isPublic) {
                    const token = localStorage.getItem("accessToken");
                    if (!token) {
                      router.push("/login");
                      return;
                    }
                  }
                  router.push(`/tutorials/${tut.id}`);
                }}
                className="group relative block overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-5 md:p-8 transition-all hover:bg-white/[0.05] hover:border-emerald-500/30 cursor-pointer animate-in fade-in slide-in-from-bottom-8 backdrop-blur-md"
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4" onClick={(e) => e.stopPropagation()}>
                      {tut.author && tut.author.id && (
                        <Link
                          href={`/profile/${tut.author.id}`}
                          className="flex items-center gap-2 text-[10px] font-bold text-white/40 hover:text-emerald-500 transition-colors group/author"
                        >
                          {tut.author.avatarUrl ? (
                            <img src={tut.author.avatarUrl} className="h-4 w-4 rounded-full border border-white/10 object-cover flex-shrink-0" alt="" />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover/author:border-emerald-500/40">
                              <UserCircle className="h-2.5 w-2.5" />
                            </div>
                          )}
                          <span className="uppercase tracking-widest">{tut.author.name || "System"}</span>
                        </Link>
                      )}

                      <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-2.5 py-1 text-[9px] font-black uppercase text-emerald-500/80">
                        <Tag className="h-2.5 w-2.5" />
                        {tut.category}
                      </div>

                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/20">
                        <Calendar className="h-2.5 w-2.5" />
                        {tut.createdAt ? new Date(tut.createdAt).toLocaleDateString() : "Unknown date"}
                      </div>

                      {mounted && !tut.isPublic && !localStorage.getItem("accessToken") && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-[9px] font-black uppercase text-rose-500">
                          <Lock className="h-2.5 w-2.5" />
                          Restricted
                        </div>
                      )}
                    </div>
                    <h2 className="text-xl md:text-2xl font-black tracking-tight mb-2 group-hover:text-emerald-400 transition-colors uppercase">{tut.title}</h2>
                    <div className="text-white/30 text-[12px] md:text-sm leading-relaxed line-clamp-2 max-w-2xl overflow-hidden [&_*]:m-0 italic">
                      <MarkdownRenderer content={tut.content} disallowLinks={true} />
                    </div>
                  </div>
                  <div className="flex items-center justify-end md:block">
                    <div className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-xl md:rounded-2xl bg-white/5 border border-white/10 transition-all group-hover:bg-emerald-500 group-hover:text-black group-hover:scale-110 shadow-lg">
                      <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <style jsx global>{`
        .stroke-text {
          -webkit-text-stroke: 1px rgba(255,255,255,0.1);
        }
      `}</style>
    </div>
  );
}
