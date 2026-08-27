<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { to: '/', label: '今天', match: (path: string) => path === '/' },
  { to: '/history', label: '记录', match: (path: string) => path.startsWith('/history') },
  { to: '/progress', label: '曲线', match: (path: string) => path.startsWith('/progress') },
]
</script>

<template>
  <div class="flex min-h-svh flex-col">
    <main class="flex-1 px-5 pb-28 pt-6">
      <slot />
    </main>
    <nav
      class="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-void/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur"
    >
      <ul class="grid grid-cols-3 gap-1">
        <li v-for="tab in tabs" :key="tab.to">
          <RouterLink
            :to="tab.to"
            class="flex h-11 items-center justify-center rounded-xl text-sm font-medium"
            :class="tab.match(route.path) ? 'bg-panel text-acid' : 'text-mute'"
          >
            {{ tab.label }}
          </RouterLink>
        </li>
      </ul>
    </nav>
  </div>
</template>
