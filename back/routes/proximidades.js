import express from 'express';
import prisma from '../config/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, proximidadeSchema } from '../middleware/validation.js';
import { ConflictError } from '../utils/errors.js';

const router = express.Router();

// Listar proximidades (público)
router.get('/proximidades', async (req, res, next) => {
    try {
        const filtro = {};
        if (req.query.nome) {
            filtro.nome = { contains: req.query.nome };
        }

        const proximidades = await prisma.proximidade.findMany({
            where: filtro,
            orderBy: { nome: 'asc' }
        });

        res.status(200).json(proximidades);
    } catch (error) {
        next(error);
    }
});

// Criar proximidade (protegido)
router.post('/proximidades', authenticateToken, validate(proximidadeSchema), async (req, res, next) => {
    try {
        const { nome } = req.body;

        const existing = await prisma.proximidade.findUnique({ where: { nome } });
        if (existing) {
            throw new ConflictError('Proximidade já existe');
        }

        const response = await prisma.proximidade.create({ data: { nome } });
        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
});

// Atualizar proximidade (protegido)
router.put('/proximidades/:id', authenticateToken, validate(proximidadeSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nome } = req.body;

        const response = await prisma.proximidade.update({
            where: { id: parseInt(id) },
            data: { nome }
        });

        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
});

// Deletar proximidade (protegido)
router.delete('/proximidades/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.proximidade.delete({ where: { id: parseInt(id) } });
        res.status(200).json({ message: 'Proximidade deletada com sucesso' });
    } catch (error) {
        next(error);
    }
});

export default router;
