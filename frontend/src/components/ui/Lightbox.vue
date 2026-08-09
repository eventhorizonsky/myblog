<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { X, ChevronLeft, ChevronRight } from "lucide-vue-next";

export interface LightboxImage {
  src: string;
  alt?: string;
}

const props = withDefaults(defineProps<{
  open: boolean;
  images: LightboxImage[];
  initialIndex?: number;
}>(), {
  initialIndex: 0,
});

const emit = defineEmits<{ close: [] }>();

const index = ref(props.initialIndex);

watch(() => props.open, (val) => {
  if (val) index.value = props.initialIndex;
});

watch(() => props.initialIndex, (val) => {
  if (props.open) index.value = val;
});

function clamp(i: number) {
  if (props.images.length === 0) return 0;
  return (i + props.images.length) % props.images.length;
}

function prev() {
  if (props.images.length > 1) index.value = clamp(index.value - 1);
}
function next() {
  if (props.images.length > 1) index.value = clamp(index.value + 1);
}
function close() {
  emit("close");
}

// 键盘导航
function onKeydown(e: KeyboardEvent) {
  if (!props.open) return;
  if (e.key === "Escape") close();
  else if (e.key === "ArrowLeft") prev();
  else if (e.key === "ArrowRight") next();
}

// 触摸滑动
const touchStartX = ref(0);
function onTouchStart(e: TouchEvent) {
  touchStartX.value = e.touches[0].clientX;
}
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX.value;
  if (Math.abs(dx) > 40) {
    if (dx < 0) next();
    else prev();
  }
}

// 锁定背景滚动
watch(() => props.open, (val) => {
  document.body.style.overflow = val ? "hidden" : "";
});
onBeforeUnmount(() => {
  document.body.style.overflow = "";
});

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      @keydown="onKeydown"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
      tabindex="-1"
    >
      <!-- 关闭按钮 -->
      <button
        @click="close"
        class="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="关闭"
      >
        <X class="h-6 w-6" />
      </button>

      <!-- 上一张 -->
      <button
        v-if="images.length > 1"
        @click.stop="prev"
        class="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="上一张"
      >
        <ChevronLeft class="h-6 w-6" />
      </button>

      <!-- 下一张 -->
      <button
        v-if="images.length > 1"
        @click.stop="next"
        class="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="下一张"
      >
        <ChevronRight class="h-6 w-6" />
      </button>

      <!-- 图片 -->
      <img
        v-if="images[index]"
        :src="images[index].src"
        :alt="images[index].alt"
        class="max-w-[92vw] max-h-[85vh] object-contain select-none"
        draggable="false"
      />

      <!-- 底部信息：计数 + 说明 -->
      <div class="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-1 px-4 text-white/80">
        <p v-if="images[index]?.alt" class="text-sm text-center line-clamp-2 max-w-[80vw]">
          {{ images[index].alt }}
        </p>
        <p v-if="images.length > 1" class="text-xs text-white/60">
          {{ index + 1 }} / {{ images.length }}
        </p>
      </div>
    </div>
  </Teleport>
</template>
