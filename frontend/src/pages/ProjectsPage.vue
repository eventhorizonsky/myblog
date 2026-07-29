<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { GitHubRepo } from "@/types";
import ProjectCard from "@/components/ProjectCard.vue";
import { FolderGit2, Loader2, AlertCircle } from "lucide-vue-next";

const repos = ref<GitHubRepo[]>([]);
const loading = ref(false);
const error = ref(false);

async function loadProjects() {
  loading.value = true;
  error.value = false;
  try {
    const res = await fetch("/api/github-projects");
    if (res.ok) {
      repos.value = await res.json();
    } else {
      error.value = true;
    }
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(() => { loadProjects(); });
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <FolderGit2 class="h-6 w-6 text-primary" />
        项目
      </h1>
      <p class="text-muted-foreground mt-1">GitHub 精选项目</p>
    </div>

    <!-- 加载态 -->
    <div v-if="loading" class="flex items-center gap-2 text-sm text-muted-foreground py-8">
      <Loader2 class="h-4 w-4 animate-spin" /> 正在加载...
    </div>

    <!-- 错误态 -->
    <div v-else-if="error" class="text-center py-16 text-muted-foreground">
      <AlertCircle class="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p class="text-sm">项目加载失败</p>
      <button
        @click="loadProjects()"
        class="mt-3 text-sm text-primary hover:underline"
      >
        重新加载
      </button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="repos.length === 0" class="text-center py-16 text-muted-foreground">
      <FolderGit2 class="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p class="text-sm">暂无置顶项目</p>
    </div>

    <!-- 项目卡片网格 -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <ProjectCard v-for="repo in repos" :key="repo.name" :repo="repo" />
    </div>
  </div>
</template>
