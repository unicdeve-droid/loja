export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const produto = await prisma.produto.findUnique({
      where: { slug: params.slug, ativo: true },
      include: {
        categoria: { select: { nome: true, slug: true } },
        variacoes:  { where: { ativo: true } },
        avaliacoes: {
          where:   { ativo: true },
          orderBy: { data: 'desc' },
          take: 20,
        },
      },
    })

    if (!produto) {
      return NextResponse.json({ erro: 'Produto não encontrado.' }, { status: 404 })
    }

    return NextResponse.json(produto)
  } catch (error) {
    console.error('[GET /api/produtos/[slug]]', error)
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 })
  }
}
