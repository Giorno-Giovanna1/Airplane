import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || ''
    const isAuthReq = url.includes('/user/login') || url.includes('/user/register')
    if (err.response?.status === 401 && !isAuthReq) {
      localStorage.removeItem('token')
      localStorage.removeItem('is_admin')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
