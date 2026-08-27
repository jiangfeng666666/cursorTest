import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api, type User } from '../api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const ready = ref(false)

  const isLoggedIn = computed(() => Boolean(user.value))

  async function hydrate() {
    try {
      user.value = await api.me()
    } catch {
      user.value = null
    } finally {
      ready.value = true
    }
  }

  async function login(email: string, password: string) {
    user.value = await api.login(email, password)
  }

  async function register(payload: { email: string; name: string; password: string }) {
    user.value = await api.register(payload)
  }

  async function logout() {
    await api.logout()
    user.value = null
  }

  return { user, ready, isLoggedIn, hydrate, login, register, logout }
})
