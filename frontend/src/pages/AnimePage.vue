<script setup lang="ts">
import { Tv } from "lucide-vue-next";
import Card from "@/components/ui/Card.vue";
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
    <div>
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <Tv class="h-6 w-6 text-primary" />
        动漫
      </h1>
      <p class="text-muted-foreground mt-1">追番列表与 Bangumi 集成（即将推出）</p>
    </div>

    <Card class="border-dashed">
      <div class="p-12 text-center">
        <Tv class="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
        <h3 class="text-lg font-semibold mb-2">敬请期待</h3>
        <p class="text-sm text-muted-foreground max-w-md mx-auto">
          动漫模块将通过 Bangumi API 集成追番列表、评分记录和观看历史。功能正在开发中。
        </p>
      </div>
    </Card>
  </div>
</template>
