<script setup lang="ts">
import { ref } from 'vue'
import { ApiError } from '../../utils/api'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
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
    uni.switchTab({ url: '/pages/index/index' })
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '注册失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="page">
    <view class="title">建一个训练本</view>
    <text class="sub">邮箱只用来登录，不会发营销信。</text>
    <view class="form">
      <text class="label">怎么称呼你</text>
      <input class="field" v-model="name" placeholder="称呼" />
      <text class="label">邮箱</text>
      <input class="field" v-model="email" placeholder="邮箱" />
      <text class="label">密码（至少 6 位）</text>
      <input class="field" password v-model="password" placeholder="密码" />
      <text v-if="error" class="heat hint">{{ error }}</text>
      <button class="btn btn-acid" :disabled="loading" @click="submit">
        {{ loading ? '创建中…' : '开始记训练' }}
      </button>
    </view>
  </view>
</template>

<style scoped>
.form {
  margin-top: 48rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.label {
  font-size: 22rpx;
  color: #8b937c;
  margin-top: 8rpx;
}
.hint {
  font-size: 26rpx;
}
</style>
