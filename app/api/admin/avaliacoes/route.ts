export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const s = await getServerSession(authOptions)
  return s?.user && (s.user as any).role === 'ADMIN'
}

async function recalcularMedia(produtoId: string) {
  const stats = await prisma.avaliacao.aggregate({
    where: { produtoId, ativo: true },
    _avg:  { estrelas: true },
    _count: true,
  })
  await prisma.produto.update({
    where: { id: produtoId },
    data:  { mediaEstrelas: stats._avg.estrelas ?? 0, totalAvaliacoes: stats._count },
  })
}

// GET /api/admin/avaliacoes → todas as avaliações (com o produto de cada uma)
export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  const avaliacoes = await prisma.avaliacao.findMany({
    include: { produto: { select: { nome: true, slug: true } } },
    orderBy: { data: 'desc' },
  })
  return NextResponse.json(avaliacoes)
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  const { produtoId, nomeCliente, estrelas, comentario, cidade, fotoUrl, data } = await req.json()

  if (!produtoId || !nomeCliente || !estrelas) {
    return NextResponse.json({ erro: 'Campos obrigatórios: produtoId, nomeCliente, estrelas.' }, { status: 400 })
  }

  const dataAval = data ? new Date(data) : undefined
  const avaliacao = await prisma.avaliacao.create({
    data: {
      produtoId, nomeCliente, estrelas, comentario, cidade,
      fotoUrl: fotoUrl || null,
      ...(dataAval && !isNaN(dataAval.getTime()) ? { data: dataAval } : {}),
      ativo: true,
    },
  })
  await recalcularMedia(produtoId)

  return NextResponse.json(avaliacao, { status: 201 })
}
