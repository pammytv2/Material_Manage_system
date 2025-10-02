import AppLayout from '@/layout/AppLayout.vue';
import { RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        component: AppLayout,
        children: [
            {
                path: '/',
                name: 'dashboard',
                component: () => import('@/views/Dashboard.vue')
            },

            {
                path: '/uikit/tree',
                name: 'tree',
                component: () => import('@/views/uikit/TreeDoc.vue')
            },
            {
                path: '/uikit/Receive_Page',
                name: 'Receive_Page',
                component: () => import('@/views/Receice/Receive_mat_Page.vue')
            },
            {
                path: '/uikit/Receive_Detail/:receiveNumber',
                name: 'Receive_Detail',
                component: () => import('@/views/Receice/Receive.Detail_Page.vue')
            },
            {
                path: '/receive-manual',
                name: 'ReceiveManual',
                component: () => import('@/views/Receice_Manual/Receive.Manual_Page.vue')
            },
            {
                path: '/materials-split',
                name: 'MaterialsSplit',
                component: () => import('@/views/Split_Materials/Materials.Split_Page.vue')

            },
            {
                path: '/materials-split-detail/:receiveNumber',
                name: 'MaterialsSplitDetail',
                component: () => import('@/views/Split_Materials/Materials.Split_Delail_Page.vue')

            },
            {
                path: '/manual-receive-list',
                name: 'ManualReceiveList',
                component: () => import('@/views/Receice_Manual/Manual.Receive.List_Page.vue')
            },
            {
                path: '/manage-material',
                name: 'ManageMaterial',
                component: () => import('@/views/Manage_Material/Manage.Material_Page.vue')

            },

        

            {
                path: '/documentation',
                name: 'documentation',
                component: () => import('@/views/pages/Documentation.vue')
            }
        ]
    },
    {
        path: '/landing',
        name: 'landing',
        component: () => import('@/views/pages/Landing.vue')
    },
    {
        path: '/pages/notfound',
        name: 'notfound',
        component: () => import('@/views/pages/NotFound.vue')
    },
    {
        path: '/auth/error',
        name: 'error',
        component: () => import('@/views/pages/auth/Error.vue')
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

export default router;
