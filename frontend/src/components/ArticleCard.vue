<script setup lang="ts">
import type { ArticleMeta } from "@/types";
import { CATEGORY_CONFIG } from "@/types";
import { cn } from "@/utils/cn";
import Card from "@/components/ui/Card.vue";
import Badge from "@/components/ui/Badge.vue";
import { Calendar } from "lucide-vue-next";

const props = defineProps<{ article: ArticleMeta }>();
const catConfig = CATEGORY_CONFIG[props.article.category] || CATEGORY_CONFIG.general;

// 基于标题字符串选一个渐变
const gradients = [
  "from-slate-300/60 to-slate-400/60",
  "from-stone-300/60 to-stone-400/60",
  "from-blue-200/50 to-slate-300/50",
  "from-teal-200/50 to-cyan-300/50",
  "from-violet-200/50 to-purple-300/50",
  "from-rose-200/50 to-pink-300/50",
];
const gradIdx = (props.article.id || props.article.title || "").length % gradients.length;
const placeholderGradient = gradients[gradIdx];
</script>

<template>
  <router-link :to="`/articles/${article.id}`" class="block group">
    <Card class="hover:shadow-sm transition-shadow hover:border-primary/50 cursor-pointer overflow-hidden h-full">
      <!-- 封面图 -->
      <div
        v-if="article.cover"
        class="w-full overflow-hidden bg-muted"
        style="aspect-ratio: 16/9"
      >
        <img
          :src="article.cover"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
      </div>
      <!-- 无封面占位 -->
      <div
        v-else
        class="w-full overflow-hidden bg-linear-to-br flex items-center justify-center p-4"
        :class="placeholderGradient"
        style="aspect-ratio: 16/9"
      >
        <span class="text-gray-700 dark:text-white/80 text-sm font-medium text-center line-clamp-3 leading-snug">
          {{ article.title }}
        </span>
      </div>
      <div class="p-4">
        <div class="flex items-center gap-2 mb-2">
          <Badge variant="outline" :class="cn('text-xs px-1.5 py-0 shrink-0', catConfig.color)">
            {{ catConfig.label }}
          </Badge>
          <span class="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar class="h-3 w-3" />
            {{ article.date }}
          </span>
        </div>
        <h3 class="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2 mb-1" v-html="article.title" />
        <p class="text-xs text-muted-foreground line-clamp-2">
          {{ article.excerpt }}
        </p>
      </div>
    </Card>
  </router-link>
</template>
