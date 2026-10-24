<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRoute, useRouter, onBeforeRouteLeave } from "vue-router";
import { fetchArticles, getCategories } from "@/utils/markdown";
import type { ArticleMeta } from "@/types";
import { CATEGORY_CONFIG } from "@/types";
import { FileText, Loader2, AlertCircle, CircleSlash } from "lucide-vue-next";
import ArticleCard from "@/components/ArticleCard.vue";
import { saveScroll, getScroll, rememberListPath } from "@/utils/scroll-memory";

// 分类筛选与「是否过时」筛选是两个独立维度，可叠加组合。
// 两者都写进 URL query，好处是：返回列表、刷新、分享链接、前进后退都不会丢状态。
type Freshness = "all" | "fresh" | "outdated";

const route = useRoute();
const router = useRouter();

const allArticles = ref<ArticleMeta[]>([]);
const loading = ref(false);
const error = ref(false);

// 从 URL 读初始状态（非法值回退到 all）
const VALID_FRESHNESS: Freshness[] = ["all", "fresh", "outdated"];

function readQuery(): { category: string; freshness: Freshness } {
  const q = route.query;
  const cat = typeof q.category === "string" && q.category ? q.category : "all";
  const fr = typeof q.freshness === "string" ? (q.freshness as Freshness) : "all";
  return { category: cat, freshness: VALID_FRESHNESS.includes(fr) ? fr : "all" };
}

const initial = readQuery();
const selectedCategory = ref(initial.category);
const freshness = ref<Freshness>(initial.freshness);

const categories = computed(() => {
  const cats = getCategories(allArticles.value);
  // URL 里带着一个已不存在的分类时（例如文章被删），仍然显示它，避免用户困惑
  if (selectedCategory.value !== "all" && !cats.includes(selectedCategory.value)) {
    cats.push(selectedCategory.value);
  }
  return cats;
});

const outdatedCount = computed(() => allArticles.value.filter((a) => a.outdated).length);
const freshCount = computed(() => allArticles.value.length - outdatedCount.value);

// 分类筛选后、再过一道「过时」筛选
const filteredArticles = computed(() => {
  let list = allArticles.value;
  if (selectedCategory.value !== "all") {
    list = list.filter((a) => a.category === selectedCategory.value);
  }
  if (freshness.value === "fresh") list = list.filter((a) => !a.outdated);
  else if (freshness.value === "outdated") list = list.filter((a) => a.outdated);
  return list;
});

// 当前分类下各状态的篇数，用于筛选块上的计数
const catScoped = computed(() => {
  if (selectedCategory.value === "all") return allArticles.value;
  return allArticles.value.filter((a) => a.category === selectedCategory.value);
});

const freshnessOptions: { key: Freshness; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "fresh", label: "未过时" },
  { key: "outdated", label: "过时" },
];

function countFor(k: Freshness) {
  if (k === "all") return catScoped.value.length;
  if (k === "fresh") return catScoped.value.filter((a) => !a.outdated).length;
  return catScoped.value.filter((a) => a.outdated).length;
}

function catLabel(cat: string) {
  return CATEGORY_CONFIG[cat]?.label || cat;
}

// 把筛选状态同步进 URL（replace：不污染浏览器历史，避免点几次筛选要按很多次后退）
function syncQuery() {
  const q: Record<string, string> = {};
  if (selectedCategory.value !== "all") q.category = selectedCategory.value;
  if (freshness.value !== "all") q.freshness = freshness.value;
  const changed =
    (route.query.category ?? "") !== (q.category ?? "") ||
    (route.query.freshness ?? "") !== (q.freshness ?? "");
  if (!changed) return;
  router.replace({ query: q });
}

// 记住当前列表地址（含筛选），文章页的「返回列表」会带回来
function rememberCurrent() {
  rememberListPath(route.fullPath);
}

function selectCategory(cat: string) {
  selectedCategory.value = cat;
  syncQuery();
}

function selectFreshness(k: Freshness) {
  freshness.value = k;
  syncQuery();
}

function resetFilters() {
  selectedCategory.value = "all";
  freshness.value = "all";
  syncQuery();
}

// 浏览器前进/后退时，URL 变了要跟着回填状态
watch(
  () => route.query,
  () => {
    const { category, freshness: fr } = readQuery();
    if (category !== selectedCategory.value) selectedCategory.value = category;
    if (fr !== freshness.value) freshness.value = fr;
  },
);

