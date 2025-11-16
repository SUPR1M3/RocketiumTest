import { api } from './api';
import type { Design, ApiResponse, PaginatedResponse } from '../types';

export interface CreateDesignDto {
  name: string;
  width?: number;
  height?: number;
}

export interface UpdateDesignDto {
  name?: string;
  width?: number;
  height?: number;
  layers?: Design['layers'];
  thumbnail?: string;
}

export interface ListDesignsParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  order?: 'asc' | 'desc';
}

export const designsApi = {
  // Create a new design
  create: async (data: CreateDesignDto): Promise<Design> => {
    const response = await api.post<ApiResponse<Design>>('/api/designs', data);
    return response.data.data;
  },

  // List all designs
  list: async (params?: ListDesignsParams): Promise<PaginatedResponse<Design>> => {
    const response = await api.get<PaginatedResponse<Design>>('/api/designs', { params });
    return response.data;
  },

  // Get a single design
  get: async (id: string): Promise<Design> => {
    const response = await api.get<ApiResponse<Design>>(`/api/designs/${id}`);
    return response.data.data;
  },

  // Update a design
  update: async (id: string, data: UpdateDesignDto): Promise<Design> => {
    const response = await api.put<ApiResponse<Design>>(`/api/designs/${id}`, data);
    return response.data.data;
  },

  // Delete a design
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/designs/${id}`);
  },
};

