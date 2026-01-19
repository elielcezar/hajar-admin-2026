import express from 'express';
import prisma from '../config/prisma.js';
import { uploadS3 } from '../config/s3.js';
import { authenticateToken } from '../middleware/auth.js';
import { NotFoundError } from '../utils/errors.js';

const router = express.Router();

// Middleware para tratamento de erros do multer
const handleMulterError = (upload) => {
    return (req, res, next) => {
        upload(req, res, (err) => {
            if (err) {
                console.error('❌ Erro no upload de arquivo:', err.message);
                
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        error: 'Arquivo muito grande',
                        message: 'O arquivo excede o limite de 10MB. Por favor, comprima a imagem antes de enviar.'
                    });
                }
                
                if (err.message && err.message.includes('Tipo de arquivo inválido')) {
                    return res.status(400).json({
                        error: 'Tipo de arquivo inválido',
                        message: err.message
                    });
                }
                
                // Erros do S3/AWS
                const isS3Error = err.name === 'S3Client' || 
                                 err.$metadata || 
                                 err.Code || 
                                 err.message?.includes('S3') ||
                                 err.message?.includes('AWS');
                
                if (isS3Error) {
                    console.error('❌ Erro no S3/AWS:', err);
                    return res.status(500).json({
                        error: 'Erro ao fazer upload para S3',
                        message: 'Erro ao fazer upload da imagem para o servidor.'
                    });
                }
                
                return res.status(500).json({
                    error: 'Erro ao processar upload',
                    message: 'Erro ao fazer upload da imagem'
                });
            }
            next();
        });
    };
};

// Listar destaques ativos (público - para o site)
router.get('/destaques', async (req, res, next) => {
    try {
        console.log('📥 GET /api/destaques - Listando destaques ativos');

        const destaques = await prisma.destaque.findMany({
            where: {
                ativo: true
            },
            orderBy: {
                ordem: 'asc'
            }
        });

        console.log(`✅ ${destaques.length} destaques ativos encontrados`);
        res.status(200).json(destaques);
    } catch (error) {
        console.error('❌ Erro ao listar destaques:', error);
        next(error);
    }
});

// Listar todos os destaques (admin)
router.get('/destaques/admin', authenticateToken, async (req, res, next) => {
    try {
        console.log('📥 GET /api/destaques/admin - Listando todos os destaques');

        const destaques = await prisma.destaque.findMany({
            orderBy: [
                { ordem: 'asc' },
                { createdAt: 'desc' }
            ]
        });

        console.log(`✅ ${destaques.length} destaques encontrados`);
        res.status(200).json(destaques);
    } catch (error) {
        console.error('❌ Erro ao listar destaques (admin):', error);
        next(error);
    }
});

// Obter destaque por ID (público)
router.get('/destaques/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`📥 GET /api/destaques/${id}`);

        const destaque = await prisma.destaque.findUnique({
            where: {
                id: parseInt(id)
            }
        });

        if (!destaque) {
            throw new NotFoundError('Destaque não encontrado');
        }

        console.log(`✅ Destaque encontrado: ${destaque.titulo}`);
        res.status(200).json(destaque);
    } catch (error) {
        console.error('❌ Erro ao buscar destaque:', error);
        next(error);
    }
});

