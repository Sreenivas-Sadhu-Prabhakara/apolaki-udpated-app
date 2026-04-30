<template>
  <div class="kitchen-sink-page">
    <header class="ks-hero">
      <div>
        <p class="ks-eyebrow">Kinetic Azure UI System</p>
        <h1>Kitchen Sink Screens</h1>
        <p class="ks-intro">
          Live reference screens from the latest Stitch Apolaki PRD bundle. Select a screen to preview the
          exact source HTML served by the app.
        </p>
      </div>
      <a class="ks-source-link" :href="selectedCodePath" target="_blank" rel="noreferrer">
        Open HTML
      </a>
    </header>

    <section class="ks-layout">
      <aside class="ks-screen-list" aria-label="Kitchen sink screens">
        <button
          v-for="screen in screens"
          :key="screen.slug"
          type="button"
          class="ks-screen-card"
          :class="{ 'ks-screen-card--active': selectedSlug === screen.slug }"
          @click="selectedSlug = screen.slug"
        >
          <img :src="screen.imagePath" :alt="`${screen.title} screenshot`" loading="lazy" />
          <span>{{ screen.title }}</span>
        </button>
      </aside>

      <main class="ks-preview-panel">
        <div class="ks-preview-header">
          <div>
            <p class="ks-eyebrow">Preview</p>
            <h2>{{ selectedScreen.title }}</h2>
          </div>
          <span>{{ selectedScreen.group }}</span>
        </div>
        <iframe
          class="ks-preview-frame"
          :src="selectedCodePath"
          :title="`${selectedScreen.title} HTML preview`"
        ></iframe>
      </main>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const basePath = '/kitchen-sink-ui'

const screens = [
  { slug: 'smart_assessment_step_1_blank_state', title: 'Assessment Blank State', group: 'Assessment' },
  { slug: 'smart_assessment_step_1_simplified_location', title: 'Assessment Location', group: 'Assessment' },
  { slug: 'property_usage_details_compact', title: 'Property Usage Details', group: 'Assessment' },
  { slug: 'roof_pinning_enhanced_zoom_satellite_view', title: 'Roof Pinning', group: 'Assessment' },
  { slug: 'solar_potential_data_simplified', title: 'Solar Potential Data', group: 'Assessment' },
  { slug: 'assessment_results_optimized_layout', title: 'Assessment Results', group: 'Assessment' },
  { slug: 'financing_plan_calculator_only', title: 'Financing Plan', group: 'Finance' },
  { slug: 'apolaki_intelligence_quick_view_consistent', title: 'Apolaki Intelligence', group: 'Dashboard' },
  { slug: 'active_components_with_live_flow', title: 'Active Components', group: 'Dashboard' },
  { slug: 'performance_analytics_monthly_view_home', title: 'Performance Analytics', group: 'Dashboard' },
  { slug: 'marketplace_suppliers_consistent_footer', title: 'Marketplace Suppliers', group: 'Marketplace' },
  { slug: 'marketplace_installers_consistent_footer', title: 'Marketplace Installers', group: 'Marketplace' },
  { slug: 'marketplace_consultants_consistent_footer', title: 'Marketplace Consultants', group: 'Marketplace' },
  { slug: 'login_signup_v6_smaller_logo', title: 'Login and Signup', group: 'Auth' }
].map((screen) => ({
  ...screen,
  codePath: `${basePath}/${screen.slug}/code.html`,
  imagePath: `${basePath}/${screen.slug}/screen.png`
}))

const selectedSlug = ref(screens[0].slug)
const selectedScreen = computed(() => screens.find((screen) => screen.slug === selectedSlug.value) || screens[0])
const selectedCodePath = computed(() => selectedScreen.value.codePath)
</script>

<style scoped>
.kitchen-sink-page {
  min-height: 100vh;
  background: #fdfdfd;
  color: #1a1c1e;
  padding: 2rem clamp(1rem, 3vw, 2.5rem);
}

.ks-hero {
  max-width: 88rem;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
}

.ks-eyebrow {
  margin: 0 0 0.45rem;
  color: #0f6cbd;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.ks-hero h1 {
  margin: 0;
  color: #0f6cbd;
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-weight: 900;
  letter-spacing: 0;
}

.ks-intro {
  max-width: 46rem;
  margin: 0.75rem 0 0;
  color: #475569;
  font-size: 1rem;
}

.ks-source-link {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0 1rem;
  border-radius: 0.75rem;
  background: #0f6cbd;
  color: white;
  font-weight: 800;
  text-decoration: none;
  box-shadow: 0 16px 30px rgba(15, 108, 189, 0.22);
}

.ks-layout {
  max-width: 88rem;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(17rem, 22rem) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;
}

.ks-screen-list {
  display: grid;
  gap: 0.75rem;
  max-height: calc(100vh - 9rem);
  overflow: auto;
  padding-right: 0.25rem;
}

.ks-screen-card {
  width: 100%;
  border: 0;
  border-radius: 0.75rem;
  background: white;
  box-shadow: 0 1px 8px rgba(15, 23, 42, 0.08);
  padding: 0.65rem;
  display: grid;
  grid-template-columns: 4.5rem minmax(0, 1fr);
  gap: 0.75rem;
  align-items: center;
  cursor: pointer;
  text-align: left;
  color: #1e293b;
  font-weight: 800;
}

.ks-screen-card img {
  width: 4.5rem;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 0.5rem;
  background: #e2e8f0;
}

.ks-screen-card--active {
  outline: 3px solid rgba(15, 108, 189, 0.22);
  background: #eef7ff;
  color: #0f6cbd;
}

.ks-preview-panel {
  min-width: 0;
  overflow: hidden;
  border-radius: 1rem;
  background: white;
  box-shadow: 0 1px 12px rgba(15, 23, 42, 0.1);
}

.ks-preview-header {
  min-height: 4.75rem;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
}

.ks-preview-header h2 {
  margin: 0;
  color: #1a1c1e;
  font-size: 1.35rem;
}

.ks-preview-header span {
  border-radius: 999px;
  background: #f4c94c;
  padding: 0.4rem 0.75rem;
  color: #1a1c1e;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
}

.ks-preview-frame {
  display: block;
  width: 100%;
  height: min(72rem, calc(100vh - 13rem));
  min-height: 42rem;
  border: 0;
  background: #fdfdfd;
}

@media (max-width: 900px) {
  .ks-hero {
    align-items: stretch;
    flex-direction: column;
  }

  .ks-layout {
    grid-template-columns: 1fr;
  }

  .ks-screen-list {
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    max-height: none;
    overflow: visible;
  }
}
</style>
