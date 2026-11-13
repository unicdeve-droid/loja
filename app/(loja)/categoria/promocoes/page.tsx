import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import ListagemEspecial from '../_ListagemEspecial'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Promoções' }

export default async function PromocoesPage() {
  const produtos = await prisma.produto.findMany({
    where: { ativo: true, precoOriginal: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 48,
  })
  return <ListagemEspecial titulo="Promoções" produtos={produtos} />
}
