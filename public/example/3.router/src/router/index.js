import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from '@/vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'

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
    children: [
      {
        path: 'a',
        name: 'a',
        component: AboutView,
      },
      {
        path: 'b',
        name: 'b',
        component: AboutView,
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
