import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

// Log API configuration for debugging
console.log('API Configuration:', {
  baseURL: api.defaults.baseURL,
  env_VITE_API_URL: import.meta.env.VITE_API_URL,
  mode: import.meta.env.MODE
})

// Attach token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  console.log('Making API request:', {
    method: config.method,
    url: config.url,
    fullURL: config.baseURL + config.url
  })
  return config
})

// Add response interceptor to log errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error Details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      fullURL: error.config?.baseURL + error.config?.url
    })
    return Promise.reject(error)
  }
)

// Get the base URL without the /api suffix for image URLs
export const getBaseUrl = () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const baseUrlForImages = baseURL.replace(/\/api$/, ''); // Remove /api if it exists at the end
  console.log('API Utility: Base URL for images:', baseUrlForImages);
  return baseUrlForImages;
}

export default api
