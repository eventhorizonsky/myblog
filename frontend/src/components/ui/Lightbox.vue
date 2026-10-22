<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-vue-next";

export interface LightboxImage {
  /** 大图地址（灯箱加载这个） */
  src: string;
  /** 可选：已在页面里加载过的缩略图，作为原图加载前的占位，避免白屏 */
  thumb?: string;
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
// 原图是否已加载完成（用于占位层 → 原图淡入）
const loaded = ref(false);
// 缩略图加载失败时，退回直接加载原图
const thumbFailed = ref(false);
// 是否显示加载提示。延迟出现，避免原图秒开时闪一下；
// 加载完成后短暂显示「已切换为原图」，然后自动淡出。
const showHint = ref(false);

let hintTimer: ReturnType<typeof setTimeout> | undefined;
let doneTimer: ReturnType<typeof setTimeout> | undefined;

function clearHintTimers() {
  if (hintTimer) { clearTimeout(hintTimer); hintTimer = undefined; }
  if (doneTimer) { clearTimeout(doneTimer); doneTimer = undefined; }
}

/** 开始一轮新的加载提示计时 */
function scheduleHint() {
  clearHintTimers();
  showHint.value = false;
  // 原图 300ms 内加载完就不打扰用户
  hintTimer = setTimeout(() => {
    if (!loaded.value) showHint.value = true;
  }, 300);
}

/** 原图加载完成：若有提示则改成「已切换为原图」，片刻后淡出 */
function onOriginLoaded() {
  loaded.value = true;
  clearHintTimers();
  if (!showHint.value) return;
  doneTimer = setTimeout(() => { showHint.value = false; }, 1200);
}

const current = computed(() => props.images[index.value]);

/**
 * 是否有独立的原图需要加载。
 * 有 thumb 且 thumb !== src 时，才需要「缩略图占位 + 原图覆盖」这套逻辑；
 * 否则直接显示 src 本身（普通图片、或 thumb 与原图相同的场景）。
 */
const needsOrigin = computed(() => {
  if (!current.value) return false;
  if (thumbFailed.value) return false;
  return !!current.value.thumb && current.value.thumb !== current.value.src;
});

/** 占位层显示什么：优先用缩略图，退化时直接用原图 */
const placeholderSrc = computed(() => {
  const img = current.value;
  if (!img) return "";
  if (img.thumb && !thumbFailed.value) return img.thumb;
  return img.src;
});

// 切换图片时重置加载状态，并重新开始提示计时
watch(index, () => {
  loaded.value = false;
  thumbFailed.value = false;
  if (props.open) scheduleHint();
});

watch(() => props.open, (val) => {
  if (val) {
    index.value = props.initialIndex;
    loaded.value = false;
    thumbFailed.value = false;
    scheduleHint();
  } else {
    clearHintTimers();
    showHint.value = false;
  }
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

onMounted(() => window.addEventListener("keydown", onKeydown));

// 统一在卸载时清理：恢复滚动、移除键盘监听、清掉提示定时器
onBeforeUnmount(() => {
  document.body.style.overflow = "";
  window.removeEventListener("keydown", onKeydown);
  clearHintTimers();
});
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

      <!-- 图片：占位层始终在文档流中撑开尺寸，原图作为覆盖层淡入 -->
      <div v-if="images[index]" class="relative">
        <!--
          占位层：负责决定容器尺寸，保证整块居中且不变形。
          原图加载完成后给它加 opacity-0 隐藏（但保留占位，避免容器塌缩导致位置跳动）。
        -->
        <img
          :src="placeholderSrc"
          alt=""
          class="max-w-[92vw] max-h-[85vh] object-contain select-none transition-opacity duration-200"
          :class="[
            needsOrigin && !loaded ? 'blur-sm opacity-80' : '',
            needsOrigin && loaded ? 'opacity-0' : '',
          ]"
          draggable="false"
          aria-hidden="true"
          @error="thumbFailed = true"
        />
        <!-- 原图层：绝对覆盖在占位层之上，加载完成后淡入 -->
        <img
          v-if="needsOrigin"
          :key="images[index].src"
          :src="images[index].src"
          :alt="images[index].alt"
          class="absolute inset-0 w-full h-full object-contain select-none transition-opacity duration-200"
          :class="loaded ? 'opacity-100' : 'opacity-0'"
          draggable="false"
          @load="onOriginLoaded"
        />
        <!--
          原图加载中的提醒：浮在图片区域内，非阻断。
          说明「当前看到的是压缩预览」，加载完成后自动消失。
        -->
        <div
          v-if="needsOrigin"
          class="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none
                 flex items-center gap-1.5 whitespace-nowrap
                 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white/90
                 ring-1 ring-white/15 backdrop-blur-sm
                 transition-opacity duration-300"
          :class="showHint ? 'opacity-100' : 'opacity-0'"
          role="status"
          aria-live="polite"
        >
          <Loader2 class="h-3.5 w-3.5 animate-spin shrink-0" />
          <span v-if="!loaded">原图加载中 · 当前为压缩预览</span>
          <span v-else>已切换为原图</span>
        </div>
      </div>

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
