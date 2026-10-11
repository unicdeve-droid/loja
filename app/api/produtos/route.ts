export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categoria  = searchParams.get('categoria')
    const busca      = searchParams.get('busca')
    const pagina     = parseInt(searchParams.get('pagina')    || '1')
    const porPagina  = parseInt(searchParams.get('porPagina') || '20')

    const where: any = { ativo: true }

    if (categoria) where.categoria = { slug: categoria }

    if (busca) {
      where.OR = [
        { nome:    { contains: busca, mode: 'insensitive' } },
        { descricao: { contains: busca, mode: 'insensitive' } },
        { codigo:  { contains: busca, mode: 'insensitive' } },
      ]
    }

    const [total, produtos] = await Promise.all([
      prisma.produto.count({ where }),
      prisma.produto.findMany({
        where,
        include: {
          categoria: { select: { nome: true, slug: true } },
          variacoes: { where: { ativo: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
    ])

    return NextResponse.json({
      produtos,
      total,
      pagina,
      totalPaginas: Math.ceil(total / porPagina),
    })
  } catch (error) {
    console.error('[GET /api/produtos]', error)
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 })
  }
}
