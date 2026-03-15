"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  ChevronDown,
  Plus,
  Send,
  User as UserIcon,
  Search,
  MessageCircle,
  MoreVertical,
  ArrowLeft,
  ChevronRight,
  Shield,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Trash2,
  Terminal,
  Heart,
  CornerUpLeft,
  Edit2,
  Database,
  Globe,
  Settings,
  PlusCircle,
  X,
  Paperclip,
  Image as ImageIcon,
  Loader2,
  ChevronUp
} from "lucide-react";
import {
  getForumCategories,
  getForumMessages,
  sendForumMessage,
  getForumThreads,
  createForumThread,
  deleteForumMessage,
  deleteForumThread,
  updateForumMessage,
  updateForumThread,
  createForumCategory,
  updateForumCategory,
  deleteForumCategory,
  createForumChannel,
  updateForumChannel,
  deleteForumChannel,
  toggleThreadLike,
  toggleMessageLike,

  getPublicUserList,
  getMe,
  AuthUser,
  ForumCategory,
  ForumChannel,
  ForumThread,
  ForumMessage,
  uploadFile
} from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";
import { hasPermission, Permissions } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "@/components/TiptapEditor";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";


export default function ForumPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [activeChannel, setActiveChannel] = useState<ForumChannel | null>(null);
  const [activeThread, setActiveThread] = useState<ForumThread | null>(null);
  const [messages, setMessages] = useState<ForumMessage[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyTo, setReplyTo] = useState<ForumMessage | null>(null);
  const [showThreadModal, setShowThreadModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState({ show: false, categoryId: "" });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ForumMessage | null>(null);
  const [editingThread, setEditingThread] = useState<ForumThread | null>(null);
  const [newThreadData, setNewThreadData] = useState({ title: "", content: "" });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newChannelData, setNewChannelData] = useState({ name: "", type: "text" as "text" | "forum" });
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [allUsers, setAllUsers] = useState<AuthUser[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [editPendingImages, setEditPendingImages] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const isInitialThreadLoad = useRef(false);
  const prevMessageCount = useRef(0);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 400);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeThread, activeChannel]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, currentUser, userList] = await Promise.all([
        getForumCategories(),
        getMe(),
        getPublicUserList()
      ]);
      setCategories(cats);
      setUser(currentUser);
      setAllUsers(userList);

      const savedChannelId = localStorage.getItem("forum_activeChannelId");
      const savedThreadId = localStorage.getItem("forum_activeThreadId");

      if (savedChannelId) {
        const flatChannels = cats.flatMap(c => c.channels);
        const channel = flatChannels.find(c => c.id === savedChannelId);
        if (channel) {
          setActiveChannel(channel);
          if (channel.type === "forum") {
            const threads = await getForumThreads(channel.id);
            setThreads(threads);
            if (savedThreadId) {
              const thread = threads.find(t => t.id === savedThreadId);
              if (thread) {
                setActiveThread(thread);
                const msgs = await getForumMessages({ threadId: thread.id });
                setMessages(msgs);
              }
            }
          } else if (channel.type === "text") {
            const msgs = await getForumMessages({ channelId: channel.id });
            setMessages(msgs);
          }
        }
      }
    } catch (err) {
      console.warn("handshake failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleHomeClick = () => {
    localStorage.removeItem("forum_activeChannelId");
    localStorage.removeItem("forum_activeThreadId");
    setActiveChannel(null);
    setActiveThread(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'input' | 'edit' | 'thread') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading("Uploading data payload...");
    try {
      const { url } = await uploadFile(file);

      if (target === 'input') {
        setPendingImages(prev => [...prev, url]);
      } else if (target === 'edit') {
        setEditPendingImages(prev => [...prev, url]);
      }

      toast.success("Connection secured", { id: toastId });
    } catch (err) {
      toast.error("Transmission failed", { id: toastId });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const removePendingImage = (index: number, target: 'input' | 'edit' | 'thread') => {
    if (target === 'input') {
      setPendingImages(prev => prev.filter((_, i) => i !== index));
    } else if (target === 'edit') {
      setEditPendingImages(prev => prev.filter((_, i) => i !== index));
    }
  };


  // Update localStorage when state changes
  useEffect(() => {
    if (activeChannel) {
      localStorage.setItem("forum_activeChannelId", activeChannel.id);
    } else {
      localStorage.removeItem("forum_activeChannelId");
    }
  }, [activeChannel]);

  useEffect(() => {
    if (activeThread) {
      localStorage.setItem("forum_activeThreadId", activeThread.id);
    } else {
      localStorage.removeItem("forum_activeThreadId");
    }
  }, [activeThread]);

  useEffect(() => {
    if (!activeChannel) return;

    setMessages([]); // Clear messages for fresh scroll state
    prevMessageCount.current = 0; // Reset count

    if (activeChannel.type === "text") {
      getForumMessages({ channelId: activeChannel.id, search: searchQuery }).then(setMessages);
      setActiveThread(null);
    } else {
      getForumThreads(activeChannel.id, { search: searchQuery }).then(setThreads);
    }

    const socket = getSocket();
    const room = `channel:${activeChannel.id}`;
    socket.emit("join_room", room);

    socket.on("new_message", (msg: ForumMessage) => {
      if (msg.channelId === activeChannel.id) {
        setMessages(prev => [...prev, msg]);
      }
    });

    socket.on("update_message", (msg: ForumMessage) => {
      if (msg.channelId === activeChannel.id) {
        setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
      }
    });

    socket.on("delete_message", (messageId: string) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    socket.on("message_like_update", ({ messageId, likes }: { messageId: string, likes: number }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, _count: { ...m._count, likes } } as any : m));
    });

    if (activeChannel.type === "forum") {
      socket.on("new_thread", (thread: ForumThread) => {
        setThreads(prev => [thread, ...prev]);
      });

      socket.on("update_thread", (thread: ForumThread) => {
        setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, ...thread } : t));
        setActiveThread(prev => prev?.id === thread.id ? { ...prev, ...thread } : prev);
      });

      socket.on("delete_thread", (threadId: string) => {
        setThreads(prev => prev.filter(t => t.id !== threadId));
        setActiveThread(prev => prev?.id === threadId ? null : prev);
      });

      socket.on("thread_like_update", ({ threadId, likes }: { threadId: string, likes: number }) => {
        setThreads(prev => prev.map(t => t.id === threadId ? { ...t, _count: { ...t._count, likes } } as any : t));
        setActiveThread(prev => {
          if (prev?.id === threadId) {
            return { ...prev, _count: { ...prev._count, likes } } as any;
          }
          return prev;
        });
      });
    }

    return () => {
      socket.emit("leave_room", room);
      socket.off("new_message");
      socket.off("update_message");
      socket.off("delete_message");
      socket.off("message_like_update");
      socket.off("new_thread");
      socket.off("update_thread");
      socket.off("delete_thread");
      socket.off("thread_like_update");
    };
  }, [activeChannel, searchQuery]);

  useEffect(() => {
    if (!activeThread) {
      isInitialThreadLoad.current = false;
      return;
    }
    isInitialThreadLoad.current = true;
    prevMessageCount.current = 0; // Reset count for fresh scroll logic
    setMessages([]); // Clear messages immediately for fresh scroll state
    getForumMessages({ threadId: activeThread.id, search: searchQuery }).then(setMessages);

    const socket = getSocket();
    const room = `thread:${activeThread.id}`;
    socket.emit("join_room", room);

    socket.on("new_message", (msg: ForumMessage) => {
      if (msg.threadId === activeThread.id) {
        setMessages(prev => [...prev, msg]);
      }
    });

    socket.on("update_message", (msg: ForumMessage) => {
      if (msg.threadId === activeThread.id) {
        setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
      }
    });

    socket.on("delete_message", (messageId: string) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    socket.on("message_like_update", ({ messageId, likes }: { messageId: string, likes: number }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, _count: { ...m._count, likes } } as any : m));
    });

    return () => {
      socket.emit("leave_room", room);
      socket.off("new_message");
      socket.off("update_message");
      socket.off("delete_message");
      socket.off("message_like_update");
    };
  }, [activeThread, searchQuery]);

  // Global Socket Presence
  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setSocketConnected(true);
      if (user) {
        socket.emit("identify", user.id);
      }
    };
    const onDisconnect = () => setSocketConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("update_online_users", (userIds: string[]) => {
      setOnlineUserIds(userIds);
    });

    socket.on("update_categories", () => {
      getForumCategories().then(setCategories);
    });

    socket.on("update_user", (updatedUser: any) => {
      setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
    });

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("update_online_users");
      socket.off("update_categories");
    };
  }, [user]);

  const formatLastActive = (dateStr?: string | Date) => {
    if (!dateStr) return "STANDBY MODE";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 60000) return "vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays >= 1 && diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  useEffect(() => {
    if (scrollRef.current) {
      const currentCount = messages.length;
      const countIncreased = currentCount > prevMessageCount.current;

      if (activeThread && isInitialThreadLoad.current) {
        scrollRef.current.scrollTop = 0;
        if (currentCount > 0) isInitialThreadLoad.current = false;
      } else if (activeChannel?.type === 'text' || (activeThread && countIncreased)) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }

      prevMessageCount.current = currentCount;
    }
  }, [messages, activeThread, activeChannel]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && pendingImages.length === 0) || !activeChannel) return;

    try {
      let finalContent = input;
      if (pendingImages.length > 0) {
        finalContent = (input.trim() + "\n" + pendingImages.map(url => `![image](${url})`).join("\n")).trim();
      }

      const data = {
        content: finalContent,
        channelId: activeThread ? undefined : activeChannel.id,
        threadId: activeThread?.id,
        parentMessageId: replyTo?.id
      };
      await sendForumMessage(data);
      setInput("");
      setPendingImages([]);
      setReplyTo(null);
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  const handleToggleLike = async (messageId?: string, threadId?: string) => {
    try {
      if (messageId) {
        const { liked } = await toggleMessageLike(messageId);
        setMessages(prev => prev.map(m => {
          if (m.id === messageId) {
            const likes = m.likes || [];
            if (liked) return { ...m, likes: [...likes, { userId: user?.id || "" }] };
            return { ...m, likes: likes.filter(l => l.userId !== user?.id) };
          }
          return m;
        }));
      } else if (threadId) {
        const { liked } = await toggleThreadLike(threadId);
        setThreads(prev => prev.map(t => {
          if (t.id === threadId) {
            const currentCount = t._count?.likes || 0;
            return {
              ...t,
              liked,
              _count: { ...t._count!, likes: liked ? currentCount + 1 : currentCount - 1 }
            };
          }
          return t;
        }));
      }
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChannel || !newThreadData.title.trim()) return;

    try {
      const thread = await createForumThread(activeChannel.id, newThreadData);
      setThreads(prev => [thread, ...prev]);
      setShowThreadModal(false);
      setNewThreadData({ title: "", content: "" });
      toast.success("Protocol established");
      setActiveThread(thread);
    } catch (err) {
      toast.error("Handshake failed");
    }
  };

  const handleUpdateMessage = async (messageId: string, content: string) => {
    try {
      let finalContent = content;
      if (editPendingImages.length > 0) {
        finalContent += "\n" + editPendingImages.map(url => `![image](${url})`).join("\n");
      }

      const updated = await updateForumMessage(messageId, finalContent);
      setMessages(prev => prev.map(m => m.id === messageId ? updated : m));
      setEditingMessage(null);
      setEditPendingImages([]);
      toast.success("Documentation updated");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleUpdateCategory = async (categoryId: string, name: string) => {
    try {
      const updated = await updateForumCategory(categoryId, { name });
      setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, name: updated.name } : c));
      toast.success("Sector recalibrated");
    } catch (err) {
      toast.error("Recalibration failed");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm("Are you sure you want to decommission this sector? This will purge all associated frequencies.")) return;
    try {
      await deleteForumCategory(categoryId);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      toast.success("Sector decommissioned");
    } catch (err) {
      toast.error("Decommission failed");
    }
  };

  const handleUpdateChannel = async (channelId: string, data: { name: string; description?: string }) => {
    try {
      const updated = await updateForumChannel(channelId, data);
      setCategories(prev => prev.map(cat => ({
        ...cat,
        channels: cat.channels.map(ch => ch.id === channelId ? updated : ch)
      })));
      if (activeChannel?.id === channelId) setActiveChannel(updated);
      toast.success("Frequency recalibrated");
    } catch (err) {
      toast.error("Recalibration failed");
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!window.confirm("Are you sure you want to decommission this frequency?")) return;
    try {
      await deleteForumChannel(channelId);
      setCategories(prev => prev.map(cat => ({
        ...cat,
        channels: cat.channels.filter(ch => ch.id !== channelId)
      })));
      if (activeChannel?.id === channelId) setActiveChannel(null);
      toast.success("Frequency decommissioned");
    } catch (err) {
      toast.error("Decommission failed");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const cat = await createForumCategory(newCategoryName);
      setCategories(prev => [...prev, { ...cat, channels: [] }]);
      setNewCategoryName("");
      setShowCategoryModal(false);
      toast.success("Sector initialized");
    } catch (err) {
      toast.error("Initialization failed");
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelData.name.trim() || !showChannelModal.categoryId) return;
    try {
      const channel = await createForumChannel({
        name: newChannelData.name,
        categoryId: showChannelModal.categoryId,
        type: newChannelData.type
      });
      setCategories(prev => prev.map(c =>
        c.id === showChannelModal.categoryId
          ? { ...c, channels: [...c.channels, channel] }
          : c
      ));
      setNewChannelData({ name: "", type: "text" });
      setShowChannelModal({ show: false, categoryId: "" });
      toast.success("Channel operational");
    } catch (err) {
      toast.error("Frequency setup failed");
    }
  };

  const handleUpdateThread = async (threadId: string, data: { title: string; content: string }) => {
    try {
      const updated = await updateForumThread(threadId, data);
      setThreads(prev => prev.map(t => t.id === threadId ? updated : t));
      if (activeThread?.id === threadId) setActiveThread(updated);
      setEditingThread(null);
      toast.success("Protocol recalibrated");
    } catch (err) {
      toast.error("Recalibration failed");
    }
  };

  const handleToggleThreadLike = async (threadId: string) => {
    if (!user) {
      toast.error("Initialization failed: Authenticated connection required");
      return;
    }

    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        const currentlyLiked = t.liked || false;
        const currentLikes = t._count?.likes || 0;
        const updated = {
          ...t,
          liked: !currentlyLiked,
          _count: {
            ...t._count,
            messages: t._count?.messages || 0,
            likes: currentlyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1
          }
        };
        // Update active thread if it's the one being liked
        setActiveThread(prev => prev?.id === threadId ? updated as any : prev);
        return updated;
      }
      return t;
    }));

    try {
      await toggleThreadLike(threadId);
    } catch (err) {
      toast.error("Signal failure: Could not synchronize like status");
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!window.confirm("Are you sure you want to decommission this protocol?")) return;
    try {
      await deleteForumThread(threadId);
      setThreads(prev => prev.filter(t => t.id !== threadId));
      if (activeThread?.id === threadId) setActiveThread(null);
      toast.success("Protocol decommissioned");
    } catch (err) {
      toast.error("Decommission failed");
    }
  };

  const handleLogout = async () => {
    localStorage.clear();
    router.push("/login");
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteForumMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success("Message deleted");
    } catch (err) {
      toast.error("Failed to delete message");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white space-y-4">
      <div className="relative">
        <Zap className="h-12 w-12 text-emerald-500 animate-pulse" />
        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
      </div>
      <p className="text-[10px] uppercase font-black tracking-[0.5em] text-emerald-500/60">Establishing Dora Connection...</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#050505] text-[#dcddde] font-sans selection:bg-emerald-500/30 overflow-hidden relative">

      {/* Background Grid & Scanline */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-emerald-500/10 to-transparent animate-scan" />
        <div className="absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 h-96 w-96 rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            key="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Navigation Matrix (Sidebars) */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex transition-transform duration-500 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Global Sidebar (Icons) */}
        <div className="flex flex-col items-center py-5 gap-3 w-[72px] bg-[#040404] border-r border-white/[0.03] z-10 relative">
          {/* Top Logo */}
          <div
            onClick={() => router.push("/")}
            className="group relative flex items-center justify-center h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/10 transition-all duration-500 hover:rounded-xl hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Zap className="h-5 w-5 text-emerald-500 group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-300 relative z-10" />
          </div>

          <div className="h-px w-7 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          {/* Forum (Active) */}
          <div className="relative group">
            <div className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-[3px] h-5 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
            <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-emerald-500 text-white cursor-pointer shadow-[0_4px_15px_rgba(16,185,129,0.3)] transition-all duration-300 hover:shadow-[0_4px_25px_rgba(16,185,129,0.4)] hover:scale-105">
              <MessageCircle className="h-5 w-5" />
            </div>
          </div>

          {/* Tutorials */}
          <div
            onClick={() => router.push("/tutorials")}
            className="group relative flex items-center justify-center h-11 w-11 rounded-2xl bg-white/[0.02] border border-white/[0.04] transition-all duration-500 hover:rounded-xl hover:bg-white/[0.06] hover:border-white/10 cursor-pointer"
          >
            <Layers className="h-5 w-5 text-white/15 group-hover:text-white/60 group-hover:scale-110 transition-all duration-300" />
          </div>

        </div>

        {/* Categories Sidebar */}
        <div className="flex flex-col w-64 lg:w-72 bg-[#080808]/80 backdrop-blur-3xl border-r border-white/5 z-10">
          <div className="flex items-center justify-between px-5 h-14 border-b border-white/5 bg-[#080808]/20">
            <h1 className="text-xs font-black text-white italic tracking-widest flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              DoraTeam
            </h1>
            <ChevronDown className="h-3 w-3 text-white/30" />
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-8 scrollbar-hide">
            {categories.map(category => (
              <div key={category.id} className="space-y-1.5">
                <div className="flex items-center justify-between px-3 mb-1 group/cat cursor-default">
                  <div className="flex items-center gap-2">
                    <div className="h-[2px] w-3 bg-emerald-500/20 group-hover/cat:bg-emerald-500 transition-colors" />
                    <span className="text-[9px] font-black tracking-[0.3em] text-white/20 group-hover/cat:text-white/40 transition-colors uppercase">SEC_{category.name}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                    {(user?.role === "superadmin" || hasPermission(user?.permissions || "0", Permissions.MANAGE_CHANNELS)) && (
                      <>
                        <div
                          onClick={() => {
                            const newName = window.prompt("Enter core sector name:", category.name);
                            if (newName) handleUpdateCategory(category.id, newName);
                          }}
                          className="p-1 hover:text-emerald-400 cursor-pointer"
                        >
                          <Edit2 className="h-2.5 w-2.5" />
                        </div>
                        <div
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </div>
                        <div
                          onClick={() => setShowChannelModal({ show: true, categoryId: category.id })}
                          className="p-1 hover:text-white cursor-pointer"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-0.5">
                  {category.channels.map(channel => (
                    <div
                      key={channel.id}
                      onClick={() => {
                        setActiveChannel(channel);
                        setIsSidebarOpen(false);
                      }}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300",
                        activeChannel?.id === channel.id
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 shadow-[inset_0_0_12px_rgba(16,185,129,0.05)]"
                          : "hover:bg-white/[0.03] text-white/40 hover:text-white"
                      )}
                    >
                      <div className={cn(
                        "flex-shrink-0 transition-transform group-hover:scale-110",
                        activeChannel?.id === channel.id ? "text-emerald-400" : "text-white/10"
                      )}>
                        {channel.type === "text" ? <Terminal className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                      </div>
                      <span className="text-[11px] font-black tracking-[0.1em] uppercase truncate italic">
                        <span className="opacity-20 mr-1 not-italic tracking-tighter">NDE_</span>
                        {channel.name}
                      </span>
                      <div className="ml-auto flex items-center gap-0.5 shrink-0">
                        {(user?.role === "superadmin" || hasPermission(user?.permissions || "0", Permissions.MANAGE_CHANNELS)) && (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                const newName = window.prompt("Enter new channel name:", channel.name);
                                if (newName) handleUpdateChannel(channel.id, { name: newName });
                              }}
                              className="p-1 hover:text-emerald-400 cursor-pointer"
                            >
                              <Edit2 className="h-2.5 w-2.5" />
                            </div>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChannel(channel.id);
                              }}
                              className="p-1 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </div>
                          </div>
                        )}
                        {activeChannel?.id === channel.id && (
                          <motion.div
                            layoutId="activeChannelIndicator"
                            className="w-1 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {(user?.role === "superadmin" || hasPermission(user?.permissions || "0", Permissions.MANAGE_CHANNELS)) && (
              <button
                onClick={() => setShowCategoryModal(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 p-3 rounded-2xl border border-dashed border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-[9px] font-black text-white/20 hover:text-emerald-500 uppercase tracking-widest transition-all"
              >
                <Database className="h-3.5 w-3.5" />
                Initialize New Sector
              </button>
            )}
          </div>

          {/* User Card */}
          <div
            onClick={() => user ? router.push("/profile") : router.push("/login")}
            className="mx-3 mb-3 p-1 rounded-[1.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl shadow-2xl relative group/user-card overflow-hidden cursor-pointer hover:border-emerald-500/30 transition-all"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-emerald-500/[0.03] group-hover/user-card:bg-emerald-500/[0.05] transition-colors pointer-events-none" />

            <div className="flex items-center gap-3 p-2 transition-all group-hover/user-card:translate-x-0.5">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden transition-all group-hover/user-card:border-emerald-500/30 group-hover/user-card:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-5 w-5 text-emerald-500/40" />
                  )}
                </div>
                {/* Status Indicator */}
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[#0a0a0a] flex items-center justify-center p-[2px] shadow-lg">
                  <div className={cn(
                    "h-full w-full rounded-full transition-all",
                    loading ? "bg-white/10 animate-pulse" : user ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                  )} />
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {loading ? (
                  <>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <p className="text-[11px] font-black uppercase tracking-tight italic transition-all text-white/20 animate-pulse">
                        Initializing...
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] italic">CONNECTING</span>
                    </div>
                  </>
                ) : user ? (
                  <>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <p className="text-[11px] font-black uppercase tracking-tight italic transition-all text-white">
                        {user.name}
                      </p>
                      <ShieldCheck className="h-2.5 w-2.5 text-emerald-500/40" />
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[7px] font-black text-emerald-500/60 uppercase tracking-[0.2em] italic">NODE ONLINE</span>
                      <span className="text-[7px] font-black text-white/10 uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded-md">ID: {user.id.slice(0, 8)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <p className="text-[11px] font-black uppercase tracking-tight italic transition-all text-rose-400">
                        Guest Protocol
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[7.5px] font-black text-white hover:text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md uppercase tracking-[0.2em] transition-colors border border-emerald-500/30">
                        Connect to DoraTeam
                      </span>
                    </div>
                  </>
                )}
              </div>

              {user && (
                <button className="p-2 rounded-xl text-white/10 hover:text-white hover:bg-white/5 transition-all opacity-0 group-hover/user-card:opacity-100">
                  <Settings className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content View */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent z-10">

        {/* Main Content Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-emerald-500/10 bg-black/40 backdrop-blur-xl transition-all">
          {/* Mobile Overlay Effects */}
          <div className="absolute inset-0 bg-linear-to-r from-emerald-500/[0.02] to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-emerald-500/20 to-transparent" />

          <div className="flex items-center gap-2 relative z-10 w-full">
            {/* Sidebar Toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-emerald-500/10 rounded-xl lg:hidden text-emerald-500/60 active:scale-95 transition-all"
            >
              <Layers className="h-5 w-5" />
            </button>


            {/* Central Brand / Interactive Home Button */}
            <div
              onClick={handleHomeClick}
              className="flex-1 flex flex-col items-center justify-center text-center cursor-pointer group/home active:scale-95 transition-all"
            >
              <div className="flex flex-col items-center relative">
                {/* Visual Accent */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-[1px] bg-linear-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover/home:opacity-100 transition-opacity" />

                <div className="flex items-center gap-2.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <h1 className="text-[15px] font-black text-white italic tracking-[0.35em] uppercase transition-all group-hover/home:text-emerald-400 group-hover/home:tracking-[0.45em]">
                    DORA
                  </h1>
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/20" />
                </div>

                <div className="flex items-center gap-2 -mt-0.5">
                  <div className="h-[1px] w-2 bg-emerald-500/30" />
                  <span className="text-[7px] font-black text-emerald-500/60 uppercase tracking-[0.5em] select-none">
                    {activeThread ? "STREAM_RET" : (activeChannel?.name || "ARCHIVE")}
                  </span>
                  <div className="h-[1px] w-2 bg-emerald-500/30" />
                </div>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {user ? (
                <Link
                  href="/profile"
                  className="relative group/header-avatar"
                >
                  <div className="h-8 w-8 rounded-xl bg-white/5 overflow-hidden border border-white/10 group-hover/header-avatar:border-emerald-500/30 transition-all active:scale-95">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon className="h-4 w-4 text-white/20 p-2" />
                    )}
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border-2 border-[#0a0a0a]" />
                </Link>
              ) : (
                <Link href="/login" className="p-2">
                  <Shield className="h-5 w-5 text-emerald-500/40 hover:text-emerald-500 transition-all" />
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Viewport content */}
        <div className="flex-1 flex min-h-0 relative">

          <main className="flex-1 flex flex-col relative overflow-hidden">
            {activeChannel?.type === "forum" && !activeThread ? (
              /* THREAD ARCHIVE VIEW */
              <div className="flex-1 overflow-y-auto p-6 md:p-12 scrollbar-hide">
                <div className="max-w-5xl mx-auto space-y-12">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8 mb-4">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-400">Section Active // Node_01</span>
                      </div>
                      <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter leading-none uppercase">
                        Discussion <br />
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 via-blue-500 to-emerald-500">
                          Protocols
                        </span>
                      </h1>
                      <div className="flex items-center gap-4 text-[9px] font-black tracking-[0.3em] text-white/20 uppercase">
                        <span>Status: Operational</span>
                        <span className="h-1 w-1 rounded-full bg-white/10" />
                        <span>v4.195-stable</span>
                      </div>
                    </div>
                    {user && (
                      <Button
                        onClick={() => setShowThreadModal(true)}
                        className="group relative h-12 md:h-14 px-8 rounded-xl bg-white text-black font-black uppercase tracking-widest overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5"
                      >
                        <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                        <div className="flex items-center gap-2 relative z-10">
                          <PlusCircle className="h-4 w-4" />
                          <span>Establish New node</span>
                        </div>
                      </Button>
                    )}
                  </div>



                  <div className="grid grid-cols-1 gap-4 mt-8">
                    {threads.map(thread => (
                      <motion.div
                        key={thread.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => setActiveThread(thread)}
                        className="group relative rounded-[2.5rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all p-1 cursor-pointer overflow-hidden"
                      >
                        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-linear-to-r from-transparent via-emerald-500/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />

                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 p-4 md:p-8">
                          <div className="hidden md:flex h-20 w-20 rounded-[1.5rem] bg-emerald-500/5 items-center justify-center shrink-0 border border-emerald-500/10 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-all">
                            <Terminal className="h-8 w-8 text-emerald-500/60 group-hover:text-emerald-500 transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1.5 md:mb-2">
                              <div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-emerald-500/40" />
                              <span className="text-[8px] md:text-[9px] font-black text-emerald-500/40 uppercase tracking-[0.3em]">Protocol ID: {thread.id.slice(0, 8)}</span>
                            </div>
                            <h3 className="text-lg md:text-2xl font-black text-white truncate transition-colors group-hover:text-emerald-400 italic tracking-tight uppercase leading-tight">{thread.title}</h3>
                            <div className="flex items-center gap-3 md:gap-4 mt-2 md:mt-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
                              <Link
                                href={`/profile/${thread.author.id}`}
                                className="flex items-center gap-2 group/author"
                              >
                                <div className="h-5 w-5 rounded-lg bg-white/5 overflow-hidden border border-white/10 group-hover/author:border-emerald-500/30 transition-colors">
                                  {thread.author.avatarUrl ? <img src={thread.author.avatarUrl} className="h-full w-full object-cover" /> : <UserIcon className="h-3 w-3 text-white/20 p-1" />}
                                </div>
                                <span
                                  className="text-[9px] md:text-[10px] font-black tracking-widest transition-colors uppercase"
                                  style={{ color: thread.author.roles?.[0]?.color || "rgba(255,255,255,0.4)" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.color = "white"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = thread.author.roles?.[0]?.color || "rgba(255,255,255,0.4)"; }}
                                >
                                  {thread.author.displayName || thread.author.name}
                                </span>
                              </Link>
                              <div className="h-1 w-1 rounded-full bg-white/10" />
                              <span className="text-[9px] md:text-[10px] font-black text-white/10 uppercase tracking-tighter">{new Date(thread.updatedAt).toLocaleDateString()}</span>
                              {(thread.author.id === user?.id || user?.role === "superadmin" || hasPermission(user?.permissions || "0", Permissions.MANAGE_FORUM)) && (
                                <div className="flex items-center gap-2 md:gap-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingThread(thread);
                                      setNewThreadData({ title: thread.title, content: thread.content || "" });
                                      setShowThreadModal(true);
                                    }}
                                    className="text-[8px] md:text-[9px] font-black text-emerald-500/20 hover:text-emerald-500 tracking-widest transition-colors flex items-center gap-1 uppercase"
                                  >
                                    <Edit2 className="h-2 w-2 md:h-2.5 md:w-2.5" />
                                    Recalibrate
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteThread(thread.id);
                                    }}
                                    className="text-[8px] md:text-[9px] font-black text-rose-500/20 hover:text-rose-500 tracking-widest transition-colors flex items-center gap-1 uppercase"
                                  >
                                    <Trash2 className="h-2 w-2 md:h-2.5 md:w-2.5" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          {user && (
                            <div className="flex items-center justify-between md:justify-end gap-4 md:px-4 mt-2 md:mt-0 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleThreadLike(thread.id);
                                }}
                                className="flex items-center md:flex-col gap-2 md:gap-1 group/like cursor-pointer"
                              >
                                <Heart className={cn("h-4 w-4 md:h-5 md:w-5 transition-all duration-300", thread.liked ? "fill-rose-500 text-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" : "text-white/20 group-hover/like:text-rose-500/50")} />
                                <p className={cn("text-[8px] font-black tracking-widest transition-colors uppercase", thread.liked ? "text-rose-500/60" : "text-white/20")}>{thread._count?.likes || 0}</p>
                              </div>
                              <div className="hidden md:block h-8 w-[1px] bg-white/5 mx-2" />
                              <div className="flex items-center md:flex-col items-end gap-2 md:gap-1">
                                <p className="text-xl md:text-3xl font-black text-white tracking-tighter leading-none">{thread._count?.messages || 0}</p>
                                <p className="text-[8px] md:text-[9px] font-black tracking-widest text-emerald-500/40 uppercase">Commits</p>
                              </div>
                              <div className="md:hidden p-2 rounded-xl bg-white/5 border border-white/5">
                                <ChevronRight className="h-4 w-4 text-white/20" />
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {threads.length === 0 && (
                      <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                        <div className="max-w-xs mx-auto">
                          <div className="h-24 w-24 rounded-full bg-linear-to-b from-white/[0.05] to-transparent flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-inner">
                            <Layers className="h-10 w-10 text-white/10" />
                          </div>
                          <h3 className="text-lg font-black text-white uppercase tracking-widest italic">Encrypted Archive Empty</h3>
                          <p className="text-xs text-white/20 font-medium mt-4 leading-relaxed uppercase tracking-tight italic">Initialize connection and start first documentation module.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* CHAT / MESSAGE VIEW */
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2 scroll-smooth scrollbar-hide">
                  <AnimatePresence>
                    {activeThread && (
                      <div key={`thread-header-${activeThread.id}`} className="mb-12 border-b border-white/5 pb-12">
                        {/* Inline Back Button */}
                        <motion.button
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => setActiveThread(null)}
                          className="flex items-center gap-2 mb-6 text-emerald-500 hover:text-emerald-400 font-black uppercase tracking-[0.2em] text-[10px] bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/10 lg:hidden"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          <span>Return to Index</span>
                        </motion.button>
                        <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter leading-tight mb-6">
                          {activeThread.title}
                        </h1>
                        <div className="flex items-center gap-4 mb-8">
                          <Link href={`/profile/${activeThread.author.id}`} className="group/author flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-white/5 overflow-hidden border border-white/10 group-hover/author:border-emerald-500/30 transition-colors">
                              {activeThread.author.avatarUrl ? <img src={activeThread.author.avatarUrl} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center bg-white/5"><UserIcon className="h-6 w-6 text-white/10" /></div>}
                            </div>
                            <div>
                              <p
                                className="text-sm font-black italic transition-colors"
                                style={{ color: activeThread.author.roles?.[0]?.color || "white" }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#34d399"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = activeThread.author.roles?.[0]?.color || "white"; }}
                              >
                                {activeThread.author.displayName || activeThread.author.name}
                              </p>
                              <p className="text-[11px] text-white/40 font-medium">{new Date(activeThread.updatedAt).toLocaleString()}</p>
                            </div>
                          </Link>
                        </div>
                        <div className="prose prose-invert max-w-none text-lg text-[#dcddde]/90 leading-relaxed font-medium">
                          <MarkdownRenderer content={activeThread.content || ""} />
                        </div>
                      </div>
                    )}
                    {messages.length === 0 && !activeThread && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="h-full flex flex-col items-center justify-center text-center py-20"
                      >
                        <div className="relative mb-8">
                          <Terminal className="h-16 w-16 text-emerald-500/20" />
                          <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full" />
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-[0.2em] italic mb-2">Channel Initialized</h3>
                        <p className="text-[10px] font-black text-emerald-500/40 uppercase tracking-[0.4em]">End-to-end encryption handshake complete // Secure link established</p>
                      </motion.div>
                    )}
                    {messages.map((message, i) => {
                      const isSameAuthor = i > 0 && messages[i - 1].authorId === message.authorId;
                      const isNewDay = i === 0 || new Date(message.createdAt).toDateString() !== new Date(messages[i - 1].createdAt).toDateString();

                      return (
                        <div key={message.id}>
                          {isNewDay && (
                            <div className="flex items-center gap-4 my-8">
                              <div className="flex-1 h-[1px] bg-linear-to-r from-transparent via-white/5 to-transparent" />
                              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.5em] italic">Sequence Mark: {new Date(message.createdAt).toLocaleDateString()}</span>
                              <div className="flex-1 h-[1px] bg-linear-to-l from-transparent via-white/5 to-transparent" />
                            </div>
                          )}
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn("flex group items-start px-2 md:px-4 py-1.5 rounded-2xl transition-all", isSameAuthor ? "mt-0" : "mt-2 md:mt-4 hover:bg-white/[0.02]")}
                          >
                            <div className="w-10 md:w-16 shrink-0 flex justify-center pt-1">
                              {!isSameAuthor && (
                                <Link
                                  href={`/profile/${message.author.id}`}
                                  className="h-8 w-8 md:h-12 md:w-12 rounded-lg md:rounded-[1rem] bg-white/[0.03] overflow-hidden border border-white/5 transition-all hover:scale-105 hover:border-emerald-500/30"
                                >
                                  {message.author.avatarUrl ? <img src={message.author.avatarUrl} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center"><UserIcon className="h-4 w-4 md:h-5 md:w-5 text-white/10" /></div>}
                                </Link>
                              )}
                              {isSameAuthor && <div className="invisible md:group-hover:visible text-[8px] md:text-[9px] font-black text-white/20 mt-2 uppercase italic tracking-tighter shrink-0">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                            </div>
                            <div className="flex-1 min-w-0 pr-2 md:pr-4">
                              {!isSameAuthor && (
                                <div className="flex items-baseline gap-2 md:gap-3 mb-1">
                                  <Link
                                    href={`/profile/${message.author.id}`}
                                    className={cn(
                                      "text-[11px] md:text-xs font-black tracking-[0.1em] italic hover:underline decoration-white/20 uppercase",
                                      !message.author.roles?.length && (message.author.role === 'superadmin' ? 'text-rose-500' : message.author.role === 'admin' ? 'text-amber-500' : 'text-emerald-400')
                                    )}
                                    style={message.author.roles?.[0] ? { color: message.author.roles[0].color } : {}}
                                  >
                                    {message.author.displayName || message.author.name}
                                  </Link>
                                  {message.author.roles?.slice(0, 1).map(r => (
                                    <span key={r.name} className="px-1.5 py-0.5 rounded text-[6px] md:text-[7px] font-black tracking-tighter uppercase" style={{ backgroundColor: `${r.color}20`, color: r.color, border: `1px solid ${r.color}30` }}>
                                      {r.name}
                                    </span>
                                  ))}
                                  {message.author.role === 'superadmin' && <ShieldCheck className="h-2.5 w-2.5 md:h-3 md:w-3 text-rose-500/40" />}
                                  <span className="text-[8px] md:text-[9px] font-black text-white/20 tracking-[0.1em] uppercase ml-auto opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              )}
                              <div className="relative">
                                {message.parentMessage && (
                                  <div className="mb-2 pl-3 border-l-2 border-white/10 bg-white/[0.02] py-1 rounded-r-lg group/reply">
                                    <p className="text-[9px] font-black text-emerald-500/40 uppercase tracking-widest mb-0.5 flex items-center gap-2">
                                      <CornerUpLeft className="h-2.5 w-2.5" />
                                      Reply to {message.parentMessage.author.name}
                                    </p>
                                    <p className="text-[10px] text-white/20 truncate">{message.parentMessage.content}</p>
                                  </div>
                                )}
                                {editingMessage?.id === message.id ? (
                                  <div className="space-y-3 pt-2">
                                    <div className="relative bg-[#101010]/80 backdrop-blur-3xl rounded-xl border border-white/5 transition-all focus-within:border-emerald-500/30 overflow-hidden">
                                      {/* Edit Pending Images Preview */}
                                      {editPendingImages.length > 0 && (
                                        <div className="flex flex-wrap gap-2 p-2 bg-white/[0.02] border-b border-white/5">
                                          {editPendingImages.map((url, idx) => (
                                            <div key={idx} className="relative group/edit-img h-12 w-12 rounded-lg overflow-hidden border border-white/10">
                                              <img src={url} className="h-full w-full object-cover" alt="pending upload" />
                                              <button
                                                onClick={() => removePendingImage(idx, 'edit')}
                                                className="absolute top-1 right-1 h-4 w-4 rounded-md bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/edit-img:opacity-100 transition-opacity hover:bg-rose-500"
                                              >
                                                <X className="h-2.5 w-2.5" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      <textarea
                                        autoFocus
                                        value={editingMessage.content}
                                        onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleUpdateMessage(message.id, editingMessage.content);
                                          }
                                        }}
                                        className="w-full bg-transparent p-3 min-h-[80px] text-white outline-none resize-none text-[13px]"
                                        placeholder="Modify data payload..."
                                      />

                                      <div className="flex items-center gap-2 px-2 py-1 bg-white/[0.02] border-t border-white/5">
                                        <label className="cursor-pointer p-1.5 rounded-lg hover:bg-white/5 text-white/20 hover:text-emerald-500 transition-all">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleImageUpload(e, 'edit')}
                                            disabled={isUploading}
                                          />
                                          <Paperclip className="h-3.5 w-3.5" />
                                        </label>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={() => {
                                        handleUpdateMessage(message.id, editingMessage?.content || message.content);
                                      }} className="h-7 px-3 text-[9px] font-black bg-emerald-500 text-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-500/20">Update Protocol</Button>
                                      <Button size="sm" variant="ghost" onClick={() => setEditingMessage(null)} className="h-7 px-3 text-[9px] font-black text-white/20 hover:text-white uppercase tracking-widest rounded-lg border border-white/5 bg-white/5">Abort</Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-[13px] md:text-sm text-[#dcddde]/80 leading-relaxed font-medium selection:bg-emerald-500/40">
                                    <MarkdownRenderer content={message.content} />
                                  </div>
                                )}
                                {((message as any)._count?.likes ?? message.likes?.length ?? 0) > 0 && (
                                  <div className="mt-2 flex items-center gap-1.5">
                                    <div className="flex -space-x-2">
                                      {message.likes?.slice(0, 3).map((l, idx) => (
                                        <div key={idx} className="h-4 w-4 rounded-full bg-emerald-500/20 border border-[#050505] flex items-center justify-center">
                                          <Heart className="h-2 w-2 text-emerald-500 fill-emerald-500" />
                                        </div>
                                      ))}
                                    </div>
                                    <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-tighter">{(message as any)._count?.likes ?? message.likes?.length ?? 0} Reactions</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                              {user && (
                                <>
                                  <button
                                    onClick={() => handleToggleLike(message.id)}
                                    className={cn(
                                      "p-2 rounded-xl transition-all cursor-pointer",
                                      message.likes?.some(l => l.userId === user?.id)
                                        ? "bg-rose-500/20 text-rose-500"
                                        : "hover:bg-white/5 text-white/20 hover:text-white"
                                    )}
                                  >
                                    <Heart className={cn("h-3.5 w-3.5", message.likes?.some(l => l.userId === user?.id) && "fill-current")} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReplyTo(message);
                                      inputRef.current?.focus();
                                    }}
                                    className="p-2 hover:bg-white/5 text-white/20 hover:text-white rounded-xl transition-all cursor-pointer"
                                  >
                                    <CornerUpLeft className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                              {(message.author.id === user?.id || user?.role === "superadmin" || hasPermission(user?.permissions || "0", Permissions.MANAGE_FORUM)) && (
                                <div className="flex items-center gap-1 mt-1">
                                  <button
                                    onClick={() => setEditingMessage(message)}
                                    className="p-1.5 hover:bg-white/5 rounded-lg text-white/20 hover:text-emerald-400 transition-colors"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMessage(message.id)}
                                    className="p-1.5 hover:bg-white/5 rounded-lg text-white/20 hover:text-rose-400 transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Cyber Chat Input */}
                {activeChannel && (activeChannel.type === 'text' || activeThread) && (
                  <div className="px-6 pb-8 pt-4">
                    {user ? (
                      <>
                        {replyTo && (
                          <div className="max-w-5xl mx-auto mb-2 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl backdrop-blur-md">
                            <div className="flex items-center gap-3">
                              <CornerUpLeft className="h-3 w-3 text-emerald-500" />
                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Replying to {replyTo.author.name}</span>
                              <span className="text-[10px] text-white/40 truncate italic max-w-sm">"{replyTo.content}"</span>
                            </div>
                            <button onClick={() => setReplyTo(null)} className="text-[10px] font-black text-white/20 hover:text-white uppercase tracking-widest transition-colors">Cancel</button>
                          </div>
                        )}
                        <div className="relative group max-w-5xl mx-auto">
                          <div className="absolute inset-0 bg-emerald-500/5 blur-2xl rounded-[1.5rem] opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                          <div className="relative bg-[#101010]/80 backdrop-blur-3xl rounded-[1.5rem] border border-white/5 transition-all group-focus-within:border-emerald-500/30 overflow-hidden">
                            {/* Pending Images Preview */}
                            {pendingImages.length > 0 && (
                              <div className="flex flex-wrap gap-2 p-3 bg-white/[0.02] border-b border-white/5">
                                {pendingImages.map((url, idx) => (
                                  <div key={idx} className="relative group/pending-img h-16 w-16 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                                    <img src={url} className="h-full w-full object-cover" alt="pending upload" />
                                    <button
                                      onClick={() => removePendingImage(idx, 'input')}
                                      className="absolute top-1 right-1 h-5 w-5 rounded-lg bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/pending-img:opacity-100 transition-opacity hover:bg-rose-500"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex flex-col">
                              <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                  }
                                }}
                                className="w-full bg-transparent px-6 py-4 min-h-[60px] max-h-[200px] text-white outline-none resize-none text-sm placeholder:text-white/10 font-medium"
                                placeholder={activeThread ? `Documenting Protocol...` : `Direct Transmission...`}
                              />

                              <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border-t border-white/5">
                                <div className="flex items-center gap-1">
                                  <label className="cursor-pointer p-2 rounded-xl hover:bg-white/5 text-white/20 hover:text-emerald-500 transition-all group/attach">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => handleImageUpload(e, 'input')}
                                      disabled={isUploading}
                                    />
                                    <ImageIcon className="h-4 w-4" />
                                  </label>
                                </div>

                                <Button
                                  type="button"
                                  onClick={() => handleSendMessage()}
                                  disabled={(!input.trim() && pendingImages.length === 0) || isUploading}
                                  className="h-8 px-4 rounded-xl bg-emerald-500 text-black font-black text-[9px] uppercase tracking-[0.2em] hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 disabled:bg-white/5 disabled:text-white/10 disabled:shadow-none transition-all flex items-center gap-2"
                                >
                                  <span>Transmit</span>
                                  {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="max-w-5xl mx-auto p-6 rounded-3xl border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center gap-4 text-center">
                        <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <Shield className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-[0.2em] mb-1">Transmission Restricted</p>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest">Initialize authentication to participate in this sector</p>
                        </div>
                        <Link href="/login">
                          <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest px-8 rounded-xl shadow-lg shadow-emerald-500/20">
                            Authentication Protocol
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
                <AnimatePresence>
                  {showScrollTop && activeThread && (
                    <motion.button
                      key="scroll-top-button"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="fixed bottom-[160px] right-0 z-50 flex items-center gap-3 bg-black/60 backdrop-blur-3xl border-r-[3px] border-emerald-500 py-2.5 pr-4 pl-6 rounded-l-2xl shadow-[-10px_0_30px_rgba(0,0,0,0.5)] lg:hidden group active:scale-95 transition-all"
                    >
                      <div className="flex flex-col items-end leading-none">
                        <span className="text-[11px] font-black text-white italic tracking-tighter uppercase">Uplink</span>
                        <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest mt-0.5">Top of Sequence</span>
                      </div>
                      <div className="relative">
                        <ChevronUp className="h-4 w-4 text-emerald-500 group-hover:-translate-y-1 transition-transform relative z-10" />
                        <div className="absolute inset-0 bg-emerald-500/20 blur-sm animate-pulse" />
                      </div>
                    </motion.button>
                  )}
                </AnimatePresence>
              </>
            )}
          </main>

          {/* Members Sidebar (Network Matrix) */}
          <aside className="hidden xl:flex flex-col w-72 bg-[#080808]/20 backdrop-blur-md border-l border-white/5">
            <div className="px-6 h-14 flex items-center border-b border-white/5">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2 shrink-0">
                <Globe className="h-3 w-3 text-emerald-500/40" />
                Network Matrix
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/10 italic">Core Operators — {onlineUserIds.length} online</span>
                </div>
                <div className="space-y-1">
                  {allUsers
                    .filter(u => onlineUserIds.includes(u.id))
                    .sort((a, b) => {
                      const roleOrder: Record<string, number> = { superadmin: 0, admin: 1, user: 2 };
                      return (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3);
                    }).map(u => {
                      const isSuper = u.role === 'superadmin';
                      const isAdmin = u.role === 'admin';

                      return (
                        <Link
                          key={u.id}
                          href={`/profile/${u.id}`}
                          className="flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer group relative overflow-hidden hover:bg-white/[0.03]"
                        >
                          <div className={cn(
                            "absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-8 transition-all",
                            isSuper ? "bg-rose-500" : isAdmin ? "bg-amber-500" : "bg-emerald-500"
                          )} />
                          <div className="relative">
                            <div className={cn(
                              "h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 transition-all",
                              isSuper ? "bg-rose-500/10 border-rose-500/20" : isAdmin ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20"
                            )}>
                              {u.avatarUrl ? (
                                <img src={u.avatarUrl} className="h-full w-full object-cover rounded-xl" />
                              ) : (
                                <UserIcon className={cn(
                                  "h-5 w-5",
                                  isSuper ? "text-rose-500" : isAdmin ? "text-amber-500" : "text-emerald-500"
                                )} />
                              )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#0a0a0a] flex items-center justify-center p-[2px]">
                              <div className="h-full w-full rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            </div>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <span className={cn(
                              "text-xs font-black uppercase tracking-tight block truncate italic transition-colors",
                              isSuper ? "text-rose-500" : isAdmin ? "text-amber-500" : "text-emerald-400"
                            )}>
                              {u.displayName || u.name}
                            </span>
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest mt-0.5",
                              isSuper ? "text-rose-500/40" : isAdmin ? "text-amber-500/40" : "text-emerald-500/40"
                            )}>
                              {isSuper ? 'Execution Lead' : isAdmin ? 'Strategic Admin' : 'Authorized User'}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              </div>

              <div className="pt-2">
                <div className="p-4 rounded-[1.5rem] bg-emerald-500/5 border border-emerald-500/10 text-center space-y-2 opacity-40">
                  <Terminal className="h-4 w-4 text-emerald-500 mx-auto opacity-40" />
                  <p className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em] italic leading-relaxed">External connections monitoring active // All ports secure</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/10 italic">Standby Nodes — {allUsers.length - onlineUserIds.length}</span>
                </div>
                <div className="space-y-1">
                  {allUsers
                    .filter(u => !onlineUserIds.includes(u.id))
                    .sort((a, b) => {
                      const roleOrder: Record<string, number> = { superadmin: 0, admin: 1, user: 2 };
                      return (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3);
                    }).map(u => {
                      const isSuper = u.role === 'superadmin';
                      const isAdmin = u.role === 'admin';

                      return (
                        <Link
                          key={u.id}
                          href={`/profile/${u.id}`}
                          className="flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer group relative opacity-70 hover:opacity-100 transition-all duration-300"
                        >
                          <div className="relative">
                            <div className="h-10 w-10 rounded-xl border border-white/5 bg-white/[0.03] flex items-center justify-center shrink-0 transition-all">
                              {u.avatarUrl ? (
                                <img src={u.avatarUrl} className="h-full w-full object-cover rounded-xl" />
                              ) : (
                                <UserIcon className="h-5 w-5 text-white/20" />
                              )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#0a0a0a] flex items-center justify-center p-[2px]">
                              <div className="h-full w-full rounded-full bg-white/10" />
                            </div>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <span className="text-xs font-black uppercase tracking-tight block truncate italic text-white/60 group-hover:text-white transition-colors">
                              {u.displayName || u.name}
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-widest mt-0.5 text-white/30 group-hover:text-emerald-400/60 transition-colors">
                              {formatLastActive(u.lastActiveAt)}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Thread Deletion/Management UI can go here */}

      {/* MODALS */}
      <AnimatePresence>
        {showThreadModal && (
          <div key="thread-creation-modal" className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowThreadModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-4 md:p-6 z-10">
                <button
                  type="button"
                  onClick={() => setShowThreadModal(false)}
                  className="h-8 w-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors group"
                >
                  <X className="h-4 w-4 text-white/20 group-hover:text-white transition-colors" />
                </button>
              </div>

              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl md:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Terminal className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-white uppercase italic tracking-tighter">Initialize Protocol</h2>
                    <p className="text-[8px] md:text-[10px] text-emerald-500/40 font-black uppercase tracking-widest">Establish new documentation module</p>
                  </div>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (editingThread) {
                    handleUpdateThread(editingThread.id, newThreadData);
                  } else {
                    handleCreateThread(e);
                  }
                }} className="space-y-4 md:space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-2">Protocol Title</label>
                    <input
                      autoFocus
                      required
                      value={newThreadData.title}
                      onChange={(e) => setNewThreadData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-xl md:rounded-2xl px-5 md:px-6 py-3 md:py-4 text-sm md:text-base text-white font-bold placeholder:text-white/5 focus:outline-none focus:border-emerald-500/30 transition-all uppercase tracking-tight"
                      placeholder="ENTER PROTOCOL DESIGNATION..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-2">Data Payload</label>
                    <TiptapEditor
                      value={newThreadData.content}
                      onChange={(val) => setNewThreadData(prev => ({ ...prev, content: val }))}
                      variant="full"
                      placeholder="Input documentation content here..."
                      className="min-h-[250px] rounded-xl md:rounded-2xl border-white/5 bg-white/[0.03]"
                    />
                  </div>

                  <div className="pt-2 md:pt-4 flex flex-col sm:flex-row gap-3 md:gap-4">
                    <Button
                      type="submit"
                      className="flex-1 h-12 md:h-16 rounded-xl md:rounded-[1.25rem] bg-emerald-500 text-black font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/10 hover:bg-emerald-400 transition-all hover:scale-[1.01]"
                    >
                      Establish Connection
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowThreadModal(false)}
                      variant="ghost"
                      className="h-12 md:h-16 px-8 rounded-xl md:rounded-[1.25rem] border border-white/5 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-all bg-white/5 sm:bg-transparent"
                    >
                      Abort
                    </Button>
                  </div>
                </form>
              </div>

              <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />
            </motion.div>
          </div>
        )}
        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCategoryModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-4 md:p-6 z-10">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="h-8 w-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors group"
                >
                  <X className="h-4 w-4 text-white/20 group-hover:text-white transition-colors" />
                </button>
              </div>

              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl md:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Database className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-white uppercase italic tracking-tighter">Initialize Sector</h2>
                    <p className="text-[8px] md:text-[10px] text-emerald-500/40 font-black uppercase tracking-widest">Create new data category</p>
                  </div>
                </div>

                <form onSubmit={handleCreateCategory} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-2">Sector Name</label>
                    <input
                      autoFocus
                      required
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-xl md:rounded-2xl px-5 md:px-6 py-3 md:py-4 text-white font-bold placeholder:text-white/5 focus:outline-none focus:border-emerald-500/30 transition-all uppercase tracking-tight"
                      placeholder="ENTER SECTOR DESIGNATION..."
                    />
                  </div>

                  <div className="pt-2 md:pt-4 flex gap-4">
                    <Button
                      type="submit"
                      className="flex-1 h-12 md:h-16 rounded-xl md:rounded-[1.25rem] bg-emerald-500 text-black font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/10 hover:bg-emerald-400 transition-all hover:scale-[1.01]"
                    >
                      Initialize
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Channel Modal */}
        {showChannelModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChannelModal({ show: false, categoryId: "" })}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-4 md:p-6 z-10">
                <button
                  type="button"
                  onClick={() => setShowChannelModal({ show: false, categoryId: "" })}
                  className="h-8 w-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors group"
                >
                  <X className="h-4 w-4 text-white/20 group-hover:text-white transition-colors" />
                </button>
              </div>

              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl md:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <PlusCircle className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-white uppercase italic tracking-tighter">New Frequency</h2>
                    <p className="text-[8px] md:text-[10px] text-emerald-500/40 font-black uppercase tracking-widest">Protocol setup in active sector</p>
                  </div>
                </div>

                <form onSubmit={handleCreateChannel} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-2">Channel Name</label>
                    <input
                      autoFocus
                      required
                      value={newChannelData.name}
                      onChange={(e) => setNewChannelData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-xl md:rounded-2xl px-5 md:px-6 py-3 md:py-4 text-white font-bold placeholder:text-white/5 focus:outline-none focus:border-emerald-500/30 transition-all uppercase tracking-tight"
                      placeholder="ENTER CHANNEL NAME..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-2">Channel Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNewChannelData(prev => ({ ...prev, type: "text" }))}
                        className={cn(
                          "px-4 py-2.5 md:py-3 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all border",
                          newChannelData.type === "text"
                            ? "bg-emerald-500 text-black border-emerald-500"
                            : "bg-white/5 text-white/20 border-white/5 hover:border-white/10"
                        )}
                      >
                        Text Chat
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewChannelData(prev => ({ ...prev, type: "forum" }))}
                        className={cn(
                          "px-4 py-2.5 md:py-3 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all border",
                          newChannelData.type === "forum"
                            ? "bg-emerald-500 text-black border-emerald-500"
                            : "bg-white/5 text-white/20 border-white/5 hover:border-white/10"
                        )}
                      >
                        Forum Board
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 md:pt-4 flex gap-4">
                    <Button
                      type="submit"
                      className="flex-1 h-12 md:h-16 rounded-xl md:rounded-[1.25rem] bg-emerald-500 text-black font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/10 hover:bg-emerald-400 transition-all hover:scale-[1.01]"
                    >
                      Initialize Channel
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes scan {
          from { top: -10%; opacity: 0; }
          50% { opacity: 1; }
          to { top: 110%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 10s linear infinite;
        }
      `}</style>
    </div>
  );
}
