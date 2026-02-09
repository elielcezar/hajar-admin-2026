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
  descricaoCurta?: string;
  descricaoLonga?: string;
  fotos: string[]; // URLs do S3
  imagemCapa?: string; // URL da imagem de capa no S3
  valor?: string;
  valorPromo?: string;
  cep?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  latitude?: number;
  longitude?: number;
  suites?: number;
  dormitorios?: number;
  banheiros?: number;
  garagem?: boolean;
  geminada?: boolean;
  terrenoMedidas?: string;
  terrenoM2?: number;
  areaConstruida?: number;
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
  descricaoCurta?: string;
  descricaoLonga?: string;
  tipo: string; // ID do tipo
  finalidade: string; // ID da finalidade
  valor?: string;
  valorPromo?: string;
  cep?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  latitude?: number;
  longitude?: number;
  suites?: number;
  dormitorios?: number;
  banheiros?: number;
  garagem?: boolean;
  geminada?: boolean;
  terrenoMedidas?: string;
  terrenoM2?: number;
  areaConstruida?: number;
  fotos?: File[]; // Arquivos para upload
  oldPhotos?: string[]; // URLs existentes
  imagemCapa?: File; // Arquivo da imagem de capa para upload
  oldImagemCapa?: string; // URL existente da imagem de capa
}

// Destaque (Hero Section)
export interface Destaque {
  id: number;
  titulo: string;
  descricao: string;
  imagem: string; // URL do S3
  valor?: string;
  area?: number;
  quartos?: number;
  banheiros?: number;
  garagem?: number;
  textoBotao: string;
  link: string;
  ativo: boolean;
  ordem: number;
  createdAt: string;
  updatedAt: string;
}

// Para criar/editar destaque
export interface DestaqueFormData {
  titulo: string;
  descricao: string;
  imagem?: File; // Arquivo para upload
  oldImage?: string; // URL existente (para edição)
  valor?: string;
  area?: number;
  quartos?: number;
  banheiros?: number;
  garagem?: number;
  textoBotao: string;
  link: string;
  ativo: boolean;
  ordem: number;
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

// BLOG
export type PostStatus = 'RASCUNHO' | 'PUBLICADO';

export interface BlogCategoria {
  id: number;
  nome: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: number;
  titulo: string;
  slug: string;
  chamada?: string;
  conteudo: string;
  imagemCapa?: string;
  dataPublicacao?: string;
  status: PostStatus;
  categoriaId: number;
  categoria: BlogCategoria;
  imovelId?: number;
  imovel?: {
    id: number;
    titulo: string;
    codigo: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PostFormData {
  titulo: string;
  slug: string;
  chamada?: string;
  conteudo: string;
  imagemCapa?: File;
  oldImagemCapa?: string;
  dataPublicacao?: string;
  status: PostStatus;
  categoriaId: string;
  imovelId?: string;
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
