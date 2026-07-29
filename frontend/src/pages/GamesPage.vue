<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { GameReview } from "@/types";
import GameCard from "@/components/GameCard.vue";
import GameStatCard from "@/components/GameStatCard.vue";
import Card from "@/components/ui/Card.vue";
import { Gamepad2, Loader2, Monitor, Cpu, HardDrive, Clock, Coins, Gamepad } from "lucide-vue-next";

interface GameStat {
  game_stat: string; bg_image: string; logo_image: string; image: string
  nickname: string; key1: string; value1: string; key2: string; value2: string
  key3: string; value3: string; key4?: string; value4?: string; data_count: number
}

interface GameOverview {
  key: string; desc: string; value: string; color: string
}

interface SteamInfo {
  nickname: string; avatar: string; level: number; total_game_count: number
  total_player_time: number; total_game_price: string
}

interface HardwareInfo {
  cpu: string; gpu: string; board: string; perf_level: string
}

const games = ref<GameReview[]>([]);
const gameStats = ref<GameStat[]>([]);
const statsLoading = ref(false);
const statsError = ref(false);

const gameOverview = ref<GameOverview[]>([]);
const steamInfo = ref<SteamInfo | null>(null);
const hardwareInfo = ref<HardwareInfo | null>(null);
const followingCount = ref(0);
const totalGameCount = ref(0);

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

      gameOverview.value = data.game_overview || [];
      steamInfo.value = data.steam_info || null;
      hardwareInfo.value = data.hardware_info || null;
      followingCount.value = data.following_count || 0;
      totalGameCount.value = data.game_count || 0;
      gameStats.value = data.game_cards || [];
    } else {
      statsError.value = true;
    }
  } catch { statsError.value = true; }
  finally { statsLoading.value = false }
}

onMounted(() => { loadGames(); loadStats(); });

const sortedGames = computed(() => [...games.value].sort((a, b) => b.date.localeCompare(a.date)));

function fmtHours(h: number) {
  if (h >= 1000) return (h / 1000).toFixed(1) + "k h";
  return h.toLocaleString() + "h";
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
    <div>
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <Gamepad2 class="h-6 w-6 text-primary" />
        游戏
      </h1>
      <p class="text-muted-foreground mt-1">游戏战绩 · 评测收藏</p>
    </div>

    <div v-if="statsError" class="text-center py-8 text-muted-foreground">
      <p class="text-sm">游戏战绩加载失败</p>
    </div>

    <template v-else>
      <!-- ====== 总结横幅 ====== -->
      <Card v-if="steamInfo" class="overflow-hidden">
        <div class="p-4 sm:p-5 space-y-4">
          <div class="flex items-center gap-3">
            <img
              v-if="steamInfo.avatar"
              :src="steamInfo.avatar"
              class="w-12 h-12 rounded-full border-2 border-border shrink-0"
              loading="lazy"
            />
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-bold text-base">{{ steamInfo.nickname }}</span>
                <span class="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Lv.{{ steamInfo.level }}</span>
              </div>
              <div class="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 flex-wrap">
                <span class="flex items-center gap-1"><Gamepad class="h-3.5 w-3.5" /> {{ steamInfo.total_game_count }} 游戏</span>
                <span class="flex items-center gap-1"><Clock class="h-3.5 w-3.5" /> {{ fmtHours(steamInfo.total_player_time) }}</span>
                <span class="flex items-center gap-1"><Coins class="h-3.5 w-3.5" /> &yen;{{ Number(steamInfo.total_game_price).toLocaleString() }}</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/40">
            <div v-if="gameOverview.length" class="space-y-1.5">
              <div class="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">账号概览</div>
              <div class="flex gap-3">
                <div v-for="item in gameOverview" :key="item.key" class="text-center">
                  <div class="text-sm font-bold" :style="{ color: item.color }">{{ item.value }}</div>
                  <div class="text-[10px] text-muted-foreground">{{ item.desc }}</div>
                </div>
              </div>
            </div>

            <div v-if="hardwareInfo" class="space-y-1.5">
              <div class="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">硬件配置</div>
              <div class="space-y-0.5 text-xs text-muted-foreground">
                <div class="flex items-center gap-1"><Cpu class="h-3 w-3 shrink-0" /> {{ hardwareInfo.cpu }}</div>
                <div class="flex items-center gap-1"><Monitor class="h-3 w-3 shrink-0" /> {{ hardwareInfo.gpu }}</div>
                <div class="flex items-center gap-1"><HardDrive class="h-3 w-3 shrink-0" /> {{ hardwareInfo.board }}</div>
              </div>
            </div>

            <div class="space-y-1.5">
              <div class="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">关注</div>
              <div class="text-2xl font-bold">{{ followingCount }}</div>
              <div class="text-[10px] text-muted-foreground">关注数 &middot; {{ totalGameCount }} 款游戏</div>
            </div>
          </div>
        </div>
      </Card>

      <div v-if="statsLoading" class="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 class="h-4 w-4 animate-spin" /> 加载中...
      </div>

      <section v-if="gameStats.length > 0">
        <h2 class="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">游戏战绩</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <GameStatCard v-for="(card, i) in gameStats" :key="card.game_stat || i" :card="card" />
        </div>
      </section>
    </template>

    <!-- ====== 游戏评测 ====== -->
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
