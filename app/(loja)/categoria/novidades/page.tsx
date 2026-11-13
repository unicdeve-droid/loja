import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import ListagemEspecial from '../_ListagemEspecial'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Novidades' }

export default async function NovidadesPage() {
  const produtos = await prisma.produto.findMany({
    where: { ativo: true },
    orderBy: { createdAt: 'desc' },
    take: 48,
  })
  return <ListagemEspecial titulo="Novidades" produtos={produtos} />
}
