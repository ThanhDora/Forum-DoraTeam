"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getPublicTutorial,
  Tutorial
} from "@/lib/api";
import {
  BookOpen,
  ArrowLeft,
  Tag,
  Calendar,
  Loader2,
  Share2,
  UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export default function TutorialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (id) fetchTutorial();
  }, [id]);
  const fetchTutorial = async () => {
    try {
      const data = await getPublicTutorial(id);

      // Session check only for non-public tutorials
      if (!data.isPublic) {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }
      }

      setTutorial(data);
    } catch (err) {
      console.error(err);
      router.push("/tutorials");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: tutorial?.title || "Project DoraTeam Knowledge Archive",
          text: `Check out this knowledge archive: ${tutorial?.title}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      // AbortError is expected if user cancels the share sheet
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Sharing failed", err);
        // Fallback to clipboard on any error (including InvalidStateError)
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (copyErr) {
          console.error("Clipboard fallback failed", copyErr);
        }
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!tutorial) return null;

  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-0 left-0 h-[50vh] w-full bg-linear-to-b from-emerald-500/10 to-transparent" />
      </div>

      <main className="relative z-10 mx-auto max-w-4xl px-6 py-12 lg:py-24">
        <nav className="mb-8 md:mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <Link href="/tutorials" className="inline-flex items-center gap-2 text-white/40 hover:text-emerald-50 transition-colors group">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Archives</span>
          </Link>
        </nav>

        <article className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <header className="mb-8 md:mb-12">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {tutorial.author && tutorial.author.id && (
                <Link
                  href={`/profile/${tutorial.author.id}`}
                  className="flex items-center gap-2.5 text-[10px] font-bold text-white/40 border-r border-white/5 pr-4 mr-0 hover:text-emerald-500 transition-colors group/author"
                >
                  {tutorial.author.avatarUrl ? (
                    <img src={tutorial.author.avatarUrl} className="h-5 w-5 rounded-full border border-white/10 object-cover flex-shrink-0" alt="" />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover/author:border-emerald-500/40">
                      <UserCircle className="h-3 w-3" />
                    </div>
                  )}
                  <span className="uppercase tracking-widest">{tutorial.author.name || "System"}</span>
                </Link>
              )}
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 text-[9px] font-black uppercase text-emerald-500">
                <Tag className="h-2.5 w-2.5" />
                {tutorial.category}
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/20">
                <Calendar className="h-2.5 w-2.5" />
                {tutorial.createdAt ? new Date(tutorial.createdAt).toLocaleDateString() : "Unknown date"}
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] uppercase italic mb-8">
              {tutorial.title}
            </h1>

            <div className="h-px w-full bg-linear-to-r from-emerald-500/50 via-emerald-500/10 to-transparent" />
          </header>

          <div className="mb-20">
            <MarkdownRenderer content={tutorial.content} />
          </div>

          <footer className="mt-16 md:mt-24 pt-8 md:pt-10 border-t border-white/5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Protocol</p>
                  <p className="text-xs md:text-sm font-bold">DoraTeam Knowledge Base</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleShare}
                disabled={isSharing}
                className={cn(
                  "w-full md:w-auto h-11 md:h-12 rounded-xl md:rounded-2xl border-white/10 bg-white/5 transition-all group font-black uppercase tracking-widest text-[10px]",
                  isSharing && "opacity-50 cursor-not-allowed",
                  copied ? "bg-emerald-500 text-black border-emerald-500" : "hover:bg-emerald-500 hover:text-black hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                )}
              >
                <Share2 className={cn("mr-2 h-3.5 w-3.5", isSharing && "animate-pulse")} />
                {isSharing ? "Establishing Link..." : copied ? "Data Copied" : "Share Decrypted Data"}
              </Button>
            </div>
          </footer>
        </article>
      </main>
    </div>
  );
}
