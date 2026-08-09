<script setup lang="ts">
import { ref } from "vue";
import type { GitHubRepo } from "@/types";
import Card from "@/components/ui/Card.vue";
import { Star, GitFork, ExternalLink, Github } from "lucide-vue-next";

const props = defineProps<{ repo: GitHubRepo }>();

const displayDesc = props.repo.description || "暂无描述";
const imgError = ref(false);
</script>

<template>
  <Card class="overflow-hidden hover:shadow-md transition-shadow group">
    <!-- OG 封面图 -->
    <div
      v-if="repo.og_image && !imgError"
      class="relative w-full overflow-hidden bg-muted"
      style="aspect-ratio: 1200/630"
    >
      <img
        :src="repo.og_image"
        :alt="repo.name"
        class="w-full h-full object-cover dark:brightness-75 dark:saturate-75 transition-[filter]"
        loading="lazy"
        @error="imgError = true"
      />
    </div>

    <!-- 无图时的占位 -->
    <div
      v-else
      class="flex items-center justify-center bg-muted"
      style="aspect-ratio: 1200/630"
    >
      <Github class="h-8 w-8 text-muted-foreground/30" />
    </div>

    <div class="p-4 space-y-3">
      <!-- 仓库名 -->
      <div class="flex items-start justify-between gap-2">
        <a
          :href="repo.url"
          target="_blank"
          rel="noopener noreferrer"
          class="font-semibold text-sm text-primary hover:underline flex items-center gap-1.5 min-w-0"
        >
          <span class="truncate">{{ repo.name }}</span>
          <ExternalLink class="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      </div>

      <!-- 描述 -->
      <p class="text-xs text-muted-foreground leading-relaxed line-clamp-3">
        {{ displayDesc }}
      </p>

      <!-- 底部信息行 -->
      <div class="flex items-center gap-3 flex-wrap pt-1">
        <!-- 语言 -->
        <div v-if="repo.language" class="flex items-center gap-1.5">
          <span
            class="inline-block w-3 h-3 rounded-full shrink-0"
            :style="{ backgroundColor: repo.language_color || '#6b7280' }"
          ></span>
          <span class="text-xs text-muted-foreground">{{ repo.language }}</span>
        </div>

        <!-- Stars -->
        <div class="flex items-center gap-1 text-xs text-muted-foreground">
          <Star class="h-3.5 w-3.5" />
          <span>{{ repo.stars }}</span>
        </div>

        <!-- Forks -->
        <div class="flex items-center gap-1 text-xs text-muted-foreground">
          <GitFork class="h-3.5 w-3.5" />
          <span>{{ repo.forks }}</span>
        </div>
      </div>
    </div>
  </Card>
</template>
