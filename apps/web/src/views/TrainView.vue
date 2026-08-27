<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { api, ApiError, type Exercise, type Workout, type WorkoutExercise } from '../api'
import Stepper from '../components/Stepper.vue'
import { useRestStore } from '../stores/rest'

const route = useRoute()
const router = useRouter()
const rest = useRestStore()

const workout = ref<Workout | null>(null)
const catalog = ref<Exercise[]>([])
const error = ref('')
const busy = ref(false)
const pickerOpen = ref(false)
const drafts = ref<Record<string, { weightKg: number; reps: number }>>({})

const id = computed(() => String(route.params.id))
const locked = computed(() => Boolean(workout.value?.finishedAt))

const available = computed(() => {
  const taken = new Set(workout.value?.exercises.map((item) => item.id) ?? [])
  return catalog.value.filter((item) => !taken.has(item.id))
})

function ensureDrafts(next: Workout) {
  for (const exercise of next.exercises) {
    if (!drafts.value[exercise.id]) {
      drafts.value[exercise.id] = {
        weightKg: exercise.last?.weightKg ?? 20,
        reps: exercise.last?.reps ?? 8,
      }
    }
  }
}

async function load() {
  const next = await api.workout(id.value)
  ensureDrafts(next)
  workout.value = next
}

onMounted(async () => {
  try {
    await load()
    catalog.value = await api.exercises()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '加载失败'
  }
})

async function completeSet(exercise: WorkoutExercise) {
  if (locked.value) return
  const draft = drafts.value[exercise.id]
  if (!draft) return
  busy.value = true
  error.value = ''
  try {
    const next = await api.logSet(id.value, {
      exerciseId: exercise.id,
      weightKg: draft.weightKg,
      reps: draft.reps,
    })
    ensureDrafts(next)
    workout.value = next
    rest.start(90)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '记组失败'
  } finally {
    busy.value = false
  }
}

async function addExercise(exerciseId: string) {
  busy.value = true
  error.value = ''
  try {
    const next = await api.addExercise(id.value, exerciseId)
    ensureDrafts(next)
    workout.value = next
    pickerOpen.value = false
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '加动作失败'
  } finally {
    busy.value = false
  }
}

async function finish() {
  if (!workout.value) return
  busy.value = true
  error.value = ''
  try {
    workout.value = await api.finishWorkout(workout.value.id)
    rest.skip()
    await router.replace(`/history/${workout.value.id}`)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '结束失败'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="flex min-h-svh flex-col px-5 pb-8 pt-6">
    <header class="flex items-center justify-between">
      <RouterLink to="/" class="text-sm text-mute">← 今天</RouterLink>
      <p class="text-xs text-mute">{{ locked ? '已结束' : '进行中' }}</p>
    </header>

    <h1 class="mt-4 text-3xl font-black">{{ workout?.title ?? '训练' }}</h1>
    <p class="mt-1 text-sm text-mute">
      {{ workout?.setCount ?? 0 }} 组 · 容量 {{ Math.round(workout?.volume ?? 0) }} kg
    </p>
    <p v-if="error" class="mt-3 text-sm text-heat">{{ error }}</p>

    <div
      v-if="rest.running"
      class="mt-5 flex items-center justify-between rounded-3xl bg-heat px-4 py-3 text-void"
    >
      <div>
        <p class="text-xs font-medium">休息</p>
        <p class="tabular font-mono text-3xl font-bold">{{ rest.label }}</p>
      </div>
      <div class="flex gap-2">
        <button type="button" class="rounded-xl bg-void/15 px-3 py-2 text-sm font-bold" @click="rest.add30">
          +30s
        </button>
        <button type="button" class="rounded-xl bg-void px-3 py-2 text-sm font-bold text-ink" @click="rest.skip">
          跳过
        </button>
      </div>
    </div>

    <ul class="mt-6 space-y-4">
      <li
        v-for="exercise in workout?.exercises ?? []"
        :key="exercise.id"
        class="rounded-3xl border border-line bg-panel p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-lg font-bold">{{ exercise.name }}</p>
            <p class="text-xs text-mute">{{ exercise.muscleGroup }} · {{ exercise.equipment }}</p>
          </div>
          <p v-if="exercise.last" class="text-right text-xs text-mute">
            上次<br />
            <span class="font-mono text-ink">{{ exercise.last.weightKg }}kg × {{ exercise.last.reps }}</span>
          </p>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="set in exercise.sets"
            :key="set.id"
            class="rounded-full border border-line px-3 py-1 font-mono text-xs"
          >
            {{ set.setIndex }} · {{ set.weightKg }}×{{ set.reps }}
          </span>
          <span v-if="exercise.sets.length === 0" class="text-xs text-mute">还没记组</span>
        </div>

        <template v-if="!locked && drafts[exercise.id]">
          <div class="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p class="mb-1 text-xs text-mute">重量</p>
              <Stepper v-model="drafts[exercise.id].weightKg" :step="2.5" suffix="kg" />
            </div>
            <div>
              <p class="mb-1 text-xs text-mute">次数</p>
              <Stepper v-model="drafts[exercise.id].reps" :step="1" :min="1" suffix="次" />
            </div>
          </div>
          <button
            type="button"
            class="mt-3 h-12 w-full rounded-2xl bg-acid font-bold text-void disabled:opacity-60"
            :disabled="busy"
            @click="completeSet(exercise)"
          >
            完成第 {{ exercise.sets.length + 1 }} 组
          </button>
        </template>
      </li>
    </ul>

    <div v-if="!locked" class="mt-6 space-y-3">
      <button
        type="button"
        class="h-12 w-full rounded-2xl border border-line text-sm font-medium"
        @click="pickerOpen = true"
      >
        + 加一个动作
      </button>
      <button
        type="button"
        class="h-12 w-full rounded-2xl bg-ink font-bold text-void disabled:opacity-60"
        :disabled="busy || (workout?.setCount ?? 0) === 0"
        @click="finish"
      >
        结束并保存
      </button>
    </div>

    <div
      v-if="pickerOpen"
      class="fixed inset-0 z-30 flex items-end justify-center bg-black/60"
      @click.self="pickerOpen = false"
    >
      <div class="max-h-[70vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-panel p-5">
        <div class="mb-4 flex items-center justify-between">
          <p class="font-bold">动作库</p>
          <button type="button" class="text-sm text-mute" @click="pickerOpen = false">关闭</button>
        </div>
        <button
          v-for="item in available"
          :key="item.id"
          type="button"
          class="mb-2 flex w-full items-center justify-between rounded-2xl border border-line px-4 py-3 text-left"
          @click="addExercise(item.id)"
        >
          <span class="font-medium">{{ item.name }}</span>
          <span class="text-xs text-mute">{{ item.muscleGroup }}</span>
        </button>
        <p v-if="available.length === 0" class="text-sm text-mute">库里的动作都在这场里了</p>
      </div>
    </div>
  </div>
</template>
