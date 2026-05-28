import api from '../../services/api'
import { lookupSolarPotential } from '../../services/solarApi'

export const usageProfiles = [
  {
    key: 'residential',
    label: 'Residential',
    description: 'Homes, townhouses, and condo units with predictable daytime and evening usage.',
    minKw: 3,
    maxKw: 5,
    defaultKw: 4,
    roofCondition: 'good',
    sunExposure: 'high',
    obstructionLevel: 'minimal'
  },
  {
    key: 'small_industry',
    label: 'Small Industry',
    description: 'Shops, offices, restaurants, and light commercial operations.',
    minKw: 5,
    maxKw: 10,
    defaultKw: 7.5,
    roofCondition: 'good',
    sunExposure: 'high',
    obstructionLevel: 'minimal'
  },
  {
    key: 'heavy_usage',
    label: 'Heavy Usage',
    description: 'Warehouses, workshops, cold storage, and high-load facilities.',
    minKw: 10,
    maxKw: 15,
    defaultKw: 12.5,
    roofCondition: 'excellent',
    sunExposure: 'high',
    obstructionLevel: 'minimal'
  }
]

export const philippinesLocations = [
  { value: 'Metro Manila', province: 'NCR', city: 'Manila', state: 'Metro Manila', zipCode: '1000' },
  { value: 'Quezon City', province: 'NCR', city: 'Quezon City', state: 'Metro Manila', zipCode: '1100' },
  { value: 'Makati', province: 'NCR', city: 'Makati', state: 'Metro Manila', zipCode: '1200' },
  { value: 'Cebu', province: 'Cebu', city: 'Cebu City', state: 'Cebu', zipCode: '6000' },
  { value: 'Davao', province: 'Davao', city: 'Davao City', state: 'Davao del Sur', zipCode: '8000' },
  { value: 'Cavite', province: 'Cavite', city: 'Dasmarinas', state: 'Cavite', zipCode: '4114' },
  { value: 'Laguna', province: 'Laguna', city: 'Santa Rosa', state: 'Laguna', zipCode: '4026' },
  { value: 'Bulacan', province: 'Bulacan', city: 'Malolos', state: 'Bulacan', zipCode: '3000' },
  { value: 'Pampanga', province: 'Pampanga', city: 'San Fernando', state: 'Pampanga', zipCode: '2000' },
  { value: 'Batangas', province: 'Batangas', city: 'Batangas City', state: 'Batangas', zipCode: '4200' }
]

export const INSTALLED_COST_PER_KW = 45000
const UTILITY_RATE_PHP = 11.5
const LOAN_APR = 0.085
const LOAN_YEARS = 7
const DOWN_PAYMENT_RATE = 0.2

export function getUsageProfile(key) {
  return usageProfiles.find(profile => profile.key === key) || usageProfiles[0]
}

export function getLocation(value) {
  return philippinesLocations.find(location => location.value === value) || philippinesLocations[0]
}

export function providerLabel(provider) {
  return {
    google_solar: 'Google Cloud Solar API',
    nrel_pvwatts: 'DREI / NREL PVWatts',
    drei_solar: 'DREI Solar Resource',
    nasa_power: 'NASA POWER',
    built_in_estimate: 'Regional baseline'
  }[provider] || 'Regional baseline'
}

export function formatPeso(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(Number(amount || 0))
}

export function buildAssessmentPayload(input, liveSolarData) {
  const profile = getUsageProfile(input.propertyType)
  const location = getLocation(input.location)
  const annualUsage = Math.max(1, Math.round((Number(input.monthlyBill || 0) / UTILITY_RATE_PHP) * 12))
  const targetCapacityKw = Number(input.targetCapacityKw || profile.defaultKw)
  const estimatedPanelCount = Math.ceil(targetCapacityKw / 0.45)
  const fallbackRoofAreaSqFt = Math.max(500, Math.round((estimatedPanelCount * 21) / 0.7))
  const apiRoofArea = liveSolarData?.data?.maxArrayAreaSqFt

  return {
    address: input.address || `${location.city}, ${location.state}, Philippines`,
    city: location.city,
    state: location.state,
    zipCode: location.zipCode,
    roofCondition: profile.roofCondition,
    roofArea: Math.round(apiRoofArea || fallbackRoofAreaSqFt),
    annualUsage,
    sunExposure: deriveSunExposure(liveSolarData) || profile.sunExposure,
    obstructionLevel: profile.obstructionLevel,
    financingOption: 'loan'
  }
}

export async function loadLiveAssessmentData(input) {
  const location = getLocation(input.location)
  return lookupSolarPotential({
    address: input.address,
    city: location.city,
    state: location.state,
    zipCode: location.zipCode
  })
}

export async function calculateAssessmentPlan(input, liveSolarData) {
  const payload = buildAssessmentPayload(input, liveSolarData)

  try {
    const response = await api.post('/assessments/calculate', payload, { skipAuthRedirect: true, timeout: 7000 })
    const backendData = response.data?.data || response.data
    return normalizeAssessmentResult(input, liveSolarData, backendData, 'backend')
  } catch (error) {
    console.warn('Assessment backend unavailable, using local calculation fallback:', error.message)
    return normalizeAssessmentResult(input, liveSolarData, null, 'local_fallback')
  }
}

export async function saveAssessmentPlan(input, result, liveSolarData) {
  const payload = buildSavedAssessmentPayload(input, result, liveSolarData)
  const response = await api.post('/assessments', payload, { timeout: 7000 })
  return response.data?.data || response.data
}

export async function fetchSavedAssessmentPlans() {
  const response = await api.get('/assessments', { timeout: 7000 })
  return Array.isArray(response.data) ? response.data : response.data?.data || []
}

