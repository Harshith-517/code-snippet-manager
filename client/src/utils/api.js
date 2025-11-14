import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

// Attach token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Get the base URL without the /api suffix for image URLs
export const getBaseUrl = () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const baseUrlForImages = baseURL.replace(/\/api$/, ''); // Remove /api if it exists at the end
  console.log('API Utility: Base URL for images:', baseUrlForImages);
  return baseUrlForImages;
}

export default api