// Criar destaque (protegido)
router.post('/destaques', authenticateToken, handleMulterError(uploadS3.single('imagem')), async (req, res, next) => {
    try {
        console.log('📥 POST /api/destaques - Criando destaque');
        console.log('📦 Arquivo recebido:', req.file ? 'Sim' : 'Não');

        const {
            titulo,
            descricao,
            valor,
            area,
            quartos,
            banheiros,
            garagem,
            textoBotao,
            link,
            ativo,
            ordem
        } = req.body;

        console.log('📋 Dados recebidos:', {
            titulo,
            descricao,
            valor,
            area,
            quartos,
            banheiros,
            garagem,
            textoBotao,
            link,
            ativo,
            ordem
        });

        // Validações básicas
        if (!titulo || !descricao || !textoBotao || !link) {
            return res.status(400).json({
                error: 'Campos obrigatórios faltando',
                message: 'Título, descrição, texto do botão e link são obrigatórios'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                error: 'Imagem obrigatória',
                message: 'É necessário enviar uma imagem para o destaque'
            });
        }

        // URL da imagem no S3
        const imagemUrl = req.file.location;
        console.log('🔗 URL da imagem:', imagemUrl);

        console.log('💾 Criando destaque no banco de dados...');

        const destaque = await prisma.destaque.create({
            data: {
                titulo,
                descricao,
                imagem: imagemUrl,
                valor: valor ? parseFloat(valor) : null,
                area: area ? parseInt(area) : null,
                quartos: quartos ? parseInt(quartos) : null,
                banheiros: banheiros ? parseInt(banheiros) : null,
                garagem: garagem ? parseInt(garagem) : null,
                textoBotao,
                link,
                ativo: ativo === 'true' || ativo === true,
                ordem: ordem ? parseInt(ordem) : 0
            }
        });

        console.log(`✅ Destaque criado com sucesso: ${destaque.id}`);
        res.status(201).json(destaque);
    } catch (error) {
        console.error('❌ Erro ao criar destaque:', error);
        next(error);
    }
});

// Atualizar destaque (protegido)
router.put('/destaques/:id', authenticateToken, handleMulterError(uploadS3.single('imagem')), async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`📥 PUT /api/destaques/${id} - Atualizando destaque`);

        const {
            titulo,
            descricao,
            valor,
            area,
            quartos,
            banheiros,
            garagem,
            textoBotao,
            link,
            ativo,
            ordem,
            oldImage
        } = req.body;

        // Verificar se destaque existe
        const destaqueExistente = await prisma.destaque.findUnique({
            where: { id: parseInt(id) }
        });

        if (!destaqueExistente) {
            throw new NotFoundError('Destaque não encontrado');
        }

        // Processar imagem
        let imagemUrl = oldImage || destaqueExistente.imagem;
        if (req.file) {
            imagemUrl = req.file.location;
            console.log('🔗 Nova imagem:', imagemUrl);
        }

        // Construir objeto de dados
        const data = {};

        if (titulo !== undefined) data.titulo = titulo;
        if (descricao !== undefined) data.descricao = descricao;
        if (imagemUrl) data.imagem = imagemUrl;
        if (valor !== undefined) data.valor = valor ? parseFloat(valor) : null;
        if (area !== undefined) data.area = area ? parseInt(area) : null;
        if (quartos !== undefined) data.quartos = quartos ? parseInt(quartos) : null;
        if (banheiros !== undefined) data.banheiros = banheiros ? parseInt(banheiros) : null;
        if (garagem !== undefined) data.garagem = garagem ? parseInt(garagem) : null;
        if (textoBotao !== undefined) data.textoBotao = textoBotao;
        if (link !== undefined) data.link = link;
        if (ativo !== undefined) data.ativo = ativo === 'true' || ativo === true;
        if (ordem !== undefined) data.ordem = parseInt(ordem);

        console.log('💾 Atualizando destaque com dados:', data);

        const destaque = await prisma.destaque.update({
            where: { id: parseInt(id) },
            data
        });

        console.log('✅ Destaque atualizado com sucesso');
        res.status(200).json(destaque);
    } catch (error) {
        console.error('❌ Erro ao atualizar destaque:', error);
        next(error);
    }
});

// Deletar destaque (protegido)
router.delete('/destaques/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`📥 DELETE /api/destaques/${id}`);

        const destaque = await prisma.destaque.findUnique({
            where: { id: parseInt(id) }
        });

        if (!destaque) {
            throw new NotFoundError('Destaque não encontrado');
        }

        await prisma.destaque.delete({
            where: { id: parseInt(id) }
        });

        console.log('✅ Destaque deletado com sucesso');
        res.status(200).json({ message: 'Destaque deletado com sucesso' });
    } catch (error) {
        console.error('❌ Erro ao deletar destaque:', error);
        next(error);
    }
});

export default router;
