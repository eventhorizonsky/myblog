<script setup lang="ts">
import { ref, inject, computed } from "vue";
import { useRoute } from "vue-router";
import { cn } from "@/utils/cn";
import { Home, FileText, Gamepad2, Tv, Sun, Moon, FolderGit2, Search } from "lucide-vue-next";
import type { SiteConfig } from "@/App.vue";
import type { Ref } from "vue";
import SearchModal from "@/components/SearchModal.vue";

const route = useRoute();
const isDark = ref(false);
const searchOpen = ref(false);
const siteConfig = inject<Ref<SiteConfig>>("siteConfig");
const siteTitle = computed(() => siteConfig?.value?.title || "EventHorizon Blog");

function toggleDark() {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle("dark", isDark.value);
}

const navItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/articles", label: "文章", icon: FileText },
  { href: "/projects", label: "项目", icon: FolderGit2 },
  { href: "/games", label: "游戏", icon: Gamepad2 },
  { href: "/anime", label: "动漫", icon: Tv },
];
</script>

<template>
  <header class="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
    <!-- PC 端：单行布局 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="hidden sm:flex items-center justify-between h-12">
        <router-link to="/" class="flex items-center gap-2 font-bold shrink-0">
          <Gamepad2 class="h-5 w-5 text-primary" />
          <span class="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            {{ siteTitle }}
          </span>
        </router-link>

        <nav class="flex items-center gap-0.5">
          <router-link
            v-for="item in navItems"
            :key="item.href"
            :to="item.href"
            :class="
              cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                route.path === item.href
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )
            "
          >
            <component :is="item.icon" class="h-3.5 w-3.5" />
            <span>{{ item.label }}</span>
          </router-link>
        </nav>

        <div class="flex items-center gap-0.5 shrink-0">
          <button
            @click="searchOpen = true"
            class="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Search class="h-4 w-4" />
          </button>
          <button
            @click="toggleDark()"
            class="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Sun v-if="isDark" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- 移动端：两行布局 -->
      <div class="sm:hidden">
        <!-- 上排：Logo + 操作 -->
        <div class="flex items-center justify-between h-10">
          <router-link to="/" class="flex items-center gap-1.5 font-bold shrink-0">
            <Gamepad2 class="h-4 w-4 text-primary" />
            <span class="text-sm bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              {{ siteTitle }}
            </span>
          </router-link>
          <div class="flex items-center gap-0.5 shrink-0">
            <button
              @click="searchOpen = true"
              class="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Search class="h-3.5 w-3.5" />
            </button>
            <button
              @click="toggleDark()"
              class="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Sun v-if="isDark" class="h-3.5 w-3.5" />
              <Moon v-else class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <!-- 下排：页面导航（仅图标） -->
        <div class="border-t border-border/40">
          <nav class="flex items-center justify-center gap-0.5 py-1 overflow-x-auto">
            <router-link
              v-for="item in navItems"
              :key="item.href"
              :to="item.href"
              :class="
                cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0',
                  route.path === item.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )
              "
            >
              <component :is="item.icon" class="h-3.5 w-3.5" />
            </router-link>
          </nav>
        </div>
      </div>
    </div>
  </header>
  <SearchModal :open="searchOpen" @close="searchOpen = false" />
</template>
