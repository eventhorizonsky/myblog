<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { fetchArticles } from "@/utils/markdown";
import type { ArticleMeta, GameReview, AnimeCollection, GitHubRepo } from "@/types";
import ArticleCard from "@/components/ArticleCard.vue";
import GameCard from "@/components/GameCard.vue";
import AnimeCard from "@/components/AnimeCard.vue";
import ProjectCard from "@/components/ProjectCard.vue";
import { FileText, Gamepad2, Tv, ArrowRight, Loader2, FolderGit2 } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { inject, type Ref } from "vue";
import type { SiteConfig } from "@/App.vue";

const router = useRouter();
const siteConfig = inject<Ref<SiteConfig>>("siteConfig");
const siteTitle = computed(() => siteConfig?.value?.title || "EventHorizon Blog");
const siteDescription = computed(() => siteConfig?.value?.description || "游戏评测 · 技术分享 · 动漫追番");

// 文章
const articles = ref<ArticleMeta[]>([]);

async function loadArticles() {
  try {
    const data = await fetchArticles();
    articles.value = data.slice(0, 4);
  } catch { /* ignore */ }
}

// 游戏评测
const games = ref<GameReview[]>([]);
async function loadGames() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}content/games/games.json`);
    if (res.ok) { const data = await res.json(); games.value = (data.games || []).slice(0, 4); }
  } catch { /* ignore */ }
}

// 在追番剧 (type=2)
const watching = ref<AnimeCollection[]>([]);
const animeLoading = ref(false);

// GitHub 置顶项目（按 star 数取前 3）
const topProjects = ref<GitHubRepo[]>([]);

async function loadProjects() {
  try {
    const res = await fetch("/api/github-projects");
    if (res.ok) {
      const data: GitHubRepo[] = await res.json();
      topProjects.value = data
        .sort((a, b) => b.stars - a.stars)
        .slice(0, 3);
    }
  } catch { /* ignore */ }
}
async function loadAnime() {
  animeLoading.value = true;
  try {
    const res = await fetch("/api/anime-collections?type=3");
    if (res.ok) {
      const data = await res.json();
      watching.value = ((data.data || []) as AnimeCollection[])
        .sort((a: AnimeCollection, b: AnimeCollection) => b.updated_at.localeCompare(a.updated_at))
        .slice(0, 8);
    }
  } catch { /* ignore */ }
  finally { animeLoading.value = false }
}

onMounted(() => { loadArticles(); loadGames(); loadAnime(); loadProjects(); });
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
    <!-- Hero -->
    <div class="text-center py-8">
      <h1 class="text-3xl font-bold tracking-tight text-primary">
        {{ siteTitle }}
      </h1>
      <p class="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
        {{ siteDescription }}
      </p>
    </div>

    <!-- ====== 最近文章 ====== -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold flex items-center gap-2">
          <FileText class="h-5 w-5 text-primary" />
          最近文章
        </h2>
        <router-link to="/articles" class="text-sm text-primary hover:underline flex items-center gap-1">
          全部 <ArrowRight class="h-3 w-3" />
        </router-link>
      </div>
      <div v-if="articles.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ArticleCard v-for="a in articles" :key="a.id" :article="a" />
      </div>
      <div v-else class="text-center py-8 text-muted-foreground text-sm">
        还没有文章
      </div>
    </section>

    <!-- ====== GitHub 精选项目 ====== -->
    <section v-if="topProjects.length > 0">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold flex items-center gap-2">
          <FolderGit2 class="h-5 w-5 text-primary" />
          精选项目
        </h2>
        <router-link to="/projects" class="text-sm text-primary hover:underline flex items-center gap-1">
          全部 <ArrowRight class="h-3 w-3" />
        </router-link>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ProjectCard v-for="repo in topProjects" :key="repo.name" :repo="repo" />
      </div>
    </section>

    <!-- ====== 最近游戏评测 ====== -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold flex items-center gap-2">
          <Gamepad2 class="h-5 w-5 text-primary" />
          最近游戏评测
        </h2>
        <router-link to="/games" class="text-sm text-primary hover:underline flex items-center gap-1">
          全部 <ArrowRight class="h-3 w-3" />
        </router-link>
      </div>
      <div v-if="games.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GameCard v-for="g in games" :key="g.linkId" :game="g" compact />
      </div>
      <div v-else class="text-center py-8 text-muted-foreground text-sm">
        暂无游戏评测
      </div>
    </section>

    <!-- ====== 在追番剧 ====== -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold flex items-center gap-2">
          <Tv class="h-5 w-5 text-primary" />
          在追番剧
        </h2>
        <router-link to="/anime" class="text-sm text-primary hover:underline flex items-center gap-1">
          全部 <ArrowRight class="h-3 w-3" />
        </router-link>
      </div>
      <div v-if="animeLoading" class="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 class="h-4 w-4 animate-spin" /> 加载中...
      </div>
      <div v-else-if="watching.length > 0" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        <AnimeCard v-for="item in watching" :key="item.subject_id" :item="item" compact />
      </div>
      <div v-else class="text-center py-8 text-muted-foreground text-sm">
        暂无在追番剧
      </div>
    </section>
  </div>
</template>
