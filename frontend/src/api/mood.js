import client from './client'

export const getMoods = () => client.get('/api/mood/')
export const logMood = (data) => client.post('/api/mood/', data)
export const getTodayMood = () => client.get('/api/mood/today/')
export const getMeetup = () => client.get('/api/mood/meetup/')
export const saveMeetup = (data) => client.post('/api/mood/meetup/', data)
export const deleteMeetup = () => client.delete('/api/mood/meetup/')
