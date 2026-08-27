<script setup lang="ts">
import { ref } from 'vue'
import { ApiError } from '../../utils/api'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const email = ref('demo@kailian.app')
const password = ref('demo1234')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    uni.switchTab({ url: '/pages/index/index' })
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : '登录失败'
  } finally {
    loading.value = false
  }
}

function goRegister() {
  uni.navigateTo({ url: '/pages/register/register' })
}
</script>

<template>
  <view class="page login">
    <view>
      <text class="brand">KAILIAN</text>
      <view class="title login-title">开练</view>
      <text class="sub">把每一组重量和次数留下来。健身房里大按钮，回家再看曲线。</text>
    </view>

    <view class="form">
      <text class="label">邮箱</text>
      <input class="field" v-model="email" placeholder="邮箱" />
      <text class="label">密码</text>
      <input class="field" v-model="password" password placeholder="密码" />
      <text v-if="error" class="heat hint">{{ error }}</text>
      <button class="btn btn-acid" :disabled="loading" @click="submit">
        {{ loading ? '正在进场…' : '进场' }}
      </button>
      <view class="footer" @click="goRegister">
        <text class="sub">还没有号？</text>
        <text class="link">注册</text>
      </view>
      <text class="sub center">演示账号已填好，直接进场即可。</text>
    </view>
  </view>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.login-title {
  margin: 24rpx 0 16rpx;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding-bottom: 40rpx;
}
.label {
  font-size: 22rpx;
  color: #8b937c;
  margin-top: 8rpx;
}
.hint {
  font-size: 26rpx;
}
.footer {
  display: flex;
  justify-content: center;
  gap: 8rpx;
  margin-top: 8rpx;
}
.link {
  color: #e8eedf;
  text-decoration: underline;
  font-size: 26rpx;
}
.center {
  text-align: center;
}
</style>
