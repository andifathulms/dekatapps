import client from './client'

export const login = (username, password) =>
  client.post('/api/auth/login/', { username, password })

export const getMe = () =>
  client.get('/api/auth/me/')

export const updateMe = (data) =>
  client.patch('/api/auth/me/', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  })

export const getPartner = () =>
  client.get('/api/auth/partner/')

// Search cities using Open-Meteo geocoding (free, no API key)
export const searchCity = async (query) => {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`
  )
  const data = await res.json()
  return data.results || []
}
