<template>
  <div class="consent-page">
    <section class="consent-card">
      <p class="eyebrow">One last step</p>
      <h1>Set up your workspace</h1>
      <p class="intro">
        To create your solar assessment, Apolaki needs your account profile and
        the property location you submit.
      </p>

      <div v-if="loadingStatus" class="loading" aria-live="polite">Loading...</div>

      <div v-else-if="!status" class="error" role="alert">
        {{ message }}
      </div>

      <form v-else @submit.prevent="submitChoice">
        <label class="essential-choice">
          <input v-model="essentialAccepted" type="checkbox">
          <span>
            <strong>I consent to essential assessment access</strong>
            <small>
              Use my profile and submitted location to calculate and save my
              solar assessment.
            </small>
          </span>
        </label>

        <p class="privacy-note">
          Monitoring, contracts, financing, and data sharing stay off unless
          you choose those features later.
        </p>

        <p v-if="message" class="error" role="alert">{{ message }}</p>

        <button class="continue" type="submit" :disabled="userStore.loading || !essentialAccepted">
          {{ userStore.loading ? 'Saving...' : 'Continue to assessment' }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'

const router = useRouter()
const userStore = useUserStore()
const status = ref(null)
const essentialAccepted = ref(false)
const loadingStatus = ref(true)
const message = ref('')

onMounted(async () => {
  try {
    status.value = userStore.consentStatus || await userStore.getConsentStatus()
    essentialAccepted.value = status.value.consents
      .filter(consent => consent.required)
      .every(consent => consent.decision === 'granted')
  } catch {
    message.value = 'Your consent settings could not be loaded. Please sign in again.'
  } finally {
    loadingStatus.value = false
  }
})

async function submitChoice() {
  message.value = ''
  if (!essentialAccepted.value) {
    message.value = 'Consent is required to open your assessment workspace.'
    return
  }

  const choices = status.value.consents.map(consent => ({
    key: consent.key,
    decision: consent.required
      ? 'granted'
      : (consent.decision === 'granted' ? 'granted' : 'declined')
  }))
  const updatedStatus = await userStore.completeConsentOnboarding(choices)

  if (!updatedStatus) {
    message.value = userStore.error
    return
  }
  await router.replace('/assessment')
}
</script>

<style scoped>
.consent-page {
  align-items: center;
  background: linear-gradient(145deg, #f8fcff, #e8f4fb);
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 1.25rem;
}

.consent-card {
  background: #fff;
  border-radius: 1.4rem;
  box-shadow: 0 24px 65px rgba(15, 44, 68, 0.13);
  max-width: 470px;
  padding: 2.25rem;
  width: 100%;
}

.eyebrow {
  color: #0f6cbd;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.13em;
  margin: 0 0 0.65rem;
  text-transform: uppercase;
}

h1 {
  color: #102a43;
  font-size: 1.8rem;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin: 0 0 0.7rem;
}

.intro {
  color: #526b7a;
  line-height: 1.55;
  margin: 0 0 1.45rem;
}

.essential-choice {
  align-items: flex-start;
  background: #f1f8ff;
  border: 1px solid #d4e8fb;
  border-radius: 0.9rem;
  cursor: pointer;
  display: flex;
  gap: 0.8rem;
  padding: 1rem;
}

.essential-choice input {
  accent-color: #0f6cbd;
  height: 1.12rem;
  margin-top: 0.15rem;
  width: 1.12rem;
}

.essential-choice strong {
  color: #102a43;
  display: block;
  font-size: 0.96rem;
  margin-bottom: 0.35rem;
}

.essential-choice small,
.privacy-note {
  color: #60788a;
  font-size: 0.88rem;
  line-height: 1.45;
}

.privacy-note {
  margin: 1.1rem 0 1.3rem;
}

.error {
  background: #fff1f2;
  border-radius: 0.5rem;
  color: #9f1239;
  font-size: 0.9rem;
  margin: 0 0 1rem;
  padding: 0.65rem 0.8rem;
}

.continue {
  background: #0f6cbd;
  border: 0;
  border-radius: 0.7rem;
  color: #fff;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.85rem 1.25rem;
  width: 100%;
}

.continue:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.loading {
  color: #60788a;
  padding: 1rem 0;
  text-align: center;
}
</style>
