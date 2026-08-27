<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { api, ApiError, type Stats, type Template, type Workout } from '../api'
import AppShell from '../components/AppShell.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const stats = ref<Stats | null>(null)
const templates = ref<Template[]>([])
const active = ref<Workout | null>(null)
const error = ref('')
const starting = ref<string | null>(null)

onMounted(async () => {
  try {
    const [statsData, templateData, activeData] = await Promise.all([
      api.stats(),
      api.templates(),
      api.activeWorkout(),
    ])
    stats.value = statsData
    templates.value = templateData
    active.value = activeData.workout
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '加载失败'
  }
})

async function start(template: Template) {
  starting.value = template.id
  error.value = ''
  try {
    const workout = await api.startWorkout(
      template.name,
      template.exercises.map((item) => item.id),
    )
    await router.push(`/train/${workout.id}`)
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      const body = err.body as { workoutId?: string }
      if (body.workoutId) {
        await router.push(`/train/${body.workoutId}`)
        return
      }
    }
    error.value = err instanceof ApiError ? err.message : '没法开练'
  } finally {
    starting.value = null
  }
}

async function logout() {
  await auth.logout()
  await router.replace('/login')
}
</script>

<template>
  <AppShell>
    <header class="flex items-start justify-between gap-3">
      <div>
        <p class="text-sm text-mute">你好，{{ auth.user?.name }}</p>
        <h1 class="mt-1 text-3xl font-black">今天练什么</h1>
      </div>
      <button class="text-xs text-mute" type="button" @click="logout">退出</button>
    </header>

    <section class="mt-6 grid grid-cols-2 gap-3">
      <div class="rounded-3xl border border-line bg-panel p-4">
        <p class="text-xs text-mute">本周已练</p>
        <p class="tabular mt-2 font-mono text-4xl font-bold text-acid">{{ stats?.workoutsThisWeek ?? '—' }}</p>
        <p class="mt-1 text-xs text-mute">场</p>
      </div>
      <div class="rounded-3xl border border-line bg-panel p-4">
        <p class="text-xs text-mute">累计</p>
        <p class="tabular mt-2 font-mono text-4xl font-bold">{{ stats?.totalWorkouts ?? '—' }}</p>
        <p class="mt-1 text-xs text-mute">场训练</p>
      </div>
    </section>

    <div
      v-if="active"
      class="mt-6 rounded-3xl border border-acid/40 bg-acid/10 p-4"
    >
      <p class="text-xs text-acid">进行中</p>
      <p class="mt-1 text-lg font-bold">{{ active.title }}</p>
      <p class="mt-1 text-xs text-mute">已记 {{ active.setCount }} 组</p>
      <RouterLink
        :to="`/train/${active.id}`"
        class="mt-3 flex h-11 items-center justify-center rounded-2xl bg-acid font-bold text-void"
      >
        继续这场
      </RouterLink>
    </div>

    <h2 class="mt-8 text-sm font-medium text-mute">模板开练</h2>
    <p v-if="error" class="mt-2 text-sm text-heat">{{ error }}</p>
    <ul class="mt-3 space-y-3">
      <li v-for="template in templates" :key="template.id">
        <button
          type="button"
          class="w-full rounded-3xl border border-line bg-panel p-4 text-left disabled:opacity-60"
          :disabled="Boolean(starting)"
          @click="start(template)"
        >
          <div class="flex items-center justify-between">
            <p class="text-lg font-bold">{{ template.name }}</p>
            <span class="font-mono text-xs text-acid">{{ starting === template.id ? '…' : 'GO' }}</span>
          </div>
          <p class="mt-1 text-sm text-mute">{{ template.blurb }}</p>
          <p class="mt-3 text-xs text-mute">
            {{ template.exercises.map((item) => item.name).join(' · ') }}
          </p>
        </button>
      </li>
    </ul>
  </AppShell>
</template>
