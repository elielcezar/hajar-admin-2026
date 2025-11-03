import apiClient, { handleApiError } from '@/lib/api-client';
import { Tipo } from '@/types/admin';

export const tiposService = {
  /**
   * Listar todos os tipos
   */
  async getAll(): Promise<Tipo[]> {
    try {
      const response = await apiClient.get<Tipo[]>('/tipo');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Criar novo tipo
   */
  async create(nome: string): Promise<Tipo> {
    try {
      const response = await apiClient.post<Tipo>('/tipo', { nome });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Atualizar tipo
   */
  async update(id: number, nome: string): Promise<Tipo> {
    try {
      const response = await apiClient.put<Tipo>(`/tipo/${id}`, { nome });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Deletar tipo
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/tipo/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

