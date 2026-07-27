<script setup lang="ts">
import type { ArticleMeta } from "@/types";
import { CATEGORY_CONFIG } from "@/types";
import { cn } from "@/utils/cn";
import Card from "@/components/ui/Card.vue";
import Badge from "@/components/ui/Badge.vue";
import { Calendar } from "lucide-vue-next";

const props = defineProps<{ article: ArticleMeta }>();
const catConfig = CATEGORY_CONFIG[props.article.category] || CATEGORY_CONFIG.general;
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
      <div :class="article.cover ? 'p-4' : 'p-5'">
        <div class="flex items-center gap-2 mb-2">
          <Badge variant="outline" :class="cn('text-xs px-1.5 py-0 shrink-0', catConfig.color)">
            {{ catConfig.label }}
          </Badge>
          <span class="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar class="h-3 w-3" />
            {{ article.date }}
          </span>
        </div>
        <h3 class="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2 mb-1">
          {{ article.title }}
        </h3>
        <p class="text-xs text-muted-foreground line-clamp-2">
          {{ article.excerpt }}
        </p>
      </div>
    </Card>
  </router-link>
</template>
