import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api, clearToken, setToken, type User } from '../utils/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const ready = ref(false)
  let pending: Promise<void> | null = null

  const isLoggedIn = computed(() => Boolean(user.value))

  async function hydrate() {
    if (pending) return pending
    pending = (async () => {
      try {
        user.value = await api.me()
      } catch {
        user.value = null
        clearToken()
      } finally {
        ready.value = true
      }
    })()
    return pending
  }

  async function login(email: string, password: string) {
    const data = await api.login(email, password)
    if (data.token) setToken(data.token)
    user.value = { id: data.id, email: data.email, name: data.name }
  }

  async function register(payload: { email: string; name: string; password: string }) {
    const data = await api.register(payload)
    if (data.token) setToken(data.token)
    user.value = { id: data.id, email: data.email, name: data.name }
  }

  async function logout() {
    try {
      await api.logout()
    } catch {
      // token 清掉即可
    }
    clearToken()
    user.value = null
  }

  async function requireLogin() {
    await hydrate()
    if (!user.value) {
      uni.reLaunch({ url: '/pages/login/login' })
      return false
    }
    return true
  }

  return { user, ready, isLoggedIn, hydrate, login, register, logout, requireLogin }
})
