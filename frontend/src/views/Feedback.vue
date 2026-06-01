<template>
  <main class="feedback-page" :class="{ 'feedback-page--dark': isDark }">
    <section class="feedback-card">
      <a class="feedback-icon-link" :href="formUrl" target="_blank" rel="noopener noreferrer" aria-label="Open Apolaki feedback form">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5.8A2.8 2.8 0 0 1 6.8 3h10.4A2.8 2.8 0 0 1 20 5.8v7.4a2.8 2.8 0 0 1-2.8 2.8H9.1L5 20v-4.2a2.8 2.8 0 0 1-1-2.1V5.8Z" />
          <path d="M8 8h8M8 11.5h5" />
        </svg>
      </a>
      <span class="eyebrow">Product feedback</span>
      <h1>Help improve Apolaki</h1>
      <p>Use the feedback icon to open the short Microsoft Form in a new tab.</p>
      <div class="feedback-actions">
        <a class="primary-link" :href="formUrl" target="_blank" rel="noopener noreferrer">Open form</a>
        <router-link class="secondary-link" to="/">Back to assessment</router-link>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useThemeStore } from '../stores/themeStore'

const formUrl = 'https://forms.cloud.microsoft/r/9FYr3SSbvs'
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDarkMode)
</script>

<style scoped>
.feedback-page {
  display: grid;
  min-height: calc(100vh - 56px);
  place-items: center;
  background: #f7fafc;
  color: #16202a;
  padding: 28px 18px 56px;
}

.feedback-page--dark {
  background: #0f141a;
  color: #f5f7fb;
}

.feedback-card {
  width: min(100%, 560px);
  border: 1px solid rgba(15, 108, 189, 0.12);
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 18px 55px rgba(15, 23, 42, 0.08);
  padding: 34px;
  text-align: center;
}

.feedback-page--dark .feedback-card {
  border-color: rgba(255, 255, 255, 0.08);
  background: #171d23;
  box-shadow: none;
}

.feedback-icon-link {
  display: inline-grid;
  width: 76px;
  height: 76px;
  place-items: center;
  border-radius: 22px;
  background: #0f6cbd;
  color: #ffffff;
  box-shadow: 0 14px 34px rgba(15, 108, 189, 0.25);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.feedback-icon-link:hover {
  box-shadow: 0 18px 42px rgba(15, 108, 189, 0.34);
  transform: translateY(-2px);
}

.feedback-page--dark .feedback-icon-link {
  background: #f4c94c;
  color: #142033;
}

.feedback-icon-link svg {
  width: 34px;
  height: 34px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.eyebrow {
  display: block;
  margin-top: 20px;
  color: #0f6cbd;
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.feedback-page--dark .eyebrow {
  color: #f4c94c;
}

h1 {
  margin: 12px 0;
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 0.98;
  font-weight: 950;
}

p {
  max-width: 380px;
  margin: 0 auto;
  color: #5d6b7a;
  line-height: 1.65;
}

.feedback-page--dark p {
  color: #b8c2ce;
}

.feedback-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 24px;
}

.primary-link,
.secondary-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 900;
  text-decoration: none;
}

.primary-link {
  background: #0f6cbd;
  color: #ffffff;
}

.secondary-link {
  background: #e8f2fb;
  color: #0f6cbd;
}

@media (max-width: 560px) {
  .feedback-card {
    padding: 26px 20px;
  }
}
</style>
