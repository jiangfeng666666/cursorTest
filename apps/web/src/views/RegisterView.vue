<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ApiError } from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.register({ name: name.value, email: email.value, password: password.value })
    await router.replace('/')
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '注册失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-svh flex-col px-6 py-10">
    <RouterLink to="/login" class="text-sm text-mute">← 返回</RouterLink>
    <h1 class="mt-8 text-3xl font-black">建一个训练本</h1>
    <p class="mt-2 text-sm text-mute">邮箱只用来登录，不会发营销信。</p>

    <form class="mt-8 space-y-4" @submit.prevent="submit">
      <label class="block">
        <span class="mb-1 block text-xs text-mute">怎么称呼你</span>
        <input
          v-model="name"
          required
          class="h-12 w-full rounded-2xl border border-line bg-panel px-4 outline-none focus:border-acid"
        />
      </label>
      <label class="block">
        <span class="mb-1 block text-xs text-mute">邮箱</span>
        <input
          v-model="email"
          type="email"
          required
          class="h-12 w-full rounded-2xl border border-line bg-panel px-4 outline-none focus:border-acid"
        />
      </label>
      <label class="block">
        <span class="mb-1 block text-xs text-mute">密码（至少 6 位）</span>
        <input
          v-model="password"
          type="password"
          required
          minlength="6"
          class="h-12 w-full rounded-2xl border border-line bg-panel px-4 outline-none focus:border-acid"
        />
      </label>
      <p v-if="error" class="text-sm text-heat">{{ error }}</p>
      <button
        class="h-12 w-full rounded-2xl bg-acid font-bold text-void disabled:opacity-60"
        :disabled="loading"
      >
        {{ loading ? '创建中…' : '开始记训练' }}
      </button>
    </form>
  </div>
</template>
