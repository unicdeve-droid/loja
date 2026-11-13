import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import ListagemEspecial from '../_ListagemEspecial'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Mais Populares' }

export default async function MaisPopularesPage() {
  const produtos = await prisma.produto.findMany({
    where: { ativo: true },
    orderBy: [{ totalAvaliacoes: 'desc' }, { createdAt: 'desc' }],
    take: 48,
  })
  return <ListagemEspecial titulo="Mais Populares" produtos={produtos} />
}
