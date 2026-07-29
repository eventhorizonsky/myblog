<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import type { AnimeCollection } from "@/types";
import AnimeCard from "@/components/AnimeCard.vue";
import { cn } from "@/utils/cn";
import { Tv, Loader2, AlertCircle, ChevronDown } from "lucide-vue-next";

const PAGE_SIZE = 12;

const COLLECTION_TABS = [
  { key: 0, label: "全部" },
  { key: 2, label: "看过" },
  { key: 3, label: "在看" },
  { key: 1, label: "想看" },
  { key: 4, label: "搁置" },
  { key: 5, label: "抛弃" },
] as const;

const items = ref<AnimeCollection[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const error = ref(false);
const activeTab = ref<number>(0);
const offset = ref(0);
const hasMore = ref(false);
const tabCounts = ref<Record<number, number>>({});
const currentTotal = ref(0);

// 切换 tab 或首次加载 → 请求第一页，total 从接口返回
async function loadTab() {
  loading.value = true;
  error.value = false;
  offset.value = 0;
  try {
    const typeParam = activeTab.value === 0 ? "" : `&type=${activeTab.value}`;
    const res = await fetch(`/api/anime-collections?limit=${PAGE_SIZE}&offset=0${typeParam}`);
    if (res.ok) {
      const data = await res.json();
      items.value = (data.data || []) as AnimeCollection[];
      currentTotal.value = data.total || items.value.length;
      tabCounts.value[activeTab.value] = currentTotal.value;
      hasMore.value = (data.data || []).length >= PAGE_SIZE;
    } else {
      error.value = true;
    }
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

// 加载更多 → 追加
async function loadMore() {
  if (loadingMore.value) return;
  loadingMore.value = true;
  const newOffset = offset.value + PAGE_SIZE;
  try {
    const typeParam = activeTab.value === 0 ? "" : `&type=${activeTab.value}`;
    const res = await fetch(`/api/anime-collections?limit=${PAGE_SIZE}&offset=${newOffset}${typeParam}`);
    if (res.ok) {
      const data = await res.json();
      const more = (data.data || []) as AnimeCollection[];
      items.value.push(...more);
      offset.value = newOffset;
      hasMore.value = more.length >= PAGE_SIZE;
    }
  } catch { /* ignore */ }
  finally { loadingMore.value = false }
}

onMounted(() => { loadTab(); });

watch(activeTab, () => { loadTab(); });
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
    <div>
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <Tv class="h-6 w-6 text-primary" />
        动漫
      </h1>
      <p class="text-muted-foreground mt-1">
        追番列表 · Bangumi 收藏
      </p>
    </div>

    <div v-if="loading" class="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
      <Loader2 class="h-5 w-5 animate-spin" /> 正在加载...
    </div>

    <div v-else-if="error" class="text-center py-16 text-muted-foreground">
      <AlertCircle class="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p class="text-sm">加载失败</p>
    </div>

    <template v-else>
      <!-- Tab 切换栏 -->
      <div class="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        <button
          v-for="tab in COLLECTION_TABS"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            activeTab === tab.key
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )"
        >
          {{ tab.label }}
          <span
            v-if="activeTab === tab.key && tabCounts[tab.key] > 0"
            class="ml-1 text-xs text-muted-foreground"
          >{{ tabCounts[tab.key] }}</span>
        </button>
      </div>

      <!-- 卡片网格 -->
      <div v-if="items.length > 0" class="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4 space-y-4">
        <AnimeCard v-for="item in items" :key="item.subject_id" :item="item" />
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore" class="text-center pt-2">
        <button
          @click="loadMore"
          :disabled="loadingMore"
          class="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <Loader2 v-if="loadingMore" class="h-4 w-4 animate-spin" />
          <ChevronDown v-else class="h-4 w-4" />
          加载更多
        </button>
      </div>

      <div v-if="items.length === 0" class="text-center py-16 text-muted-foreground">
        <Tv class="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p class="text-sm">暂无该分类的追番数据</p>
      </div>
    </template>
  </div>
</template>
