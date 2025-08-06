import axios from 'axios';
import { FileUploadResponse, ParsedLogsResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request/Response interceptors for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    return Promise.reject(error);
  }
);

export const logAPI = {
  // Upload log file
  uploadFile: async (file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<FileUploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Parse text content
  parseText: async (content: string): Promise<ParsedLogsResponse> => {
    const response = await api.post<ParsedLogsResponse>('/parse-text', {
      content,
    });
    
    return response.data;
  },

  // Export data
  exportData: async (data: any, format: 'json' | 'csv', filename?: string): Promise<{ content: string; filename: string }> => {
    const response = await api.get(`/export/${format}`, {
      params: {
        data: JSON.stringify(data),
        filename,
      },
    });
    
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; service: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Helper function to handle API errors
export const handleAPIError = (error: any): string => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.detail || error.response.data?.message || 'Server error occurred';
    return `Error ${error.response.status}: ${message}`;
  } else if (error.request) {
    // Request made but no response received
    return 'Network error: Unable to connect to server';
  } else {
    // Something else happened
    return `Error: ${error.message}`;
  }
};

export default api;