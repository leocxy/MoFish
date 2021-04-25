import { createRouter, createWebHashHistory, createWebHistory, RouteRecordRaw } from 'vue-router'
import Novel from '../views/Novel.vue'

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'Novel',
        component: Novel
    },
    {
        path: '/novel',
        name: 'Novel',
        component: Novel
    },
    {
        path: '/touchBar',
        name: 'TouchBar',
        component: () => import('../views/TouchBar.vue')
    },
    {
        path: '/setting',
        name: 'Setting',
        component: () => import(/* webpackChunkName: "setting" */ '../views/Setting.vue')
    },
    {
        path: '/search',
        name: 'Search',
        component: () => import(/* webpackChunkName: "search" */ '../views/Search.vue')
    }
]

const router = createRouter({
    history: process.env.IS_ELECTRON ? createWebHashHistory() : createWebHistory(),
    routes
})

export default router
