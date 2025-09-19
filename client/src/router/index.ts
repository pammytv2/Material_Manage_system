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
                component: () => import('@/views/uikit/Receive_mat_Page.vue')
            },
            {
                path: '/uikit/Receive_Detail/:receiveNumber',
                name: 'Receive_Detail',
                component: () => import('@/views/uikit/Receive.Detail_Page.vue')
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
