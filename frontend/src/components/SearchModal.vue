<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { searchArticles } from "@/utils/markdown";
import type { ArticleMeta } from "@/types";
import { Search, Loader2, FileText, X } from "lucide-vue-next";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const router = useRouter();
const query = ref("");
const results = ref<ArticleMeta[]>([]);
const searching = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

// 打开时聚焦输入框
watch(() => props.open, async (val) => {
  if (val) {
    query.value = "";
    results.value = [];
    await nextTick();
    inputRef.value?.focus();
  }
});

// 搜索（防抖）
let timer: ReturnType<typeof setTimeout> | null = null;
function onInput() {
  if (timer) clearTimeout(timer);
  const q = query.value.trim();
  if (!q) {
    results.value = [];
    searching.value = false;
    return;
  }
  searching.value = true;
  timer = setTimeout(async () => {
    try {
      results.value = await searchArticles(q);
    } catch { results.value = []; }
    finally { searching.value = false; }
  }, 200);
}

function goToArticle(id: string) {
  emit("close");
  router.push(`/articles/${id}`);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") emit("close");
}

function onBackdropClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains("backdrop")) emit("close");
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="backdrop fixed inset-0 z-[100] bg-black/40 flex items-start justify-center pt-[15vh]"
      @click="onBackdropClick"
      @keydown="onKeydown"
    >
      <div class="w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <!-- 搜索框 -->
        <div class="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search class="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            placeholder="搜索文章..."
            class="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            @input="onInput"
          />
          <button
            @click="emit('close')"
            class="p-1 rounded hover:bg-muted transition-colors shrink-0"
          >
            <X class="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <!-- 结果列表 -->
        <div class="max-h-[60vh] overflow-y-auto">
          <!-- 搜索中 -->
          <div v-if="searching" class="flex items-center gap-2 text-sm text-muted-foreground px-4 py-8 justify-center">
            <Loader2 class="h-4 w-4 animate-spin" /> 搜索中...
          </div>

          <!-- 无结果 -->
          <div v-else-if="query && results.length === 0 && !searching" class="text-center py-8 text-sm text-muted-foreground">
            未找到相关文章
          </div>

          <!-- 结果 -->
          <div v-else-if="results.length > 0" class="py-2">
            <button
              v-for="item in results"
              :key="item.id"
              @click="goToArticle(item.id)"
              class="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border/40 last:border-0"
            >
              <div class="flex items-center gap-2">
                <FileText class="h-4 w-4 text-muted-foreground shrink-0" />
                <span class="text-sm font-medium truncate">{{ item.title }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-0.5 line-clamp-1 ml-6">
                {{ item.date }} · {{ item.excerpt }}
              </p>
            </button>
          </div>

          <!-- 初始提示 -->
          <div v-else class="text-center py-8 text-sm text-muted-foreground">
            输入关键词搜索文章标题和内容
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
