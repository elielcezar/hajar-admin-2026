import { z } from 'zod';
import { ValidationError } from '../utils/errors.js';

/**
 * Middleware de validação usando Zod
 * @param {z.ZodSchema} schema - Schema Zod para validação
 * @param {string} source - Fonte dos dados ('body', 'query', 'params')
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      schema.parse(dataToValidate);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({
          error: 'Erro de validação',
          details: messages,
        });
      }
      next(error);
    }
  };
};

// Schemas de validação comuns

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const userCreateSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const userUpdateSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Pelo menos um campo deve ser fornecido para atualização',
});

export const imovelCreateSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  codigo: z.string().min(1, 'Código é obrigatório'),
  subTitulo: z.string().optional(),
  descricaoCurta: z.string().optional(),
  descricaoLonga: z.string().optional(),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  finalidade: z.string().min(1, 'Finalidade é obrigatória'),
  valor: z.string().optional(),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export const categoriaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
});

export const tipoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
});

export const finalidadeSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
});

export const blogCategoriaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
});

export const postSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  slug: z.string().min(3, 'Slug deve ter no mínimo 3 caracteres'),
  chamada: z.string().optional(),
  conteudo: z.string().min(10, 'Conteúdo deve ter no mínimo 10 caracteres'),
  dataPublicacao: z.string().optional().nullable(),
  status: z.enum(['RASCUNHO', 'PUBLICADO']).default('RASCUNHO'),
  categoriaId: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) : val),
  imovelId: z.union([z.number(), z.string()]).optional().nullable().transform(val => (typeof val === 'string' && val !== '') ? parseInt(val) : val),
});

