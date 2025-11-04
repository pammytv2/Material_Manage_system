export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  seccd?: string;
}

export interface MenuPermission {
  menuId: string;
  requiredPermissions: string[];
  requiredRoles?: string[];
  requiredSeccd?: string[];
}

export interface UserPermissions {
  userId: string;
  roles: string[];
  permissions: string[];
  seccd: string;
}