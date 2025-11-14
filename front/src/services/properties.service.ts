import apiClient, { handleApiError } from '@/lib/api-client';
import { Property, PropertyFormData } from '@/types/admin';

export const propertiesService = {
  /**
   * Listar todos os imóveis
   */
  async getAll(filters?: { cidade?: string; tipo?: string; finalidade?: string }): Promise<Property[]> {
    try {
      const response = await apiClient.get<Property[]>('/imoveis', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obter imóvel por ID
   */
  async getById(id: number): Promise<Property> {
    try {
      const response = await apiClient.get<Property>(`/imoveis/id/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Obter imóvel por código
   */
  async getByCode(codigo: string): Promise<Property> {
    try {
      const response = await apiClient.get<Property>(`/imoveis/${codigo}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Criar novo imóvel com upload de fotos
   */
  async create(data: PropertyFormData): Promise<Property> {
    try {
      const formData = new FormData();
      
      // Adicionar campos de texto
      formData.append('titulo', data.titulo);
      formData.append('codigo', data.codigo);
      if (data.subTitulo) formData.append('subTitulo', data.subTitulo);
      if (data.descricaoCurta) formData.append('descricaoCurta', data.descricaoCurta);
      if (data.descricaoLonga) formData.append('descricaoLonga', data.descricaoLonga);
      if (data.valor) formData.append('valor', data.valor);
      if (data.cep) formData.append('cep', data.cep);
      if (data.endereco) formData.append('endereco', data.endereco);
      if (data.bairro) formData.append('bairro', data.bairro);
      if (data.cidade) formData.append('cidade', data.cidade);
      if (data.estado) formData.append('estado', data.estado);
      if (data.latitude !== undefined) formData.append('latitude', data.latitude.toString());
      if (data.longitude !== undefined) formData.append('longitude', data.longitude.toString());
      formData.append('tipo', data.tipo);
      formData.append('finalidade', data.finalidade);

      // Adicionar fotos
      if (data.fotos && data.fotos.length > 0) {
        data.fotos.forEach((file) => {
          formData.append('fotos', file);
        });
      }

      const response = await apiClient.post<Property>('/imoveis', formData, {
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
   * Atualizar imóvel
   */
  async update(id: number, data: Partial<PropertyFormData>): Promise<Property> {
    try {
      const formData = new FormData();

      // Adicionar campos de texto
      if (data.titulo) formData.append('titulo', data.titulo);
      if (data.codigo) formData.append('codigo', data.codigo);
      if (data.subTitulo) formData.append('subTitulo', data.subTitulo);
      if (data.descricaoCurta) formData.append('descricaoCurta', data.descricaoCurta);
      if (data.descricaoLonga) formData.append('descricaoLonga', data.descricaoLonga);
      if (data.valor) formData.append('valor', data.valor);
      if (data.cep) formData.append('cep', data.cep);
      if (data.endereco) formData.append('endereco', data.endereco);
      if (data.bairro) formData.append('bairro', data.bairro);
      if (data.cidade) formData.append('cidade', data.cidade);
      if (data.estado) formData.append('estado', data.estado);
      if (data.latitude !== undefined) formData.append('latitude', data.latitude.toString());
      if (data.longitude !== undefined) formData.append('longitude', data.longitude.toString());
      if (data.tipo) formData.append('tipo', data.tipo);
      if (data.finalidade) formData.append('finalidade', data.finalidade);

      // Adicionar fotos antigas (manter)
      if (data.oldPhotos && data.oldPhotos.length > 0) {
        formData.append('oldPhotos', JSON.stringify(data.oldPhotos));
      }

      // Adicionar novas fotos
      if (data.fotos && data.fotos.length > 0) {
        data.fotos.forEach((file) => {
          formData.append('fotos', file);
        });
      }

      const response = await apiClient.put<Property>(`/imoveis/${id}`, formData, {
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
   * Deletar imóvel
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/imoveis/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

