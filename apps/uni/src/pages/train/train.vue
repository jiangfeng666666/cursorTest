<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import Stepper from '../../components/Stepper.vue'
import { api, ApiError, type Exercise, type Workout, type WorkoutExercise } from '../../utils/api'
import { useAuthStore } from '../../stores/auth'
import { useRestStore } from '../../stores/rest'

const auth = useAuthStore()
const rest = useRestStore()

const workoutId = ref('')
const workout = ref<Workout | null>(null)
const catalog = ref<Exercise[]>([])
const error = ref('')
const busy = ref(false)
const pickerOpen = ref(false)
const drafts = ref<Record<string, { weightKg: number; reps: number }>>({})

const locked = computed(() => Boolean(workout.value?.finishedAt))
const available = computed(() => {
  const taken = new Set(workout.value?.exercises.map((item) => item.id) ?? [])
  return catalog.value.filter((item) => !taken.has(item.id))
})

function ensureDrafts(next: Workout) {
  const nextDrafts = { ...drafts.value }
  for (const exercise of next.exercises) {
    if (!nextDrafts[exercise.id]) {
      nextDrafts[exercise.id] = {
        weightKg: exercise.last?.weightKg ?? 20,
        reps: exercise.last?.reps ?? 8,
      }
    }
  }
  drafts.value = nextDrafts
}

function setDraft(exerciseId: string, field: 'weightKg' | 'reps', value: number) {
  const current = drafts.value[exerciseId]
  if (!current) return
  drafts.value = { ...drafts.value, [exerciseId]: { ...current, [field]: value } }
}

async function load() {
  const next = await api.workout(workoutId.value)
  ensureDrafts(next)
  workout.value = next
}

onLoad(async (query) => {
  if (!(await auth.requireLogin())) return
  workoutId.value = String(query?.id || '')
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
    const next = await api.logSet(workoutId.value, {
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
    const next = await api.addExercise(workoutId.value, exerciseId)
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
    const next = await api.finishWorkout(workout.value.id)
    rest.skip()
    uni.redirectTo({ url: `/pages/detail/detail?id=${next.id}` })
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '结束失败'
  } finally {
    busy.value = false
  }
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<template>
  <view class="page">
    <view class="head">
      <text class="sub" @click="goHome">← 今天</text>
      <text class="sub">{{ locked ? '已结束' : '进行中' }}</text>
    </view>
    <view class="title">{{ workout?.title || '训练' }}</view>
    <text class="sub">{{ workout?.setCount || 0 }} 组 · 容量 {{ Math.round(workout?.volume || 0) }} kg</text>
    <text v-if="error" class="heat">{{ error }}</text>

    <view v-if="rest.running" class="rest">
      <view>
        <text class="rest-label">休息</text>
        <view class="rest-time">{{ rest.label }}</view>
      </view>
      <view class="rest-actions">
        <button class="chip" @click="rest.add30">+30s</button>
        <button class="chip skip" @click="rest.skip">跳过</button>
      </view>
    </view>

    <view v-for="exercise in workout?.exercises || []" :key="exercise.id" class="card lift">
      <view class="row">
        <view>
          <view class="lift-name">{{ exercise.name }}</view>
          <text class="sub">{{ exercise.muscleGroup }} · {{ exercise.equipment }}</text>
        </view>
        <view v-if="exercise.last" class="last">
          <text class="sub">上次</text>
          <text>{{ exercise.last.weightKg }}kg × {{ exercise.last.reps }}</text>
        </view>
      </view>
      <view class="chips">
        <text v-for="set in exercise.sets" :key="set.id" class="set-chip">
          {{ set.setIndex }} · {{ set.weightKg }}×{{ set.reps }}
        </text>
        <text v-if="exercise.sets.length === 0" class="sub">还没记组</text>
      </view>
      <view v-if="!locked && drafts[exercise.id]" class="editors">
        <view class="editor">
          <text class="sub">重量</text>
          <Stepper
            :model-value="drafts[exercise.id].weightKg"
            :step="2.5"
            suffix="kg"
            @update:model-value="(value) => setDraft(exercise.id, 'weightKg', value)"
          />
        </view>
        <view class="editor">
          <text class="sub">次数</text>
          <Stepper
            :model-value="drafts[exercise.id].reps"
            :step="1"
            :min="1"
            suffix="次"
            @update:model-value="(value) => setDraft(exercise.id, 'reps', value)"
          />
        </view>
      </view>
      <button
        v-if="!locked"
        class="btn btn-acid"
        :disabled="busy"
        @click="completeSet(exercise)"
      >
        完成第 {{ exercise.sets.length + 1 }} 组
      </button>
    </view>

    <view v-if="!locked" class="actions">
      <button class="btn btn-ghost" @click="pickerOpen = true">+ 加一个动作</button>
      <button class="btn btn-ink" :disabled="busy || (workout?.setCount || 0) === 0" @click="finish">
        结束并保存
      </button>
    </view>

    <view v-if="pickerOpen" class="mask" @click="pickerOpen = false">
      <view class="sheet" @click.stop>
        <view class="row">
          <text class="lift-name">动作库</text>
          <text class="sub" @click="pickerOpen = false">关闭</text>
        </view>
        <view
          v-for="item in available"
          :key="item.id"
          class="sheet-item"
          @click="addExercise(item.id)"
        >
          <text>{{ item.name }}</text>
          <text class="sub">{{ item.muscleGroup }}</text>
        </view>
        <text v-if="available.length === 0" class="sub">库里的动作都在这场里了</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
}
.title {
  margin: 20rpx 0 8rpx;
}
.rest {
  margin-top: 32rpx;
  background: #ff5c3a;
  color: #11140f;
  border-radius: 32rpx;
  padding: 24rpx 28rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.rest-label {
  font-size: 22rpx;
  font-weight: 600;
}
.rest-time {
  font-size: 56rpx;
  font-weight: 800;
}
.rest-actions {
  display: flex;
  gap: 12rpx;
}
.chip {
  background: rgba(17, 20, 15, 0.15);
  color: #11140f;
  padding: 12rpx 20rpx;
  border-radius: 16rpx;
  font-weight: 700;
  font-size: 24rpx;
}
.chip.skip {
  background: #11140f;
  color: #e8eedf;
}
.lift {
  margin-top: 24rpx;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.lift-name {
  font-size: 34rpx;
  font-weight: 700;
}
.last {
  text-align: right;
  font-size: 22rpx;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin: 20rpx 0;
}
.set-chip {
  border: 1px solid #2c3526;
  border-radius: 999rpx;
  padding: 8rpx 20rpx;
  font-size: 22rpx;
}
.editors {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}
.editor {
  flex: 1;
}
.actions {
  margin-top: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  z-index: 20;
}
.sheet {
  width: 100%;
  max-height: 70vh;
  overflow: auto;
  background: #1a1f17;
  border-radius: 32rpx 32rpx 0 0;
  padding: 32rpx;
  box-sizing: border-box;
}
.sheet-item {
  display: flex;
  justify-content: space-between;
  border: 1px solid #2c3526;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-top: 16rpx;
}
</style>
