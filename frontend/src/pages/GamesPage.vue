<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { GameReview } from "@/types";
import GameCard from "@/components/GameCard.vue";
import GameStatCard from "@/components/GameStatCard.vue";
import { Gamepad2, Loader2 } from "lucide-vue-next";

interface GameStat {
  game_stat: string; bg_image: string; logo_image: string; image: string
  nickname: string; key1: string; value1: string; key2: string; value2: string
  key3: string; value3: string; key4?: string; value4?: string; data_count: number
  protocol?: string
}

// Game reviews
const games = ref<GameReview[]>([]);
// Game stat cards
const gameStats = ref<GameStat[]>([]);
const statsLoading = ref(false);
const statsError = ref(false);

async function loadGames() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}content/games/games.json`);
    if (res.ok) { const data = await res.json(); games.value = data.games || []; }
  } catch { /* not available yet */ }
}

async function loadStats() {
  statsLoading.value = true;
  try {
    const res = await fetch("/api/game-stats");
    if (res.ok) {
      const data = await res.json();
      if (data.status === "ok") {
        const cards: GameStat[] = [];
        if (data.result.bmw_account_info) cards.push(data.result.bmw_account_info);
        if (data.result.bind_game_infos) cards.push(...data.result.bind_game_infos);
        gameStats.value = cards;
      }
    } else {
      statsError.value = true;
    }
  } catch { statsError.value = true; }
  finally { statsLoading.value = false }
}

onMounted(() => { loadGames(); loadStats(); });

const sortedGames = computed(() => [...games.value].sort((a, b) => b.date.localeCompare(a.date)));
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
    <div>
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <Gamepad2 class="h-6 w-6 text-primary" />
        游戏
      </h1>
      <p class="text-muted-foreground mt-1">
        游戏战绩 · 评测收藏
      </p>
    </div>

    <!-- 游戏战绩卡片 -->
    <section v-if="!statsError">
      <h2 class="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">游戏战绩</h2>
      <div v-if="statsLoading" class="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 class="h-4 w-4 animate-spin" /> 加载中...
      </div>
      <div v-else-if="gameStats.length > 0" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <GameStatCard v-for="(card, i) in gameStats" :key="card.game_stat || i" :card="card" />
      </div>
    </section>

    <!-- 评测 -->
    <section>
      <h2 class="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">游戏评测</h2>
    <div v-if="sortedGames.length > 0" class="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
      <GameCard v-for="g in sortedGames" :key="g.linkId" :game="g" />
    </div>

      <div v-else class="text-center py-16 text-muted-foreground">
        <Gamepad2 class="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p class="text-sm">暂无游戏评测数据</p>
        <p class="text-xs mt-1">运行同步脚本从黑盒拉取游戏评测</p>
      </div>
    </section>
  </div>
</template>
