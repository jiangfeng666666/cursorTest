<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api, ApiError, type Stats } from '../../utils/api'
import { useAuthStore } from '../../stores/auth'

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
  const date = new Date(value)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

onShow(async () => {
  if (!(await auth.requireLogin())) return
  stats.value = await api.stats()
  const last = stats.value.metrics[stats.value.metrics.length - 1]
  if (last) weight.value = last.weightKg
})

function onWeightInput(event: { detail: { value: string } }) {
  const value = Number(event.detail.value)
  if (Number.isFinite(value)) weight.value = value
}

async function saveWeight() {
  saving.value = true
  error.value = ''
  try {
    await api.logWeight(Number(weight.value))
    stats.value = await api.stats()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '保存失败'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <view class="page">
    <view class="title">曲线</view>
    <text class="sub">体重和出场次数，给自己看就够。</text>

    <view class="card summary">
      <text class="sub">本周 / 累计</text>
      <view class="big">
        {{ stats?.workoutsThisWeek || 0 }}
        <text class="sub"> / {{ stats?.totalWorkouts || 0 }}</text>
      </view>
    </view>

    <view class="card">
      <view class="row">
        <text class="name">体重</text>
        <text class="sub">{{ auth.user?.name }}</text>
      </view>
      <view class="chart">
        <view v-for="point in stats?.metrics || []" :key="point.id" class="col">
          <view class="track">
            <view class="bar" :style="{ height: barHeight(point.weightKg) }" />
          </view>
          <text class="sub date">{{ dayLabel(point.loggedAt) }}</text>
        </view>
        <text v-if="!stats?.metrics.length" class="sub">还没有体重记录</text>
      </view>
      <text class="sub label">今天体重（kg）</text>
      <input class="field" type="digit" :value="String(weight)" @input="onWeightInput" />
      <text v-if="error" class="heat">{{ error }}</text>
      <button class="btn btn-acid save" :disabled="saving" @click="saveWeight">记下体重</button>
    </view>
  </view>
</template>

<style scoped>
.summary {
  margin: 32rpx 0 24rpx;
}
.big {
  font-size: 48rpx;
  font-weight: 700;
  margin-top: 12rpx;
}
.row {
  display: flex;
  justify-content: space-between;
}
.name {
  font-weight: 700;
}
.chart {
  height: 280rpx;
  display: flex;
  align-items: flex-end;
  gap: 12rpx;
  margin: 24rpx 0;
}
.col {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.track {
  flex: 1;
  display: flex;
  align-items: flex-end;
}
.bar {
  width: 100%;
  min-height: 8rpx;
  background: #d6ff4b;
  border-radius: 8rpx 8rpx 0 0;
}
.date {
  font-size: 20rpx;
  text-align: center;
}
.label {
  display: block;
  margin-bottom: 8rpx;
}
.save {
  margin-top: 24rpx;
}
</style>
