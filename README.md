# Ecommerce MVP

Loja online completa construída com **Next.js 14**, **Prisma**, **PostgreSQL**, **NextAuth** e **Asaas (PIX)**.

---

## Stack

| Camada         | Tecnologia                        |
|----------------|-----------------------------------|
| Frontend       | Next.js 14 (App Router)           |
| Estilização    | Tailwind CSS                      |
| ORM            | Prisma 5 + PostgreSQL 16          |
| Autenticação   | NextAuth v4 (JWT)                 |
| Pagamentos     | Asaas (PIX) + cartão manual       |
| Frete          | Correios WebService + fallback     |
| Deploy         | Docker + Nginx                    |

---

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) ≥ 2.20
- Git

---

## Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/ecommerce-mvp.git
cd ecommerce-mvp
```

### 2. Crie o arquivo `.env`

```bash
cp .env.example .env
```

Edite o `.env` com seus valores:

```env
# Banco de dados
POSTGRES_USER=ecommerce
POSTGRES_PASSWORD=troque_esta_senha
POSTGRES_DB=ecommerce

# Next.js
# Gere com: openssl rand -base64 32
NEXTAUTH_SECRET=cole_aqui_o_secret_gerado

# URL pública da aplicação (sem barra no final)
NEXTAUTH_URL=http://localhost

# Asaas — deixe vazio para configurar depois pelo painel admin
ASAAS_API_KEY=
ASAAS_ENV=sandbox
```

> **Atenção:** nunca suba o `.env` para o repositório. O `.gitignore` já o exclui.

---

## Rodando com Docker

### Subir tudo (primeira vez ou após alterações)

```bash
docker compose up --build -d
```

O que acontece automaticamente na primeira vez:

1. Build da imagem Next.js (multi-stage)
2. Postgres sobe e aguarda ficar pronto
3. `prisma migrate deploy` aplica todas as migrations
4. `prisma db seed` popula o banco com admin, categorias e produtos de exemplo
5. Next.js inicia na porta 3000 (acessível via Nginx na 80)

### Ver logs

```bash
# Todos os serviços
docker compose logs -f

# Apenas a aplicação
docker compose logs -f app

# Apenas o banco
docker compose logs -f postgres
```

### Parar

```bash
docker compose down
```

### Parar e apagar dados (⚠️ destrói banco e uploads)

```bash
docker compose down -v
```

---

## Acesso

| URL                          | Descrição                    |
|------------------------------|------------------------------|
| `http://localhost`           | Loja (frontend público)      |
| `http://localhost/admin`     | Painel administrativo        |
| `http://localhost/login`     | Login                        |

### Credenciais padrão do admin (seed)

| Campo | Valor          |
|-------|----------------|
| Email | admin@admin.com |
| Senha | admin123        |

> Troque a senha após o primeiro acesso em **Admin → Configurações** ou direto no banco.

---

## Estrutura do projeto

```
ecommerce-mvp/
├── app/
│   ├── admin/                  # 7 páginas do painel admin
│   │   ├── layout.tsx          # Layout com AdminNav
│   │   ├── page.tsx            # Dashboard
│   │   ├── pedidos/            # Lista + detalhe de pedidos
│   │   ├── produtos/           # Lista, novo e editar produtos
│   │   ├── categorias/         # CRUD de categorias
│   │   ├── avaliacoes/         # Moderação de avaliações
│   │   └── config/             # Configurações do site
│   ├── api/                    # API Routes
│   │   ├── admin/              # Endpoints protegidos (role ADMIN)
│   │   ├── auth/               # NextAuth + cadastro
│   │   ├── produtos/           # Listagem e detalhe público
│   │   ├── categorias/         # Listagem pública
│   │   ├── pedidos/            # Pedidos do usuário logado
│   │   ├── pagamento/          # PIX (Asaas) e cartão
│   │   ├── frete/              # Cálculo Correios
│   │   ├── cep/                # Consulta ViaCEP
│   │   ├── config/             # Configurações públicas
│   │   └── webhook/asaas/      # Recebe confirmação PIX
│   ├── layout.tsx              # Layout raiz com SessionProvider
│   ├── page.tsx                # Página de login
│   ├── globals.css
│   └── providers.tsx
├── components/
│   └── admin/
│       ├── AdminNav.tsx        # Sidebar do painel admin
│       └── ProdutoForm.tsx     # Formulário criar/editar produto
├── lib/
│   ├── auth.ts                 # Configuração NextAuth
│   ├── prisma.ts               # Singleton PrismaClient
│   └── utils.ts                # slugify, formatCurrency, etc.
├── prisma/
│   ├── schema.prisma           # Models do banco
│   └── seed.ts                 # Dados iniciais
├── public/
│   └── uploads/                # Imagens enviadas via admin
├── types/
│   └── next-auth.d.ts          # Tipos estendidos de sessão
├── middleware.ts               # Proteção de rotas por role
├── next.config.js
├── tailwind.config.js
├── Dockerfile
├── docker-compose.yml
├── docker-entrypoint.sh
├── nginx.conf
└── .env.example
```

