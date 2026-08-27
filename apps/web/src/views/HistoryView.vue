<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api, type WorkoutSummary } from '../api'
import AppShell from '../components/AppShell.vue'

const workouts = ref<WorkoutSummary[]>([])

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

onMounted(async () => {
  workouts.value = await api.workouts()
})
</script>

<template>
  <AppShell>
    <h1 class="text-3xl font-black">训练本</h1>
    <p class="mt-1 text-sm text-mute">练完的场次会落在这里。</p>

    <ul v-if="workouts.length" class="mt-6 space-y-3">
      <li v-for="item in workouts" :key="item.id">
        <RouterLink
          :to="`/history/${item.id}`"
          class="block rounded-3xl border border-line bg-panel p-4"
        >
          <div class="flex items-center justify-between">
            <p class="font-bold">{{ item.title }}</p>
            <p class="font-mono text-xs text-acid">{{ Math.round(item.volume) }}kg</p>
          </div>
          <p class="mt-2 text-xs text-mute">{{ formatDate(item.startedAt) }} · {{ item.setCount }} 组</p>
        </RouterLink>
      </li>
    </ul>
    <p v-else class="mt-10 text-sm text-mute">还没有结束的训练。去「今天」开一场。</p>
  </AppShell>
</template>
