# 🗺️ Migração - Integração com Google Maps

**Data:** 11/11/2025  
**Status:** ✅ Implementado

## 📋 Resumo

Implementação completa de integração com Google Maps no formulário de cadastro/edição de imóveis, com:
- Mapa interativo que localiza automaticamente o endereço
- Geocoding automático (endereço → coordenadas)
- Armazenamento de latitude e longitude no banco de dados
- Atualização em tempo real conforme o endereço é preenchido

---

## 🎯 Funcionalidade

### Como Funciona

1. **Usuário preenche o CEP** → ViaCEP busca e preenche os campos de endereço
2. **Campos de endereço são preenchidos** → Mapa faz geocoding automático
3. **Mapa atualiza automaticamente** → Mostra a localização no Google Maps
4. **Coordenadas são salvas** → Latitude e longitude armazenadas no banco

### Fluxo Visual

```
CEP digitado (01001-000)
    ↓
ViaCEP API busca endereço
    ↓
Campos preenchidos (endereço, bairro, cidade, estado)
    ↓
Google Maps Geocoding API (endereço → lat/lng)
    ↓
Mapa atualiza com marcador na localização
    ↓
Coordenadas salvas no banco de dados
```

---

## 🔧 Alterações Implementadas

### 1. Backend

#### Schema do Banco de Dados (`back/prisma/schema.prisma`)

```prisma
model Imovel {
  // ... campos existentes
  latitude   Float?   // Novo campo
  longitude  Float?   // Novo campo
  // ... outros campos
}
```

#### Validação (`back/middleware/validation.js`)

```javascript
export const imovelCreateSchema = z.object({
  // ... validações existentes
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});
```

#### Rotas (`back/routes/imoveis.js`)

**POST /api/imoveis** - Criar imóvel:
```javascript
const { latitude, longitude, /* outros campos */ } = req.body;

await prisma.imovel.create({
  data: {
    // ... outros campos
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
  }
});
```

**PUT /api/imoveis/:id** - Atualizar imóvel:
```javascript
const data = {
  // ... outros campos
  latitude: latitude ? parseFloat(latitude) : null,
  longitude: longitude ? parseFloat(longitude) : null,
};
```

---

### 2. Frontend

#### Novo Componente (`front/src/components/ui/google-map.tsx`)

Componente React completo com:
- ✅ Integração com Google Maps JavaScript API
- ✅ Geocoding automático de endereços
- ✅ Marcador interativo no mapa
- ✅ Estados de loading e erro
- ✅ Debounce para evitar muitas requisições
- ✅ Callback para atualizar coordenadas no formulário pai
- ✅ Interface responsiva

#### Tipos TypeScript Atualizados

**`front/src/types/admin.ts`:**
```typescript
export interface Property {
  // ... campos existentes
  latitude?: number;
  longitude?: number;
}

export interface PropertyFormData {
  // ... campos existentes
  latitude?: number;
  longitude?: number;
}
```

**`front/src/vite-env.d.ts`:**
```typescript
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;  // Novo
}
```

#### Formulário Atualizado (`front/src/pages/admin/PropertyForm.tsx`)

- ✅ Import do componente GoogleMap
- ✅ Estados para latitude/longitude
- ✅ Callback `handleLocationChange` para receber coordenadas
- ✅ Componente GoogleMap renderizado após campos de endereço
- ✅ Coordenadas enviadas junto com outros dados do formulário

---

## 📦 Dependências Instaladas

```bash
npm install --save-dev @types/google.maps
```

---

## ⚙️ Configuração Necessária

### 1. Obter API Key do Google Maps

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto (ou use um existente)
3. Ative as APIs necessárias:
   - **Maps JavaScript API**
   - **Geocoding API**
4. Vá em **Credenciais** → **Criar Credenciais** → **Chave de API**
5. (Opcional) Restrinja a chave:
   - Por domínio (produção): `seudominio.com/*`
   - Por IP (desenvolvimento): deixe sem restrição ou adicione `localhost`

### 2. Configurar Variáveis de Ambiente

