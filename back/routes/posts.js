import express from 'express';
import prisma from '../config/prisma.js';
import { uploadPostsS3 } from '../config/s3.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, postSchema } from '../middleware/validation.js';
import { NotFoundError } from '../utils/errors.js';

const router = express.Router();

// Middleware para tratamento de erros do multer (simplificado)
const handleMulterError = (upload) => {
    return (req, res, next) => {
        upload(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    error: 'Erro no upload',
                    message: err.message
                });
            }
            next();
        });
    };
};

// Criar Post (protegido)
router.post('/posts', authenticateToken, handleMulterError(uploadPostsS3.single('imagemCapa')), validate(postSchema), async (req, res, next) => {
    try {
        const {
            titulo,
            slug,
            chamada,
            conteudo,
            dataPublicacao,
            status,
            categoriaId,
            imovelId
        } = req.body;

        const imagemCapa = req.file ? req.file.location : null;

        const post = await prisma.post.create({
            data: {
                titulo,
                slug,
                chamada,
                conteudo,
                imagemCapa,
                dataPublicacao: dataPublicacao ? new Date(dataPublicacao) : null,
                status,
                categoriaId: parseInt(categoriaId),
                imovelId: imovelId ? parseInt(imovelId) : null
            },
            include: {
                categoria: true,
                imovel: true
            }
        });

        res.status(201).json(post);
    } catch (error) {
        next(error);
    }
});

// Listar Posts (público)
router.get('/posts', async (req, res, next) => {
    try {
        const { status, categoriaId, imovelId } = req.query;

        const filtro = {};
        if (status) filtro.status = status;
        if (categoriaId) filtro.categoriaId = parseInt(categoriaId);
        if (imovelId) filtro.imovelId = parseInt(imovelId);

        const posts = await prisma.post.findMany({
            where: filtro,
            include: {
                categoria: true,
                imovel: {
                    select: {
                        id: true,
                        titulo: true,
                        codigo: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json(posts);
    } catch (error) {
        next(error);
    }
});

// Obter Post por ID (admin)
router.get('/posts/id/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await prisma.post.findUnique({
            where: { id: parseInt(id) },
            include: {
                categoria: true,
                imovel: true
            }
        });

        if (!post) {
            throw new NotFoundError('Post não encontrado');
        }

        res.status(200).json(post);
    } catch (error) {
        next(error);
    }
});

// Obter Post por Slug (público)
router.get('/posts/:slug', async (req, res, next) => {
    try {
        const { slug } = req.params;
        const post = await prisma.post.findUnique({
            where: { slug },
            include: {
                categoria: true,
                imovel: true
            }
        });

        if (!post) {
            throw new NotFoundError('Post não encontrado');
        }

        res.status(200).json(post);
    } catch (error) {
        next(error);
    }
});

// Atualizar Post (protegido)
router.put('/posts/:id', authenticateToken, handleMulterError(uploadPostsS3.single('imagemCapa')), validate(postSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            titulo,
            slug,
            chamada,
            conteudo,
            dataPublicacao,
            status,
            categoriaId,
            imovelId
        } = req.body;

        const postExistente = await prisma.post.findUnique({
            where: { id: parseInt(id) }
        });

        if (!postExistente) {
            throw new NotFoundError('Post não encontrado');
        }

        const data = {
            titulo,
            slug,
            chamada,
            conteudo,
            dataPublicacao: dataPublicacao ? new Date(dataPublicacao) : null,
            status,
            categoriaId: parseInt(categoriaId),
            imovelId: imovelId ? parseInt(imovelId) : null
        };

        if (req.file) {
            data.imagemCapa = req.file.location;
        }

        const post = await prisma.post.update({
            where: { id: parseInt(id) },
            data: data,
            include: {
                categoria: true,
                imovel: true
            }
        });

        res.status(200).json(post);
    } catch (error) {
        next(error);
    }
});

// Deletar Post (protegido)
router.delete('/posts/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.post.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({ message: 'Post deletado com sucesso' });
    } catch (error) {
        next(error);
    }
});

export default router;
