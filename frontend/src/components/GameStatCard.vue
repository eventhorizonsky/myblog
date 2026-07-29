<script setup lang="ts">
import Card from "@/components/ui/Card.vue";

interface GameStatCard {
  game_stat: string
  bg_image: string
  logo_image: string
  image: string
  nickname: string
  key1: string; value1: string
  key2: string; value2: string
  key3: string; value3: string
  key4?: string; value4?: string
  data_count: number
  protocol?: string
}

defineProps<{ card: GameStatCard }>()
const statPairs = (c: GameStatCard) => [
  { k: c.key1, v: c.value1 },
  { k: c.key2, v: c.value2 },
  { k: c.key3, v: c.value3 },
  ...(c.key4 ? [{ k: c.key4, v: c.value4! }] : []),
].filter(p => p.k)
</script>

<template>
  <Card class="overflow-hidden hover:shadow-md transition-shadow">
    <!-- 背景横幅 -->
    <div class="relative w-full overflow-hidden" style="aspect-ratio: 1101/306">
      <img
        :src="card.bg_image"
        class="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <!-- 渐变遮罩 -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <!-- 游戏 Logo -->
      <img
        v-if="card.logo_image"
        :src="card.logo_image"
        class="absolute top-2 left-2 h-6 object-contain"
      />
      <!-- 角色图右侧 -->
      <img
        v-if="card.image"
        :src="card.image"
        class="absolute top-1 right-1 h-[calc(100%-8px)] object-contain"
        loading="lazy"
      />
    </div>

    <!-- 统计区 -->
    <div class="p-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-muted-foreground truncate max-w-[70%]">
          {{ card.nickname }}
        </span>
      </div>
      <div :class="['grid gap-2', card.data_count >= 4 ? 'grid-cols-4' : 'grid-cols-3']">
        <div v-for="(p, i) in statPairs(card)" :key="i" class="text-center">
          <div class="text-sm font-bold text-foreground">{{ p.v }}</div>
          <div class="text-[10px] text-muted-foreground leading-tight">{{ p.k }}</div>
        </div>
      </div>
    </div>
  </Card>
</template>
