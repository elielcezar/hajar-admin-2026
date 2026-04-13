#!/bin/bash
set -e

echo "=== Iniciando deploy ==="

# Backend
echo ">> Instalando dependencias do backend..."
cd back
npm install --production

echo ">> Gerando Prisma Client..."
npx prisma generate

echo ">> Executando migrations..."
npx prisma migrate deploy

echo ">> Reiniciando backend..."
if pm2 describe hajar-admin > /dev/null 2>&1; then
  pm2 restart hajar-admin
else
  pm2 start server.js --name hajar-admin
fi
cd ..

# Frontend
echo ">> Instalando dependencias do frontend..."
cd front
npm install

echo ">> Build do frontend..."
npm run build
cd ..

echo "=== Deploy concluido com sucesso ==="
