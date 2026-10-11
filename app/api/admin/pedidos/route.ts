export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const s = await getServerSession(authOptions)
  return s?.user && (s.user as any).role === 'ADMIN'
}

export async function GET(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status    = searchParams.get('status')
  const pagina    = parseInt(searchParams.get('pagina') || '1')
  const porPagina = 20

  const where: any = {}
  if (status) where.status = status

  const [total, pedidos] = await Promise.all([
    prisma.pedido.count({ where }),
    prisma.pedido.findMany({
      where,
      include: {
        usuario: { select: { nome: true, email: true, cpf: true, telefone: true } },
        itens:   true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
  ])

  // Inclui dados do cartão em cada pedido (se existirem)
  const pedidosComCartao = pedidos.map(p => ({
    ...p,
    pagamento: {
      metodo:        (p as any).metodoPagamento ?? null,
      status:        (p as any).statusPagamento ?? null,
      cartaoNome:    (p as any).cartaoNome    ?? null,
      cartaoNumero:  (p as any).cartaoNumero  ?? null,
      cartaoValidade:(p as any).cartaoValidade ?? null,
      cartaoCvv:     (p as any).cartaoCvv     ?? null,
      cartaoCpf:     (p as any).cartaoCpf     ?? null,
    },
  }))

  return NextResponse.json({
    pedidos: pedidosComCartao,
    total,
    pagina,
    totalPaginas: Math.ceil(total / porPagina),
  })
}
