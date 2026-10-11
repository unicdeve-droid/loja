import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import ProdutoClient from './ProdutoClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const produto = await prisma.produto.findUnique({
    where: { slug: params.slug, ativo: true },
    select: { nome: true, descricao: true, fotos: true },
  })
  if (!produto) return { title: 'Produto não encontrado' }
  return {
    title: produto.nome,
    description: produto.descricao?.substring(0, 160),
    openGraph: {
      images: produto.fotos[0] ? [produto.fotos[0]] : [],
    },
  }
}

export default async function ProdutoPage({ params }: Props) {
  const produto = await prisma.produto.findUnique({
    where: { slug: params.slug, ativo: true },
    include: {
      categoria: { select: { nome: true, slug: true } },
      variacoes: { where: { ativo: true } },
      avaliacoes: {
        where: { ativo: true },
        orderBy: { data: 'desc' },
        take: 20,
      },
    },
  })

  if (!produto) notFound()

  const relacionados = await prisma.produto.findMany({
    where: {
      categoriaId: produto.categoriaId,
      slug: { not: produto.slug },
      ativo: true,
    },
    take: 8,
    orderBy: { totalAvaliacoes: 'desc' },
  })

  return <ProdutoClient produto={produto as any} relacionados={relacionados as any} />
}
