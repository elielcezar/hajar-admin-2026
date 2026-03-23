# Conectando ao Banco de Dados via Túnel SSH

O banco de dados MySQL está hospedado na VPS `212.85.19.190` e **não é acessível diretamente** pela internet. O acesso local é feito através de um túnel SSH que mapeia a porta remota `3306` para `localhost:3306`.

---

## Por que o túnel é necessário?

O backend usa a `DATABASE_URL` apontando para `127.0.0.1:3306`. Sem o túnel ativo, essa porta não existe na máquina local e o Prisma retorna:

```
PrismaClientInitializationError: Can't reach database server at `127.0.0.1:3306`
```

---

## Passo a passo para trabalhar localmente

### 1. Verifique seu IP público atual

```bash
curl https://api.ipify.org
```

### 2. Libere seu IP no servidor (se necessário)

Caso o SSH esteja sendo bloqueado (conexão recusada/timeout), acesse o **painel do provedor da VPS** e adicione uma regra de firewall liberando seu IP na porta `22`.

Ou, se já tiver acesso ao servidor via console de emergência:

```bash
sudo ufw allow from SEU_IP to any port 22
sudo ufw reload
```

### 3. Abra o túnel SSH

Em um terminal separado, execute e **deixe-o aberto** durante todo o desenvolvimento:

```bash
ssh -L 3306:localhost:3306 hajar-admin@212.85.19.190
```

> O túnel ficará ativo enquanto a sessão SSH estiver aberta. Se fechar o terminal, o túnel cai e o backend perde a conexão com o banco.

### 4. Inicie o backend

Com o túnel ativo, em outro terminal:

```bash
cd back
node server.js
# ou
npm run dev
```

### 5. Inicie o frontend

```bash
cd front
npm run dev
```

---

## Referência rápida

| O que fazer | Comando |
|---|---|
| Ver IP público | `curl https://api.ipify.org` |
| Abrir túnel SSH | `ssh -L 3306:localhost:3306 hajar-admin@212.85.19.190` |
| Iniciar backend | `cd back && npm run dev` |
| Iniciar frontend | `cd front && npm run dev` |

---

## Sintomas comuns e causas

| Sintoma | Causa provável |
|---|---|
| `500 Internal Server Error` na API | Túnel SSH não está ativo |
| `ssh: connect to host ... port 22: Connection refused` | IP local não está liberado no firewall da VPS |
| Backend inicia mas trava ao receber requisições | Túnel caiu depois de um tempo ocioso |

---

## Informações do servidor

- **IP da VPS:** `212.85.19.190`
- **Usuário SSH:** `hajar-admin`
- **Porta MySQL remota:** `3306`
- **Porta local (túnel):** `3306`
