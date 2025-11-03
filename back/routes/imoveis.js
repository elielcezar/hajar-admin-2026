import express from 'express';
import prisma from '../config/prisma.js';
import { uploadS3 } from '../config/s3.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, imovelCreateSchema } from '../middleware/validation.js';
import { NotFoundError } from '../utils/errors.js';

const router = express.Router();

// Middleware para tratamento de erros do multer
const handleMulterError = (upload) => {
    return (req, res, next) => {
        upload(req, res, (err) => {
            if (err) {
                console.error('❌ Erro no upload de arquivos:', err.message);
                console.error('Stack:', err.stack);
                console.error('Detalhes do erro:', {
                    code: err.code,
                    field: err.field,
                    name: err.name
                });
                
                if (err.code === 'LIMIT_FILE_SIZE') {
                    const maxSizeMB = 10;
                    const fileName = err.field ? `O arquivo "${err.field}"` : 'Um arquivo';
                    return res.status(400).json({
                        error: 'Arquivo muito grande',
                        message: `${fileName} excede o limite de ${maxSizeMB}MB. Por favor, comprima a imagem antes de enviar.`
                    });
                }
                
                if (err.code === 'LIMIT_FILE_COUNT') {
                    return res.status(400).json({
                        error: 'Muitos arquivos',
                        message: 'O número máximo de arquivos é 18'
                    });
                }
                
                if (err.message && err.message.includes('Tipo de arquivo inválido')) {
                    return res.status(400).json({
                        error: 'Tipo de arquivo inválido',
                        message: err.message
                    });
                }
                
                // Erros do S3/AWS - capturar qualquer erro relacionado ao S3
                const isS3Error = err.name === 'S3Client' || 
                                 err.$metadata || 
                                 err.Code || 
                                 err.code === 'CredentialsError' || 
                                 err.name === 'NoCredentialsError' ||
                                 err.name === 'AccessDenied' ||
                                 err.code === 'AccessDenied' ||
                                 err.message?.includes('S3') ||
                                 err.message?.includes('AWS') ||
                                 err.message?.includes('bucket') ||
                                 err.stack?.includes('s3') ||
                                 err.stack?.includes('S3');
                
                if (isS3Error) {
                    console.error('❌ Erro no S3/AWS:', err);
                    console.error('   Tipo:', err.name || err.constructor?.name);
                    console.error('   Código:', err.code || err.Code);
                    console.error('   Mensagem:', err.message);
                    console.error('   Stack completo:', err.stack);
                    if (err.$metadata) {
                        console.error('   Metadata:', JSON.stringify(err.$metadata, null, 2));
                    }
                    
                    let errorMessage = 'Erro ao fazer upload para S3';
                    let statusCode = 500;
                    
                    if (err.name === 'NoCredentialsError' || err.code === 'CredentialsError' || err.message?.includes('credentials')) {
                        errorMessage = 'Credenciais AWS não configuradas ou inválidas. Verifique as variáveis AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY no servidor.';
                        statusCode = 500;
                    } else if (err.Code === 'NoSuchBucket' || err.message?.includes('bucket') || err.message?.includes('does not exist')) {
                        errorMessage = `Bucket S3 não encontrado. Verifique se o bucket "${process.env.AWS_S3_BUCKET}" existe na região ${process.env.AWS_REGION}.`;
                        statusCode = 500;
                    } else if (err.Code === 'AccessDenied' || err.name === 'AccessDenied' || err.message?.includes('Access Denied') || err.message?.includes('not authorized')) {
                        errorMessage = 'Acesso negado ao S3. O usuário IAM não tem permissão s3:PutObject. Verifique as permissões IAM.';
                        statusCode = 403;
                    } else if (err.message?.includes('region') || err.message?.includes('Região')) {
                        errorMessage = `Erro de região AWS. Verifique se a região "${process.env.AWS_REGION}" está correta.`;
                        statusCode = 500;
                    } else if (err.Code === 'AccessControlListNotSupported' || err.name === 'AccessControlListNotSupported' || err.message?.includes('does not allow ACLs')) {
                        errorMessage = 'O bucket S3 não permite ACLs. Remova a configuração ACL do código e use política de bucket para acesso público.';
                        statusCode = 400;
                    } else {
                        // Em produção, sempre mostrar a mensagem de erro real para debug
                        errorMessage = `Erro S3: ${err.message || 'Erro desconhecido'}`;
                    }
                    
                    return res.status(statusCode).json({
                        error: 'Erro ao fazer upload para S3',
                        message: errorMessage,
                        // Em produção também mostrar detalhes básicos para facilitar debug
                        details: {
                            type: err.name || err.constructor?.name,
                            code: err.code || err.Code || 'N/A'
                        }
                    });
                }
                
                return res.status(500).json({
                    error: 'Erro ao processar upload',
                    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro ao fazer upload de imagens'
                });
            }
            next();
        });
    };
};

// Criar imovel (protegido)
router.post('/imoveis', authenticateToken, handleMulterError(uploadS3.array('fotos', 18)), async (req, res, next) => {
    try {
        console.log('📥 Recebendo requisição POST /imoveis');
        console.log('📦 Files recebidos:', req.files ? req.files.length : 0);
        console.log('📋 Headers:', {
            'content-type': req.headers['content-type'],
            'content-length': req.headers['content-length']
        });
        
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

        console.log('📝 Dados body recebidos:', {
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
        });

        // URLs das fotos no S3
        const fotos = req.files ? req.files.map(file => {
            console.log('📸 Arquivo processado:', {
                originalname: file.originalname,
                location: file.location,
                size: file.size,
                mimetype: file.mimetype
            });
            return file.location;
        }) : [];

        console.log('🔗 URLs das fotos:', fotos);
        
        // Validações básicas
        if (!titulo || !codigo || !tipo || !finalidade) {
            return res.status(400).json({
                error: 'Campos obrigatórios faltando',
                message: 'Título, código, tipo e finalidade são obrigatórios'
            });
        }
        
        console.log('💾 Criando imóvel no banco de dados...');
        
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
        
        console.log('✅ Imóvel criado com sucesso:', response.id);
        res.status(201).json(response);
    } catch (error) {
        console.error('❌ Erro ao criar imóvel:', error);
        console.error('Erro completo:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        });
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
router.put('/imoveis/:id', authenticateToken, handleMulterError(uploadS3.array('fotos', 18)), async (req, res, next) => {
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




