import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usuariosRoutes from './routes/usuarios.js';
import imoveisRoutes from './routes/imoveis.js';
import loginRoutes from './routes/login.js';
import categoriasRoutes from './routes/categorias.js';
import tipoRoutes from './routes/tipoImovel.js';
import finalidadeRoutes from './routes/finalidade.js';
import { errorHandler } from './utils/errors.js';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Rota de health check
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        message: 'API Hajar Imóveis - Servidor funcionando',
        timestamp: new Date().toISOString()
    });
});

// Rotas da API
app.use('/api', loginRoutes);
app.use('/api', usuariosRoutes);
app.use('/api', imoveisRoutes);
app.use('/api', categoriasRoutes);
app.use('/api', tipoRoutes);
app.use('/api', finalidadeRoutes);

// Servir arquivos estáticos (se existirem uploads locais antigos)
app.use('/uploads', express.static('uploads'));

// Rota 404 - deve vir antes do error handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Rota não encontrada',
        path: req.path
    });
});

// Middleware de tratamento de erros global (deve ser o último)
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📡 API Base URL: http://localhost:${PORT}/api\n`);
});