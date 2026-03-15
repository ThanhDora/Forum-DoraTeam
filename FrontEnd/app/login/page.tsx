"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, register } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ShieldCheck, ChevronRight, Activity, Cpu, Eye, EyeOff } from "lucide-react";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      router.push("/profile");
    }
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(""); // Clear previous errors

    if (mode === "register") {
      if (name !== name.toLowerCase()) {
        setError("Username phải được viết thường.");
        return;
      }
      if (name.includes(" ")) {
        setError("Username không được chứa khoảng trắng (viết liền nhau).");
        return;
      }
      const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
      if (!passwordRegex.test(password)) {
        setError("Mật khẩu phải có ít nhất 8 ký tự, bao gồm 1 chữ số và 1 ký tự đặc biệt.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, name || undefined);
      }
      router.push("/profile");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center relative overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,#0a0a0a_0%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

      {/* Ambient Orbs */}
      <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[20%] right-[20%] w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#080808]/60 backdrop-blur-2xl border border-white/5 shadow-2xl rounded-[2rem] overflow-hidden">

          {/* Header */}
          <div className="p-8 pb-6 border-b border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50" />
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] relative group">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl group-hover:bg-emerald-500/30 transition-all duration-500" />
                <Terminal className="h-8 w-8 text-emerald-400 relative z-10" />
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-white">
                  {mode === "login" ? "System Access" : "Initialize Node"}
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/50 mt-2">
                  Cyber Dora Network
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                onSubmit={handleAuth}
                className="space-y-6"
              >
                {mode === "register" && (
                  <div className="space-y-2 relative group">
                    <label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                      <Cpu className="h-3 w-3" /> Identity Matrix
                    </label>
                    <div className="relative">
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-300 placeholder:text-white/20"
                        placeholder="Enter your designated identifier"
                        autoComplete="name"
                      />
                      <div className="absolute inset-0 border border-white/5 rounded-xl pointer-events-none group-hover:border-white/10 transition-colors duration-300" />
                    </div>
                  </div>
                )}

                <div className="space-y-2 relative group">
                  <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <Activity className="h-3 w-3" /> Identifier (Username or Email)
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-300 placeholder:text-white/20"
                      placeholder="Username or email"
                      autoComplete="username email"
                    />
                    <div className="absolute inset-0 border border-white/5 rounded-xl pointer-events-none group-hover:border-white/10 transition-colors duration-300" />
                  </div>
                </div>

                <div className="space-y-2 relative group">
                  <label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3" /> Security Passphrase
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={mode === "register" ? 8 : 1}
                      className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3.5 pr-10 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-300 placeholder:text-white/20 tracking-wider"
                      placeholder={mode === "register" ? "Lớn hơn 8 ký tự, 1 số, 1 ký tự đặc biệt" : "••••••••"}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <div className="absolute inset-0 border border-white/5 rounded-xl pointer-events-none group-hover:border-white/10 transition-colors duration-300" />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-400 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0 animate-pulse" />
                        {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full group overflow-hidden rounded-xl p-[1px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-70 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500" />
                  <div className="relative bg-[#0a0a0a] rounded-xl px-4 py-4 flex items-center justify-center gap-2 transition-all duration-300">
                    <span className="text-sm font-black uppercase tracking-[0.2em] text-white group-hover:text-white/80 transition-colors duration-300">
                      {loading ? "Authenticating..." : mode === "login" ? "Establish Link" : "Generate Node"}
                    </span>
                    {!loading && <ChevronRight className="h-4 w-4 text-emerald-500 group-hover:text-emerald-400 transition-colors duration-300" />}
                  </div>
                </button>
              </motion.form>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-white/5 bg-[#0a0a0a]/50">
            <p className="text-center text-xs text-white/40">
              {mode === "login" ? (
                <>
                  Unauthorized node detected?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("register"); setError(""); }}
                    className="font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors ml-1"
                  >
                    Register here
                  </button>
                </>
              ) : (
                <>
                  Node already registered?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setError(""); }}
                    className="font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors ml-1"
                  >
                    Authenticate
                  </button>
                </>
              )}
            </p>
            <div className="mt-6 flex justify-center">
              <Link href="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white/60 transition-colors flex items-center gap-1 group">
                <div className="w-4 h-[1px] bg-white/20 group-hover:w-6 transition-all" /> Return to Mainframe <div className="w-4 h-[1px] bg-white/20 group-hover:w-6 transition-all" />
              </Link>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
