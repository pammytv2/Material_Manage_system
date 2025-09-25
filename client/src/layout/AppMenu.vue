<script lang="ts" setup>
import { ref } from 'vue';

import AppMenuItem from './AppMenuItem.vue';

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
}

const model = ref<MenuItem[]>([
    {
        label: 'Home',
        items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }]
    },
    {
        label: 'Products',
        items: [
            { label: 'Request Material', icon: 'pi pi-fw pi-box', to: '/uikit/formlayout' },
            { label: 'Return Material', icon: 'pi pi-fw pi-undo', to: '/uikit/input' }
        ]
    },
    {
        label: 'MC',
        icon: 'pi pi-fw pi-briefcase',
        to: '/pages',
        items: [
            { label: 'Manage Material', icon: 'pi pi-fw pi-cog', to: '/manage-material' },
            {
                label: 'Receive Material',
                icon: 'pi pi-fw pi-download', // รับวัสดุ
                to: '/uikit/Receive_Page'
            },

            {
                label: 'Manual Receive ',
                icon: 'pi pi-fw pi-list', // รายการรับวัสดุ Manual
                to: '/manual-receive-list'
            },
            {
                label: ' Material Split',
                icon: 'pi pi-fw pi-share-alt', // แยกวัสดุ
                to: '/materials-split'
            },
            {
                label: 'Return Material',
                icon: 'pi pi-fw pi-upload', // คืนวัสดุ
                to: '/documentation'
            },
            {
                label: 'Print Receive Material',
                icon: 'pi pi-fw pi-print', // พิมพ์ใบรับวัสดุ
                to: '/documentation'
            }
        ]
    },
    {
        label: 'IQA',
        items: [
            {
                label: 'IQA Checklist Material',
                icon: 'pi pi-fw pi-list-check', // รายการตรวจสอบ
                to: '/documentation'
            },
            {
                label: 'Check Material Receive',
                icon: 'pi pi-fw pi-check-square', // ตรวจสอบการรับวัสดุ
                to: '/documentation'
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
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
