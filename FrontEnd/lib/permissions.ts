/**
 * Permission bitfield constants inspired by Discord.
 */
export const Permissions = {
  ADMINISTRATOR: 1n << 0n,
  MANAGE_SERVER: 1n << 1n,
  MANAGE_ROLES: 1n << 2n,
  MANAGE_CHANNELS: 1n << 3n,
  MANAGE_MESSAGES: 1n << 4n,
  KICK_MEMBERS: 1n << 5n,
  BAN_MEMBERS: 1n << 6n,
  CREATE_TUTORIAL: 1n << 7n,
  EDIT_TUTORIAL: 1n << 8n,
  DELETE_TUTORIAL: 1n << 9n,
  VIEW_AUDIT_LOG: 1n << 10n,
  MANAGE_USERS: 1n << 11n,
  MANAGE_FORUM: 1n << 12n,
};

export type PermissionName = keyof typeof Permissions;

export const PermissionLabels: Record<PermissionName, { name: string; description: string }> = {
  ADMINISTRATOR: { name: "Quản trị viên", description: "Cấp toàn quyền quản trị, bỏ qua tất cả các hạn chế khác." },
  MANAGE_SERVER: { name: "Quản lý máy chủ", description: "Cho phép thay đổi cài đặt và thông tin cơ bản của hệ thống." },
  MANAGE_ROLES: { name: "Quản lý vai trò", description: "Cho phép tạo, xóa và chỉnh sửa các vai trò thấp hơn vai trò này." },
  MANAGE_CHANNELS: { name: "Quản lý chuyên mục", description: "Cho phép tạo, xóa và sửa các chuyên mục nội dung." },
  MANAGE_MESSAGES: { name: "Quản lý tin nhắn", description: "Cho phép xóa tin nhắn của người dùng khác hoặc ghim tin nhắn." },
  KICK_MEMBERS: { name: "Trục xuất thành viên", description: "Cho phép trục xuất thành viên ra khỏi hệ thống." },
  BAN_MEMBERS: { name: "Cấm thành viên", description: "Cho phép cấm vĩnh viễn thành viên truy cập hệ thống." },
  CREATE_TUTORIAL: { name: "Tạo bài hướng dẫn", description: "Cho phép tạo các bài hướng dẫn mới trong kho lưu trữ." },
  EDIT_TUTORIAL: { name: "Sửa bài hướng dẫn", description: "Cho phép chỉnh sửa các bài hướng dẫn hiện có." },
  DELETE_TUTORIAL: { name: "Xóa bài hướng dẫn", description: "Cho phép xóa các bài hướng dẫn khỏi hệ thống." },
  VIEW_AUDIT_LOG: { name: "Xem nhật ký hệ thống", description: "Cho phép xem các bản ghi hoạt động của các quản trị viên khác." },
  MANAGE_USERS: { name: "Quản lý người dùng", description: "Cho phép thay đổi thông tin và quyền hạn của người dùng." },
  MANAGE_FORUM: { name: "Quản lý diễn đàn", description: "Cho phép quản lý các bài viết và bình luận trên toàn diễn đàn." },
};

export function hasPermission(
  userPermissions: bigint | string,
  requiredPermission: bigint
): boolean {
  const perms = typeof userPermissions === "string" ? BigInt(userPermissions) : userPermissions;
  if ((perms & Permissions.ADMINISTRATOR) === Permissions.ADMINISTRATOR) return true;
  return (perms & requiredPermission) === requiredPermission;
}

export function getPermissionNames(bitfield: bigint | string): PermissionName[] {
  const perms = typeof bitfield === "string" ? BigInt(bitfield) : bitfield;
  const names: PermissionName[] = [];
  for (const [name, value] of Object.entries(Permissions)) {
    if ((perms & value) === value) {
      names.push(name as PermissionName);
    }
  }
  return names;
}
