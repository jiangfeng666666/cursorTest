<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api, ApiError, type Stats } from '../api'
import AppShell from '../components/AppShell.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const stats = ref<Stats | null>(null)
const weight = ref(70)
const error = ref('')
const saving = ref(false)

const maxWeight = computed(() => {
  const values = stats.value?.metrics.map((item) => item.weightKg) ?? []
  return Math.max(80, ...values)
})

function barHeight(kg: number) {
  return `${Math.max(8, (kg / maxWeight.value) * 100)}%`
}

function dayLabel(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(new Date(value))
}

onMounted(async () => {
  stats.value = await api.stats()
  const last = stats.value.metrics.at(-1)
  if (last) weight.value = last.weightKg
})

async function saveWeight() {
  saving.value = true
  error.value = ''
  try {
    await api.logWeight(weight.value)
    stats.value = await api.stats()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '保存失败'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppShell>
    <h1 class="text-3xl font-black">曲线</h1>
    <p class="mt-1 text-sm text-mute">体重和出场次数，给自己看就够。</p>

    <section class="mt-6 rounded-3xl border border-line bg-panel p-4">
      <p class="text-xs text-mute">本周 / 累计</p>
      <p class="mt-2 font-mono text-3xl font-bold">
        {{ stats?.workoutsThisWeek ?? 0 }}
        <span class="text-lg text-mute">/ {{ stats?.totalWorkouts ?? 0 }}</span>
      </p>
    </section>

    <section class="mt-5 rounded-3xl border border-line bg-panel p-4">
      <div class="flex items-center justify-between">
        <p class="text-sm font-bold">体重</p>
        <p class="text-xs text-mute">{{ auth.user?.name }}</p>
      </div>
      <div class="mt-4 flex h-36 items-end gap-2">
        <div
          v-for="point in stats?.metrics ?? []"
          :key="point.id"
          class="flex h-full min-w-0 flex-1 flex-col items-center gap-1"
        >
          <div class="flex w-full flex-1 items-end">
            <div
              class="w-full min-h-2 rounded-t-md bg-acid"
              :style="{ height: barHeight(point.weightKg) }"
            />
          </div>
          <span class="text-[10px] text-mute">{{ dayLabel(point.loggedAt) }}</span>
        </div>
        <p v-if="!stats?.metrics.length" class="w-full text-center text-sm text-mute">还没有体重记录</p>
      </div>
      <label class="mt-4 block">
        <span class="mb-1 block text-xs text-mute">今天体重（kg）</span>
        <input
          v-model.number="weight"
          type="number"
          step="0.1"
          class="h-12 w-full rounded-2xl border border-line bg-void px-4 font-mono outline-none focus:border-acid"
        />
      </label>
      <p v-if="error" class="mt-2 text-sm text-heat">{{ error }}</p>
      <button
        type="button"
        class="mt-3 h-11 w-full rounded-2xl bg-acid font-bold text-void disabled:opacity-60"
        :disabled="saving"
        @click="saveWeight"
      >
        记下体重
      </button>
    </section>
  </AppShell>
</template>
