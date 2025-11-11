# 🚀 Configuração Rápida - Google Maps

## ⚡ Passos para ativar o Google Maps

### 1️⃣ Aplicar Migration no Banco de Dados

```bash
cd back
npx prisma generate
npx prisma migrate dev --name add_latitude_longitude

```
### 2️⃣ URL de Debug

https://maps.googleapis.com/maps/api/geocode/json?address=Pra%C3%A7a+da+S%C3%A9,+S%C3%A3o+Paulo&key=AIzaSyCWgzeQeSs5ah8Fmh30udVylOQ-3uSBojk

### 2️⃣ Obter API Key do Google Maps

1. Acesse: https://console.cloud.google.com/
2. Crie um projeto (ou use existente)
3. Ative estas APIs:
   - **Maps JavaScript API**
   - **Geocoding API**
4. Vá em **Credenciais** → **Criar Credenciais** → **Chave de API**
5. Copie a chave gerada

### 3️⃣ Configurar Frontend

Crie/edite o arquivo `front/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_GOOGLE_MAPS_API_KEY=SUA_CHAVE_AQUI
```

### 4️⃣ Reinstalar Dependências (se necessário)

```bash
cd front
npm install
```

### 5️⃣ Reiniciar os Servidores

**Terminal 1 - Backend:**
```bash
cd back
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd front
npm run dev
```

### 6️⃣ Testar

1. Acesse `http://localhost:5173/admin/imoveis/novo`
2. Preencha o CEP (ex: `01001-000`)
3. Veja o mapa aparecer automaticamente! 🗺️

---

## 💰 Custo

Google Maps oferece:
- **$200 USD grátis por mês**
- ~28.000 carregamentos de mapa/mês grátis
- ~40.000 requisições de geocoding/mês grátis

Para um painel administrativo, isso é **MAIS QUE SUFICIENTE** ✅

---

## 🔒 Segurança (Opcional)

Em produção, restrinja a API Key:

1. No Google Cloud Console → Credenciais
2. Clique na sua API Key
3. Em "Restrições de aplicativo":
   - Escolha "Referenciadores HTTP (sites)"
   - Adicione: `https://seudominio.com/*`

---

## ❓ Problemas?

Veja a documentação completa: [MIGRATION_GOOGLE_MAPS.md](./MIGRATION_GOOGLE_MAPS.md)

