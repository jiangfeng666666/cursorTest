<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { api, type Workout } from '../api'

const route = useRoute()
const workout = ref<Workout | null>(null)

const id = computed(() => String(route.params.id))

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

onMounted(async () => {
  workout.value = await api.workout(id.value)
})
</script>

<template>
  <div class="min-h-svh px-5 pb-10 pt-6">
    <RouterLink to="/history" class="text-sm text-mute">← 训练本</RouterLink>
    <h1 class="mt-4 text-3xl font-black">{{ workout?.title }}</h1>
    <p class="mt-2 text-sm text-mute">
      {{ workout ? formatDate(workout.startedAt) : '' }}
    </p>
    <p class="mt-1 font-mono text-sm text-acid">
      {{ workout?.setCount }} 组 · {{ Math.round(workout?.volume ?? 0) }} kg
    </p>

    <section v-for="exercise in workout?.exercises ?? []" :key="exercise.id" class="mt-6">
      <h2 class="text-lg font-bold">{{ exercise.name }}</h2>
      <ol class="mt-2 space-y-2">
        <li
          v-for="set in exercise.sets"
          :key="set.id"
          class="flex items-center justify-between rounded-2xl border border-line bg-panel px-4 py-3"
        >
          <span class="text-sm text-mute">第 {{ set.setIndex }} 组</span>
          <span class="font-mono font-bold">{{ set.weightKg }} kg × {{ set.reps }}</span>
        </li>
        <li v-if="exercise.sets.length === 0" class="text-sm text-mute">这动作没记组</li>
      </ol>
    </section>
  </div>
</template>
