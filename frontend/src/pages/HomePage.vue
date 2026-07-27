<script setup lang="ts">
import { computed } from "vue";
import { loadAllArticles } from "@/utils/markdown";
import Card from "@/components/ui/Card.vue";
import { FileText, Gamepad2, Tv, ArrowRight } from "lucide-vue-next";
import ArticleCard from "@/components/ArticleCard.vue";
import { useRouter } from "vue-router";

const router = useRouter();
const articles = computed(() => loadAllArticles().slice(0, 6));

const quickLinks = [
  { title: "文章", desc: "游戏评测、技术教程、社区分享", icon: FileText, to: "/articles", color: "from-blue-500/10 to-purple-500/10 border-blue-500/20" },
  { title: "游戏", desc: "小黑盒评测同步、游戏记录", icon: Gamepad2, to: "/games", color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20" },
  { title: "动漫", desc: "追番列表、Bangumi 集成（即将推出）", icon: Tv, to: "/anime", color: "from-pink-500/10 to-rose-500/10 border-pink-500/20" },
];
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
    <!-- Hero -->
    <div class="text-center py-12">
      <h1 class="text-3xl font-bold tracking-tight">
        EventHorizon
        <span class="text-primary"> Blog</span>
      </h1>
      <p class="text-muted-foreground mt-3 max-w-lg mx-auto">
        游戏评测、技术分享、动漫追番。整合小黑盒动态，一处记录。
      </p>
    </div>

    <!-- Quick Links -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card
        v-for="link in quickLinks"
        :key="link.to"
        :class="`bg-gradient-to-br ${link.color} cursor-pointer hover:shadow-md transition-all group`"
        @click="router.push(link.to)"
      >
        <div class="p-6">
          <component :is="link.icon" class="h-8 w-8 text-primary mb-3" />
          <h3 class="font-semibold mb-1">{{ link.title }}</h3>
          <p class="text-sm text-muted-foreground mb-3">{{ link.desc }}</p>
          <span class="text-xs text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
            进入 <ArrowRight class="h-3 w-3" />
          </span>
        </div>
      </Card>
    </div>

    <!-- Recent Articles -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold flex items-center gap-2">
          <FileText class="h-5 w-5 text-primary" />
          最近文章
        </h2>
        <router-link to="/articles" class="text-sm text-primary hover:underline flex items-center gap-1">
          查看全部 <ArrowRight class="h-3 w-3" />
        </router-link>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ArticleCard v-for="a in articles" :key="a.id" :article="a" />
      </div>
      <div v-if="articles.length === 0" class="text-center py-12 text-muted-foreground">
        <FileText class="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p class="text-sm">还没有文章，运行同步脚本或添加 Markdown 文件到 doc/ 目录</p>
      </div>
    </div>
  </div>
</template>
