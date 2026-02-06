import apiClient, { handleApiError } from '@/lib/api-client';
import { Post, PostFormData, BlogCategoria } from '@/types/admin';

export const blogService = {
  // --- Categorias ---
  async getAllCategories(): Promise<BlogCategoria[]> {
    try {
      const response = await apiClient.get<BlogCategoria[]>('/blog-categorias');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async createCategory(nome: string): Promise<BlogCategoria> {
    try {
      const response = await apiClient.post<BlogCategoria>('/blog-categorias', { nome });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async updateCategory(id: number, nome: string): Promise<BlogCategoria> {
    try {
      const response = await apiClient.put<BlogCategoria>(`/blog-categorias/${id}`, { nome });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async deleteCategory(id: number): Promise<void> {
    try {
      await apiClient.delete(`/blog-categorias/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // --- Posts ---
  async getAllPosts(filters?: { status?: string; categoriaId?: number }): Promise<Post[]> {
    try {
      const response = await apiClient.get<Post[]>('/posts', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getPostBySlug(slug: string): Promise<Post> {
    try {
      const response = await apiClient.get<Post>(`/posts/${slug}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getPostById(id: number): Promise<Post> {
    try {
      const posts = await this.getAllPosts();
      const post = posts.find(p => p.id === id);
      if (!post) throw new Error('Post não encontrado');
      return post;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async createPost(data: PostFormData): Promise<Post> {
    try {
      const formData = new FormData();
      formData.append('titulo', data.titulo);
      formData.append('slug', data.slug);
      if (data.chamada) formData.append('chamada', data.chamada);
      formData.append('conteudo', data.conteudo);
      if (data.dataPublicacao) formData.append('dataPublicacao', data.dataPublicacao);
      formData.append('status', data.status);
      formData.append('categoriaId', data.categoriaId);
      // Enviar imovelId apenas se tiver valor e não for "0"
      if (data.imovelId && data.imovelId !== '0') {
        formData.append('imovelId', data.imovelId);
      }
      
      if (data.imagemCapa) {
        formData.append('imagemCapa', data.imagemCapa);
      }

      const response = await apiClient.post<Post>('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async updatePost(id: number, data: Partial<PostFormData>): Promise<Post> {
    try {
      const formData = new FormData();
      if (data.titulo) formData.append('titulo', data.titulo);
      if (data.slug) formData.append('slug', data.slug);
      if (data.chamada !== undefined) formData.append('chamada', data.chamada);
      if (data.conteudo) formData.append('conteudo', data.conteudo);
      if (data.dataPublicacao !== undefined) formData.append('dataPublicacao', data.dataPublicacao || '');
      if (data.status) formData.append('status', data.status);
      if (data.categoriaId) formData.append('categoriaId', data.categoriaId);
      
      // Tratar imovelId: se for "0", envia vazio para remover a relação
      if (data.imovelId !== undefined) {
        const imovelIdToSend = data.imovelId === '0' ? '' : data.imovelId;
        formData.append('imovelId', imovelIdToSend);
      }
      
      if (data.imagemCapa) {
        formData.append('imagemCapa', data.imagemCapa);
      }

      const response = await apiClient.put<Post>(`/posts/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async deletePost(id: number): Promise<void> {
    try {
      await apiClient.delete(`/posts/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};
