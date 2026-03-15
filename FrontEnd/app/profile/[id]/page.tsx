"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import type { AuthUser } from "@/lib/api";
import { getUserById } from "@/lib/api";
import {
  HomeIcon,
  Mail,
  User,
  ShieldAlert,
  ArrowLeft,
  Clock,
  BookOpen,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await getUserById(id);
        setUser(userData);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError(err instanceof Error ? err.message : "User not found");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse text-white/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] text-white p-4">
        <h1 className="text-2xl font-bold mb-4">Error Accessing Data</h1>
        <p className="text-rose-400 mb-8">{error || "User data is classified or non-existent."}</p>
        <Button onClick={() => router.back()} className="rounded-2xl">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retreat to Previous Node
        </Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-primary/30 overflow-hidden font-sans">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
      </div>

      {/* Navigation */}
      <div className="relative z-30 p-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-white/60 hover:text-white bg-white/5 rounded-xl border border-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return
        </Button>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
          Security Level: Restricted
        </div>
      </div>

      <div className="relative z-20 mx-auto w-full max-w-4xl px-4 pb-20 pt-10">
        <div className="group relative rounded-[2.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-500 hover:border-white/20">

          <div className="absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />

          <div className="flex flex-col lg:flex-row p-8 lg:p-12 gap-12">

            {/* Left Column */}
            <div className="flex flex-col items-center lg:items-start lg:w-1/3">
              <div className="relative">
                <div
                  className={cn(
                    "relative h-44 w-44 rounded-[2.5rem] p-1.5 transition-all duration-500 bg-linear-to-br from-primary via-purple-500 to-blue-500"
                  )}
                >
                  <div className="h-full w-full overflow-hidden rounded-[2.2rem] bg-[#0a0a0a]">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name ?? "User"} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/[0.05]">
                        <User className="h-16 w-16 text-white/20" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center lg:items-start text-center lg:text-left">
                <h1 className="text-4xl font-black tracking-tighter bg-linear-to-br from-white to-white/60 bg-clip-text text-transparent">
                  {user.displayName || user.name || "Anonymous"}
                </h1>
                <div className="mt-2 text-primary font-mono text-sm tracking-widest lowercase">
                  @{user.name ? user.name.toLowerCase() : ""}
                </div>
                <div className="mt-2 flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 border border-white/5">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-white/60">{user.email}</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex-1 space-y-10">

              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  {(user.role === "admin" || user.role === "superadmin") && (
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-2 shadow-lg">
                      <ShieldAlert className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold">Authorized Personnel</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="relative group/bio">
                <div className="absolute -inset-1 rounded-[2rem] bg-linear-to-r from-primary/20 via-blue-500/20 to-purple-500/20 opacity-20 blur-xl" />
                <div className="relative rounded-[1.8rem] border border-white/10 bg-black/40 p-1">
                  <div className="rounded-[1.6rem] bg-white/[0.02] p-6">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4 block">Identity Dossier</label>
                    <p className="text-sm leading-8 text-white/70 italic font-medium">
                      " {user.bio ?? "Subject has not provided a mission statement."} "
                    </p>
                  </div>
                </div>
              </div>

              {/* Roles Badge Card */}
              {user.roles && user.roles.length > 0 && (
                <div className="relative group/roles">
                  <div className="absolute -inset-1 rounded-[2rem] bg-linear-to-r from-emerald-500/20 via-primary/20 to-blue-500/20 opacity-20 blur-xl" />
                  <div className="relative rounded-[1.8rem] border border-white/10 bg-black/40 p-1">
                    <div className="rounded-[1.6rem] bg-white/[0.02] p-6">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4 block">Vai trò được cấp</label>
                      <div className="flex flex-wrap gap-3">
                        {user.roles.map((role) => (
                          <div
                            key={role.id}
                            className="flex items-center gap-2 rounded-xl border px-4 py-2 transition-all hover:scale-105"
                            style={{
                              backgroundColor: `${role.color}10`,
                              borderColor: `${role.color}40`,
                              boxShadow: `0 0 15px ${role.color}15`
                            }}
                          >
                            <div className="h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: role.color, color: role.color }} />
                            <span className="text-xs font-black uppercase tracking-wider" style={{ color: role.color }}>
                              {role.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Credential Level</span>
                  <div className="mt-2 text-2xl font-black text-white capitalize">
                    {user.role}
                  </div>
                  <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={cn(
                      "h-full bg-linear-to-r from-primary to-blue-500",
                      user.role === 'superadmin' ? 'w-full' : user.role === 'admin' ? 'w-3/4' : 'w-1/4'
                    )} />
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">DoraTeam Status</span>

                  {user.lastActiveAt ? (
                    (() => {
                      const lastActive = new Date(user.lastActiveAt);
                      const isOnline = (new Date().getTime() - lastActive.getTime()) / (1000 * 60) < 5;

                      return isOnline ? (
                        <>
                          <div className="mt-2 text-2xl font-black text-emerald-500 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                            Active
                          </div>
                          <p className="mt-1 text-[10px] font-medium text-white/30 uppercase tracking-tight">Curently transmitting on Node</p>
                        </>
                      ) : (
                        <>
                          <div className="mt-2 text-2xl font-black text-rose-500 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                            Offline
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-white/30">
                            <Clock className="h-3 w-3" />
                            <p className="text-[10px] font-medium uppercase tracking-tight">
                              {formatDistanceToNow(lastActive, { addSuffix: true })}
                            </p>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <>
                      <div className="mt-2 text-2xl font-black text-rose-500">
                        External
                      </div>
                      <p className="mt-1 text-[10px] font-medium text-white/30 uppercase tracking-tight">Access restricted by Protocol 9</p>
                    </>
                  )}
                </div>

                <div className="group/stat relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-6 transition-all hover:bg-white/[0.07] hover:border-emerald-500/30">
                  <div className="absolute top-0 right-0 p-4 opacity-10 transition-all group-hover/stat:opacity-30 group-hover/stat:scale-125 font-black text-emerald-500">
                    <BookOpen className="h-12 w-12" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Knowledge Base</span>
                  <div className="mt-2 text-2xl font-black text-white">
                    Tutorials
                  </div>
                  <Link href="/tutorials" className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:translate-x-1 transition-transform">
                    Xem blogs hướng dẫn <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="group/stat relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-6 transition-all hover:bg-white/[0.07] hover:border-primary/30">
                  <div className="absolute top-0 right-0 p-4 opacity-10 transition-all group-hover/stat:opacity-30 group-hover/stat:scale-125 font-black text-primary">
                    <MessageSquare className="h-12 w-12" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Community</span>
                  <div className="mt-2 text-2xl font-black text-white">
                    Forum
                  </div>
                  <Link href="/forum" className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest hover:translate-x-1 transition-transform">
                    Truy cập diễn đàn <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href="/"
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "h-14 w-full rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(255,255,255,0.15)] transition-all hover:-translate-y-1 hover:bg-white/90"
                  )}
                >
                  <HomeIcon className="mr-2 h-4 w-4" />
                  Exit To Terminal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
