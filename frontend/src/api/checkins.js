import client from './client'

export const reverseGeocode = (latitude, longitude) =>
  client.post('/api/checkins/reverse-geocode/', { latitude, longitude })

export const createCheckIn = (data) =>
  client.post('/api/checkins/', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
  })

export const getLatest = () =>
  client.get('/api/checkins/latest/')

export const getCheckIns = (params = {}) =>
  client.get('/api/checkins/', { params })

export const getMapCheckIns = () =>
  client.get('/api/checkins/map/')
