import apiClient, { handleApiError } from '@/lib/api-client';
import { Finalidade } from '@/types/admin';

export const finalidadesService = {
  /**
   * Listar todas as finalidades
   */
  async getAll(): Promise<Finalidade[]> {
    try {
      const response = await apiClient.get<Finalidade[]>('/finalidade');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Criar nova finalidade
   */
  async create(nome: string): Promise<Finalidade> {
    try {
      const response = await apiClient.post<Finalidade>('/finalidade', { nome });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Atualizar finalidade
   */
  async update(id: number, nome: string): Promise<Finalidade> {
    try {
      const response = await apiClient.put<Finalidade>(`/finalidade/${id}`, { nome });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Deletar finalidade
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/finalidade/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

