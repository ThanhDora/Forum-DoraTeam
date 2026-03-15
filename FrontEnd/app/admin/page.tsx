"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  getAllUsers,
  deleteUser,
  updateUserRole,
  createAdminUser,
  getAllTutorials,
  createTutorial,
  updateTutorial,
  deleteTutorial,
  uploadImage,
  AdminUser,
  AuthUser,
  Tutorial
} from "@/lib/api";
import { TiptapEditor } from "@/components/TiptapEditor";
import {
  Users,
  Shield,
  Trash2,
  UserCircle,
  Mail,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Search,
  Loader2,
  UserPlus,
  ExternalLink,
  X,
  Lock,
  BookOpen,
  Plus,
  Edit,
  Check,
  Tag,
  Bold,
  Italic,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Eye,
  Type,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Minus
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

import { RolesTab } from "@/components/admin/RolesTab";
import { getSocket } from "@/lib/socket";
import { hasPermission, Permissions } from "@/lib/permissions";
import { getMe } from "@/lib/api";
import {
  Palette,
  Settings2,
  Hash,
  Users2,
  Copy,
  Plus as PlusIcon,
  Save,
  RefreshCw
} from "lucide-react";
import {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  reorderRoles,
  Role
} from "@/lib/api";

export default function AdminPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "tutorials" | "roles">("users");
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");

  // User creation state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState<{
    email: string;
    name: string;
    password: string;
    role: string;
    roleIds: string[];
  }>({
    email: "",
    name: "",
    password: "",
    role: "user",
    roleIds: []
  });

  // Tutorial state
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [tutorialLoading, setTutorialLoading] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [tutorialForm, setTutorialForm] = useState({
    title: "",
    content: "",
    category: "C++",
    active: true,
    isPublic: true
  });

  const [showPreview, setShowPreview] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  // Role management state
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState<Partial<Role>>({});
  const [roleLoading, setRoleLoading] = useState(false);

  // User Role Assignment state
  const [selectedUserForRole, setSelectedUserForRole] = useState<AdminUser | null>(null);
  const [isRoleAssignModalOpen, setIsRoleAssignModalOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  const categories = Array.from(new Set(tutorials.map(t => t.category))).filter(Boolean);
  if (!categories.includes("C++")) categories.push("C++");
  if (!categories.includes("Android")) categories.push("Android");
  if (!categories.includes("iOS")) categories.push("iOS");
  if (!categories.includes("Server")) categories.push("Server");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        insertMarkdown("**", "**");
      } else if (e.key === 'i') {
        e.preventDefault();
        insertMarkdown("_", "_");
      } else if (e.key === 'k') {
        e.preventDefault();
        insertMarkdown("[", "](url)");
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const { url } = await uploadImage(file);
      insertMarkdown(`![${file.name}](`, `)`, url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
      // Clear the input so the same file can be uploaded again
      e.target.value = "";
    }
  };

  const insertMarkdown = (prefix: string, suffix: string = "", defaultSelection: string = "text") => {
    const textarea = document.getElementById("tutorial-content") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = tutorialForm.content;
    const selection = text.substring(start, end);

    const before = text.substring(0, start);
    const after = text.substring(end);

    const newContent = before + prefix + (selection || defaultSelection) + suffix + after;
    setTutorialForm({ ...tutorialForm, content: newContent });

    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      const contentToMeasure = selection || defaultSelection;
      const newCursorPos = start + prefix.length + contentToMeasure.length + suffix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  useEffect(() => {
    setMounted(true);
    const raw = localStorage.getItem("user");
    if (!raw) {
      router.replace("/login");
      return;
    }

    const initialUser = JSON.parse(raw) as AuthUser;

    // Refresh user data to get latest permissions
    getMe().then(updatedUser => {
      if (!updatedUser || (updatedUser.role !== "admin" && updatedUser.role !== "superadmin")) {
        router.replace("/profile");
        return;
      }
      setAdmin(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser)); // Keep it synced
    }).catch(() => {
      if (initialUser.role !== "admin" && initialUser.role !== "superadmin") {
        router.replace("/profile");
        return;
      }
      setAdmin(initialUser);
    });

    fetchData();

    // Socket listeners
    const socket = getSocket();

    const handleOnlineUpdate = (ids: string[]) => {
      setOnlineUserIds(ids);
    };

    socket.emit("identify", initialUser.id);
    socket.on("update_online_users", handleOnlineUpdate);

    return () => {
      socket.off("update_online_users", handleOnlineUpdate);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [userData, tutorialData, roleData] = await Promise.all([
        getAllUsers(),
        getAllTutorials(),
        getAllRoles()
      ]);
      setUsers(userData);
      setTutorials(tutorialData);
      setRoles(roleData);
      if (roleData.length > 0 && !selectedRole) {
        setSelectedRole(roleData[0]);
        setRoleForm(roleData[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này không?")) return;
    try {
      await deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
      toast.success("Đã xóa danh tính khỏi kho lưu trữ");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa người dùng thất bại");
    }
  };

  const handleToggleRole = async (user: AdminUser) => {
    if (user.id === admin?.id) {
      toast.error("Lỗi bảo mật: Bạn không thể tự hạ cấp chính mình");
      return;
    }
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      await updateUserRole(user.id, newRole);
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      toast.success(`Đã cập nhật cấp độ truy cập: ${newRole.toUpperCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cập nhật vai trò thất bại");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      const newUser = await createAdminUser(createForm);
      setUsers([newUser, ...users]);
      setIsCreateModalOpen(false);
      setCreateForm({ email: "", name: "", password: "", role: "user", roleIds: [] });
      toast.success("New identity authorized and added to archives");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAssignRoles = async () => {
    if (!selectedUserForRole) return;
    try {
      setAssignLoading(true);
      const roleIds = selectedUserForRole.roleIds || [];
      await updateUserRole(selectedUserForRole.id, undefined, roleIds);
      setUsers(users.map(u => u.id === selectedUserForRole.id ? selectedUserForRole : u));
      setIsRoleAssignModalOpen(false);
      toast.success("Roles updated for user");
    } catch (err) {
      toast.error("Cập nhật vai trò thất bại");
    } finally {
      setAssignLoading(false);
    }
  };

  // Tutorial Handlers
  const handleSaveTutorial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setTutorialLoading(true);
      const payload = {
        ...tutorialForm,
        category: isCustomCategory ? customCategory : tutorialForm.category
      };

      if (editingTutorial) {
        const updated = await updateTutorial(editingTutorial.id, payload);
        setTutorials(tutorials.map(t => t.id === updated.id ? updated : t));
      } else {
        const newer = await createTutorial(payload);
        setTutorials([newer, ...tutorials]);
      }
      setIsTutorialModalOpen(false);
      setEditingTutorial(null);
      setTutorialForm({ title: "", content: "", category: "C++", active: true, isPublic: true });
      setIsCustomCategory(false);
      setCustomCategory("");
      toast.success(editingTutorial ? "Đã cập nhập dữ liệu" : "Đã thêm dữ liệu mới");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lưu bài hướng dẫn thất bại");
    } finally {
      setTutorialLoading(false);
    }
  };

  const handleDeleteTutorial = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài hướng dẫn này?")) return;
    try {
      await deleteTutorial(id);
      setTutorials(tutorials.filter(t => t.id !== id));
      toast.success("Đã xóa vĩnh viễn dữ liệu");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa bài hướng dẫn thất bại");
    }
  };

  const openEditTutorial = (tut: Tutorial) => {
    setEditingTutorial(tut);
    setTutorialForm({
      title: tut.title,
      content: tut.content,
      category: tut.category,
      active: tut.active,
      isPublic: tut.isPublic
    });
    setIsCustomCategory(false);
    setCustomCategory("");
    setIsTutorialModalOpen(true);
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredTutorials = tutorials.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[15%] right-[5%] w-[32rem] h-[32rem] bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Bảng Điều Khiển</h1>
                <p className="text-sm text-muted-foreground">Quản lý cộng đồng, vai trò và nội dung của bạn</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                placeholder={activeTab === "users" ? "Tìm kiếm người dùng..." : "Tìm bài viết..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 rounded-xl border border-border/50 bg-card/50 backdrop-blur-md pl-10 pr-4 py-2.5 text-sm ring-offset-background transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            {activeTab === "users" && admin && hasPermission(admin.permissions || "0", Permissions.MANAGE_USERS) ? (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Thêm Người Dùng
              </Button>
            ) : activeTab === "tutorials" && admin && hasPermission(admin.permissions || "0", Permissions.CREATE_TUTORIAL) ? (
              <Button
                onClick={() => {
                  setEditingTutorial(null);
                  setTutorialForm({ title: "", content: "", category: "C++", active: true, isPublic: true });
                  setIsCustomCategory(false);
                  setCustomCategory("");
                  setIsTutorialModalOpen(true);
                }}
                className="rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm Bài Viết
              </Button>
            ) : null}
          </div>
        </header>

        {/* Tab Switcher */}
        <div className="flex p-1 mb-8 gap-1 w-full sm:w-fit rounded-2xl border border-border/50 bg-card/50 backdrop-blur-md overflow-x-auto">
          {admin && hasPermission(admin.permissions || "0", Permissions.MANAGE_USERS) && (
            <button
              onClick={() => { setActiveTab("users"); setSearchTerm(""); }}
              className={cn(
                "flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 sm:flex-none justify-center",
                activeTab === "users" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Users className="h-4 w-4" />
              Thành Viên
            </button>
          )}
          {admin && (
            hasPermission(admin.permissions || "0", Permissions.CREATE_TUTORIAL) ||
            hasPermission(admin.permissions || "0", Permissions.EDIT_TUTORIAL) ||
            hasPermission(admin.permissions || "0", Permissions.DELETE_TUTORIAL)
          ) && (
              <button
                onClick={() => { setActiveTab("tutorials"); setSearchTerm(""); }}
                className={cn(
                  "flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 sm:flex-none justify-center",
                  activeTab === "tutorials" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <BookOpen className="h-4 w-4" />
                Bài Viết
              </button>
            )}
          {admin && hasPermission(admin.permissions || "0", Permissions.MANAGE_ROLES) && (
            <button
              onClick={() => { setActiveTab("roles"); setSearchTerm(""); }}
              className={cn(
                "flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 sm:flex-none justify-center",
                activeTab === "roles" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Shield className="h-4 w-4" />
              Vai Trò
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 flex items-center justify-between gap-4 animate-in fade-in">
            <p className="text-sm text-destructive font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchData}>Thử lại</Button>
          </div>
        )}

        <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="overflow-x-auto">
            {activeTab === "users" ? (
              <div>
                {/* Desktop Table */}
                <table className="hidden md:table w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Thành viên</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Vai trò</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Giới thiệu</th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-24 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Đang tải danh sách thành viên...</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {filteredUsers.map((user, index) => (
                          <motion.tr
                            key={`${user.id}-${index}`}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="group transition-colors hover:bg-muted/30"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-border/50 bg-linear-to-br from-primary/10 to-primary/20 shadow-sm transition-transform group-hover:scale-105">
                                  {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                                      <UserCircle className="h-6 w-6" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate font-semibold text-foreground">{user.name || "Người dùng ẩn danh"}</span>
                                    {onlineUserIds.includes(user.id) && (
                                      <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate">{user.email}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-wrap gap-1.5">
                                <div className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-tight shadow-sm border",
                                  user.role === "superadmin" ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" :
                                    user.role === "admin" ? "bg-primary/10 text-primary border-primary/20" :
                                      "bg-muted text-muted-foreground border-border/50"
                                )}>
                                  {user.role === "superadmin" ? <ShieldCheck className="h-2.5 w-2.5" /> : user.role === "admin" ? <Shield className="h-2.5 w-2.5" /> : <UserCircle className="h-2.5 w-2.5" />}
                                  {user.role}
                                </div>
                                {user.roles?.map((r, idx) => (
                                  <div key={`${r.id}-${idx}`} className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-tight shadow-sm border" style={{ backgroundColor: `${r.color}15`, color: r.color, borderColor: `${r.color}30` }}>
                                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: r.color }} />
                                    {r.name}
                                  </div>
                                ))}
                                {admin && (admin.role === "superadmin" || hasPermission(admin.permissions || "0", Permissions.MANAGE_ROLES)) && (
                                  <button onClick={() => { setSelectedUserForRole(user); setIsRoleAssignModalOpen(true); }} className="h-6 w-6 rounded-full border border-dashed border-border hover:border-primary hover:text-primary transition-all flex items-center justify-center">
                                    <PlusIcon className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <p className="max-w-[200px] truncate text-sm text-muted-foreground/80">
                                {user.bio || <span className="italic text-muted-foreground/40">Chưa có giới thiệu</span>}
                              </p>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                {admin && (admin.role === "superadmin" || hasPermission(admin.permissions || "0", Permissions.MANAGE_ROLES)) && (
                                  <Button variant="ghost" size="icon" disabled={user.role === "superadmin"} title={user.role === "admin" ? "Hạ cấp" : "Nâng cấp Quản trị"} onClick={() => handleToggleRole(user)} className={cn("h-9 w-9 rounded-lg transition-all", user.role === "admin" ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10")}><ShieldAlert className="h-4.5 w-4.5" /></Button>
                                )}
                                {admin && hasPermission(admin.permissions || "0", Permissions.MANAGE_USERS) && (
                                  <Button variant="ghost" size="icon" disabled={user.role === "superadmin"} title="Xóa người dùng" onClick={() => handleDelete(user.id)} className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"><Trash2 className="h-4.5 w-4.5" /></Button>
                                )}
                                <Button variant="ghost" size="icon" onClick={() => router.push(`/profile/${user.id}`)} title="Xem hồ sơ" className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"><ExternalLink className="h-4.5 w-4.5" /></Button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    )}
                  </tbody>
                </table>

                {/* Mobile Card Layout */}
                <div className="md:hidden divide-y divide-border/30">
                  {loading ? (
                    <div className="px-4 py-16 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                      <p className="text-sm text-muted-foreground mt-3">Đang tải danh sách thành viên...</p>
                    </div>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <div key={`mobile-${user.id}-${index}`} className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-border/50 bg-linear-to-br from-primary/10 to-primary/20">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                                <UserCircle className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-semibold text-foreground text-sm">{user.name || "Người dùng ẩn danh"}</span>
                              {onlineUserIds.includes(user.id) && (
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <div className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-tight border",
                            user.role === "superadmin" ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" :
                              user.role === "admin" ? "bg-primary/10 text-primary border-primary/20" :
                                "bg-muted text-muted-foreground border-border/50"
                          )}>
                            {user.role === "superadmin" ? <ShieldCheck className="h-2.5 w-2.5" /> : user.role === "admin" ? <Shield className="h-2.5 w-2.5" /> : <UserCircle className="h-2.5 w-2.5" />}
                            {user.role}
                          </div>
                          {user.roles?.map((r, idx) => (
                            <div key={`${r.id}-${idx}`} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-tight border" style={{ backgroundColor: `${r.color}15`, color: r.color, borderColor: `${r.color}30` }}>
                              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: r.color }} />
                              {r.name}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          {admin?.role === "superadmin" && (
                            <Button variant="ghost" size="sm" disabled={user.role === "superadmin"} onClick={() => handleToggleRole(user)} className={cn("h-8 px-2 rounded-lg text-xs", user.role === "admin" ? "text-primary" : "text-muted-foreground")}>
                              <ShieldAlert className="h-3.5 w-3.5 mr-1" />{user.role === "admin" ? "Hạ cấp" : "Nâng cấp"}
                            </Button>
                          )}
                          {admin?.role === "superadmin" && (
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedUserForRole(user); setIsRoleAssignModalOpen(true); }} className="h-8 px-2 rounded-lg text-xs text-muted-foreground">
                              <PlusIcon className="h-3.5 w-3.5 mr-1" />Vai trò
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/profile/${user.id}`)} className="h-8 px-2 rounded-lg text-xs text-muted-foreground">
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />Hồ sơ
                          </Button>
                          <div className="flex-1" />
                          <Button variant="ghost" size="icon" disabled={user.role === "superadmin"} onClick={() => handleDelete(user.id)} className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : activeTab === "tutorials" ? (
              <div>
                {/* Desktop Table */}
                <table className="hidden md:table w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Bài viết</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Chuyên mục</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Tác giả</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Trạng thái</th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-24 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Đang truy cập kho dữ liệu...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredTutorials.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-24 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                            <p className="text-lg font-medium text-muted-foreground">Không tìm thấy bài viết nào</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {filteredTutorials.map((tut) => (
                          <motion.tr
                            key={tut.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="group transition-colors hover:bg-muted/30"
                          >
                            <td className="px-6 py-5">
                              <div className="flex flex-col min-w-0">
                                <span className="truncate font-bold text-foreground text-lg">{tut.title}</span>
                                <p className="truncate text-xs text-muted-foreground/60 max-w-[300px]">{tut.content.substring(0, 60)}...</p>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-500">
                                <Tag className="h-3 w-3" />
                                {tut.category}
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2">
                                {tut.author?.avatarUrl ? (
                                  <img src={tut.author.avatarUrl} className="h-6 w-6 rounded-full border border-border/50 object-cover flex-shrink-0" alt="" />
                                ) : (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
                                    <UserCircle className="h-3.5 w-3.5" />
                                  </div>
                                )}
                                <span className="text-xs font-medium text-muted-foreground">{tut.author?.name || "Hệ thống"}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              {tut.active ? (
                                <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500">
                                  <Check className="h-3 w-3" /> Đã đăng
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
                                  <X className="h-3 w-3" /> Bản nháp
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                {admin && hasPermission(admin.permissions || "0", Permissions.EDIT_TUTORIAL) && (
                                  <Button variant="ghost" size="icon" title="Sửa bài viết" onClick={() => openEditTutorial(tut)} className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"><Edit className="h-4 w-4" /></Button>
                                )}
                                {admin && hasPermission(admin.permissions || "0", Permissions.DELETE_TUTORIAL) && (
                                  <Button variant="ghost" size="icon" title="Xóa bài viết" onClick={() => handleDeleteTutorial(tut.id)} className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"><Trash2 className="h-4 w-4" /></Button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    )}
                  </tbody>
                </table>

                {/* Mobile Card Layout */}
                <div className="md:hidden divide-y divide-border/30">
                  {loading ? (
                    <div className="px-4 py-16 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                      <p className="text-sm text-muted-foreground mt-3">Đang truy cập kho dữ liệu...</p>
                    </div>
                  ) : filteredTutorials.length === 0 ? (
                    <div className="px-4 py-16 text-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                      <p className="text-lg font-medium text-muted-foreground mt-3">Không tìm thấy bài viết nào</p>
                    </div>
                  ) : (
                    filteredTutorials.map((tut) => (
                      <div key={`mobile-${tut.id}`} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-foreground text-sm line-clamp-2">{tut.title}</span>
                            <p className="text-xs text-muted-foreground/60 mt-1 line-clamp-1">{tut.content.substring(0, 60)}...</p>
                          </div>
                        </div>
                        <div className="flex items-center flex-wrap gap-2">
                          <div className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-500">
                            <Tag className="h-2.5 w-2.5" />
                            {tut.category}
                          </div>
                          {tut.active ? (
                            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                              <Check className="h-2.5 w-2.5" /> Đã đăng
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                              <X className="h-2.5 w-2.5" /> Bản nháp
                            </div>
                          )}
                          <div className="flex items-center gap-1 ml-auto">
                            {tut.author?.avatarUrl ? (
                              <img src={tut.author.avatarUrl} className="h-5 w-5 rounded-full border border-border/50 object-cover" alt="" />
                            ) : (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                                <UserCircle className="h-3 w-3" />
                              </div>
                            )}
                            <span className="text-[10px] font-medium text-muted-foreground">{tut.author?.name || "Hệ thống"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {admin && hasPermission(admin.permissions || "0", Permissions.EDIT_TUTORIAL) && (
                            <Button variant="ghost" size="sm" onClick={() => openEditTutorial(tut)} className="h-8 px-3 rounded-lg text-xs text-muted-foreground hover:text-primary">
                              <Edit className="h-3.5 w-3.5 mr-1" />Sửa
                            </Button>
                          )}
                          <div className="flex-1" />
                          {admin && hasPermission(admin.permissions || "0", Permissions.DELETE_TUTORIAL) && (
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTutorial(tut.id)} className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <RolesTab roles={roles} onRolesUpdate={(updated) => setRoles(updated)} />
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/50 bg-card/95 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/50 p-6">
              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserPlus className="h-5 w-5" /></div><h2 className="text-xl font-bold">Danh tính mới</h2></div>
              <Button variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(false)} className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-5">
              <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Tên đầy đủ</label><div className="relative"><UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input type="text" required placeholder="Tên của đối tượng" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="w-full rounded-xl border border-border/50 bg-muted/30 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" /></div></div>
              <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Địa chỉ Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input type="email" required placeholder="email@example.com" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="w-full rounded-xl border border-border/50 bg-muted/30 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" /></div></div>
              <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Mã khóa bảo mật</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input type="password" required placeholder="••••••••" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className="w-full rounded-xl border border-border/50 bg-muted/30 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" /></div></div>
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Cấp độ ưu tiên & Vai trò</label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button type="button" onClick={() => setCreateForm({ ...createForm, role: "user" })} className={cn("flex items-center justify-center gap-2 rounded-xl border py-2 text-xs font-bold transition-all", createForm.role === "user" ? "bg-primary/10 border-primary text-primary shadow-sm" : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50")}><UserCircle className="h-3.5 w-3.5" /> THÀNH VIÊN</button>
                  <button type="button" onClick={() => setCreateForm({ ...createForm, role: "admin" })} className={cn("flex items-center justify-center gap-2 rounded-xl border py-2 text-xs font-bold transition-all", createForm.role === "admin" ? "bg-primary/10 border-primary text-primary shadow-sm" : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50")}><Shield className="h-3.5 w-3.5" /> QUẢN TRỊ</button>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Vai trò bổ sung</p>
                  <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar p-1">
                    {roles.map((role) => {
                      const isSelected = createForm.roleIds?.includes(role.id);
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => {
                            const currentIds = createForm.roleIds || [];
                            const newIds = isSelected
                              ? currentIds.filter(id => id !== role.id)
                              : [...currentIds, role.id];
                            setCreateForm({ ...createForm, roleIds: newIds });
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-2",
                            isSelected ? "bg-primary/10 border-primary text-primary" : "border-border/30 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                          )}
                        >
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: role.color }} />
                          {role.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="flex-1 rounded-xl">Hủy bỏ</Button>
                <Button type="submit" disabled={createLoading} className="flex-1 rounded-xl shadow-lg shadow-primary/20">{createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Phê duyệt đối tượng"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tutorial Management Modal */}
      {isTutorialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity" onClick={() => { setIsTutorialModalOpen(false); setEditingTutorial(null); }} />
          <div className="relative w-full max-w-6xl max-h-[95vh] overflow-y-auto overflow-hidden rounded-3xl border border-border/50 bg-card/95 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/50 p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold">{editingTutorial ? "Cập nhật dữ liệu" : "Đóng góp kiến thức"}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setIsTutorialModalOpen(false); setEditingTutorial(null); }} className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={handleSaveTutorial} className="p-4 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Tiêu đề bài viết</label>
                  <input type="text" required placeholder="Nhập tiêu đề..." value={tutorialForm.title} onChange={(e) => setTutorialForm({ ...tutorialForm, title: e.target.value })} className="w-full rounded-xl border border-border/50 bg-muted/30 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Phân loại</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(!isCustomCategory)}
                      className="text-[10px] font-black uppercase text-primary hover:underline"
                    >
                      {isCustomCategory ? "Chọn hiện có" : "+ Tạo mới"}
                    </button>
                  </div>
                  {isCustomCategory ? (
                    <input
                      type="text"
                      required
                      placeholder="Nhập chuyên mục mới..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full rounded-xl border border-border/50 bg-muted/30 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  ) : (
                    <select
                      value={tutorialForm.category}
                      onChange={(e) => setTutorialForm({ ...tutorialForm, category: e.target.value })}
                      className="w-full rounded-xl border border-border/50 bg-muted/30 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>


              <div className="flex flex-col gap-6 h-[50vh] sm:h-[70vh]">
                {/* Editor Surface */}
                <div className="flex flex-col gap-4 min-h-0 flex-1">
                  <div className="flex h-12 items-center px-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                      Trình soạn thảo nội dung
                    </label>
                  </div>
                  <div className="relative flex-1 rounded-3xl border border-border/50 bg-black/5 shadow-inner overflow-hidden">
                    <TiptapEditor
                      variant="full"
                      value={tutorialForm.content}
                      onChange={(val) => setTutorialForm({ ...tutorialForm, content: val })}
                      placeholder="Nhập nội dung bài viết..."
                      className="h-full rounded-none border-0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button type="button" onClick={() => setTutorialForm({ ...tutorialForm, active: !tutorialForm.active })} className={cn("flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] sm:text-xs font-bold transition-all", tutorialForm.active ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-muted/30 border-border text-muted-foreground")}>
                  {tutorialForm.active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {tutorialForm.active ? "Công khai" : "Ẩn"}
                </button>
                <button type="button" onClick={() => setTutorialForm({ ...tutorialForm, isPublic: !tutorialForm.isPublic })} className={cn("flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] sm:text-xs font-bold transition-all", tutorialForm.isPublic ? "bg-blue-500/10 border-blue-500/30 text-blue-500" : "bg-rose-500/10 border-rose-500/30 text-rose-500")}>
                  {tutorialForm.isPublic ? <Check className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {tutorialForm.isPublic ? "Công khai" : "Đăng nhập"}
                </button>
                <div className="flex-1" />
                <Button type="button" variant="ghost" onClick={() => { setIsTutorialModalOpen(false); setEditingTutorial(null); }} className="rounded-xl px-4 sm:px-6 text-xs sm:text-sm">Hủy</Button>
                <Button type="submit" disabled={tutorialLoading} className="rounded-xl bg-primary px-4 sm:px-8 shadow-lg shadow-primary/20 text-xs sm:text-sm">{tutorialLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : editingTutorial ? "Cập nhật" : "Đăng bài"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      <AnimatePresence>
        {isRoleAssignModalOpen && selectedUserForRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRoleAssignModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] border border-border/50 bg-card p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" /> Cấp vai trò
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mt-0.5">
                    Đang quản lý {selectedUserForRole.name || selectedUserForRole.email}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsRoleAssignModalOpen(false)} className="rounded-full h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {roles.sort((a, b) => b.position - a.position).map((role) => {
                  const hasRole = selectedUserForRole.roleIds?.includes(role.id);
                  return (
                    <div
                      key={role.id}
                      onClick={() => {
                        const currentIds = selectedUserForRole.roleIds || [];
                        const newIds = hasRole
                          ? currentIds.filter(id => id !== role.id)
                          : [...currentIds, role.id];

                        // Mock update in local state for UI feedback
                        const updatedUser = {
                          ...selectedUserForRole,
                          roleIds: newIds,
                          roles: hasRole
                            ? selectedUserForRole.roles?.filter(r => r.id !== role.id)
                            : [...(selectedUserForRole.roles || []), { id: role.id, name: role.name, color: role.color }]
                        };
                        setSelectedUserForRole(updatedUser);
                      }}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group",
                        hasRole ? "bg-primary/10 border-primary/30" : "bg-muted/30 border-border/50 hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: role.color }} />
                        <span className={cn("text-xs font-bold", hasRole ? "text-primary" : "text-foreground group-hover:text-primary transition-colors")}>
                          {role.name}
                        </span>
                      </div>
                      <div className={cn(
                        "h-4 w-4 rounded-md border-2 transition-all flex items-center justify-center",
                        hasRole ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                      )}>
                        {hasRole && <Check className="h-3 w-3 stroke-[4]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 mt-6">
                <Button variant="ghost" onClick={() => setIsRoleAssignModalOpen(false)} className="flex-1 rounded-xl h-10 text-xs font-bold">
                  Hủy bỏ
                </Button>
                <Button onClick={handleAssignRoles} disabled={assignLoading} className="flex-1 rounded-xl h-10 text-xs font-bold bg-primary shadow-lg shadow-primary/20">
                  {assignLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Xác nhận"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

