<template>
  <div class="mb-10 flex items-center gap-4">
    <div class="h-px flex-1 bg-gradient-to-r from-magenta-500/60 via-neon-400/60 to-transparent"></div>
    <h2
      class="glitch text-3xl font-extrabold uppercase tracking-[0.3em] sm:text-4xl"
      :data-text="title"
    >
      {{ title }}
    </h2>
    <div class="h-px flex-1 bg-gradient-to-l from-magenta-500/60 via-neon-400/60 to-transparent"></div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true
  }
});
</script>
