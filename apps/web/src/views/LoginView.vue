<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ApiError } from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('demo@kailian.app')
const password = ref('demo1234')
const error = ref('')
const loading = ref(false)

const redirect = computed(() => {
  const value = route.query.redirect
  return typeof value === 'string' ? value : '/'
})

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    await router.replace(redirect.value)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-svh flex-col justify-between px-6 py-10">
    <div>
      <p class="font-mono text-xs tracking-[0.3em] text-acid">KAILIAN</p>
      <h1 class="mt-4 text-5xl font-black leading-none">开练</h1>
      <p class="mt-3 max-w-[16rem] text-sm leading-6 text-mute">把每一组重量和次数留下来。健身房里大按钮，回家再看曲线。</p>
    </div>

    <form class="space-y-4" @submit.prevent="submit">
      <label class="block">
        <span class="mb-1 block text-xs text-mute">邮箱</span>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          class="h-12 w-full rounded-2xl border border-line bg-panel px-4 text-ink outline-none focus:border-acid"
        />
      </label>
      <label class="block">
        <span class="mb-1 block text-xs text-mute">密码</span>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          class="h-12 w-full rounded-2xl border border-line bg-panel px-4 text-ink outline-none focus:border-acid"
        />
      </label>
      <p v-if="error" class="text-sm text-heat">{{ error }}</p>
      <button
        type="submit"
        class="h-12 w-full rounded-2xl bg-acid text-base font-bold text-void disabled:opacity-60"
        :disabled="loading"
      >
        {{ loading ? '正在进场…' : '进场' }}
      </button>
      <p class="text-center text-sm text-mute">
        还没有号？
        <RouterLink to="/register" class="text-ink underline decoration-line">注册</RouterLink>
      </p>
      <p class="text-center text-xs text-mute">演示账号已填好，直接进场即可。</p>
    </form>
  </div>
</template>
