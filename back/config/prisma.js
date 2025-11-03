import { PrismaClient } from '@prisma/client';

// Instância singleton do Prisma para evitar múltiplas conexões
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Em desenvolvimento, usa variável global para manter a instância durante hot-reload
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.prisma;
}

export default prisma;

