import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      component: () => import('./views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      component: () => import('./views/RegisterView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('./views/HomeView.vue'),
    },
    {
      path: '/train/:id',
      component: () => import('./views/TrainView.vue'),
    },
    {
      path: '/history',
      component: () => import('./views/HistoryView.vue'),
    },
    {
      path: '/history/:id',
      component: () => import('./views/HistoryDetailView.vue'),
    },
    {
      path: '/progress',
      component: () => import('./views/ProgressView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.ready) await auth.hydrate()
  if (to.meta.public) {
    if (auth.isLoggedIn) return { path: '/' }
    return true
  }
  if (!auth.isLoggedIn) return { path: '/login', query: { redirect: to.fullPath } }
  return true
})

export default router
