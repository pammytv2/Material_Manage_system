import { defineStore } from 'pinia';
import { Permission, Role, UserPermissions, MenuPermission } from '@/interfaces/auth.interfaces';

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    userPermissions: null as UserPermissions | null,
    roles: [] as Role[],
    permissions: [] as Permission[],
    menuPermissions: [] as MenuPermission[],
  }),

  getters: {
    hasPermission: (state) => (permissionId: string): boolean => {
      if (!state.userPermissions) return false;
      return state.userPermissions.permissions.includes(permissionId);
    },

    hasRole: (state) => (roleId: string): boolean => {
      if (!state.userPermissions) return false;
      return state.userPermissions.roles.includes(roleId);
    },

    hasSeccd: (state) => (seccd: string): boolean => {
      if (!state.userPermissions) return false;
      return state.userPermissions.seccd === seccd;
    },

    canAccessMenu: (state) => (menuId: string): boolean => {
      if (!state.userPermissions) return false;
      
      const menuPermission = state.menuPermissions.find(mp => mp.menuId === menuId);
      if (!menuPermission) return true; // ถ้าไม่กำหนดสิทธิ์ให้เข้าได้

      // ตรวจสอบ permissions
      if (menuPermission.requiredPermissions.length > 0) {
        const hasRequiredPermission = menuPermission.requiredPermissions.some(
          permission => state.userPermissions!.permissions.includes(permission)
        );
        if (!hasRequiredPermission) return false;
      }

      // ตรวจสอบ roles
      if (menuPermission.requiredRoles && menuPermission.requiredRoles.length > 0) {
        const hasRequiredRole = menuPermission.requiredRoles.some(
          role => state.userPermissions!.roles.includes(role)
        );
        if (!hasRequiredRole) return false;
      }

      // ตรวจสอบ SECCD
      if (menuPermission.requiredSeccd && menuPermission.requiredSeccd.length > 0) {
        const hasRequiredSeccd = menuPermission.requiredSeccd.includes(state.userPermissions!.seccd);
        if (!hasRequiredSeccd) return false;
      }

      return true;
    },
  },

  actions: {
    setUserPermissions(userPermissions: UserPermissions) {
      this.userPermissions = userPermissions;
    },

    initializePermissions() {
      // กำหนดสิทธิ์เมนูต่างๆ
      this.menuPermissions = [
        {
          menuId: 'dashboard',
          requiredPermissions: ['view_dashboard'],
        },
        {
          menuId: 'manage_material',
          requiredPermissions: ['manage_material'],
          requiredSeccd: ['2130', '2120'],
        },
        {
          menuId: 'receive_material',
          requiredPermissions: ['receive_material'],
        },
        {
          menuId: 'split_material',
          requiredPermissions: ['split_material'],
          requiredRoles: ['admin', 'manager'],
        },
        {
          menuId: 'iqa_checklist',
          requiredPermissions: ['iqa_check'],
          requiredSeccd: ['3110', '3230'],
        },
        {
          menuId: 'admin_panel',
          requiredPermissions: [],
          requiredRoles: ['admin'],
        },
      ];

      // กำหนด roles และ permissions
      this.roles = [
        {
          id: 'admin',
          name: 'Administrator',
          permissions: ['*'], // ทุกสิทธิ์
        },
        {
          id: 'manager',
          name: 'Manager',
          permissions: ['view_dashboard', 'manage_material', 'receive_material', 'split_material'],
        },
        {
          id: 'user',
          name: 'User',
          permissions: ['view_dashboard', 'receive_material'],
        },
        {
          id: 'iqa_checker',
          name: 'IQA Checker',
          permissions: ['view_dashboard', 'iqa_check'],
        },
      ];
    },

    async loadUserPermissions(userId: string) {
      try {
        // เรียก API เพื่อดึงสิทธิ์ของ user
        // const response = await api.get(`/users/${userId}/permissions`);
        
        // ตัวอย่างข้อมูลจำลอง - ในการใช้งานจริงให้ดึงจาก API
        const mockUserPermissions: UserPermissions = {
          userId: userId,
          roles: ['user'],
          permissions: ['view_dashboard', 'receive_material'],
          seccd: '2130',
        };

        this.setUserPermissions(mockUserPermissions);
      } catch (error) {
        console.error('Error loading user permissions:', error);
      }
    },
  },
});