#### Frontend (`front/.env`)

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_GOOGLE_MAPS_API_KEY=sua-chave-aqui
```

⚠️ **IMPORTANTE:** Nunca commite a chave da API no repositório!

#### Produção

No servidor de produção, configure a variável de ambiente:
```bash
VITE_GOOGLE_MAPS_API_KEY=sua-chave-de-producao
```

---

## 🚀 Como Aplicar a Migração

### Passo 1: Atualizar o Banco de Dados

```bash
cd back

# Gerar Prisma Client atualizado
npx prisma generate

# Criar e aplicar migration
npx prisma migrate dev --name add_latitude_longitude

# OU em produção:
npx prisma migrate deploy
```

Isso criará as colunas `latitude` e `longitude` na tabela `imoveis`.

### Passo 2: Instalar Dependências do Frontend

```bash
cd front
npm install
```

### Passo 3: Configurar API Key

Crie/edite o arquivo `front/.env`:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_GOOGLE_MAPS_API_KEY=SUA_CHAVE_AQUI
```

### Passo 4: Reiniciar os Servidores

**Backend:**
```bash
cd back
npm run dev
```

**Frontend:**
```bash
cd front
npm run dev
```

### Passo 5: Testar

1. Acesse `/admin/imoveis/novo`
2. Preencha o CEP
3. Observe o mapa carregando automaticamente
4. Salve o imóvel
5. Edite o imóvel e veja o mapa com a localização salva

---

## 🎨 Interface do Usuário

### Antes
```
┌─────────────────────────────┐
│ CEP: [_________]            │
│ Endereço: [_______________] │
│ Bairro: [_______]           │
│ Cidade: [_______]           │
│ Estado: [__]                │
└─────────────────────────────┘
```

### Depois
```
┌─────────────────────────────┐
│ CEP: [_________] 🔍         │
│ Endereço: [_______________] │
│ Bairro: [_______]           │
│ Cidade: [_______]           │
│ Estado: [__]                │
├─────────────────────────────┤
│ 📍 Localização no Mapa      │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │    🗺️ Google Maps       │ │
│ │      com marcador       │ │
│ │                         │ │
│ └─────────────────────────┘ │
│ 📍 Coordenadas: -23.5, -46.6│
└─────────────────────────────┘
```

---

## 🔍 Recursos Implementados

### Componente GoogleMap

#### Props
```typescript
interface GoogleMapProps {
  address: string;      // Endereço (rua, número)
  city?: string;        // Cidade
  state?: string;       // Estado (UF)
  cep?: string;         // CEP
  className?: string;   // Classes CSS adicionais
  onLocationChange?: (lat: number, lng: number) => void;  // Callback
}
```

#### Estados
- ✅ **Loading** - Mostra spinner enquanto busca localização
- ✅ **Erro** - Exibe mensagens de erro amigáveis
- ✅ **Vazio** - Mensagem quando não há endereço preenchido
- ✅ **Mapa carregado** - Exibe o mapa com marcador

#### Validações
- Verifica se a API Key está configurada
- Valida se o endereço está completo antes de buscar
- Trata erros de geocoding (endereço não encontrado, etc)
- Debounce de 500ms para evitar requisições excessivas

---

## 📊 Exemplos de Uso

### Imóvel com Endereço Completo

**Input:**
```
CEP: 01001-000
Endereço: Praça da Sé
Bairro: Sé
Cidade: São Paulo
Estado: SP
```

**Output:**
- Mapa exibe: Praça da Sé, São Paulo
- Coordenadas salvas: `-23.550520, -46.633308`

### Edição de Imóvel Existente

Ao editar um imóvel que já possui coordenadas:
1. Mapa carrega automaticamente com a localização salva
2. Se o endereço for alterado, o mapa atualiza
3. Novas coordenadas são salvas ao submeter o formulário

---

## 🐛 Tratamento de Erros

