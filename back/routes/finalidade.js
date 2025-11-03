import express from 'express';
import prisma from '../config/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, finalidadeSchema } from '../middleware/validation.js';
import { ConflictError } from '../utils/errors.js';

const router = express.Router();

// Criar finalidade (protegido)
router.post('/finalidade', authenticateToken, validate(finalidadeSchema), async (req, res, next) => {
    try {
        console.log('Recebendo requisição POST /finalidade');
        const { nome } = req.body;

        // Verificar se finalidade já existe
        const existingFinalidade = await prisma.finalidade.findUnique({
            where: { nome }
        });

        if (existingFinalidade) {
            throw new ConflictError('Finalidade já existe');
        }

        const response = await prisma.finalidade.create({
            data: { nome }
        });

        console.log('Nova finalidade criada:', response);
        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
})

// Lista finalidades (público - necessário para exibir no site)
router.get('/finalidade', async (req, res, next) => {
    try {
        console.log('Recebendo requisição GET /finalidade');

        const filtro = {};
        if (req.query.nome) {
            filtro.nome = { contains: req.query.nome };
        }

        const finalidades = await prisma.finalidade.findMany({
            where: filtro,
            orderBy: {
                nome: 'asc'
            }
        });

        console.log(`Finalidades encontradas: ${finalidades.length}`);
        res.status(200).json(finalidades);
    } catch (error) {
        next(error);
    }
});

// Atualizar finalidade (protegido)
router.put('/finalidade/:id', authenticateToken, validate(finalidadeSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nome } = req.body;

        const finalidade = await prisma.finalidade.update({
            where: { id: parseInt(id) },
            data: { nome }
        });

        res.status(200).json(finalidade);
    } catch (error) {
        next(error);
    }
});

// Deletar finalidade (protegido)
router.delete('/finalidade/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.finalidade.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({ message: 'Finalidade deletada com sucesso' });
    } catch (error) {
        next(error);
    }
});

export default router;