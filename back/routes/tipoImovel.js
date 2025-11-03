import express from 'express';
import prisma from '../config/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, tipoSchema } from '../middleware/validation.js';
import { ConflictError } from '../utils/errors.js';

const router = express.Router();

// Criar tipo (protegido)
router.post('/tipo', authenticateToken, validate(tipoSchema), async (req, res, next) => {
    try {
        console.log('Recebendo requisição POST /tipo');
        const { nome } = req.body;

        // Verificar se tipo já existe
        const existingTipo = await prisma.tipo.findUnique({
            where: { nome }
        });

        if (existingTipo) {
            throw new ConflictError('Tipo de imóvel já existe');
        }

        const response = await prisma.tipo.create({
            data: { nome }
        });

        console.log('Novo tipo criado:', response);
        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
})

// Lista tipos (público - necessário para exibir no site)
router.get('/tipo', async (req, res, next) => {
    try {
        console.log('Recebendo requisição GET /tipo');

        const filtro = {};
        if (req.query.nome) {
            filtro.nome = { contains: req.query.nome };
        }

        const tipos = await prisma.tipo.findMany({
            where: filtro,
            orderBy: {
                nome: 'asc'
            }
        });

        console.log(`Tipos de imóvel encontrados: ${tipos.length}`);
        res.status(200).json(tipos);
    } catch (error) {
        next(error);
    }
});

// Atualizar tipo (protegido)
router.put('/tipo/:id', authenticateToken, validate(tipoSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nome } = req.body;

        const tipo = await prisma.tipo.update({
            where: { id: parseInt(id) },
            data: { nome }
        });

        res.status(200).json(tipo);
    } catch (error) {
        next(error);
    }
});

// Deletar tipo (protegido)
router.delete('/tipo/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.tipo.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({ message: 'Tipo deletado com sucesso' });
    } catch (error) {
        next(error);
    }
});

export default router;