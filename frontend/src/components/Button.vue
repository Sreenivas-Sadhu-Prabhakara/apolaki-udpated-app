<template>
  <component
    :is="tag"
    :href="href"
    :type="type"
    :disabled="disabled"
    :class="['btn', `btn-${variant}`, `btn-${size}`, { 'btn-loading': loading, 'btn-disabled': disabled }]"
    @click="$emit('click')"
  >
    <span v-if="loading" class="btn-spinner"></span>
    <slot />
  </component>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'success', 'warning', 'danger', 'outline', 'ghost'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  type: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value)
  },
  href: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])

const tag = defineModel('href') ? 'a' : 'button'
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
  text-decoration: none;
  font-family: inherit;
  outline: none;
}

/* Variants */
.btn-primary {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
}

.btn-primary:hover:not(.btn-disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
}

.btn-secondary {
  background: #e5e7eb;
  color: #1f2937;
}

.btn-secondary:hover:not(.btn-disabled) {
  background: #d1d5db;
}

.btn-success {
  background: #22c55e;
  color: white;
}

.btn-success:hover:not(.btn-disabled) {
  background: #16a34a;
}

.btn-warning {
  background: #eab308;
  color: white;
}

.btn-warning:hover:not(.btn-disabled) {
  background: #ca8a04;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(.btn-disabled) {
  background: #dc2626;
}

.btn-outline {
  background: transparent;
  color: #f97316;
  border: 2px solid #f97316;
}

.btn-outline:hover:not(.btn-disabled) {
  background: #f97316;
  color: white;
}

.btn-ghost {
  background: transparent;
  color: #374151;
}

.btn-ghost:hover:not(.btn-disabled) {
  background: #f3f4f6;
}

/* Sizes */
.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.05rem;
}

/* States */
.btn-disabled,
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-loading {
  pointer-events: none;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
