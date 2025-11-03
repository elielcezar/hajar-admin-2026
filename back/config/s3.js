import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';

// Validar variáveis de ambiente AWS
const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;

// Log de configuração (sem expor credenciais)
console.log('🔧 Configurando S3:');
console.log('  📍 Região:', AWS_REGION || 'NÃO CONFIGURADO');
console.log('  🗝️  Access Key ID:', AWS_ACCESS_KEY_ID ? `${AWS_ACCESS_KEY_ID.substring(0, 4)}...` : 'NÃO CONFIGURADO');
console.log('  🔐 Secret Key:', AWS_SECRET_ACCESS_KEY ? '***CONFIGURADO***' : 'NÃO CONFIGURADO');
console.log('  🪣 Bucket:', AWS_S3_BUCKET || 'NÃO CONFIGURADO');

if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET) {
    console.warn('⚠️  AVISO: Credenciais AWS não configuradas completamente. Uploads podem falhar.');
}

// Configuração do cliente S3
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

// Configuração do Multer para upload direto no S3
export const uploadS3 = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: AWS_S3_BUCKET,
    acl: 'public-read', // Tornar objetos públicos para leitura
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `imoveis/${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB por arquivo
    files: 18, // Máximo de 18 arquivos
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido. Apenas JPEG, JPG, PNG e WEBP são permitidos.'));
    }
  },
});

export { s3Client };

