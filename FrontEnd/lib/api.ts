export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  role: "user" | "admin" | "superadmin";
  permissions?: string;
  roleIds?: string[];
  roles?: {
    id: string;
    name: string;
    color: string;
  }[];
  lastActiveAt?: string | Date;
};

export type Role = {
  id: string;
  name: string;
  color: string;
  permissions: string;
  position: number;
  hoist: boolean;
  mentionable: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Tutorial = {
  id: string;
  title: string;
  content: string;
  category: string;
  active: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author?: {
    id: string;
    name: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
};

export type LoginResponse = { 
  accessToken: string; 
  refreshToken: string; 
  user: AuthUser 
};
export type RegisterResponse = { 
  accessToken: string; 
  refreshToken: string; 
  user: AuthUser 
};

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken") ?? localStorage.getItem("token");
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  let res = await fetch(url, { ...options, headers, credentials: "include" });
  
  if (res.status === 401) {
    // Attempt refresh
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
    if (refreshToken) {
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        credentials: "include",
      });
      
      if (refreshRes.ok) {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await refreshRes.json();
        localStorage.setItem("accessToken", newAccessToken);
        if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);
        
        // Retry original request
        headers.set("Authorization", `Bearer ${newAccessToken}`);
        res = await fetch(url, { ...options, headers, credentials: "include" });
      } else {
        // Refresh failed, logout
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
  }
  
  return res;
}

export async function getMe(): Promise<AuthUser | null> {
  const res = await fetchWithAuth("/api/auth/me");
  if (!res.ok) {
    if (res.status === 404 || res.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      }
      return null;
    }
    return null;
  }
  return res.json();
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Login failed");
  }
  const data = await res.json();
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}

export async function register(
  email: string,
  password: string,
  name?: string
): Promise<RegisterResponse> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Registration failed");
  }
  const data = await res.json();
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}
export const updateProfile = async (data: { displayName?: string; bio?: string; avatarUrl?: string }) => {
  const res = await fetchWithAuth("/api/user/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update profile");
  }
  return res.json();
}

export async function getPublicUserList(): Promise<AuthUser[]> {
  const res = await fetchWithAuth("/api/user/list");
  if (!res.ok) throw new Error("Failed to fetch user list");
  return res.json();
}

export type AdminUser = AuthUser;

async function getErrorFromResponse(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  const msg = (data as { error?: string }).error;
  if (res.status === 401) return msg ?? "Please sign in again.";
  if (res.status === 403) return msg ?? "You do not have admin access.";
  return msg ?? `Request failed (${res.status})`;
}

export async function getAllUsers(): Promise<AdminUser[]> {
  const res = await fetchWithAuth("/api/admin/users");
  if (!res.ok) throw new Error(await getErrorFromResponse(res));
  return res.json();
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/admin/users/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await getErrorFromResponse(res));
}

export async function updateUserRole(id: string, role?: string, roleIds?: string[]): Promise<void> {
  const res = await fetchWithAuth(`/api/admin/users/${id}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role, roleIds }),
  });
  if (!res.ok) throw new Error(await getErrorFromResponse(res));
}

export async function createAdminUser(data: {
  email: string;
  name?: string;
  password: string;
  role?: string;
  roleIds?: string[];
}): Promise<AdminUser> {
  const res = await fetchWithAuth("/api/admin/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorFromResponse(res));
  return res.json();
}

export async function getUserById(id: string): Promise<AuthUser> {
  const res = await fetchWithAuth(`/api/user/${id}`);
  if (!res.ok) throw new Error(await getErrorFromResponse(res));
  return res.json();
}

// Role API methods
export async function getAllRoles(): Promise<Role[]> {
  const res = await fetchWithAuth("/api/admin/roles");
  if (!res.ok) throw new Error(await getErrorFromResponse(res));
  return res.json();
}

export async function createRole(data: Partial<Role>): Promise<Role> {
  const res = await fetchWithAuth("/api/admin/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorFromResponse(res));
  return res.json();
}

export async function updateRole(id: string, data: Partial<Role>): Promise<Role> {
  const res = await fetchWithAuth(`/api/admin/roles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorFromResponse(res));
  return res.json();
}

export async function deleteRole(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/admin/roles/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await getErrorFromResponse(res));
}

export async function reorderRoles(roles: { id: string; position: number }[]): Promise<void> {
  const res = await fetchWithAuth("/api/admin/roles/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roles }),
  });
  if (!res.ok) throw new Error(await getErrorFromResponse(res));
}

// Tutorial API methods
export async function getPublicTutorials(): Promise<Tutorial[]> {
  const res = await fetch("/api/tutorials/public");
  if (!res.ok) throw new Error("Failed to fetch tutorials");
  return res.json();
}

export async function getPublicTutorial(id: string): Promise<Tutorial> {
  const res = await fetch(`/api/tutorials/public/${id}`);
  if (!res.ok) throw new Error("Failed to fetch tutorial detail");
  return res.json();
}

export async function getAllTutorials(): Promise<Tutorial[]> {
  const res = await fetchWithAuth("/api/tutorials");
  if (!res.ok) throw new Error(await getErrorFromResponse(res));
  return res.json();
}

