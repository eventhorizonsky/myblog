<script setup lang="ts">
import { ref, inject } from "vue";
import { useRoute } from "vue-router";
import { cn } from "@/utils/cn";
import { Home, FileText, Gamepad2, Tv, Sun, Moon } from "lucide-vue-next";
import type { SiteConfig } from "@/App.vue";
import type { Ref } from "vue";

const route = useRoute();
const isDark = ref(false);
const siteConfig = inject<Ref<SiteConfig>>("siteConfig");
const siteTitle = siteConfig?.value?.title || "EventHorizon Blog";

function toggleDark() {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle("dark", isDark.value);
}

const navItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/articles", label: "文章", icon: FileText },
  { href: "/games", label: "游戏", icon: Gamepad2 },
  { href: "/anime", label: "动漫", icon: Tv },
];
</script>

<template>
  <header class="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="flex items-center justify-between h-14">
        <router-link to="/" class="flex items-center gap-2 font-bold">
          <Gamepad2 class="h-5 w-5 text-primary" />
          <span class="hidden sm:inline bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            {{ siteTitle }}
          </span>
        </router-link>

        <nav class="flex items-center gap-1">
          <router-link
            v-for="item in navItems"
            :key="item.href"
            :to="item.href"
            :class="
              cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                route.path === item.href
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )
            "
          >
            <component :is="item.icon" class="h-4 w-4" />
            <span class="hidden md:inline">{{ item.label }}</span>
          </router-link>
        </nav>

        <button
          @click="toggleDark()"
          class="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Sun v-if="isDark" class="h-4 w-4" />
          <Moon v-else class="h-4 w-4" />
        </button>
      </div>
    </div>
  </header>
</template>
