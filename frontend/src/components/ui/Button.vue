<script setup lang="ts">
import { cn } from "@/utils/cn";

const props = withDefaults(
  defineProps<{
    variant?: "default" | "outline" | "ghost" | "secondary";
    size?: "default" | "sm" | "lg";
    class?: string;
    disabled?: boolean;
  }>(),
  { variant: "default", size: "default", disabled: false }
);
</script>

<template>
  <button
    :class="
      cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-primary text-primary-foreground shadow hover:bg-primary/90': variant === 'default',
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground': variant === 'outline',
          'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80': variant === 'secondary',
          'h-9 px-4 py-2': size === 'default',
          'h-8 rounded-md px-3 text-xs': size === 'sm',
          'h-10 rounded-md px-8': size === 'lg',
        },
        props.class
      )
    "
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
