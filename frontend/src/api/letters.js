import client from './client'

export const getLetters = () => client.get('/api/letters/')
export const sendLetter = (data) =>
  client.post('/api/letters/', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  })
export const markLetterRead = (id) => client.post(`/api/letters/${id}/read/`)
export const getUnreadCount = () => client.get('/api/letters/unread/')
