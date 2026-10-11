export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

async function checkAdmin() {
  const s = await getServerSession(authOptions)
  return s?.user && (s.user as any).role === 'ADMIN'
}

export async function GET(req: NextRequest) {
  if (!await checkAdmin()) {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const busca      = searchParams.get('busca')
  const categoria  = searchParams.get('categoria')
  const pagina     = parseInt(searchParams.get('pagina') || '1')
  const porPagina  = 20

  const where: any = {}
  if (busca) {
    where.OR = [
      { nome:   { contains: busca, mode: 'insensitive' } },
      { codigo: { contains: busca, mode: 'insensitive' } },
    ]
  }
  if (categoria) where.categoriaId = categoria

  const [total, produtos] = await Promise.all([
    prisma.produto.count({ where }),
    prisma.produto.findMany({
      where,
      include: { categoria: true },
      orderBy: { createdAt: 'desc' },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
  ])

  return NextResponse.json({ produtos, total, pagina, totalPaginas: Math.ceil(total / porPagina) })
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })
  }
  const data = await req.json()

  const produto = await prisma.produto.create({
    data: {
      nome:           data.nome,
      slug:           data.slug || slugify(data.nome),
      codigo:         data.codigo        || null,
      descricao:      data.descricao,
      preco:          parseFloat(data.preco),
      precoOriginal:  data.precoOriginal ? parseFloat(data.precoOriginal) : null,
      categoriaId:    data.categoriaId,
      fotos:          data.fotos         || [],
      ativo:          data.ativo         ?? true,
      mediaEstrelas:  parseFloat(data.mediaEstrelas)   || 0,
      totalAvaliacoes: parseInt(data.totalAvaliacoes)  || 0,
      temCor:         data.temCor        ?? false,
      temVoltagem:    data.temVoltagem   ?? false,
      temTamanho:     data.temTamanho    ?? false,
      tipo:           data.tipo === 'FISICO' ? 'FISICO' : 'DIGITAL',
      conteudoDigital:   data.conteudoDigital   || null,
      pixQrCodeEstatico: data.pixQrCodeEstatico || null,
      pixCopiaCola:      data.pixCopiaCola      || null,
      variacoes: data.variacoes?.length
        ? { create: data.variacoes.map((v: any) => ({ tipo: v.tipo, valor: v.valor, ativo: v.ativo ?? true })) }
        : undefined,
    },
    include: { variacoes: true, categoria: true },
  })

  return NextResponse.json(produto, { status: 201 })
}
