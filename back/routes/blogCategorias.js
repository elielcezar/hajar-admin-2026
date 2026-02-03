import express from 'express';
import prisma from '../config/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, blogCategoriaSchema } from '../middleware/validation.js';
import { ConflictError } from '../utils/errors.js';

const router = express.Router();

// Criar categoria de blog (protegido)
router.post('/blog-categorias', authenticateToken, validate(blogCategoriaSchema), async (req, res, next) => {
    try {
        const { nome } = req.body;

        const existingCategoria = await prisma.blogCategoria.findUnique({
            where: { nome }
        });

        if (existingCategoria) {
            throw new ConflictError('Categoria já existe');
        }

        const response = await prisma.blogCategoria.create({
            data: { nome }
        });

        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
});

// Listar categorias de blog (público)
router.get('/blog-categorias', async (req, res, next) => {
    try {
        const categorias = await prisma.blogCategoria.findMany({
            orderBy: { nome: 'asc' }
        });
        res.status(200).json(categorias);
    } catch (error) {
        next(error);
    }
});

// Atualizar categoria de blog (protegido)
router.put('/blog-categorias/:id', authenticateToken, validate(blogCategoriaSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nome } = req.body;

        const categoria = await prisma.blogCategoria.update({
            where: { id: parseInt(id) },
            data: { nome }
        });

        res.status(200).json(categoria);
    } catch (error) {
        next(error);
    }
});

// Deletar categoria de blog (protegido)
router.delete('/blog-categorias/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.blogCategoria.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({ message: 'Categoria deletada com sucesso' });
    } catch (error) {
        next(error);
    }
});

export default router;
