// Tipos e Categorias
export interface Tipo {
  id: number;
  nome: string;
  createdAt: string;
  updatedAt: string;
}

export interface Categoria {
  id: number;
  nome: string;
  createdAt: string;
  updatedAt: string;
}

export interface Finalidade {
  id: number;
  nome: string;
  createdAt: string;
  updatedAt: string;
}

// Imóvel
export interface Property {
  id: number;
  titulo: string;
  codigo: string;
  subTitulo?: string;
  descricaoCurta?: string;
  descricaoLonga?: string;
  fotos: string[]; // URLs do S3
  valor?: string;
  endereco?: string;
  cidade?: string;
  createdAt: string;
  updatedAt: string;
  tipo?: {
    id: number;
    tipo: Tipo;
  }[];
  finalidade?: {
    id: number;
    finalidade: Finalidade;
  }[];
  categorias?: {
    id: number;
    categoria: Categoria;
  }[];
}

// Para criar/editar imóvel
export interface PropertyFormData {
  titulo: string;
  codigo: string;
  subTitulo?: string;
  descricaoCurta?: string;
  descricaoLonga?: string;
  tipo: string; // ID do tipo
  finalidade: string; // ID da finalidade
  valor?: string;
  endereco?: string;
  cidade?: string;
  fotos?: File[]; // Arquivos para upload
  oldPhotos?: string[]; // URLs existentes
}

// Usuário
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// Para criar/editar usuário
export interface UserFormData {
  name: string;
  email: string;
  password?: string;
}

// Resposta de Login
export interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Dados de autenticação (para o contexto)
export interface AdminUser extends User {
  role?: 'admin' | 'editor' | 'viewer'; // Mantido para compatibilidade, mas não vem do backend
}

// Respostas da API
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}
