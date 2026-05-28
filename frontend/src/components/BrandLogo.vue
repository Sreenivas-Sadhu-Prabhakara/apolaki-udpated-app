<template>
  <component :is="to ? 'router-link' : 'div'" :to="to" class="brand-logo" :class="[`brand-logo--${size}`, { 'brand-logo--wordmark': wordmark }]">
    <img class="brand-logo__mark" src="/brand/apolaki-logo.svg" alt="Apolaki Solar logo">
    <span v-if="wordmark" class="brand-logo__text">{{ text }}</span>
  </component>
</template>

<script setup>
defineProps({
  size: {
    type: String,
    default: 'md',
    validator: value => ['sm', 'md', 'lg', 'xl'].includes(value)
  },
  text: {
    type: String,
    default: 'Apolaki Solar'
  },
  to: {
    type: String,
    default: ''
  },
  wordmark: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped>
.brand-logo {
  align-items: center;
  color: inherit;
  display: inline-flex;
  gap: 0.55rem;
  min-width: 0;
  text-decoration: none;
}

.brand-logo__mark {
  display: block;
  flex: 0 0 auto;
  object-fit: contain;
}

.brand-logo__text {
  color: currentColor;
  font-weight: 800;
  letter-spacing: -0.03em;
  white-space: nowrap;
}

.brand-logo--sm .brand-logo__mark {
  height: 2rem;
  width: 2rem;
}

.brand-logo--md .brand-logo__mark {
  height: 2.75rem;
  width: 2.75rem;
}

.brand-logo--lg .brand-logo__mark {
  height: 4.5rem;
  width: 4.5rem;
}

.brand-logo--xl .brand-logo__mark {
  height: 7rem;
  width: 7rem;
}

.brand-logo--sm .brand-logo__text {
  font-size: 1rem;
}

.brand-logo--md .brand-logo__text {
  font-size: 1.125rem;
}

.brand-logo--lg .brand-logo__text {
  font-size: 1.65rem;
}

.brand-logo--xl {
  flex-direction: column;
  gap: 0.9rem;
  text-align: center;
}

.brand-logo--xl .brand-logo__text {
  font-size: 1.35rem;
}
</style>
