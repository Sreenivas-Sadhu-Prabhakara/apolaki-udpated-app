<template>
  <main class="feedback-page" :class="{ 'feedback-page--dark': isDark }">
    <section class="feedback-shell">
      <div class="feedback-intro">
        <span class="eyebrow">Product feedback</span>
        <h1>Help improve Apolaki</h1>
        <p>
          Tell us what worked, what felt confusing, and what would make the solar assessment easier to trust.
          It takes about two minutes.
        </p>
        <div class="feedback-actions">
          <a class="primary-link" :href="formUrl" target="_blank" rel="noopener noreferrer">Open feedback form</a>
          <router-link class="secondary-link" to="/">Back to assessment</router-link>
        </div>
      </div>

      <section class="form-panel" aria-label="Apolaki feedback form">
        <iframe
          :src="embedUrl"
          title="Apolaki app feedback form"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
        <div class="form-fallback">
          <p>If the form does not load here, open it in a new tab.</p>
          <a :href="formUrl" target="_blank" rel="noopener noreferrer">Open Microsoft Form</a>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useThemeStore } from '../stores/themeStore'

const formUrl = 'https://forms.cloud.microsoft/r/9FYr3SSbvs'
const embedUrl = `${formUrl}?embed=true`
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDarkMode)
</script>

<style scoped>
.feedback-page {
  min-height: calc(100vh - 56px);
  background: #f7fafc;
  color: #16202a;
  padding: 28px 18px 56px;
}

.feedback-page--dark {
  background: #0f141a;
  color: #f5f7fb;
}

.feedback-shell {
  display: grid;
  grid-template-columns: minmax(280px, 0.72fr) minmax(0, 1.28fr);
  gap: 22px;
  max-width: 1180px;
  margin: 0 auto;
  align-items: start;
}

.feedback-intro,
.form-panel {
  border: 1px solid rgba(15, 108, 189, 0.12);
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 18px 55px rgba(15, 23, 42, 0.08);
}

.feedback-intro {
  padding: 28px;
  position: sticky;
  top: 84px;
}

.feedback-page--dark .feedback-intro,
.feedback-page--dark .form-panel {
  border-color: rgba(255, 255, 255, 0.08);
  background: #171d23;
  box-shadow: none;
}

.eyebrow {
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
  font-size: clamp(2rem, 4vw, 3.5rem);
  line-height: 0.98;
  font-weight: 950;
}

p {
  margin: 0;
  color: #5d6b7a;
  line-height: 1.65;
}

.feedback-page--dark p {
  color: #b8c2ce;
}

.feedback-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.primary-link,
.secondary-link,
.form-fallback a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 900;
  text-decoration: none;
}

.primary-link,
.form-fallback a {
  background: #0f6cbd;
  color: #ffffff;
}

.secondary-link {
  background: #e8f2fb;
  color: #0f6cbd;
}

.form-panel {
  overflow: hidden;
}

iframe {
  display: block;
  width: 100%;
  min-height: 760px;
  border: 0;
  background: #ffffff;
}

.form-fallback {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border-top: 1px solid #e4ecf3;
  padding: 14px 16px;
  background: #f9fbfd;
}

.feedback-page--dark .form-fallback {
  border-color: rgba(255, 255, 255, 0.08);
  background: #11171d;
}

.form-fallback p {
  font-size: 0.9rem;
  font-weight: 700;
}

@media (max-width: 900px) {
  .feedback-shell {
    grid-template-columns: 1fr;
  }

  .feedback-intro {
    position: static;
  }

  iframe {
    min-height: 680px;
  }
}

@media (max-width: 560px) {
  .feedback-page {
    padding: 18px 12px 42px;
  }

  .feedback-intro {
    padding: 22px;
  }

  .form-fallback {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
