import axios from 'axios';

const api = axios.create({
  baseURL:
    // If VITE_API_URL exists, use it
    (import.meta as any).env?.VITE_API_URL ||
    // Otherwise, default to backend
    "http://localhost:3000/api",

  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