export function persistAssessmentState(input, result, liveSolarData) {
  const location = getLocation(input.location)
  localStorage.setItem('financingAssessmentState', JSON.stringify({
    province: location.province,
    location: input.location,
    propertyType: input.propertyType,
    targetCapacityKw: input.targetCapacityKw,
    monthlyBill: input.monthlyBill,
    monthlyPayment: result.solarPayment,
    monthlySavings: result.monthlySavings,
    systemSize: result.systemSize,
    provider: result.provider || liveSolarData?.provider || 'built_in_estimate',
    calculatedAt: new Date().toISOString()
  }))
}

function buildSavedAssessmentPayload(input, result, liveSolarData) {
  const basePayload = buildAssessmentPayload(input, liveSolarData)
  return {
    ...basePayload,
    recommendedCapacity: result.systemSize,
    estimatedCost: result.installedCost,
    savingsEstimate: {
      source: 'assessment_conversion_funnel',
      monthlyBill: Number(input.monthlyBill || 0),
      monthlyPayment: result.solarPayment,
      monthlySavings: result.monthlySavings,
      annualSavings: result.annualSavings,
      annualProduction: result.annualProduction,
      installedCost: result.installedCost,
      downPayment: result.downPayment,
      loanPrincipal: result.loanPrincipal,
      tenureYears: result.tenure,
      costBasisPhpPerKw: INSTALLED_COST_PER_KW,
      provider: result.provider || liveSolarData?.provider || 'built_in_estimate',
      providerName: result.providerName,
      locationName: result.locationName,
      latitude: result.latitude,
      longitude: result.longitude,
      confidenceScore: result.confidenceScore,
      propertyType: input.propertyType,
      targetCapacityKw: input.targetCapacityKw,
      calculatedAt: new Date().toISOString()
    }
  }
}

function normalizeAssessmentResult(input, liveSolarData, backendData, calculationSource) {
  const profile = getUsageProfile(input.propertyType)
  const calc = backendData?.calculation || backendData?.savings_estimate || {}
  const backendCapacity = Number(backendData?.recommended_capacity || calc.recommendedCapacity || calc.recommendedCapacityKw || calc.recommendedCapacity || 0)
  const targetCapacityKw = Number(input.targetCapacityKw || profile.defaultKw)
  const systemSize = clamp(roundOne(backendCapacity || targetCapacityKw), profile.minKw, profile.maxKw)
  const annualProduction = Math.round(
    Number(calc.annualProduction || liveSolarData?.data?.annualProductionKwh || liveSolarData?.data?.bestConfig?.yearlyEnergyDcKwh || systemSize * peakSunHours(liveSolarData) * 365 * 0.8)
  )
  const installedCost = Math.round(systemSize * INSTALLED_COST_PER_KW)
  const downPayment = Math.round(installedCost * DOWN_PAYMENT_RATE)
  const loanPrincipal = installedCost - downPayment
  const solarPayment = monthlyPayment(loanPrincipal, LOAN_APR, LOAN_YEARS * 12)
  const monthlyBill = Number(input.monthlyBill || 0)
  const monthlySavings = Math.round(monthlyBill - solarPayment)
  const annualSavings = monthlySavings * 12
  const paybackYears = annualSavings > 0 ? roundOne(installedCost / annualSavings) : null
  const lifetimeSavings = Math.round((Math.max(0, annualSavings) * 20) - installedCost)

  const provider = liveSolarData?.provider || calc.dataSource || 'built_in_estimate'

  return {
    calculationSource,
    provider,
    providerName: providerLabel(provider),
    locationName: liveSolarData?.data?.formattedAddress || `${getLocation(input.location).city}, Philippines`,
    latitude: Number(liveSolarData?.data?.latitude || 14.5995),
    longitude: Number(liveSolarData?.data?.longitude || 120.9842),
    systemSize,
    installedCost,
    downPayment,
    loanPrincipal,
    solarPayment,
    monthlySavings,
    annualProduction,
    annualSavings,
    paybackYears,
    lifetimeSavings,
    tenure: LOAN_YEARS,
    confidenceScore: confidenceScore(liveSolarData, calculationSource),
    peakSunHours: peakSunHours(liveSolarData),
    monthlyProduction: liveSolarData?.data?.monthlyProductionKwh || [],
    avgTemperatureC: liveSolarData?.data?.avgTemperatureC || calc.avgTemperatureC || null,
    backendAssessmentId: backendData?.id || null
  }
}

function deriveSunExposure(liveSolarData) {
  const psh = peakSunHours(liveSolarData)
  if (!psh) return null
  if (psh >= 5) return 'high'
  if (psh >= 3.5) return 'medium'
  return 'low'
}

function peakSunHours(liveSolarData) {
  return Number(liveSolarData?.data?.estimatedPeakSunHoursPerDay || liveSolarData?.data?.solarRadiationAnnual || 4.8)
}

function confidenceScore(liveSolarData, calculationSource) {
  let score = calculationSource === 'backend' ? 74 : 62
  if (liveSolarData?.provider === 'google_solar') score += 18
  else if (['nrel_pvwatts', 'drei_solar'].includes(liveSolarData?.provider)) score += 14
  else if (liveSolarData?.provider === 'nasa_power') score += 12
  else score += 6
  if (liveSolarData?.data?.latitude && liveSolarData?.data?.longitude) score += 6
  return Math.min(98, score)
}

function monthlyPayment(principal, annualRate, months) {
  const monthlyRate = annualRate / 12
  if (!monthlyRate) return Math.round(principal / months)
  return Math.round(principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)))
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function roundOne(value) {
  return Math.round(Number(value || 0) * 10) / 10
}
