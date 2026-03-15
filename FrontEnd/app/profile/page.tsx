/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import type { AuthUser } from "@/lib/api";
import { updateProfile, getMe, logout } from "@/lib/api";
import { TiptapEditor } from "@/components/TiptapEditor";
import {
  HomeIcon,
  Mail,
  User,
  LogOut,
  Settings,
  Camera,
  Upload,
  ShieldAlert,
  Wifi,
  WifiOff,
  BookOpen,
  ChevronRight,
  Key,
  Lock,
  Eye,
  EyeOff,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getSocket } from "@/lib/socket";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [_loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Edit states
  const [editName, setEditName] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 100);
    const socket = getSocket();

    const onConnect = () => {
      setIsConnected(true);
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const u = JSON.parse(rawUser) as AuthUser;
        socket.emit("identify", u.id);
      }
    };
    const onDisconnect = () => setIsConnected(false);

    if (socket.connected) onConnect();

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    const fetchLatestUser = async () => {
      try {
        const latestUser = await getMe();
        if (!latestUser) {
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }
        setUser(latestUser);
        localStorage.setItem("user", JSON.stringify(latestUser));

        setEditName(latestUser.name ?? "");
        setEditDisplayName(latestUser.displayName ?? "");
        setEditBio(latestUser.bio ?? "");
        setEditAvatarUrl(latestUser.avatarUrl ?? "");
        setLoading(false);
      } catch (err) {
        console.warn("Session verification failed:", err);
        localStorage.removeItem("user");
        router.replace("/login");
      }
    };

    const raw = localStorage.getItem("user");
    if (!raw) {
      router.replace("/login");
      return;
    }

    // Still mount early with local data if available for speed
    try {
      const parsedUser = JSON.parse(raw) as AuthUser;
      setUser(parsedUser);
      setEditName(parsedUser.name ?? "");
      setEditDisplayName(parsedUser.displayName ?? "");
      setEditBio(parsedUser.bio ?? "");
      setEditAvatarUrl(parsedUser.avatarUrl ?? "");
    } catch (e) { }

    fetchLatestUser();

    // Stats simulation timer
    const timer = setTimeout(() => {
      // already handled in fetchLatestUser but for safety
    }, 800);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      clearTimeout(timer);
    };
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
    router.refresh();
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const updatedUser = await updateProfile({
        displayName: editDisplayName,
        bio: editBio,
        avatarUrl: editAvatarUrl,
      });

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setIsEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  const handleCancel = () => {
    if (user) {
      setEditName(user.name ?? "");
      setEditDisplayName(user.displayName ?? "");
      setEditBio(user.bio ?? "");
      setEditAvatarUrl(user.avatarUrl ?? "");
    }
    setIsEditing(false);
    setIsChangingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ các trường");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }

    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự, bao gồm 1 chữ số và 1 ký tự đặc biệt.");
      return;
    }

    try {
      setLoading(true);
      await (await import("@/lib/api")).changePassword(currentPassword, newPassword);
      toast.success("Thay đổi mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thay đổi mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!mounted || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-primary/30 overflow-hidden font-sans">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
      </div>

      {/* Hero Header */}
      <div className="relative z-10 h-64 w-full bg-linear-to-b from-primary/10 via-background/0 to-background/0 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-px w-full bg-linear-to-r from-transparent via-primary/50 to-transparent opacity-20" />
        </div>
      </div>

      <div className="relative z-20 mx-auto -mt-32 w-full max-w-4xl px-4 pb-20">
        <div className="group relative rounded-[2.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-500 hover:border-white/20">

          {/* Inner Glow Decorative */}
          <div className="absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />

          <div className="flex flex-col lg:flex-row p-8 lg:p-12 gap-12">

            {/* Left Column: Essential Info */}
            <div className="flex flex-col items-center lg:items-start lg:w-1/3">
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />

                {/* Avatar Ring */}
                <div
                  className={cn(
                    "relative h-44 w-44 rounded-[2.5rem] p-1.5 transition-all duration-500",
                    "bg-linear-to-br from-primary via-purple-500 to-blue-500 group-hover:rotate-3",
                    isEditing && "cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(var(--primary),0.3)]"
                  )}
                  onClick={() => isEditing && fileInputRef.current?.click()}
                >
                  <div className="h-full w-full overflow-hidden rounded-[2.2rem] bg-[#0a0a0a]">
                    {isEditing ? (
                      editAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={editAvatarUrl} alt="Preview" className="h-full w-full object-cover transition-transform duration-700 hover:scale-110" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-white/[0.05]">
                          <User className="h-16 w-16 text-white/20" />
                        </div>
                      )
                    ) : (
                      user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatarUrl} alt={user.name ?? "User"} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-white/[0.05]">
                          <User className="h-16 w-16 text-white/20" />
                        </div>
                      )
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className={cn(
                    "absolute -bottom-2 -right-2 flex items-center gap-1.5 rounded-2xl border-2 border-[#0a0a0a] px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-xl",
                    isConnected ? "bg-emerald-500 text-white animate-bounce-subtle" : "bg-rose-500 text-white"
                  )}>
                    <div className={cn("h-2 w-2 rounded-full", isConnected ? "bg-white animate-pulse" : "bg-white/50")} />
                    {isConnected ? "Live" : "Offline"}
                  </div>
                </div>

                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -top-2 -left-2 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-primary shadow-lg transition-all hover:scale-110 active:rotate-12"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="mt-8 flex flex-col items-center lg:items-start text-center lg:text-left">
                {!isEditing ? (
                  <>
                    <h1 className="text-4xl font-black tracking-tighter bg-linear-to-br from-white to-white/60 bg-clip-text text-transparent">
                      {user.displayName || user.name || "Anonymous"}
                    </h1>
                    <div className="mt-2 text-primary font-mono text-sm tracking-widest lowercase">
                      @{user.name ? user.name.toLowerCase() : ""}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2">
                      <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 border border-white/5">
                        <Mail className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold text-white/60">{user.email}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 w-full">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Display Name</label>
                        <input
                          type="text"
                          value={editDisplayName}
                          onChange={(e) => setEditDisplayName(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm font-medium outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                          placeholder="Public handle"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Avatar Link</label>
                      <input
                        type="text"
                        value={editAvatarUrl}
                        onChange={(e) => setEditAvatarUrl(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm font-medium outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-mono text-white/80"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className="mt-8 w-full pt-8 border-t border-white/10">
                    <Button
                      variant="ghost"
                      onClick={() => setIsChangingPassword(!isChangingPassword)}
                      className={cn(
                        "w-full rounded-2xl border border-white/10 bg-white/5 font-bold transition-all",
                        isChangingPassword ? "text-primary border-primary/30" : "text-white/60"
                      )}
                    >
                      <Key className="mr-2 h-4 w-4" />
                      Thay đổi mật khẩu
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-10 hidden lg:flex flex-col gap-4 w-full">
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLogout}
                    className="w-full rounded-2xl border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Terminate Session
                  </Button>
                )}
              </div>
            </div>

            {/* Right Column: Content & Actions */}
            <div className="flex-1 space-y-10">

              {/* Header Actions for Mobile/Admin */}
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  {(user.role === "admin" || user.role === "superadmin") && !isEditing && (
                    <Button
                      onClick={() => router.push("/admin")}
                      className="rounded-2xl border border-white/10 bg-white/5 px-6 font-bold hover:bg-primary hover:text-white transition-all shadow-lg shadow-black/20"
                    >
                      <ShieldAlert className="mr-2 h-4 w-4 text-primary group-hover:text-white" />
                      DoraTeam
                    </Button>
                  )}
                </div>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-primary/20 hover:text-primary transition-all rotate-0 hover:rotate-90 active:scale-90"
                    onClick={() => setIsEditing(true)}
                  >
                    <Settings className="h-6 w-6" />
                  </Button>
                )}
              </div>

              {/* Bio Content Area */}
              <div className="relative group/bio">
                <div className="absolute -inset-1 rounded-[2rem] bg-linear-to-r from-primary/20 via-blue-500/20 to-purple-500/20 opacity-0 blur-xl transition duration-500 group-hover/bio:opacity-100" />
                <div className="relative rounded-[1.8rem] border border-white/10 bg-black/40 p-1">
                  <div className="rounded-[1.6rem] bg-white/[0.02] p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Personal Directive</label>
                    </div>
                    {isEditing ? (
                      <TiptapEditor
                        variant="compact"
                        value={editBio}
                        onChange={setEditBio}
                        placeholder="Define your bio context..."
                      />
                    ) : (
                      <p className="text-sm leading-8 text-white/70 italic font-medium">
                        " {user.bio ?? "No mission statement established. Update your profile to define your narrative."} "
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Roles Badge Card */}
              {user.roles && user.roles.length > 0 && !isEditing && (
                <div className="relative group/roles">
                  <div className="absolute -inset-1 rounded-[2rem] bg-linear-to-r from-emerald-500/20 via-primary/20 to-blue-500/20 opacity-0 blur-xl transition duration-500 group-hover/roles:opacity-100" />
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

              {/* Change Password Form */}
              {isEditing && isChangingPassword && (
                <div className="relative group/pw animate-in zoom-in-95 duration-300">
                  <div className="absolute -inset-1 rounded-[2rem] bg-linear-to-r from-amber-500/20 via-primary/20 to-orange-500/20 opacity-30 blur-xl" />
                  <div className="relative rounded-[1.8rem] border border-white/10 bg-black/40 p-1">
                    <div className="rounded-[1.6rem] bg-white/[0.02] p-6 space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 block">Cập nhật bảo mật</label>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-white/60 ml-1">Mật khẩu hiện tại</label>
                          <div className="relative group/field">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within/field:text-primary transition-colors" />
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-10 py-3 text-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                            >
                              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-white/60 ml-1">Mật khẩu mới</label>
                            <div className="relative">
                              <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength={8}
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 pr-10 py-3 text-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                placeholder="&gt; 8 ký tự, 1 số, 1 ký tự đặc biệt"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                              >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-white/60 ml-1">Xác nhận mật khẩu</label>
                            <div className="relative">
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 pr-10 py-3 text-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                placeholder="Nhập lại mật khẩu mới"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={handleChangePassword}
                          className="w-full mt-2 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black uppercase tracking-widest h-12 shadow-lg shadow-amber-900/20 transition-all active:scale-[0.98]"
                        >
                          Xác nhận thay đổi
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats & Global Rank */}
              {!isEditing && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="group/stat relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-6 transition-all hover:bg-white/[0.07] hover:border-white/20">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transition-all group-hover/stat:opacity-30 group-hover/stat:scale-125">
                      <User className="h-12 w-12" />
                    </div>
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
              )}

              {/* Big Bottom Actions */}
              <div className="pt-4">
                {isEditing ? (
                  <div className="flex gap-4">
                    <Button
                      onClick={handleSave}
                      className="h-14 flex-1 rounded-2xl bg-primary text-sm font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(var(--primary),0.3)] transition-all hover:-translate-y-1 active:translate-y-0"
                    >
                      Publish Changes
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleCancel}
                      className="h-14 flex-1 rounded-2xl border border-white/10 bg-white/5 text-sm font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Abort
                    </Button>
                  </div>
                ) : (
                  <Link
                    href="/"
                    className={cn(
                      buttonVariants({ variant: "default", size: "lg" }),
                      "h-14 w-full rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(255,255,255,0.15)] transition-all hover:-translate-y-1 hover:bg-white/90 active:translate-y-0"
                    )}
                  >
                    System Override [Home]
                  </Link>
                )}
              </div>

              {/* Mobile logout */}
              <div className="lg:hidden">
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLogout}
                    className="w-full h-14 rounded-2xl border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-black uppercase tracking-[0.2em]"
                  >
                    De-authorize
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Floating Blobs for interactive feel */}
      <div className="fixed top-1/4 right-0 -mr-20 h-96 w-96 rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-1/4 left-0 -ml-20 h-96 w-96 rounded-full bg-blue-500/5 blur-[150px] pointer-events-none" />
    </div>
  );
}
