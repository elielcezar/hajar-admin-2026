import express from 'express';
import prisma from '../config/prisma.js';
import { uploadS3 } from '../config/s3.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, imovelCreateSchema } from '../middleware/validation.js';
import { NotFoundError } from '../utils/errors.js';

const router = express.Router();

// Criar imovel (protegido)
router.post('/imoveis', authenticateToken, uploadS3.array('fotos', 10), async (req, res, next) => {
    try {
        console.log('Recebendo requisição POST /imoveis');
        
        const { 
            titulo, 
            codigo, 
            subTitulo, 
            descricaoCurta, 
            descricaoLonga,
            tipo,
            finalidade,
            valor,
            endereco,
            cidade
        } = req.body;

        // URLs das fotos no S3
        const fotos = req.files ? req.files.map(file => file.location) : [];

        console.log('Dados recebidos:', {titulo, codigo, subTitulo, descricaoCurta, descricaoLonga, tipo, finalidade, valor, endereco, cidade, fotos});        
        
        const response = await prisma.imovel.create({
            data: {
                titulo, 
                codigo, 
                subTitulo, 
                descricaoCurta, 
                descricaoLonga,                
                valor,
                endereco,
                cidade,
                fotos: fotos,
                tipo: {
                    create: [{
                        tipoId: parseInt(tipo)
                    }]
                },
                finalidade: {
                    create: [{
                        finalidadeId: parseInt(finalidade)
                    }]
                }
            },
            include: {
                tipo: {
                    include: {
                        tipo: true
                    }
                },
                finalidade: {
                    include: {
                        finalidade: true
                    }
                }
            }
        });
        
        console.log('Imóvel criado:', response);
        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
})

// Listar imoveis (público)
router.get('/imoveis', async (req, res, next) => {
    try {
        console.log('Recebendo requisição GET /imoveis');
        console.log('Query params:', req.query);

        // Criar objeto de filtro apenas com parâmetros definidos
        const filtro = {};
        if (req.query.codigo) filtro.codigo = req.query.codigo;                
        if (req.query.cidade) filtro.cidade = req.query.cidade;
        if (req.query.tipo) {
            filtro.tipo = {
                some: {
                    tipo: {
                        nome: req.query.tipo
                    }
                }
            }
        }
        if (req.query.finalidade) {
            filtro.finalidade = {
                some: {
                    finalidade: {
                        nome: req.query.finalidade
                    }
                }
            }
        }         

        const imoveis = await prisma.imovel.findMany({
            where: filtro,
            include: {
                tipo: {
                    include: {
                        tipo: true
                    }
                },
                finalidade: {
                    include: {
                        finalidade: true
                    }
                },
                categorias: {
                    include: {
                        categoria: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`Imóveis encontrados: ${imoveis.length}`);
        res.status(200).json(imoveis);
    } catch (error) {
        next(error);
    }
});

// Obter imovel pelo ID (público)
router.get('/imoveis/id/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const imovel = await prisma.imovel.findUnique({
            where: {
                id: parseInt(id)
            },
            include: {
                tipo: {
                    include: {
                        tipo: true
                    }
                },
                finalidade: {
                    include: {
                        finalidade: true
                    }
                },
                categorias: {
                    include: {
                        categoria: true
                    }
                }
            }
        });
        
        if (!imovel) {
            throw new NotFoundError('Imóvel não encontrado');
        }
        
        res.json(imovel);
    } catch (error) {
        next(error);
    }
});


// Obter imovel pelo codigo do cadastro (público)
router.get('/imoveis/:codigo', async (req, res, next) => {
    try {
        console.log('Recebendo requisição GET /imoveis/:codigo');
        console.log('Código:', req.params.codigo);

        const { codigo } = req.params;
        const imovel = await prisma.imovel.findUnique({
            where: {
                codigo: codigo
            },
            include: {
                tipo: {
                    include: {
                        tipo: true
                    }
                },
                finalidade: {
                    include: {
                        finalidade: true
                    }
                },
                categorias: {
                    include: {
                        categoria: true
                    }
                }
            }
        });
        
        if (!imovel) {
            throw new NotFoundError('Imóvel não encontrado');
        }
        
        res.json(imovel);
        console.log('Imóvel encontrado:', imovel.titulo);
    } catch (error) {
        next(error);
    }
});

// Atualizar imovel (protegido)
router.put('/imoveis/:id', authenticateToken, uploadS3.array('fotos', 10), async (req, res, next) => {
    try {
        console.log('Recebendo requisição PUT /imoveis');

        const { id } = req.params;
        const {
            titulo,
            codigo,
            subTitulo,
            descricaoCurta,
            descricaoLonga,
            tipo,
            finalidade,
            valor,
            endereco,
            cidade,
            oldPhotos
        } = req.body;

        // Verificar se imóvel existe
        const imovelExistente = await prisma.imovel.findUnique({
            where: { id: parseInt(id) }
        });

        if (!imovelExistente) {
            throw new NotFoundError('Imóvel não encontrado');
        }

        // Processar fotos
        let fotos = [];
        if (oldPhotos) {
            fotos = JSON.parse(oldPhotos); // Fotos antigas mantidas
        }
        if (req.files && req.files.length > 0) {
            const novasFotos = req.files.map(file => file.location); // URLs do S3
            fotos = [...fotos, ...novasFotos];
        }

        const data = {
            titulo,
            codigo,
            subTitulo,
            descricaoCurta,
            descricaoLonga,
            valor,
            endereco,
            cidade,
            fotos
        };

        console.log('Atualizando imóvel com dados:', data);

        const response = await prisma.imovel.update({
            where: { id: parseInt(id) },
            data: data,
            include: {
                tipo: {
                    include: {
                        tipo: true
                    }
                },
                finalidade: {
                    include: {
                        finalidade: true
                    }
                }
            }
        });

        // Atualizar tipo
        if (tipo) {
            await prisma.imovelTipo.deleteMany({
                where: { imovelId: parseInt(id) }
            });
            await prisma.imovelTipo.create({
                data: {
                    imovelId: parseInt(id),
                    tipoId: parseInt(tipo)
                }
            });
        }

        // Atualizar finalidade
        if (finalidade) {
            await prisma.imovelFinalidade.deleteMany({
                where: { imovelId: parseInt(id) }
            });
            await prisma.imovelFinalidade.create({
                data: {
                    imovelId: parseInt(id),
                    finalidadeId: parseInt(finalidade)
                }
            });
        }

        console.log('Imóvel atualizado com sucesso');
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
});

// Deletar imóvel (protegido)
router.delete('/imoveis/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;

        const imovel = await prisma.imovel.findUnique({
            where: { id: parseInt(id) }
        });

        if (!imovel) {
            throw new NotFoundError('Imóvel não encontrado');
        }

        await prisma.imovel.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({ message: 'Imóvel deletado com sucesso' });
    } catch (error) {
        next(error);
    }
});

export default router;