// ====== 滚动位置记忆 ======
// 关键点：数据是异步加载的，必须等列表渲染完（DOM 有高度）再恢复，
// 否则 scrollTo 会因为没有滚动空间而被截断到 0。
function currentKey() {
  return route.fullPath;
}

function onScroll() {
  saveScroll(currentKey());
}

async function restoreScroll() {
  const y = getScroll(currentKey());
  if (!y) return;
  await nextTick();
  // 再等一帧，确保图片/布局撑开后的总高度已就绪
  requestAnimationFrame(() => {
    window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
  });
}

async function load() {
  loading.value = true;
  error.value = false;
  try {
    allArticles.value = await fetchArticles();
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
    // 列表有内容后才恢复滚动
    if (!error.value) restoreScroll();
  }
}

onMounted(() => {
  load();
  rememberCurrent();
  window.addEventListener("scroll", onScroll, { passive: true });
});

// URL 变化（筛选切换 / 浏览器前进后退）时更新记忆的列表地址
watch(() => route.fullPath, rememberCurrent);

// 离开列表（进文章页）前把当前位置记下来 —— 这一步必须在路由切换前完成，
// onUnmounted 时组件已不再响应滚动，且路由 query 可能已被清空。
onBeforeRouteLeave(() => {
  saveScroll(currentKey());
  rememberCurrent();
});

onUnmounted(() => {
  saveScroll(currentKey());
  window.removeEventListener("scroll", onScroll);
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <FileText class="h-6 w-6 text-primary" />
        文章
      </h1>
      <p class="text-muted-foreground mt-1">共 {{ allArticles.length }} 篇文章</p>
    </div>

    <!-- 加载态 -->
    <div v-if="loading" class="flex items-center gap-2 text-sm text-muted-foreground py-8">
      <Loader2 class="h-4 w-4 animate-spin" /> 正在加载...
    </div>

    <!-- 错误态 -->
    <div v-else-if="error" class="text-center py-16 text-muted-foreground">
      <AlertCircle class="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p class="text-sm">文章加载失败</p>
      <button @click="load()" class="mt-3 text-sm text-primary hover:underline">重新加载</button>
    </div>

    <template v-else>
      <!-- 筛选：分类 / 新鲜度 两个独立维度 -->
      <div class="space-y-3">
        <!-- 分类 -->
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs text-muted-foreground w-12 shrink-0">分类</span>
          <button
            v-for="cat in categories"
            :key="cat"
            @click="selectCategory(cat)"
            :class="[
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              selectedCategory === cat
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            ]"
          >
            {{ catLabel(cat) }}
          </button>
        </div>

        <!-- 是否过时 -->
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs text-muted-foreground w-12 shrink-0">状态</span>
          <button
            v-for="opt in freshnessOptions"
            :key="opt.key"
            @click="selectFreshness(opt.key)"
            :disabled="countFor(opt.key) === 0 && opt.key !== 'all'"
            :class="[
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1',
              freshness === opt.key
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              countFor(opt.key) === 0 && opt.key !== 'all' ? 'opacity-40 cursor-not-allowed' : '',
            ]"
          >
            <CircleSlash v-if="opt.key === 'outdated'" class="h-3 w-3" />
            {{ opt.label }}
            <span class="tabular-nums opacity-60">{{ countFor(opt.key) }}</span>
          </button>
        </div>
      </div>

      <!-- 结果统计 -->
      <p class="text-sm text-muted-foreground">
        <template v-if="selectedCategory === 'all' && freshness === 'all'">
          共 {{ allArticles.length }} 篇
        </template>
        <template v-else>
          筛选出 {{ filteredArticles.length }} 篇
          <span class="opacity-60">
            （{{ selectedCategory === 'all' ? '全部分类' : catLabel(selectedCategory) }} ·
            {{ freshness === 'all' ? '不限状态' : freshness === 'fresh' ? '未过时' : '过时' }}）
          </span>
        </template>
      </p>

      <!-- Article Grid -->
      <div v-if="filteredArticles.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ArticleCard v-for="a in filteredArticles" :key="a.id" :article="a" />
      </div>

      <div v-else class="text-center py-16 text-muted-foreground">
        <FileText class="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>没有符合条件的文章</p>
        <button @click="resetFilters" class="mt-3 text-sm text-primary hover:underline">
          清除筛选
        </button>
      </div>
    </template>
  </div>
</template>
