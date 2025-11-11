# 🏢 Painel Administrativo - Hajar Imóveis

Sistema completo de administração para imobiliária desenvolvido com **React**, **Node.js**, **MySQL** e **AWS S3**.

## 📋 Índice

- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Executando o Projeto](#-executando-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [API Endpoints](#-api-endpoints)

---

## 🚀 Tecnologias

### Backend
- **Node.js** + **Express** - Framework web
- **Prisma ORM** - ORM para MySQL
- **MySQL** - Banco de dados
- **JWT** - Autenticação
- **AWS S3** - Armazenamento de imagens
- **Zod** - Validação de dados
- **Multer-S3** - Upload de arquivos

### Frontend
- **React** + **TypeScript** - Framework UI
- **Vite** - Build tool
- **TanStack Query** - Gerenciamento de estado servidor
- **React Router** - Roteamento
- **Tailwind CSS** - Estilização
- **Shadcn/ui** - Componentes UI
- **Axios** - Cliente HTTP

---

## 📁 Estrutura do Projeto

```
Admin/
├── back/                    # Backend (Node.js + Express)
│   ├── config/             # Configurações (Prisma, S3)
│   ├── middleware/         # Middlewares (Auth, Validation)
│   ├── routes/             # Rotas da API
│   ├── utils/              # Utilitários (JWT, Errors)
│   ├── prisma/             # Schema do banco de dados
│   └── server.js           # Servidor principal
│
├── front/                   # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # Serviços da API
│   │   ├── lib/            # Configurações e utilitários
│   │   └── types/          # Tipos TypeScript
│   └── public/             # Arquivos estáticos
│
└── README.md               # Este arquivo
```

---

## ✅ Pré-requisitos

Antes de começar, você precisará ter instalado:

- **Node.js** (v18 ou superior)
- **npm** ou **yarn**
- **MySQL** (v8 ou superior)
- **Conta AWS** com S3 configurado (para upload de imagens)

---

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd Admin
```

### 2. Instale as dependências do Backend

```bash
cd back
npm install
```

### 3. Instale as dependências do Frontend

```bash
cd ../front
npm install
```

---

## ⚙️ Configuração

### Backend

1. Crie um arquivo `.env` na pasta `back/`:

```env
# Database
DATABASE_URL="mysql://usuario:senha@localhost:3306/hajar_imoveis"

# JWT
JWT_SECRET="seu-secret-super-seguro-aqui"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="sua-access-key-id"
AWS_SECRET_ACCESS_KEY="sua-secret-access-key"
AWS_S3_BUCKET="nome-do-seu-bucket"

# Server
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

2. Configure o banco de dados MySQL:

```bash
# Crie o banco de dados
mysql -u root -p
CREATE DATABASE hajar_imoveis;
```

3. Execute as migrations do Prisma:

```bash
cd back
npx prisma generate
npx prisma migrate dev --name init
```

4. (Opcional) Crie um usuário admin inicial:

```bash
# Use o Prisma Studio para criar o primeiro usuário
npx prisma studio
```

### Frontend

1. Crie um arquivo `.env` na pasta `front/`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_GOOGLE_MAPS_API_KEY=sua-google-maps-api-key-aqui
```

**Obter Google Maps API Key:**
- Acesse [Google Cloud Console](https://console.cloud.google.com/)
- Crie um projeto e ative as APIs: **Maps JavaScript API** e **Geocoding API**
- Crie uma chave de API em **Credenciais**
- Adicione a chave no `.env` acima

---

## 🚀 Executando o Projeto

### Backend (Terminal 1)

```bash
cd back
npm run dev
```

O servidor estará rodando em: `http://localhost:3000`

### Frontend (Terminal 2)

```bash
cd front
npm run dev
```

O frontend estará rodando em: `http://localhost:5173`

### Acessando o Sistema

1. Abra o navegador em `http://localhost:5173`
2. Acesse `/admin/login`
3. Faça login com as credenciais criadas

---

## 🎯 Funcionalidades

### ✅ Autenticação
- Login com email e senha
- JWT com access token e refresh token
- Renovação automática de tokens
- Logout seguro

### ✅ Dashboard
- Estatísticas de imóveis
- Estatísticas de usuários
- Visão geral do sistema

### ✅ Gestão de Imóveis
- Listagem com busca e ordenação
- Cadastro de novos imóveis
- Edição de imóveis existentes
- Exclusão de imóveis
- Upload múltiplo de imagens (até 10 por imóvel)
- Preview de imagens
- **Integração com Google Maps** - Localização automática no mapa
- **Integração com ViaCEP** - Preenchimento automático de endereço
- Campos: título, código, descrições, valor, localização completa (CEP, endereço, bairro, cidade, estado)
- Armazenamento de coordenadas (latitude/longitude)

### ✅ Gestão de Usuários
- Listagem de usuários
- Cadastro de novos usuários
- Edição de usuários
- Exclusão de usuários
- Validação de formulários

### ✅ Gestão de Tipos/Finalidades
- Tipos de imóveis (Casa, Apartamento, etc.)
- Finalidades (Venda, Aluguel, etc.)
- CRUD completo

---

## 📡 API Endpoints

### Autenticação
```
POST   /api/login            # Login
POST   /api/refresh          # Refresh token
```

### Usuários
```
GET    /api/usuarios         # Listar usuários
GET    /api/usuarios/:id     # Buscar usuário
POST   /api/usuarios         # Criar usuário
PUT    /api/usuarios/:id     # Atualizar usuário
DELETE /api/usuarios/:id     # Deletar usuário
```

### Imóveis
```
GET    /api/imoveis          # Listar imóveis
GET    /api/imoveis/:id      # Buscar imóvel
GET    /api/imoveis/codigo/:codigo  # Buscar por código
POST   /api/imoveis          # Criar imóvel (com upload)
PUT    /api/imoveis/:id      # Atualizar imóvel (com upload)
DELETE /api/imoveis/:id      # Deletar imóvel
```

### Tipos
```
GET    /api/tipos            # Listar tipos
POST   /api/tipos            # Criar tipo
PUT    /api/tipos/:id        # Atualizar tipo
DELETE /api/tipos/:id        # Deletar tipo
```

### Finalidades
```
GET    /api/finalidades      # Listar finalidades
POST   /api/finalidades      # Criar finalidade
PUT    /api/finalidades/:id  # Atualizar finalidade
DELETE /api/finalidades/:id  # Deletar finalidade
```

### Categorias
```
GET    /api/categorias       # Listar categorias
POST   /api/categorias       # Criar categoria
PUT    /api/categorias/:id   # Atualizar categoria
DELETE /api/categorias/:id   # Deletar categoria
```

---

## 🔐 Segurança

- Autenticação JWT em todas as rotas protegidas
- Senhas criptografadas com bcrypt
- Validação de dados com Zod
- CORS configurado
- Tratamento global de erros
- Refresh tokens para sessões seguras

---

## 📝 Scripts Úteis

### Backend

```bash
npm run dev          # Inicia servidor em modo desenvolvimento
npm start            # Inicia servidor em modo produção
npm run migrate      # Executa migrations do Prisma
npm run prisma:studio # Abre Prisma Studio (GUI do banco)
```

### Frontend

```bash
npm run dev          # Inicia dev server
npm run build        # Build para produção
npm run preview      # Preview do build de produção
npm run lint         # Executa linter
```

---

## 🐛 Troubleshooting

### Backend não conecta ao MySQL
- Verifique se o MySQL está rodando
- Confirme as credenciais no `.env`
- Teste a conexão: `mysql -u usuario -p`

### Upload de imagens não funciona
- Verifique as credenciais AWS no `.env`
- Confirme que o bucket S3 existe e tem permissões corretas
- Verifique se a região está correta

### Erro de CORS
- Confirme que `FRONTEND_URL` no backend está correto
- Verifique se o frontend está rodando na porta esperada

### Token expirado
- O sistema renova automaticamente tokens expirados
- Se persistir, faça logout e login novamente

---

## 📚 Documentação Adicional

- [Migração Google Maps](./MIGRATION_GOOGLE_MAPS.md) - **NOVO** - Integração com Google Maps
- [Migração CEP](./back/MIGRATION_CEP.md) - Integração com ViaCEP
- [Status da Integração](./front/INTEGRATION_STATUS.md) - Detalhes da integração frontend/backend
- [Schema do Banco](./back/prisma/schema.prisma) - Estrutura do banco de dados
- [Prisma Docs](https://www.prisma.io/docs)
- [React Query Docs](https://tanstack.com/query/latest)

---

## 👥 Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
2. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
3. Push para a branch (`git push origin feature/NovaFuncionalidade`)
4. Abra um Pull Request

---

## 📄 Licença

Este projeto é proprietário e confidencial.

---

## 💬 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ para Hajar Imóveis**
