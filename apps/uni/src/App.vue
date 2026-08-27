<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useAuthStore } from './stores/auth'

onLaunch(async () => {
  const auth = useAuthStore()
  await auth.hydrate()
})
</script>

<style>
page {
  background: #11140f;
  color: #e8eedf;
  font-family: -apple-system, 'PingFang SC', 'Noto Sans SC', sans-serif;
}

button {
  margin: 0;
  padding: 0;
  line-height: 1.2;
  font-size: inherit;
  background: transparent;
  border-radius: 0;
}

button::after {
  border: none;
}

.page {
  min-height: 100%;
  padding: 32rpx 40rpx 80rpx;
  box-sizing: border-box;
}

.brand {
  font-size: 22rpx;
  letter-spacing: 0.3em;
  color: #d6ff4b;
}

.title {
  font-size: 56rpx;
  font-weight: 900;
  line-height: 1.15;
}

.sub {
  color: #8b937c;
  font-size: 26rpx;
  line-height: 1.6;
}

.card {
  background: #1a1f17;
  border: 1px solid #2c3526;
  border-radius: 32rpx;
  padding: 32rpx;
}

.btn {
  height: 88rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 30rpx;
}

.btn-acid {
  background: #d6ff4b !important;
  color: #11140f !important;
}

.btn-ink {
  background: #e8eedf !important;
  color: #11140f !important;
}

.btn-ghost {
  border: 1px solid #2c3526;
  color: #e8eedf;
}

.btn[disabled] {
  opacity: 0.55;
}

.field {
  height: 88rpx;
  border-radius: 24rpx;
  border: 1px solid #2c3526;
  background: #1a1f17;
  color: #e8eedf;
  padding: 0 28rpx;
  font-size: 30rpx;
}

.heat {
  color: #ff5c3a;
}

.acid {
  color: #d6ff4b;
}

.mono {
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
}
</style>
