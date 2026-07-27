<script setup lang="ts">
import { useAttrs } from "vue";

defineProps<{ variant?: "default" | "secondary" | "outline" | "destructive" }>();
const attrs = useAttrs();
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors',
      variant === 'default' ? 'border-transparent bg-primary text-primary-foreground shadow'
        : variant === 'secondary' ? 'border-transparent bg-secondary text-secondary-foreground'
        : variant === 'destructive' ? 'border-transparent bg-destructive text-destructive-foreground shadow'
        : 'text-foreground',
      attrs.class,
    ]"
  >
    <slot />
  </span>
</template>