| Erro | Mensagem | Solução |
|------|----------|---------|
| API Key não configurada | "Google Maps API Key não configurada" | Adicionar `VITE_GOOGLE_MAPS_API_KEY` no .env |
| API Key inválida | "API Key do Google Maps inválida" | Verificar a chave no Google Cloud Console |
| Endereço não encontrado | "Endereço não encontrado. Verifique os dados" | Usuário deve corrigir o endereço |
| Sem conexão | "Erro ao buscar localização. Verifique sua conexão" | Verificar conectividade |
| Endereço vazio | "Preencha o endereço para visualizar o mapa" | Usuário deve preencher os campos |

---

## 🔒 Segurança

### Restrições Recomendadas para API Key

**Desenvolvimento:**
```
Sem restrições (para facilitar testes locais)
```

**Produção:**
```
Restrições de HTTP referrer:
- https://seudominio.com/*
- https://admin.seudominio.com/*
```

### Limites de Uso

Google Maps oferece:
- **$200 de crédito gratuito por mês**
- Equivalente a ~28.000 carregamentos de mapa
- Geocoding: ~40.000 requisições grátis/mês

Para um painel administrativo, isso é mais que suficiente.

---

## 📈 Melhorias Futuras

### Possíveis Extensões

1. **Busca por Endereço no Mapa**
   - Permitir clicar no mapa para selecionar localização
   - Fazer geocoding reverso (coordenadas → endereço)

2. **Autocomplete de Endereço**
   - Usar Google Places Autocomplete
   - Sugestões enquanto o usuário digita

3. **Visualização de Raio**
   - Mostrar raio de proximidade no mapa
   - Útil para busca de imóveis próximos

4. **Street View**
   - Integrar Google Street View
   - Visualizar a rua do imóvel

5. **Múltiplos Marcadores**
   - Na listagem de imóveis, mostrar todos em um mapa
   - Clustering para muitos imóveis

---

## 📁 Arquivos Modificados/Criados

### Backend
- ✅ `back/prisma/schema.prisma` - Schema atualizado
- ✅ `back/middleware/validation.js` - Validação atualizada
- ✅ `back/routes/imoveis.js` - Rotas POST e PUT atualizadas

### Frontend
- ✅ `front/src/components/ui/google-map.tsx` - **NOVO** componente
- ✅ `front/src/pages/admin/PropertyForm.tsx` - Formulário atualizado
- ✅ `front/src/types/admin.ts` - Tipos atualizados
- ✅ `front/src/vite-env.d.ts` - Tipagens ambiente atualizadas
- ✅ `front/package.json` - Nova dependência `@types/google.maps`

### Documentação
- ✅ `MIGRATION_GOOGLE_MAPS.md` - **NOVO** (este arquivo)

---

## ✅ Checklist de Implementação

- [x] Atualizar schema do Prisma
- [x] Adicionar validações no backend
- [x] Atualizar rotas de criação e edição
- [x] Criar componente GoogleMap
- [x] Instalar tipos do Google Maps
- [x] Atualizar tipos TypeScript
- [x] Integrar mapa no formulário
- [x] Adicionar callback de coordenadas
- [x] Documentar variáveis de ambiente
- [x] Criar documentação completa
- [ ] Aplicar migration no banco (você deve fazer)
- [ ] Configurar API Key do Google Maps (você deve fazer)
- [ ] Testar em desenvolvimento
- [ ] Testar em produção

---

## 🎓 Recursos Adicionais

- [Google Maps JavaScript API Docs](https://developers.google.com/maps/documentation/javascript)
- [Geocoding API Docs](https://developers.google.com/maps/documentation/geocoding)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Prisma Migrations Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

## 💡 Dicas

1. **Use Debounce**: O componente já implementa, mas se modificar, mantenha o debounce para não fazer requisições demais.

2. **Cache de Geocoding**: Considere salvar as coordenadas no banco para não precisar fazer geocoding toda vez que editar um imóvel.

3. **Fallback**: O mapa só aparece se a API Key estiver configurada, mas o formulário funciona normalmente sem ela.

4. **Performance**: O script do Google Maps é carregado apenas uma vez e reutilizado.

---

**Implementação concluída! 🎉**

O sistema agora possui integração completa com Google Maps, proporcionando uma experiência visual rica para o cadastro de imóveis.

