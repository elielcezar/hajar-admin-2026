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
      if (data.descricaoCurta) formData.append('descricaoCurta', data.descricaoCurta);
      if (data.descricaoLonga) formData.append('descricaoLonga', data.descricaoLonga);
      if (data.valor) formData.append('valor', data.valor);
      if (data.valorPromo) formData.append('valorPromo', data.valorPromo);
      if (data.cep) formData.append('cep', data.cep);
      if (data.endereco) formData.append('endereco', data.endereco);
      if (data.bairro) formData.append('bairro', data.bairro);
      if (data.cidade) formData.append('cidade', data.cidade);
      if (data.estado) formData.append('estado', data.estado);
      if (data.latitude !== undefined) {
        console.log('✅ Adicionando latitude ao FormData:', data.latitude);
        formData.append('latitude', data.latitude.toString());
      } else {
        console.warn('⚠️ Latitude está undefined, não será enviada!');
      }
      if (data.longitude !== undefined) {
        console.log('✅ Adicionando longitude ao FormData:', data.longitude);
        formData.append('longitude', data.longitude.toString());
      } else {
        console.warn('⚠️ Longitude está undefined, não será enviada!');
      }
      // Campos numéricos
      if (data.suites !== undefined && data.suites !== null) formData.append('suites', data.suites.toString());
      if (data.dormitorios !== undefined && data.dormitorios !== null) formData.append('dormitorios', data.dormitorios.toString());
      if (data.banheiros !== undefined && data.banheiros !== null) formData.append('banheiros', data.banheiros.toString());
      if (data.terrenoM2 !== undefined && data.terrenoM2 !== null) formData.append('terrenoM2', data.terrenoM2.toString());
      if (data.areaConstruida !== undefined && data.areaConstruida !== null) formData.append('areaConstruida', data.areaConstruida.toString());
      // Campos booleanos
      formData.append('garagem', data.garagem ? 'true' : 'false');
      formData.append('geminada', data.geminada ? 'true' : 'false');
      // Campo de texto
      if (data.terrenoMedidas) formData.append('terrenoMedidas', data.terrenoMedidas);
      formData.append('tipo', data.tipo);
      formData.append('finalidade', data.finalidade);
      formData.append('proximidades', JSON.stringify(data.proximidades ?? []));

      // Adicionar fotos
      if (data.fotos && data.fotos.length > 0) {
        data.fotos.forEach((file) => {
          formData.append('fotos', file);
        });
      }

      // Adicionar imagem de capa
      if (data.imagemCapa) {
        formData.append('imagemCapa', data.imagemCapa);
      }

      console.log('📦 FormData pronto para enviar. Conferindo coordenadas:', {
        latitude: formData.get('latitude'),
        longitude: formData.get('longitude')
      });

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
      if (data.descricaoCurta) formData.append('descricaoCurta', data.descricaoCurta);
      if (data.descricaoLonga) formData.append('descricaoLonga', data.descricaoLonga);
      if (data.valor) formData.append('valor', data.valor);
      if (data.valorPromo) formData.append('valorPromo', data.valorPromo);
      if (data.cep) formData.append('cep', data.cep);
      if (data.endereco) formData.append('endereco', data.endereco);
      if (data.bairro) formData.append('bairro', data.bairro);
      if (data.cidade) formData.append('cidade', data.cidade);
      if (data.estado) formData.append('estado', data.estado);
      if (data.latitude !== undefined) {
        console.log('✅ [UPDATE] Adicionando latitude ao FormData:', data.latitude);
        formData.append('latitude', data.latitude.toString());
      } else {
        console.warn('⚠️ [UPDATE] Latitude está undefined, não será enviada!');
      }
      if (data.longitude !== undefined) {
        console.log('✅ [UPDATE] Adicionando longitude ao FormData:', data.longitude);
        formData.append('longitude', data.longitude.toString());
      } else {
        console.warn('⚠️ [UPDATE] Longitude está undefined, não será enviada!');
      }
      // Campos numéricos
      if (data.suites !== undefined && data.suites !== null) formData.append('suites', data.suites.toString());
      if (data.dormitorios !== undefined && data.dormitorios !== null) formData.append('dormitorios', data.dormitorios.toString());
      if (data.banheiros !== undefined && data.banheiros !== null) formData.append('banheiros', data.banheiros.toString());
      if (data.terrenoM2 !== undefined && data.terrenoM2 !== null) formData.append('terrenoM2', data.terrenoM2.toString());
      if (data.areaConstruida !== undefined && data.areaConstruida !== null) formData.append('areaConstruida', data.areaConstruida.toString());
      // Campos booleanos
      if (data.garagem !== undefined) formData.append('garagem', data.garagem ? 'true' : 'false');
      if (data.geminada !== undefined) formData.append('geminada', data.geminada ? 'true' : 'false');
      // Campo de texto
      if (data.terrenoMedidas) formData.append('terrenoMedidas', data.terrenoMedidas);
      if (data.tipo) formData.append('tipo', data.tipo);
      if (data.finalidade) formData.append('finalidade', data.finalidade);
      formData.append('proximidades', JSON.stringify(data.proximidades ?? []));

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

      // Adicionar imagem de capa antiga (manter)
      if (data.oldImagemCapa) {
        formData.append('oldImagemCapa', data.oldImagemCapa);
      }

      // Adicionar nova imagem de capa
      if (data.imagemCapa) {
        formData.append('imagemCapa', data.imagemCapa);
      }

      console.log('📦 [UPDATE] FormData pronto para enviar. Conferindo coordenadas:', {
        latitude: formData.get('latitude'),
        longitude: formData.get('longitude')
      });

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

