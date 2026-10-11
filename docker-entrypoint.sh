#!/bin/sh
set -e
echo "──────────────────────────────────────"
echo "  🚀  Ecommerce MVP — startup"
echo "──────────────────────────────────────"
# 1. Aguarda o Postgres ficar disponível
echo "⏳ Aguardando banco de dados..."
until nc -z postgres 5432 2>/dev/null; do
  sleep 2
done
echo "✅ Banco disponível."
# 2. Aplica migrations (idempotente — seguro rodar sempre)
echo "🔄 Aplicando migrations..."
node_modules/.bin/prisma db push --accept-data-loss --skip-generate
echo "✅ Migrations aplicadas."
# 3. Seed somente na primeira vez (verifica se tabela Usuario está vazia)
USERS=$(node -e "
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
p.usuario.count().then(n => { console.log(n); p.\$disconnect() }).catch(() => { console.log(0); p.\$disconnect() })
" 2>/dev/null || echo "0")
if [ "$USERS" = "0" ]; then
  echo "🌱 Executando seed..."
  node_modules/.bin/tsx prisma/seed.ts
  echo "✅ Seed concluído."
else
  echo "ℹ️  Banco já populado ($USERS usuário(s)) — seed ignorado."
fi
echo "──────────────────────────────────────"
echo "  ✅  Iniciando Next.js na porta 3000"
echo "──────────────────────────────────────"
exec node server.js
