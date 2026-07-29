<script setup lang="ts">
import { ref } from "vue";
import type { GameReview } from "@/types";
import Card from "@/components/ui/Card.vue";
import Badge from "@/components/ui/Badge.vue";
import { Calendar, ChevronDown, ChevronUp } from "lucide-vue-next";

const props = withDefaults(defineProps<{ game: GameReview; compact?: boolean }>(), { compact: false });
const hdCover = props.game.coverImage?.replace(/460x215/, "920x430") || "";
const expanded = ref(false);
</script>

<template>
  <Card class="overflow-hidden hover:shadow-sm transition-shadow break-inside-avoid">
    <div v-if="hdCover" class="relative w-full overflow-hidden bg-muted" style="aspect-ratio: 460/215">
      <img
        :src="hdCover"
        :alt="game.gameName"
        class="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
        @error="($event.target as HTMLImageElement).style.display = 'none'"
      />
    </div>

    <div class="p-4" :class="{ 'max-h-[320px] overflow-hidden': compact && !expanded }">
      <div class="flex items-center gap-2 mb-2">
        <Badge variant="outline" class="text-xs px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200 shrink-0">
          🎮
        </Badge>
        <span class="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar class="h-3 w-3" />
          {{ game.date }}
        </span>
      </div>

      <h4 class="font-medium text-sm mb-2">{{ game.gameName }}</h4>

      <p
        v-if="game.review"
        class="text-sm text-muted-foreground leading-relaxed whitespace-pre-line"
        :class="{ 'line-clamp-4': compact && !expanded }"
      >
        {{ game.review }}
      </p>

      <!-- 查看更多（紧凑模式） -->
      <button
        v-if="compact && game.review && game.review.length > 120"
        @click="expanded = !expanded"
        class="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
      >
        {{ expanded ? '收起' : '查看更多' }}
        <ChevronDown v-if="!expanded" class="h-3 w-3" />
        <ChevronUp v-else class="h-3 w-3" />
      </button>
    </div>
  </Card>
</template>