export async function createTutorial(data: {
  title: string;
  content: string;
  category?: string;
  active?: boolean;
  isPublic?: boolean;
}): Promise<Tutorial> {
  const res = await fetchWithAuth("/api/tutorials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorFromResponse(res));
  return res.json();
}

export async function updateTutorial(id: string, data: Partial<Tutorial>): Promise<Tutorial> {
  const res = await fetchWithAuth(`/api/tutorials/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorFromResponse(res));
  return res.json();
}

export async function deleteTutorial(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/tutorials/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await getErrorFromResponse(res));
}

export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetchWithAuth("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to upload image");
  }

  return res.json();
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetchWithAuth("/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Thay đổi mật khẩu thất bại");
  }
}

// --- Forum API ---

export interface ForumCategory {
  id: string;
  name: string;
  position: number;
  channels: ForumChannel[];
}

export interface ForumChannel {
  id: string;
  name: string;
  description?: string;
  type: "text" | "forum";
  position: number;
  categoryId: string;
}

export interface ForumThread {
  id: string;
  title: string;
  content?: string;
  authorId: string;
  author: { 
    id: string; 
    name: string; 
    displayName?: string; 
    avatarUrl?: string;
    roles?: { name: string; color: string }[];
  };
  channelId: string;
  _count?: { messages: number; likes: number };
  tags?: ForumTag[];
  liked?: boolean;
  updatedAt: string;
}

export interface ForumTag {
  id: string;
  name: string;
  color?: string;
}

export interface ForumMessage {
  id: string;
  content: string;
  authorId: string;
  author: { 
    id: string; 
    name: string; 
    displayName?: string;
    avatarUrl?: string; 
    role: string;
    roles?: { name: string; color: string }[];
  };
  channelId?: string;
  threadId?: string;
  parentMessageId?: string;
  parentMessage?: { id: string; content: string; author: { name: string } };
  likes?: { userId: string }[];
  _count?: { replies: number };
  createdAt: string;
}

export async function getForumCategories(): Promise<ForumCategory[]> {
  const res = await fetchWithAuth("/api/forum/categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function getForumThreads(channelId: string, params?: { search?: string; tagId?: string }): Promise<ForumThread[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.tagId) query.append("tagId", params.tagId);
  const res = await fetchWithAuth(`/api/forum/channels/${channelId}/threads?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch threads");
  return res.json();
}

export async function createForumThread(channelId: string, data: { title: string; content: string; tagIds?: string[] }): Promise<ForumThread> {
  const res = await fetchWithAuth(`/api/forum/channels/${channelId}/threads`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create thread");
  return res.json();
}

export async function updateForumThread(threadId: string, data: { title?: string; content?: string; tagIds?: string[] }): Promise<ForumThread> {
  const res = await fetchWithAuth(`/api/forum/threads/${threadId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update thread");
  return res.json();
}

export async function toggleThreadLike(threadId: string): Promise<{ liked: boolean }> {
  const res = await fetchWithAuth(`/api/forum/threads/${threadId}/like`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to toggle like");
  return res.json();
}

export async function getForumMessages(params: { channelId?: string; threadId?: string; search?: string; cursor?: string }): Promise<ForumMessage[]> {
  const query = new URLSearchParams();
  if (params.channelId) query.append("channelId", params.channelId);
  if (params.threadId) query.append("threadId", params.threadId);
  if (params.search) query.append("search", params.search);
  if (params.cursor) query.append("cursor", params.cursor);

  const res = await fetchWithAuth(`/api/forum/messages?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

export async function sendForumMessage(data: { content: string; channelId?: string; threadId?: string; parentMessageId?: string }): Promise<ForumMessage> {
  const res = await fetchWithAuth("/api/forum/messages", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}

export async function updateForumMessage(messageId: string, content: string): Promise<ForumMessage> {
  const res = await fetchWithAuth(`/api/forum/messages/${messageId}`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to update message");
  return res.json();
}

export async function toggleMessageLike(messageId: string): Promise<{ liked: boolean }> {
  const res = await fetchWithAuth(`/api/forum/messages/${messageId}/like`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to toggle like");
  return res.json();
}

export async function getForumTags(): Promise<ForumTag[]> {
  const res = await fetchWithAuth("/api/forum/tags");
  if (!res.ok) throw new Error("Failed to fetch tags");
  return res.json();
}

export async function createForumTag(data: { name: string; color?: string }): Promise<ForumTag> {
  const res = await fetchWithAuth("/api/forum/tags", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create tag");
  return res.json();
}

export async function deleteForumTag(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/forum/tags/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete tag");
}

export async function createForumCategory(name: string): Promise<ForumCategory> {
  const res = await fetchWithAuth("/api/forum/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to create category");
  return res.json();
}

export async function updateForumCategory(id: string, data: { name?: string; position?: number }): Promise<ForumCategory> {
  const res = await fetchWithAuth(`/api/forum/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update category");
  return res.json();
}

export async function deleteForumCategory(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/forum/categories/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete category");
}

export async function createForumChannel(data: { name: string; description?: string; type: string; categoryId: string; position?: number }): Promise<ForumChannel> {
  const res = await fetchWithAuth("/api/forum/channels", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create channel");
  return res.json();
}

export async function updateForumChannel(id: string, data: { name?: string; description?: string; position?: number; categoryId?: string }): Promise<ForumChannel> {
  const res = await fetchWithAuth(`/api/forum/channels/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update channel");
  return res.json();
}

export async function deleteForumChannel(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/forum/channels/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete channel");
}

export async function deleteForumThread(threadId: string): Promise<void> {
  const res = await fetchWithAuth(`/api/forum/threads/${threadId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete thread");
}

export async function deleteForumMessage(messageId: string): Promise<void> {
  const res = await fetchWithAuth(`/api/forum/messages/${messageId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete message");
}

export async function uploadFile(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || localStorage.getItem("token") : null;
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch("/api/upload", {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to upload file");
  }

  return res.json();
}

export async function logout(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("token"); // Legacy key cleanup
  }
}
