import { createRouter, createWebHistory } from '@/vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import MyView from '../views/MyView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
  },
  {
    path: '/my',
    name: 'my',
    component: MyView,
    children: [
      {
        path: 'a',
        name: 'mya',
        component: { render: () => <a>a页面</a> },
      },
      {
        path: 'b',
        name: 'myb',
        component: { render: () => <a>b页面</a> },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
