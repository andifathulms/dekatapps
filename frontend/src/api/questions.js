import client from './client'

export const getTodayQuestion = () => client.get('/api/questions/today/')
export const answerQuestion = (text) => client.post('/api/questions/today/', { text })
export const getQuestionHistory = () => client.get('/api/questions/history/')
