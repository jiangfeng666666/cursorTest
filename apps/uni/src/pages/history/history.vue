<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { api, type WorkoutSummary } from '../../utils/api'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const workouts = ref<WorkoutSummary[]>([])

function formatDate(value: string) {
  const date = new Date(value)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}月${day}日 ${hour}:${minute}`
}

onShow(async () => {
  if (!(await auth.requireLogin())) return
  workouts.value = await api.workouts()
})

function open(id: string) {
  uni.navigateTo({ url: `/pages/detail/detail?id=${id}` })
}
</script>

<template>
  <view class="page">
    <view class="title">训练本</view>
    <text class="sub">练完的场次会落在这里。</text>
    <view
      v-for="item in workouts"
      :key="item.id"
      class="card item"
      @click="open(item.id)"
    >
      <view class="row">
        <text class="name">{{ item.title }}</text>
        <text class="acid">{{ Math.round(item.volume) }}kg</text>
      </view>
      <text class="sub">{{ formatDate(item.startedAt) }} · {{ item.setCount }} 组</text>
    </view>
    <text v-if="!workouts.length" class="sub empty">还没有结束的训练。去「今天」开一场。</text>
  </view>
</template>

<style scoped>
.item {
  margin-top: 24rpx;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}
.name {
  font-weight: 700;
  font-size: 32rpx;
}
.empty {
  display: block;
  margin-top: 80rpx;
}
</style>
