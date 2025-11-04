<script lang="ts" setup>
import { ref, onMounted,computed} from 'vue';

import AppMenuItem from './AppMenuItem.vue';
import { useReceiveStore } from '@/stores/receive';
import { usePermissionStore } from '@/stores/auth/auth.store';
import { useMainStore } from '@/stores/main.store';
import { Permission } from '../interfaces/auth.interfaces';

const permissionStore = usePermissionStore();
const mainStore = useMainStore();
// Define proper types for menu items
interface MenuItem {
    label: string;
    items?: MenuItem[];
    icon?: string;
    to?: string;
    url?: string;
    target?: string;
    class?: string;
    separator?: boolean;
    badge?: any;
    menuId?: string;
}
const receiveStore = useReceiveStore();

const nullItemCount = ref<any>(0);

onMounted(async () => {
    // Initialize permissions
    permissionStore.initializePermissions();
    
    // Get user data and set permissions
    await mainStore.getUserData();
    const userInfo = mainStore._userInfo;
    
    // Set user permissions based on SECCD
    permissionStore.setUserPermissions({
        userId: userInfo.ID,
        permissions: getUserPermissionsBySeccd(String(userInfo.SECCD)),
        roles: getUserRolesBySeccd(String(userInfo.SECCD)),
        seccd: String(userInfo.SECCD)
    });
    
    console.log('User SECCD:', userInfo.SECCD);
    console.log('User permissions set');
    
    const data = await receiveStore.fetchGetItem();
    
    // สมมติ data = [{ NullItemCount: 8 }]
    if (Array.isArray(data) && data.length > 0 && typeof data[0].NullItemCount === 'number') {
        nullItemCount.value = data[0].NullItemCount;
    } else {
        nullItemCount.value = 0;
    }
    console.log('NullItemCount1:', nullItemCount.value);
});

// Helper functions to map SECCD to permissions and roles
function getUserPermissionsBySeccd(seccd: string): string[] {
    switch (seccd) {
        case '2130': // Admin
            return ['view_dashboard','view_production' ,'manage_material', 'receive_material', 'split_material', 'iqa_check'];
        case '3110': // MC
            return ['view_dashboard', 'manage_material', 'receive_material', 'split_material'];
        case '3300': // IQA
            return ['view_dashboard', 'iqa_check'];
        case '3100':
        case '3410':
        case '3500':
        case '3700':
        case '3800':
        case '3830':
        case '3900': // Production
            return ['view_dashboard', 'view_production'];
        default:
            return ['view_dashboard'];
    }
}

function getUserRolesBySeccd(seccd: string): string[] {
    switch (seccd) {
        case '2130': // Admin
            return ['admin'];
        case '3110': // MC
            return ['manager'];
        case '3300': // IQA
            return ['iqa_checker'];
        case '3100':
        case '3410':
        case '3500':
        case '3700':
        case '3800':
        case '3830':
        case '3900': // Production
            return ['production'];
        default:
            return ['user'];
    }
}





const model = computed<MenuItem[]>(() => [
    {
        label: 'Home',
        items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/', menuId: 'dashboard' }]
    },
    {
        label: 'Products',
        menuId: 'production',
        items: [
            { label: 'Request Material', icon: 'pi pi-fw pi-box', to: '/uikit/formlayout' },
            { label: 'Return Material', icon: 'pi pi-fw pi-undo', to: '/uikit/input' }

        ]
    },
    {
        label: 'MC',
        icon: 'pi pi-fw pi-briefcase',
        to: '/pages',
        menuId: 'mc_group',
        items: [
            { label: 'Manage Material',
             icon: 'pi pi-fw pi-cog', 
             to: '/manage-material',
             badge: nullItemCount,
             menuId: 'manage_material'
            },
            {
                label: 'Receive Material',
                icon: 'pi pi-fw pi-download',
                to: '/uikit/Receive_Page',
                menuId: 'receive_material'
            },
            {
                label: 'Manual Receive ',
                icon: 'pi pi-fw pi-list',
                to: '/manual-receive-list'
            },
            {
                label: ' Material Split',
                icon: 'pi pi-fw pi-share-alt',
                to: '/materials-split',
                menuId: 'split_material'
            },
            {
                label: 'Material IQA Status',
                icon: 'pi pi-fw pi-database',
                to: '/Mc_view_iqa'
            },
            {
                label: 'Return Material',
                icon: 'pi pi-fw pi-upload',
                to: '/documentation'
            },
            {
                label: 'Print Receive Material',
                icon: 'pi pi-fw pi-print',
                to: '/documentation'
            }
        ]
    },
    {
        label: 'IQA',
        menuId: 'iqa_group',
        items: [ 
            {
                label: 'Check Material Receive',
                icon: 'pi pi-fw pi-list-check',
                to: '/Iqa_checklist',
                menuId: 'iqa_checklist'
            },
            {
                label: 'IQA Checklist Material',
                icon: 'pi pi-fw pi-check-square',
                to: '/Iqa_checklist_test'
            }
        ]
    },
    {
        label: 'Get Started',
        items: [
            {
                label: 'Documentation',
                icon: 'pi pi-fw pi-book',
                to: '/documentation'
            },
            {
                label: 'View Source',
                icon: 'pi pi-fw pi-github',
                url: 'https://github.com/primefaces/sakai-vue',
                target: '_blank'
            }
        ]
    },
    // Adding a separator item example
    {
        separator: true,
        label: 'Separator'
    }
]);

function filterMenu(items: MenuItem[]): MenuItem[] {
    return items
        .filter(item => {
            if (item.separator) return true;
            
            // ถ้ามี menuId ให้เช็คสิทธิ์
            if (item.menuId) {
                const canAccess = permissionStore.canAccessMenu(item.menuId);
                console.log(`Menu ${item.menuId} access:`, canAccess);
                return canAccess;
            }
            
            // ถ้าไม่มี menuId แต่มี items ให้เช็คว่ามี items ที่เข้าได้หรือไม่
            if (item.items && item.items.length > 0) {
                const filteredItems = filterMenu(item.items);
                return filteredItems.length > 0;
            }
            
            return true;
        })
        .map(item => ({
            ...item,
            items: item.items ? filterMenu(item.items) : undefined
        }))
        .filter(item => {
            // กรองเมนูที่ไม่มี items อีกรอบ
            if (item.items && item.items.length === 0) return false;
            return true;
        });
}
const filteredModel = computed(() => filterMenu(model.value));

</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in filteredModel" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
