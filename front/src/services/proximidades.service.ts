import apiClient, { handleApiError } from '@/lib/api-client';
import { Proximidade } from '@/types/admin';

export const proximidadesService = {
  async getAll(): Promise<Proximidade[]> {
    try {
      const response = await apiClient.get<Proximidade[]>('/proximidades');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async create(nome: string): Promise<Proximidade> {
    try {
      const response = await apiClient.post<Proximidade>('/proximidades', { nome });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
