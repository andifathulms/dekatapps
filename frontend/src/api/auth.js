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
