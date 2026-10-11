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

// GET /api/admin/avaliacoes/[id] → lista avaliações de um produto (id = produtoId)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  const avaliacoes = await prisma.avaliacao.findMany({
    where:   { produtoId: params.id },
    orderBy: { data: 'desc' },
  })
  return NextResponse.json(avaliacoes)
}

// PUT /api/admin/avaliacoes/[id] → edita avaliação (id = avaliacao id)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  const { nomeCliente, estrelas, comentario, cidade, ativo } = await req.json()
  const avaliacao = await prisma.avaliacao.update({
    where: { id: params.id },
    data:  { nomeCliente, estrelas, comentario, cidade, ativo },
  })
  await recalcularMedia(avaliacao.produtoId)
  return NextResponse.json(avaliacao)
}

// DELETE /api/admin/avaliacoes/[id] → remove avaliação (id = avaliacao id)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  const avaliacao = await prisma.avaliacao.delete({ where: { id: params.id } })
  await recalcularMedia(avaliacao.produtoId)
  return NextResponse.json({ sucesso: true })
}
