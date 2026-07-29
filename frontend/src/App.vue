<script setup lang="ts">
import { ref, provide, onMounted } from "vue";
import AppHeader from "@/components/AppHeader.vue";

export interface SiteConfig {
  title: string;
  icp_beian?: string;
}

const siteConfig = ref<SiteConfig>({ title: "EventHorizon Blog" });
provide("siteConfig", siteConfig);

onMounted(async () => {
  try {
    const res = await fetch("/api/site-config");
    if (res.ok) {
      const config = await res.json();
      siteConfig.value = config;
      document.title = config.title || "EventHorizon Blog";
    }
  } catch { /* use default */ }
});
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <AppHeader />
    <main class="pb-12 flex-1">
      <router-view />
    </main>
    <footer class="border-t border-border/40 py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 text-center text-sm text-muted-foreground space-y-1">
        <p>{{ siteConfig.title }} · Powered by Vue + Vite</p>
        <p v-if="siteConfig.icp_beian">
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-foreground transition-colors"
          >{{ siteConfig.icp_beian }}</a>
        </p>
      </div>
    </footer>
  </div>
</template>
