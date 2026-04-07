import client from './client'

export const getJournal = () => client.get('/api/journal/')
export const createEntry = (data) =>
  client.post('/api/journal/', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  })
export const deleteEntry = (id) => client.delete(`/api/journal/${id}/`)

export const getMemories = () => client.get('/api/journal/memories/')
export const uploadMemory = (data) =>
  client.post('/api/journal/memories/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const deleteMemory = (id) => client.delete(`/api/journal/memories/${id}/`)
