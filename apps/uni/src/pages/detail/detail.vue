<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { api, type Workout } from '../../utils/api'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const workout = ref<Workout | null>(null)

function formatDate(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

onLoad(async (query) => {
  if (!(await auth.requireLogin())) return
  workout.value = await api.workout(String(query?.id || ''))
})

function back() {
  uni.switchTab({ url: '/pages/history/history' })
}
</script>

<template>
  <view class="page">
    <text class="sub" @click="back">← 训练本</text>
    <view class="title">{{ workout?.title }}</view>
    <text class="sub">{{ workout ? formatDate(workout.startedAt) : '' }}</text>
    <text class="acid summary">{{ workout?.setCount }} 组 · {{ Math.round(workout?.volume || 0) }} kg</text>

    <view v-for="exercise in workout?.exercises || []" :key="exercise.id" class="block">
      <view class="name">{{ exercise.name }}</view>
      <view v-for="set in exercise.sets" :key="set.id" class="card row">
        <text class="sub">第 {{ set.setIndex }} 组</text>
        <text class="value">{{ set.weightKg }} kg × {{ set.reps }}</text>
      </view>
      <text v-if="exercise.sets.length === 0" class="sub">这动作没记组</text>
    </view>
  </view>
</template>

<style scoped>
.title {
  margin: 20rpx 0 8rpx;
}
.summary {
  display: block;
  margin-top: 8rpx;
  font-size: 28rpx;
}
.block {
  margin-top: 40rpx;
}
.name {
  font-size: 34rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}
.row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}
.value {
  font-weight: 700;
}
</style>
