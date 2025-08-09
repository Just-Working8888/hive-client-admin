import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://apihiveclient.bigbee.su',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// // Добавляем токен в каждый запрос
api.interceptors.request.use(config => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth.accessToken') : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== 'undefined'
    ) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('auth.refreshToken')
      if (refreshToken) {
        try {
          const { data } = await api.post('/refresh/token', {
            refresh_token: refreshToken,
          })
          localStorage.setItem('auth.accessToken', data.access_token)
          originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`
          return api(originalRequest)
        } catch (refreshErr) {
          // redirect to login
          // window.location.href = '/'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default { api }