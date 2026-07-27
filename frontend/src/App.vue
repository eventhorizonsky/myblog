<script setup lang="ts">
import AppHeader from "@/components/AppHeader.vue";
</script>

<template>
  <div class="min-h-screen bg-background">
    <AppHeader />
    <main class="pb-12">
      <router-view />
    </main>
    <footer class="border-t border-border/40 py-6 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 text-center text-sm text-muted-foreground">
        EventHorizon Blog · Powered by Vue + Vite
      </div>
    </footer>
  </div>
</template>
