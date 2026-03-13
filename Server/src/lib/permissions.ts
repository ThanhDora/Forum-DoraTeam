/**
 * Permission bitfield constants inspired by Discord.
 * Using BigInt to support more than 31 permissions safely.
 */
export const Permissions = {
  ADMINISTRATOR: 1n << 0n,
  MANAGE_SERVER: 1n << 1n,   // Manage site settings
  MANAGE_ROLES: 1n << 2n,
  MANAGE_CHANNELS: 1n << 3n, // Manage categories
  MANAGE_MESSAGES: 1n << 4n,
  KICK_MEMBERS: 1n << 5n,
  BAN_MEMBERS: 1n << 6n,
  CREATE_TUTORIAL: 1n << 7n,
  EDIT_TUTORIAL: 1n << 8n,
  DELETE_TUTORIAL: 1n << 9n,
  VIEW_AUDIT_LOG: 1n << 10n,
  MANAGE_USERS: 1n << 11n,
};

/**
 * Checks if a user has a specific permission.
 * @param userPermissions The combined permissions of the user (as BigInt or string)
 * @param requiredPermission The permission to check for
 * @returns boolean
 */
export function hasPermission(
  userPermissions: bigint | string,
  requiredPermission: bigint
): boolean {
  const perms = typeof userPermissions === "string" ? BigInt(userPermissions) : userPermissions;
  
  // Administrator permission overrides everything
  if ((perms & Permissions.ADMINISTRATOR) === Permissions.ADMINISTRATOR) {
    return true;
  }
  
  return (perms & requiredPermission) === requiredPermission;
}

/**
 * Combines multiple permission bitfields into one.
 * @param permissionsList List of permissions
 * @returns bigint
 */
export function combinePermissions(permissionsList: (bigint | string)[]): bigint {
  return permissionsList.reduce((acc: bigint, curr) => {
    const val = typeof curr === "string" ? BigInt(curr) : curr;
    return acc | val;
  }, 0n);
}

/**
 * Returns an array of permission names that are present in the bitfield.
 */
export function getPermissionNames(bitfield: bigint | string): string[] {
  const perms = typeof bitfield === "string" ? BigInt(bitfield) : bitfield;
  const names: string[] = [];
  
  for (const [name, value] of Object.entries(Permissions)) {
    if ((perms & value) === value) {
      names.push(name);
    }
  }
  
  return names;
}

/**
 * Fetches and combines all permissions for a user.
 */
export async function getUserPermissions(userId: string, prisma: any): Promise<bigint> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true }
  });

  if (!user) return 0n;

  // Handle legacy superadmin role
  if (user.role === "superadmin") return Permissions.ADMINISTRATOR;

  const rolePermissions = user.roles.map((r: any) => r.permissions);
  return combinePermissions(rolePermissions);
}
