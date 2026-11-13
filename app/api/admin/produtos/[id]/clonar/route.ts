export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const s = await getServerSession(authOptions)
  return s?.user && (s.user as any).role === 'ADMIN'
}

// POST /api/admin/produtos/[id]/clonar
// Copia o produto com as variações e as avaliações (feedbacks). O clone nasce INATIVO
// e sem SKU, para você trocar foto/título antes de publicar.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })
  }

  try {
    const original = await prisma.produto.findUnique({
      where: { id: params.id },
      include: { variacoes: true, avaliacoes: true },
    })
    if (!original) {
      return NextResponse.json({ erro: 'Produto não encontrado.' }, { status: 404 })
    }

    // Slug que nunca repete: slug-copia, slug-copia-2, slug-copia-3...
    const base = `${original.slug}-copia`
    let slug = base
    for (let n = 2; await prisma.produto.findUnique({ where: { slug } }); n++) {
      slug = `${base}-${n}`
    }

    // Média/total do clone = só das avaliações visíveis copiadas (mesma regra do admin)
    const visiveis = original.avaliacoes.filter(a => a.ativo)
    const mediaClone = visiveis.length
      ? visiveis.reduce((acc, a) => acc + a.estrelas, 0) / visiveis.length
      : 0

    const clone = await prisma.produto.create({
      data: {
        nome:            `${original.nome} (cópia)`,
        slug,
        codigo:          null,
        descricao:       original.descricao,
        preco:           original.preco,
        precoOriginal:   original.precoOriginal,
        categoriaId:     original.categoriaId,
        fotos:           original.fotos,
        ativo:           false,
        mediaEstrelas:   mediaClone,
        totalAvaliacoes: visiveis.length,
        temCor:          original.temCor,
        temVoltagem:     original.temVoltagem,
        temTamanho:      original.temTamanho,
        tipo:            original.tipo,
        conteudoDigital: original.conteudoDigital,
        pixCopiaCola:    original.pixCopiaCola,
        pixQrCodeEstatico: original.pixQrCodeEstatico,
        variacoes: original.variacoes.length
          ? { create: original.variacoes.map(v => ({ tipo: v.tipo, valor: v.valor, ativo: v.ativo })) }
          : undefined,
        avaliacoes: original.avaliacoes.length
          ? {
              create: original.avaliacoes.map(a => ({
                nomeCliente: a.nomeCliente,
                estrelas:    a.estrelas,
                comentario:  a.comentario,
                cidade:      a.cidade,
                fotoUrl:     a.fotoUrl,
                data:        a.data,
                ativo:       a.ativo,
              })),
            }
          : undefined,
      },
    })

    return NextResponse.json({ id: clone.id }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/produtos/[id]/clonar]', error)
    return NextResponse.json({ erro: 'Erro ao clonar o produto.' }, { status: 500 })
  }
}
