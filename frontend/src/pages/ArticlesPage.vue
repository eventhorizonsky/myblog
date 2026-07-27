<script setup lang="ts">
import { ref, computed } from "vue";
import { loadAllArticles } from "@/utils/markdown";
import { CATEGORY_CONFIG } from "@/types";
import { FileText } from "lucide-vue-next";
import ArticleCard from "@/components/ArticleCard.vue";

const selectedCategory = ref("all");

const allArticles = computed(() => loadAllArticles());
const categories = computed(() => {
  const cats = new Set(allArticles.value.map((a) => a.category));
  return ["all", ...Array.from(cats).filter(Boolean)];
});

const filteredArticles = computed(() => {
  if (selectedCategory.value === "all") return allArticles.value;
  return allArticles.value.filter((a) => a.category === selectedCategory.value);
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
  </div>
</template>
