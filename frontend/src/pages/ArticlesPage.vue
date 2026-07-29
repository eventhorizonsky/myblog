<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { fetchArticles, getCategories } from "@/utils/markdown";
import type { ArticleMeta } from "@/types";
import { CATEGORY_CONFIG } from "@/types";
import { FileText, Loader2, AlertCircle } from "lucide-vue-next";
import ArticleCard from "@/components/ArticleCard.vue";

const selectedCategory = ref("all");
const allArticles = ref<ArticleMeta[]>([]);
const loading = ref(false);
const error = ref(false);

const categories = computed(() => getCategories(allArticles.value));

const filteredArticles = computed(() => {
  if (selectedCategory.value === "all") return allArticles.value;
  return allArticles.value.filter((a) => a.category === selectedCategory.value);
});

async function load() {
  loading.value = true;
  error.value = false;
  try {
    allArticles.value = await fetchArticles();
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(() => { load(); });
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
      <!-- Category Filter -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="selectedCategory = cat"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            selectedCategory === cat
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          ]"
        >
          {{ CATEGORY_CONFIG[cat]?.label || cat }}
        </button>
      </div>

      <!-- Article Grid -->
      <div v-if="filteredArticles.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ArticleCard v-for="a in filteredArticles" :key="a.id" :article="a" />
      </div>

      <div v-else class="text-center py-16 text-muted-foreground">
        <FileText class="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>该分类暂无文章</p>
      </div>
    </template>
  </div>
</template>
