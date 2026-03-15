"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, Shield, Users, MessageSquare, BookOpen, Database, 
  ChevronRight, Copy, CheckCircle2, Search, ExternalLink, Zap
} from "lucide-react";

/**
 * MÀU SẮC GIAO DIỆN THEO CHUẨN DORATEAM TONE (Emerald/Dark)
 */
const THEME = {
  bg: "bg-[#050505]",
  sidebarBg: "bg-[#080808]",
  cardBg: "bg-white/[0.02]",
  cardBorder: "border-white/[0.05]",
  primary: "text-emerald-500",
  primaryBg: "bg-emerald-500",
  primaryHover: "hover:bg-emerald-400",
  danger: "text-rose-500",
  warning: "text-amber-500",
  info: "text-blue-500",
  success: "text-emerald-500",
};

/**
 * KIỂU DỮ LIỆU ENDPOINT
 */
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface Endpoint {
  id: string;
  method: Method;
  path: string;
  title: string;
  description: string;
  authRequired: boolean;
  reqBody?: any;
  resBody?: any;
}

interface ApiSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  endpoints: Endpoint[];
}

/**
 * DỮ LIỆU TÀI LIỆU API EXPRESS (THỰC TẾ TRONG PROJECT)
 */
const API_DOCS: ApiSection[] = [
  {
    id: "auth",
    title: "Authentication",
    icon: <Shield className="h-4 w-4" />,
    endpoints: [
      {
        id: "auth-login",
        method: "POST",
        path: "/api/auth/login",
        title: "Login to Node",
        description: "Xác thực người dùng bằng email/username và mật khẩu, trả về thông tin user và cặp Token.",
        authRequired: false,
        reqBody: {
          email: "operator@cybernexus.net (or username)",
          password: "Thanhdora@2026"
        },
        resBody: {
          user: {
            id: "uuid",
            email: "email@domain.com",
            role: "user|admin|superadmin"
          },
          accessToken: "jwt_token_string",
          refreshToken: "jwt_token_string"
        }
      },
      {
        id: "auth-register",
        method: "POST",
        path: "/api/auth/register",
        title: "Register New Node",
        description: "Đăng ký tài khoản mới với email, password và name tuỳ chọn.",
        authRequired: false,
        reqBody: {
          email: "newnode@domain.com",
          password: "StrongPassword@123",
          name: "optional_username"
        },
        resBody: {
          user: { id: "uuid", email: "newnode@domain.com", role: "user" },
          accessToken: "jwt_token",
          refreshToken: "jwt_token"
        }
      },
      {
        id: "auth-me",
        method: "GET",
        path: "/api/auth/me",
        title: "Get Connection Identity",
        description: "Lấy thông tin của người dùng đang đăng nhập thông qua Access Token.",
        authRequired: true,
        resBody: {
          id: "uuid",
          email: "email@domain.com",
          name: "username",
          displayName: "Display Name",
          role: "user",
          roles: [{ id: "role_id", name: "VIP", color: "#FFD700" }],
          lastActiveAt: "2026-03-15T21:00:00Z",
          permissions: "3" // Bitfield string
        }
      }
    ]
  },
  {
    id: "users",
    title: "Users & Profiles",
    icon: <Users className="h-4 w-4" />,
    endpoints: [
      {
        id: "users-list",
        method: "GET",
        path: "/api/user/list",
        title: "List All Entities",
        description: "Lấy danh sách thông tin cơ bản của tất cả user trong hệ thống.",
        authRequired: false,
        resBody: [
          {
            id: "uuid",
            name: "username",
            displayName: "Display Name",
            avatarUrl: "URL",
            role: "user",
            lastActiveAt: "2026-03-15T...",
            roles: []
          }
        ]
      },
      {
        id: "users-profile",
        method: "PUT",
        path: "/api/user/profile",
        title: "Update Local Identity",
        description: "Cập nhật thông tin profile của user đang đăng nhập (tên hiển thị, avatar, bio).",
        authRequired: true,
        reqBody: {
          displayName: "New Display Name",
          bio: "Engineer at DoraTeam",
          avatarUrl: "https://.../avatar.png"
        },
        resBody: {
          success: true,
          user: { id: "uuid", displayName: "New Display Name" }
        }
      }
    ]
  },
  {
    id: "forum",
    title: "Nexus Forum",
    icon: <MessageSquare className="h-4 w-4" />,
    endpoints: [
      {
        id: "forum-categories-get",
        method: "GET",
        path: "/api/forum/categories",
        title: "Fetch Sectors",
        description: "Lấy danh sách tất cả các Categories (Sectors) kèm theo cấu trúc Channels bên trong.",
        authRequired: false,
        resBody: [
          {
            id: "cat_id",
            name: "Sector Name",
            position: 0,
            channels: [{ id: "chan_id", name: "Channel Name", type: "text" }]
          }
        ]
      },
      {
        id: "forum-threads-get",
        method: "GET",
        path: "/api/forum/channels/:channelId/threads",
        title: "Fetch Threads",
        description: "Lấy danh sách bài đăng (Threads) trong một Channel cụ thể.",
        authRequired: false,
        resBody: [
          {
            id: "thread_id",
            title: "Thread Title",
            content: "Markdown content...",
            createdAt: "Date",
            author: { id: "uuid", name: "username", roles: [] },
            _count: { messages: 10, likes: 5 },
            liked: false
          }
        ]
      },
      {
        id: "forum-threads-post",
        method: "POST",
        path: "/api/forum/threads",
        title: "Initiate Thread",
        description: "Tạo bài đăng mới trong Channel (cần quyền MANAGE_FORUM hoặc user thông thường nếu channel cho phép).",
        authRequired: true,
        reqBody: {
          channelId: "chan_id",
          title: "New Protocol Initialization",
          content: "Body of the thread...",
          tags: ["announcement", "update"]
        },
        resBody: { id: "thread_id", title: "New Protocol Initialization" }
      }
    ]
  },
  {
    id: "admin",
    title: "System Admin",
    icon: <Database className="h-4 w-4" />,
    endpoints: [
      {
        id: "admin-users-patch",
        method: "PATCH",
        path: "/api/admin/users/:id",
        title: "Override User Role",
        description: "Chỉnh sửa cấp bậc (role) hoặc thông tin hệ thống của user. Yêu cầu quyền MANAGE_USERS.",
        authRequired: true,
        reqBody: { role: "admin" },
        resBody: { id: "uuid", role: "admin" }
      }
    ]
  }
];

