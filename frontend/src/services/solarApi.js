/**
 * Solar API Service
 * Calls the backend /api/solar/lookup which integrates:
 *   1. Google Solar API (primary, requires GOOGLE_SOLAR_API_KEY)
 *   2. NREL PVWatts API (fallback, requires NREL_API_KEY)
 *   3. NASA POWER API (free, no key needed — satellite irradiance data)
 *   4. Built-in regional estimates (no key needed)
 *
 * Cascading location: address → zip code → city
 */

import axios from 'axios'
import api from './api'

/**
 * Look up solar potential for a location via backend (cascading providers).
 * @param {{ address?: string, city?: string, state?: string, zipCode?: string }} location
 * @returns {Promise<{ provider: string, data: object, availableProviders: object }>}
 */
export async function lookupSolarPotential(location) {
  const response = await api.post('/solar/lookup', location)
  return response.data
}

/**
 * Direct NASA POWER API call from the frontend.
 * Free, no API key needed. Returns climatological solar irradiance & temperature.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<object>} NASA POWER data with monthly/annual irradiance
 */
export async function fetchNasaPowerData(lat, lng) {
  const res = await axios.get(
    'https://power.larc.nasa.gov/api/temporal/climatology/point', {
      params: {
        parameters: 'ALLSKY_SFC_SW_DWN,CLRSKY_SFC_SW_DWN,T2M,T2M_MAX,T2M_MIN,WS2M',
        community: 'RE',
        longitude: lng.toFixed(4),
        latitude: lat.toFixed(4),
        format: 'JSON'
      },
      timeout: 15000
    }
  )

  const params = res.data?.properties?.parameter
  if (!params) throw new Error('No data returned from NASA POWER')

  const monthKeys = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const irradiance = params.ALLSKY_SFC_SW_DWN || {}
  const clearSky = params.CLRSKY_SFC_SW_DWN || {}
  const temp = params.T2M || {}
  const tempMax = params.T2M_MAX || {}
  const tempMin = params.T2M_MIN || {}
  const windSpeed = params.WS2M || {}

  return {
    latitude: lat,
    longitude: lng,
    annualIrradianceKwhM2Day: irradiance.ANN || 0,
    annualClearSkyKwhM2Day: clearSky.ANN || 0,
    annualTempC: temp.ANN || 0,
    monthlyIrradiance: monthKeys.map(m => parseFloat((irradiance[m] || 0).toFixed(2))),
    monthlyClearSky: monthKeys.map(m => parseFloat((clearSky[m] || 0).toFixed(2))),
    monthlyTemp: monthKeys.map(m => parseFloat((temp[m] || 0).toFixed(1))),
    monthlyTempMax: monthKeys.map(m => parseFloat((tempMax[m] || 0).toFixed(1))),
    monthlyTempMin: monthKeys.map(m => parseFloat((tempMin[m] || 0).toFixed(1))),
    monthlyWindSpeed: monthKeys.map(m => parseFloat((windSpeed[m] || 0).toFixed(1))),
    monthLabels: monthKeys,
    peakSunHoursPerDay: parseFloat((irradiance.ANN || 0).toFixed(2)),
    annualSunshineHours: parseFloat(((irradiance.ANN || 0) * 365).toFixed(0))
  }
}

/**
 * Geocode an address using Nominatim (OpenStreetMap) — free, no key.
 * @param {string} query - Address, city, or zip to geocode
 * @returns {Promise<{ lat: number, lng: number, displayName: string } | null>}
 */
export async function geocodeAddress(query) {
  if (!query || query.trim().length < 2) return null
  const res = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: { q: query, format: 'json', limit: 1 },
    headers: { 'User-Agent': 'ApolakiSolarPlatform/1.0' },
    timeout: 8000
  })
  if (res.data?.[0]) {
    return {
      lat: parseFloat(res.data[0].lat),
      lng: parseFloat(res.data[0].lon),
      displayName: res.data[0].display_name
    }
  }
  return null
}

export default { lookupSolarPotential, fetchNasaPowerData, geocodeAddress }
