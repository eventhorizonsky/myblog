<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import type { GiscusConfig } from "@/config/giscus";

const props = defineProps<{ config: GiscusConfig; articleId: string }>();

const container = ref<HTMLDivElement | null>(null);
let observer: MutationObserver | null = null;

function theme() {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function initGiscus() {
  const el = container.value;
  if (!el) return;
  el.innerHTML = "";
  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.setAttribute("data-repo", props.config.repo);
  script.setAttribute("data-repo-id", props.config.repoId);
  script.setAttribute("data-category", props.config.category);
  script.setAttribute("data-category-id", props.config.categoryId);
  script.setAttribute("data-mapping", "pathname");
  script.setAttribute("data-strict", "0");
  script.setAttribute("data-reactions-enabled", "1");
  script.setAttribute("data-emit-metadata", "0");
  script.setAttribute("data-input-position", "bottom");
  script.setAttribute("data-theme", theme());
  script.setAttribute("data-lang", "zh-CN");
  script.crossOrigin = "anonymous";
  script.async = true;
  el.appendChild(script);
}

function watchTheme() {
  observer = new MutationObserver(() => {
    const frame = document.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
    frame?.contentWindow?.postMessage(
      { giscus: { setConfig: { theme: theme() } } },
      "https://giscus.app",
    );
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
}

const enabled = () =>
  !!props.config.repo && !!props.config.repoId && !!props.config.category && !!props.config.categoryId;

watch(() => props.articleId, () => {
  if (enabled()) initGiscus();
});

onMounted(() => {
  if (!enabled()) return;
  initGiscus();
  watchTheme();
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div class="mt-10">
    <h2 class="text-lg font-bold mb-4">评论</h2>
    <div v-if="enabled()" ref="container" class="giscus" />
    <p v-else class="text-sm text-muted-foreground">
      评论功能未配置，请先在
      <a
        href="https://giscus.app"
        target="_blank"
        rel="noopener"
        class="text-primary hover:underline"
      >giscus.app</a>
      完成配置并填入 src/config/giscus.ts。
    </p>
  </div>
</template>