const METHOD_COLORS = {
  GET: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  POST: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  PUT: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  PATCH: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  DELETE: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

/**
 * COMPONENT UI
 */
export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState<string>("auth");
  const [activeEndpoint, setActiveEndpoint] = useState<Endpoint>(API_DOCS[0].endpoints[0]);
  const [copiedData, setCopiedData] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedData(id);
    setTimeout(() => setCopiedData(null), 2000);
  };

  return (
    <div className={`flex h-screen font-sans text-white/80 selection:bg-emerald-500/30 selection:text-emerald-200 ${THEME.bg} relative overflow-hidden`}>
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 h-96 w-96 rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="flex w-full max-w-[1600px] mx-auto z-10 p-4 md:p-8 gap-6">
        
        {/* SIDEBAR NAVE */}
        <div className="w-80 flex-shrink-0 flex flex-col hidden md:flex">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Terminal className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-black italic tracking-wider text-white">DoraTeam API</h1>
              <p className="text-[10px] uppercase font-black tracking-widest text-emerald-500/60 mt-0.5">Integration Reference</p>
            </div>
          </div>

          <div className="space-y-6 overflow-y-auto scrollbar-hide flex-1 pb-10">
            {API_DOCS.map((section) => (
              <div key={section.id} className="space-y-1">
                <div className="flex items-center gap-2 px-2 py-1 mb-2">
                  <span className="text-emerald-500/60">{section.icon}</span>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">{section.title}</h3>
                </div>
                
                {section.endpoints.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setActiveEndpoint(ep);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-left ${
                      activeEndpoint.id === ep.id 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 shadow-[inset_0_0_12px_rgba(16,185,129,0.05)]" 
                        : "hover:bg-white/[0.03] text-white/40 hover:text-white"
                    }`}
                  >
                    <span className={`text-[9px] font-black uppercase tracking-wider w-10 ${
                      activeEndpoint.id === ep.id ? METHOD_COLORS[ep.method].split(" ")[0] : "opacity-60"
                    }`}>
                      {ep.method}
                    </span>
                    <span className="text-[11px] font-bold truncate flex-1 leading-tight">{ep.title}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide rounded-[2.5rem] bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/5 relative">
          <div className="sticky top-0 z-20 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5 p-6 md:p-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1.5 rounded-lg border text-xs font-black tracking-widest uppercase ${METHOD_COLORS[activeEndpoint.method]}`}>
                {activeEndpoint.method}
              </span>
              <h2 className="text-xl md:text-3xl font-black tracking-tight text-white">{activeEndpoint.path}</h2>
            </div>
            {activeEndpoint.authRequired && (
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500/80 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                <Shield className="h-3 w-3" /> Auth Required
              </div>
            )}
          </div>

          <div className="p-6 md:p-10 flex flex-col lg:flex-row gap-10">
            {/* Description & Params */}
            <div className="flex-[1.5] space-y-10">
              <div className="space-y-3">
                <h3 className="text-sm font-black uppercase tracking-widest text-white/40">Operation Overview</h3>
                <p className="text-sm text-white/70 leading-relaxed font-medium">
                  {activeEndpoint.description}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <Database className="h-4 w-4" /> Endpoint Flow
                </h3>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 font-mono text-xs overflow-x-auto space-y-2">
                  <div className="flex gap-4">
                    <span className="text-white/30 text-[10px] uppercase w-16">Base URL</span>
                    <span className="text-white/80">https://api.dora.team</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-white/30 text-[10px] uppercase w-16">Path</span>
                    <span className={METHOD_COLORS[activeEndpoint.method].split(" ")[0]}>{activeEndpoint.path}</span>
                  </div>
                  {activeEndpoint.authRequired && (
                    <div className="flex gap-4">
                      <span className="text-white/30 text-[10px] uppercase w-16">Headers</span>
                      <span className="text-amber-500/80">Authorization: Bearer &lt;token&gt;</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Code Snippets & Payload */}
            <div className="flex-1 space-y-6">
              {activeEndpoint.reqBody && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Request Payload</h3>
                  </div>
                  <div className="relative group">
                    <pre className="bg-[#050505] border border-white/10 rounded-2xl p-4 md:p-6 overflow-x-auto font-mono text-xs text-emerald-400/80 w-full shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] leading-relaxed">
                      {JSON.stringify(activeEndpoint.reqBody, null, 2)}
                    </pre>
                    <button 
                      onClick={() => handleCopy(JSON.stringify(activeEndpoint.reqBody, null, 2), "req")}
                      className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                    >
                      {copiedData === "req" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-white/40" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Response Example</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/40">200 OK</span>
                </div>
                <div className="relative group">
                  <pre className="bg-[#050505] border border-white/10 rounded-2xl p-4 md:p-6 overflow-x-auto font-mono text-xs text-blue-400/80 w-full shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] leading-relaxed">
                    {JSON.stringify(activeEndpoint.resBody, null, 2)}
                  </pre>
                  <button 
                    onClick={() => handleCopy(JSON.stringify(activeEndpoint.resBody, null, 2), "res")}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                  >
                    {copiedData === "res" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-white/40" />}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
