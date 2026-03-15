import { useState, useEffect } from "react";
import { 
  Shield, 
  Palette, 
  Settings2, 
  Hash, 
  Users2, 
  Trash2, 
  Plus, 
  Save, 
  ChevronRight,
  Info,
  Lock,
  Eye,
  Check,
  RefreshCw
} from "lucide-react";
import { Role, createRole, updateRole, deleteRole, reorderRoles } from "@/lib/api";
import { Permissions, getPermissionNames, PermissionLabels } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface RolesTabProps {
  roles: Role[];
  onRolesUpdate: (updatedRoles: Role[]) => void;
}

export function RolesTab({ roles, onRolesUpdate }: RolesTabProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(roles[0] || null);
  const [roleForm, setRoleForm] = useState<Partial<Role>>({});
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"display" | "permissions" | "members">("display");

  useEffect(() => {
    if (selectedRole) {
      setRoleForm(selectedRole);
    }
  }, [selectedRole]);

  const handleCreateRole = async () => {
    try {
      setLoading(true);
      const newRole = await createRole({
        name: "new role",
        color: "#99aab5",
        permissions: "0",
        position: roles.length,
      });
      const updatedRoles = [...roles, newRole];
      onRolesUpdate(updatedRoles);
      setSelectedRole(newRole);
      toast.success("Đã tạo vai trò mới");
    } catch (err) {
      toast.error("Tạo vai trò thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRole = async () => {
    if (!selectedRole?.id) return;
    try {
      setLoading(true);
      const updated = await updateRole(selectedRole.id, roleForm);
      const updatedRoles = roles.map(r => r.id === updated.id ? updated : r);
      onRolesUpdate(updatedRoles);
      setSelectedRole(updated);
      toast.success("Đã lưu vai trò thành công");
    } catch (err) {
      toast.error("Lưu vai trò thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      setLoading(true);
      await deleteRole(id);
      const updatedRoles = roles.filter(r => r.id !== id);
      onRolesUpdate(updatedRoles);
      if (selectedRole?.id === id) {
        setSelectedRole(updatedRoles[0] || null);
      }
      toast.success("Đã xóa vai trò");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa vai trò thất bại");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (perm: bigint) => {
    const currentPerms = BigInt(roleForm.permissions || "0");
    const newPerms = (currentPerms & perm) === perm 
      ? currentPerms & ~perm 
      : currentPerms | perm;
    setRoleForm({ ...roleForm, permissions: newPerms.toString() });
  };

  return (
    <div className="flex flex-col md:flex-row md:h-[600px] gap-0 overflow-hidden rounded-3xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-2xl">
      {/* Sidebar — horizontal on mobile, vertical on desktop */}
      <div className="md:w-64 flex md:flex-col border-b md:border-b-0 md:border-r border-border/50 bg-muted/20">
        <div className="p-3 md:p-4 md:border-b border-border/50 flex items-center justify-between shrink-0">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">Vai trò</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-primary/20 hover:text-primary" onClick={handleCreateRole}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex md:flex-col flex-1 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto p-2 gap-1 md:space-y-1">
          {roles.sort((a,b) => b.position - a.position).map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role)}
              className={cn(
                "flex items-center gap-2 md:gap-3 px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-all group whitespace-nowrap md:whitespace-normal md:w-full shrink-0",
                selectedRole?.id === role.id 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <div className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-full shadow-sm shrink-0" style={{ backgroundColor: role.color }} />
              <span className="flex-1 text-left truncate">{role.name}</span>
              <ChevronRight className={cn("h-4 w-4 transition-transform hidden md:block", selectedRole?.id === role.id ? "opacity-100" : "opacity-0 group-hover:opacity-50")} />
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background/40">
        {!selectedRole ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
            <Shield className="h-12 w-12 opacity-10" />
            <p className="text-sm font-medium">Chọn một vai trò để chỉnh sửa thuộc tính</p>
          </div>
        ) : (
          <>
            <div className="p-4 md:p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shrink-0" style={{ backgroundColor: `${selectedRole.color}20`, color: selectedRole.color }}>
                  <Shield className="h-4 w-4 md:h-6 md:w-6" />
                </div>
                <div>
                  <h2 className="text-base md:text-xl font-black tracking-tight">{selectedRole.name}</h2>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Chỉnh sửa cấu hình vai trò</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="rounded-xl text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteRole(selectedRole.id)}>
                   <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Xóa
                </Button>
                <Button size="sm" className="rounded-xl bg-primary shadow-lg shadow-primary/20 text-xs" onClick={handleSaveRole} disabled={loading}>
                   {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />} Lưu
                </Button>
              </div>
            </div>

            {/* Sub-Tabs */}
            <div className="flex px-4 md:px-6 py-2 gap-2 md:gap-4 border-b border-border/50 bg-muted/10 overflow-x-auto">
              {[
                { id: "display", label: "Hiển thị", icon: Palette },
                { id: "permissions", label: "Quyền hạn", icon: Lock },
                { id: "members", label: "Thành viên", icon: Users2 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-2 text-[10px] md:text-xs font-black uppercase tracking-wider md:tracking-widest transition-all border-b-2 whitespace-nowrap",
                    activeSubTab === tab.id 
                      ? "border-primary text-primary" 
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
              <AnimatePresence mode="wait">
                {activeSubTab === "display" && (
                  <motion.div
                    key="display"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6 md:space-y-8"
                  >
                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
                        <Settings2 className="h-3.5 w-3.5" /> Danh tính vai trò
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-muted-foreground/50">TÊN VAI TRÒ</label>
                          <input 
                            value={roleForm.name || ""} 
                            onChange={e => setRoleForm({...roleForm, name: e.target.value})}
                            className="w-full bg-muted/40 border border-border/50 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-muted-foreground/50">MÀU VAI TRÒ</label>
                          <div className="flex gap-3">
                            <input 
                              type="color"
                              value={roleForm.color || "#99aab5"} 
                              onChange={e => setRoleForm({...roleForm, color: e.target.value})}
                              className="h-11 w-11 rounded-xl border-none p-0 bg-transparent cursor-pointer overflow-hidden"
                            />
                            <input 
                              value={roleForm.color || ""} 
                              onChange={e => setRoleForm({...roleForm, color: e.target.value})}
                              className="flex-1 bg-muted/40 border border-border/50 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
                        <Eye className="h-3.5 w-3.5" /> Hiển thị vai trò
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 md:p-4 rounded-2xl bg-muted/20 border border-border/50 hover:bg-muted/30 transition-all cursor-pointer gap-3" onClick={() => setRoleForm({...roleForm, hoist: !roleForm.hoist})}>
                          <div className="space-y-0.5 md:space-y-1 flex-1 min-w-0">
                            <p className="text-xs md:text-sm font-bold">Hiển thị riêng biệt</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground/60 italic">Nổi bật vai trò trong danh sách thành viên</p>
                          </div>
                          <div className={cn("h-6 w-11 rounded-full transition-all relative p-1", roleForm.hoist ? "bg-emerald-500" : "bg-muted-foreground/20")}>
                            <div className={cn("h-4 w-4 bg-white rounded-full transition-all shadow-md", roleForm.hoist ? "translate-x-5" : "translate-x-0")} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 md:p-4 rounded-2xl bg-muted/20 border border-border/50 hover:bg-muted/30 transition-all cursor-pointer gap-3" onClick={() => setRoleForm({...roleForm, mentionable: !roleForm.mentionable})}>
                          <div className="space-y-0.5 md:space-y-1 flex-1 min-w-0">
                            <p className="text-xs md:text-sm font-bold">Cho phép @mention</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground/60 italic">Mọi thành viên có thể gắn thẻ vai trò này</p>
                          </div>
                          <div className={cn("h-6 w-11 rounded-full transition-all relative p-1", roleForm.mentionable ? "bg-emerald-500" : "bg-muted-foreground/20")}>
                            <div className={cn("h-4 w-4 bg-white rounded-full transition-all shadow-md", roleForm.mentionable ? "translate-x-5" : "translate-x-0")} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeSubTab === "permissions" && (
                  <motion.div
                    key="permissions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="rounded-xl md:rounded-2xl bg-blue-500/10 border border-blue-500/20 p-3 md:p-4 flex gap-3 md:gap-4 items-start">
                      <div className="h-8 w-8 md:h-10 md:w-10 shrink-0 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                        <Info className="h-4 w-4 md:h-6 md:w-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs md:text-sm font-bold text-blue-500">Hệ thống quyền hạn</p>
                        <p className="text-[10px] md:text-[11px] leading-relaxed text-blue-500/80">
                          Quyền hạn được cộng dồn dựa trên tất cả các vai trò được cấp cho người dùng. 
                          Quyền <span className="font-black uppercase">Quản trị viên</span> sẽ bỏ qua tất cả các quyền khác.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(PermissionLabels).map(([name, label]) => {
                        const value = Permissions[name as keyof typeof Permissions];
                        const isGranted = (BigInt(roleForm.permissions || "0") & (value as bigint)) === (value as bigint);
                        return (
                          <div 
                            key={name}
                            className={cn(
                              "flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all cursor-pointer gap-3",
                              isGranted ? "bg-primary/10 border-primary/30" : "bg-muted/20 border-border/50 hover:bg-muted/30"
                            )}
                            onClick={() => togglePermission(value as bigint)}
                          >
                            <div className="space-y-0.5 md:space-y-1 flex-1 min-w-0">
                              <p className={cn("text-xs md:text-sm font-bold", isGranted ? "text-primary" : "text-foreground")}>{label.name}</p>
                              <p className="text-[10px] md:text-[11px] text-muted-foreground/60 italic lowercase first-letter:uppercase">Cấp quyền "{label.name.toLowerCase()}"</p>
                            </div>
                            <div className={cn("h-6 w-11 rounded-full transition-all relative p-1", isGranted ? "bg-emerald-500" : "bg-muted-foreground/20")}>
                              <div className={cn("h-4 w-4 bg-white rounded-full transition-all shadow-md", isGranted ? "translate-x-5" : "translate-x-0")} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {activeSubTab === "members" && (
                  <motion.div
                    key="members"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4 bg-muted/10 rounded-3xl border border-dashed border-border/50"
                  >
                    <Users2 className="h-12 w-12 opacity-10" />
                    <p className="text-sm font-medium">Để cấp vai trò này cho các thành viên, hãy chuyển sang tab <span className="text-primary underline cursor-pointer" onClick={() => (window as any).setActiveTab?.("users")}>Thành viên</span>.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
