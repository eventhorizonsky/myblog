<script setup lang="ts">
import { ref } from "vue";
import type { AnimeCollection } from "@/types";
import Card from "@/components/ui/Card.vue";
import Badge from "@/components/ui/Badge.vue";
import { Star, Hash, MessageCircle, ThumbsUp } from "lucide-vue-next";

const props = withDefaults(defineProps<{ item: AnimeCollection; compact?: boolean }>(), { compact: false });

const cover = props.item.subject.images?.common || props.item.subject.images?.medium || "";
const displayName = props.item.subject.name_cn || props.item.subject.name;
const hasOriginalName = props.item.subject.name_cn && props.item.subject.name !== props.item.subject.name_cn;
const hasPersonalRating = props.item.rate > 0;
const hasComment = !!props.item.comment;

const watchedEps = props.item.ep_status || 0;
const totalEps = props.item.subject.eps || 0;
const hasProgress = watchedEps > 0;
const progressPct = totalEps > 0
  ? Math.min(100, Math.round((watchedEps / totalEps) * 100))
  : 0;

const imageLoaded = ref(false);
const imageError = ref(false);

function onImageLoad() {
  imageLoaded.value = true;
}
function onImageError() {
  imageError.value = true;
  imageLoaded.value = true; // hide skeleton, show fallback
}

function openBangumi() {
  window.open(`https://bgm.tv/subject/${props.item.subject_id}`, "_blank", "noopener");
}
</script>

<template>
  <Card
    class="overflow-hidden hover:shadow-md transition-shadow break-inside-avoid cursor-pointer"
    @click="openBangumi"
  >
    <!-- 封面区域 -->
    <div v-if="cover && !imageError" class="relative w-full overflow-hidden bg-muted" style="aspect-ratio: 2/3">
      <!-- Skeleton -->
      <div
        v-if="!imageLoaded"
        class="absolute inset-0 bg-muted animate-pulse flex items-center justify-center"
      >
        <div class="w-8 h-8 rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/40 animate-spin" />
      </div>
      <!-- 图片 -->
      <img
        :src="cover"
        :alt="displayName"
        class="w-full h-full object-cover transition-opacity duration-300"
        :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
        loading="lazy"
        decoding="async"
        @load="onImageLoad"
        @error="onImageError"
      />
      <!-- 个人评分浮层 -->
      <div
        v-if="hasPersonalRating"
        class="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-3 pt-8"
      >
        <div class="flex items-center gap-1.5">
          <ThumbsUp class="h-4 w-4 text-amber-400" />
          <span class="text-white font-bold text-lg leading-none">{{ item.rate }}</span>
          <span class="text-white/60 text-xs">/ 10</span>
        </div>
      </div>
    </div>

    <!-- 封面加载失败占位 -->
    <div
      v-if="imageError || !cover"
      class="relative w-full bg-linear-to-br from-muted to-muted/50 flex items-center justify-center"
      style="aspect-ratio: 2/3"
    >
      <div class="text-center text-muted-foreground/30">
        <Star class="h-10 w-10 mx-auto mb-1" />
        <span class="text-xs">{{ displayName.slice(0, 4) }}</span>
      </div>
    </div>

    <!-- 紧凑模式：封面+标题+进度 -->
    <template v-if="compact">
      <div class="p-2">
        <h4 class="font-medium text-xs leading-snug line-clamp-2 text-center">
          {{ displayName }}
        </h4>
        <div v-if="hasProgress" class="mt-2 space-y-1">
          <div class="h-1 rounded-full bg-muted-foreground/20 overflow-hidden">
            <div
              class="h-full bg-primary rounded-full"
              :style="{ width: (progressPct || 4) + '%' }"
            />
          </div>
          <p class="text-center text-[10px] text-muted-foreground leading-none">
            <template v-if="totalEps > 0">{{ watchedEps }} / {{ totalEps }} 话</template>
            <template v-else>看到第 {{ watchedEps }} 话</template>
          </p>
        </div>
      </div>
    </template>

    <!-- 完整模式 -->
    <div v-else class="p-3 space-y-2.5">
      <div>
        <h4 class="font-semibold text-sm leading-snug line-clamp-2">
          {{ displayName }}
        </h4>
        <p v-if="hasOriginalName" class="text-[11px] text-muted-foreground/70 mt-0.5 line-clamp-1">
          {{ item.subject.name }}
        </p>
      </div>

      <div
        v-if="hasComment"
        class="relative bg-amber-50 dark:bg-amber-950/30 border-l-2 border-amber-400 rounded-r-md px-2.5 py-2"
      >
        <p class="text-xs leading-relaxed text-foreground/85 line-clamp-4">
          {{ item.comment }}
        </p>
      </div>

      <div
        v-if="hasPersonalRating && (imageError || !cover)"
        class="flex items-center gap-1.5 text-amber-500"
      >
        <ThumbsUp class="h-4 w-4" />
        <span class="font-bold text-base">{{ item.rate }}</span>
        <span class="text-xs text-muted-foreground">/ 10</span>
      </div>

      <div v-if="hasProgress" class="space-y-1">
        <div class="flex items-center justify-between text-[11px] text-muted-foreground/70">
          <span class="flex items-center gap-0.5">
            <template v-if="totalEps > 0">
              看到 {{ watchedEps }} / {{ totalEps }} 话
            </template>
            <template v-else>
              看到第 {{ watchedEps }} 话
            </template>
          </span>
          <span v-if="totalEps > 0">{{ progressPct }}%</span>
        </div>
        <div class="h-1 rounded-full bg-muted-foreground/20 overflow-hidden">
          <div
            class="h-full bg-primary rounded-full transition-all"
            :style="{ width: (progressPct || 4) + '%' }"
          />
        </div>
      </div>

      <div class="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground/60 pt-0.5 border-t border-border/30">
        <span v-if="item.subject.score" class="flex items-center gap-0.5">
          <Star class="h-3 w-3 fill-muted-foreground/40" />
          {{ item.subject.score.toFixed(1) }}
        </span>
        <span v-if="item.subject.rank" class="flex items-center gap-0.5">
          <Hash class="h-3 w-3" /> {{ item.subject.rank.toLocaleString() }}
        </span>
        <span v-if="item.subject.eps">全 {{ item.subject.eps }} 话</span>
      </div>

      <div v-if="item.subject.tags?.length" class="flex flex-wrap gap-1">
        <Badge
          v-for="tag in item.subject.tags.slice(0, 4)"
          :key="tag.name"
          variant="secondary"
          class="text-[10px] px-1.5 py-0"
        >
          {{ tag.name }}
        </Badge>
      </div>
    </div>
  </Card>
</template>
