import type { Metadata } from 'next'
import ListagemEspecial from '../_ListagemEspecial'
import { getProdutosDescubra } from '@/lib/vitrines'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Descubra' }

export default async function DescubraPage() {
  const produtos = await getProdutosDescubra(48)
  return <ListagemEspecial titulo="Descubra" produtos={produtos} />
}
