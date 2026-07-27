<script setup lang="ts">
import { ref, computed } from "vue";
import type { GameReview } from "@/types";
import GameCard from "@/components/GameCard.vue";
import { Gamepad2 } from "lucide-vue-next";

// Load game data from JSON
const games = ref<GameReview[]>([]);

async function loadGames() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}content/games/games.json`);
    if (res.ok) {
      const data = await res.json();
      games.value = data.games || [];
    }
  } catch {
    // Games data not available yet
  }
}
loadGames();

const sortedGames = computed(() =>
  [...games.value].sort((a, b) => b.date.localeCompare(a.date))
);
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
    <div>
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <Gamepad2 class="h-6 w-6 text-primary" />
        游戏
      </h1>
      <p class="text-muted-foreground mt-1">
        {{ games.length > 0 ? `共 ${games.length} 款游戏评测` : '小黑盒游戏评测同步展示' }}
      </p>
    </div>

    <!-- 瀑布流 -->
    <div v-if="sortedGames.length > 0" class="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
      <GameCard v-for="g in sortedGames" :key="g.linkId" :game="g" />
    </div>

    <div v-else class="text-center py-16 text-muted-foreground">
      <Gamepad2 class="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p class="text-sm">暂无游戏评测数据</p>
      <p class="text-xs mt-1">运行同步脚本从黑盒拉取游戏评测</p>
    </div>
  </div>
</template>
