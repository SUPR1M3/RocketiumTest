import axios from 'axios';
import type { AxiosError } from 'axios';
import type { ApiError } from '../types';

// VITE_API_URL should be the base URL without /api (e.g., https://backend.com or http://localhost:3000)
// All API routes include the /api prefix in their paths
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.data) {
      // Return structured API error
      return Promise.reject(error.response.data);
    }
    // Network or other error
    return Promise.reject({
      code: 'NETWORK_ERROR',
      message: error.message || 'Network error occurred',
    });
  }
);

