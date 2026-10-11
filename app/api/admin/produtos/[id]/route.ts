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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  const produto = await prisma.produto.findUnique({
    where:   { id: params.id },
    include: { variacoes: true, categoria: true, avaliacoes: { orderBy: { data: 'desc' } } },
  })
  if (!produto) return NextResponse.json({ erro: 'Não encontrado.' }, { status: 404 })
  return NextResponse.json(produto)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  const data = await req.json()

  // Recria variações do zero
  await prisma.variacao.deleteMany({ where: { produtoId: params.id } })

  const produto = await prisma.produto.update({
    where: { id: params.id },
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
      mediaEstrelas:  parseFloat(data.mediaEstrelas)  || 0,
      totalAvaliacoes: parseInt(data.totalAvaliacoes) || 0,
      temCor:         data.temCor        ?? false,
      temVoltagem:    data.temVoltagem   ?? false,
      temTamanho:     data.temTamanho    ?? false,
      tipo:           (data.tipo === 'FISICO' || data.tipo === 'DIGITAL') ? data.tipo : undefined,
      conteudoDigital:   data.conteudoDigital   !== undefined ? (data.conteudoDigital   || null) : undefined,
      pixQrCodeEstatico: data.pixQrCodeEstatico !== undefined ? (data.pixQrCodeEstatico || null) : undefined,
      pixCopiaCola:      data.pixCopiaCola      !== undefined ? (data.pixCopiaCola      || null) : undefined,
      variacoes: data.variacoes?.length
        ? { create: data.variacoes.map((v: any) => ({ tipo: v.tipo, valor: v.valor, ativo: v.ativo ?? true })) }
        : undefined,
    },
    include: { variacoes: true, categoria: true },
  })

  return NextResponse.json(produto)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  await prisma.produto.delete({ where: { id: params.id } })
  return NextResponse.json({ sucesso: true })
}
