/**
 * Solar API Service
 * Calls the backend /api/solar/lookup which integrates:
 *   1. Google Solar API (primary, requires GOOGLE_SOLAR_API_KEY)
 *   2. NREL PVWatts API (fallback, requires NREL_API_KEY)
 *   3. Built-in regional estimates (no key needed)
 *
 * Cascading location: address → zip code → city
 */

import api from './api'

/**
 * Look up solar potential for a location.
 * @param {{ address?: string, city?: string, state?: string, zipCode?: string }} location
 * @returns {Promise<{ provider: string, data: object, availableProviders: object }>}
 */
export async function lookupSolarPotential(location) {
  const response = await api.post('/solar/lookup', location)
  return response.data
}

export default { lookupSolarPotential }
