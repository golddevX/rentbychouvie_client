import axios, { AxiosInstance, AxiosError } from 'axios';

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('leadToken')
      : null;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
