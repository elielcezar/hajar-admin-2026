import apiClient, { handleApiError } from '@/lib/api-client';
import { Destaque, DestaqueFormData } from '@/types/admin';

export const destaquesService = {
  /**
   * Listar todos os destaques (admin - inclui ativos e inativos)
   */
  async getAll(): Promise<Destaque[]> {
    try {
      const response = await apiClient.get<Destaque[]>('/destaques/admin');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Listar apenas destaques ativos (público)
   */
  async getAtivos(): Promise<Destaque[]> {
    try {
      const response = await apiClient.get<Destaque[]>('/destaques');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obter destaque por ID
   */
  async getById(id: number): Promise<Destaque> {
    try {
      const response = await apiClient.get<Destaque>(`/destaques/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Criar novo destaque com upload de imagem
   */
  async create(data: DestaqueFormData): Promise<Destaque> {
    try {
      const formData = new FormData();
      
      // Campos de texto obrigatórios
      formData.append('titulo', data.titulo);
      formData.append('descricao', data.descricao);
      formData.append('textoBotao', data.textoBotao);
      formData.append('link', data.link);
      
      // Campos numéricos opcionais
      if (data.valor) formData.append('valor', data.valor);
      if (data.area !== undefined && data.area !== null) formData.append('area', data.area.toString());
      if (data.quartos !== undefined && data.quartos !== null) formData.append('quartos', data.quartos.toString());
      if (data.banheiros !== undefined && data.banheiros !== null) formData.append('banheiros', data.banheiros.toString());
      if (data.garagem !== undefined && data.garagem !== null) formData.append('garagem', data.garagem.toString());
      
      // Status e ordem
      formData.append('ativo', data.ativo ? 'true' : 'false');
      formData.append('ordem', data.ordem.toString());
      
      // Imagem (obrigatória)
      if (data.imagem) {
        formData.append('imagem', data.imagem);
      }

      const response = await apiClient.post<Destaque>('/destaques', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Atualizar destaque existente
   */
  async update(id: number, data: DestaqueFormData): Promise<Destaque> {
    try {
      const formData = new FormData();
      
      // Campos de texto
      formData.append('titulo', data.titulo);
      formData.append('descricao', data.descricao);
      formData.append('textoBotao', data.textoBotao);
      formData.append('link', data.link);
      
      // Campos numéricos opcionais
      if (data.valor) formData.append('valor', data.valor);
      if (data.area !== undefined && data.area !== null) formData.append('area', data.area.toString());
      if (data.quartos !== undefined && data.quartos !== null) formData.append('quartos', data.quartos.toString());
      if (data.banheiros !== undefined && data.banheiros !== null) formData.append('banheiros', data.banheiros.toString());
      if (data.garagem !== undefined && data.garagem !== null) formData.append('garagem', data.garagem.toString());
      
      // Status e ordem
      formData.append('ativo', data.ativo ? 'true' : 'false');
      formData.append('ordem', data.ordem.toString());
      
      // Imagem
      if (data.imagem) {
        // Nova imagem sendo enviada
        formData.append('imagem', data.imagem);
      } else if (data.oldImage) {
        // Manter imagem antiga
        formData.append('oldImage', data.oldImage);
      }

      const response = await apiClient.put<Destaque>(`/destaques/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Deletar destaque
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/destaques/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};
