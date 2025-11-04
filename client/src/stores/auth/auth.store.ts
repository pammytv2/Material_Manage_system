import { defineStore } from 'pinia';
import { Permission, Role, UserPermissions, MenuPermission } from '@/interfaces/auth.interfaces';
import type { IViewEmployee } from '@/shared/interfaces/template-web-stack-2025/employee.interface';
import { useMainStore } from '@/stores/main.store';


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
        console.log('requiredPermissions:', menuPermission.requiredPermissions); // เพิ่มบรรทัดนี้
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
        console.log('requiredSeccd:', menuPermission.requiredSeccd); // เพิ่มบรรทัดนี้
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
          requiredSeccd: ['2130', '3110', '3300'], // ทุก SECCD เข้าได้
        },
        {
          menuId: 'production',
          requiredPermissions: ['view_production'],
          requiredSeccd: ['2130', '3100', '3410', '3500', '3700', '3800', '3830', '3900'], // ทุก SECCD เข้าได้
        },
        {
          menuId: 'manage_material',
          requiredPermissions: ['manage_material'],
          requiredSeccd: ['2130', '3110'], // Admin และ MC เข้าได้
        },
        {
          menuId: 'receive_material',
          requiredPermissions: ['receive_material'],
          requiredSeccd: ['2130', '3110'], // Admin และ MC เข้าได้
        },
        {
          menuId: 'split_material',
          requiredPermissions: ['split_material'],
          requiredSeccd: ['2130', '3110'], // Admin และ MC เข้าได้
        },
        {
          menuId: 'iqa_checklist',
          requiredPermissions: ['iqa_check'],
          requiredSeccd: ['2130', '3300'], // Admin และ IQA เข้าได้
        },
        {
          menuId: 'admin_panel',
          requiredPermissions: [],
          requiredSeccd: ['2130'], // Admin เท่านั้น
        },
        {
          menuId: 'mc_group',
          requiredPermissions: ['manage_material'],
          requiredSeccd: ['2130', '3110'], // Admin และ MC เข้าได้
        },
        {
          menuId: 'iqa_group',
          requiredPermissions: ['iqa_check'],
          requiredSeccd: ['2130', '3300'], // Admin และ IQA เข้าได้
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
          id: 'production',
          name: 'Production',
          permissions: ['view_dashboard', 'view_production'],
        },
        {
          id: 'iqa_checker',
          name: 'IQA Checker',
          permissions: ['view_dashboard', 'iqa_check'],
        },
      ];
    },

   
  },
});