---

## Painel Admin

### Dashboard
Resumo de receita, total de pedidos, pedidos do dia e atalhos rápidos.

### Pedidos
- Lista paginada com filtro por status
- Detalhe completo: cliente, endereço, itens, dados de pagamento
- Atualização de status (Aguardando → Pago → Em separação → Enviado → Entregue)

### Produtos
- Cadastro completo: nome, slug, código, preço, preço original, categoria, fotos, variações (cor / voltagem / tamanho)
- Upload de fotos direto pelo formulário (JPG, PNG, WebP, máx 5 MB)
- Busca por nome ou código

### Categorias
- CRUD com modal
- Ordenação por campo `ordem`
- Proteção: não exclui categoria com produtos vinculados

### Avaliações
- Lista todas as avaliações de todos os produtos
- Toggle visível/oculto sem sair da página
- Edição completa (nome, estrelas, comentário, cidade)
- Exclusão com recálculo automático de média

### Configurações
- Nome e descrição do site
- Logo (upload)
- Prazo de entrega e frete grátis
- CEP de origem para Correios
- API Key e ambiente do Asaas

---

## Pagamentos

### PIX (Asaas)
1. Configure a **API Key** e o **ambiente** no painel Admin → Configurações
2. No painel Asaas, configure o webhook:
   - URL: `https://seudominio.com.br/api/webhook/asaas`
   - Evento: `PAYMENT_RECEIVED` e `PAYMENT_CONFIRMED`
3. O pedido é atualizado automaticamente para `PAGO` ao receber o webhook

### Cartão de crédito
Os dados são salvos no banco para processamento manual. Para processamento automático, implemente a integração com a API do Asaas em `app/api/pagamento/cartao/route.ts`.

---

## Deploy em produção

### 1. Configure o domínio

Edite `nginx.conf` e substitua `server_name _;` pelo seu domínio:

```nginx
server_name loja.com.br www.loja.com.br;
```

### 2. Obtenha um certificado SSL

```bash
# Com Certbot (Let's Encrypt)
apt install certbot
certbot certonly --standalone -d loja.com.br -d www.loja.com.br
```

### 3. Habilite HTTPS no nginx.conf

Descomente o bloco `server { listen 443 ssl ... }` e aponte para os certificados.

Ative o redirect HTTP → HTTPS:

```nginx
# No bloco porta 80, substitua o conteúdo por:
return 301 https://$host$request_uri;
```

### 4. Atualize o .env

```env
NEXTAUTH_URL=https://loja.com.br
```

### 5. Suba novamente

```bash
docker compose up --build -d
```

---

## Comandos úteis

```bash
# Rebuild apenas da aplicação (sem recriar o banco)
docker compose up --build -d app

# Acessar o shell do container da app
docker compose exec app sh

# Rodar o seed manualmente
docker compose exec app node_modules/.bin/tsx prisma/seed.ts

# Rodar uma migration manualmente
docker compose exec app node_modules/.bin/prisma migrate deploy

# Abrir o Prisma Studio (porta 5555 — apenas dev local)
# Adicione "ports: - '5555:5555'" ao serviço app no compose antes
docker compose exec app node_modules/.bin/prisma studio --port 5555 --browser none

# Ver tamanho dos volumes
docker volume ls
docker system df -v
```

---

## Variáveis de ambiente

| Variável          | Obrigatória | Descrição                                      |
|-------------------|-------------|------------------------------------------------|
| `DATABASE_URL`    | ✅          | Connection string PostgreSQL                   |
| `NEXTAUTH_SECRET` | ✅          | Secret JWT (gere com `openssl rand -base64 32`)|
| `NEXTAUTH_URL`    | ✅          | URL pública da aplicação                       |
| `POSTGRES_USER`   | ✅*         | Usuário do banco (usado pelo compose)          |
| `POSTGRES_PASSWORD`| ✅*        | Senha do banco (usado pelo compose)            |
| `POSTGRES_DB`     | ✅*         | Nome do banco (usado pelo compose)             |
| `ASAAS_API_KEY`   | ❌          | Configurável também pelo painel admin          |
| `ASAAS_ENV`       | ❌          | `sandbox` ou `producao` (padrão: sandbox)      |

\* Usadas pelo serviço `postgres` no docker-compose. Devem ser consistentes com `DATABASE_URL`.

---

## Licença

MIT
