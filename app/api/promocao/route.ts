export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcularDescontoLancamentos } from '@/lib/promocao'

// POST /api/promocao  { itens: [{ id, quantidade }] }  →  { desconto }
// Só para EXIBIR o desconto no carrinho/checkout. O valor cobrado de verdade
// é calculado de novo no servidor ao criar o pedido.
export async function POST(req: NextRequest) {
  try {
    const { itens } = await req.json()
    if (!Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ desconto: 0 })
    }

    const ids = itens.map((i: any) => String(i?.id || '')).filter(Boolean).slice(0, 50)
    const produtos = await prisma.produto.findMany({
      where: { id: { in: ids }, ativo: true },
      select: { id: true, preco: true, categoria: { select: { nome: true } } },
    })
    const porId = new Map(produtos.map(p => [p.id, p]))

    const base = itens
      .map((i: any) => {
        const p = porId.get(String(i?.id))
        if (!p) return null
        return { preco: p.preco, quantidade: Number(i?.quantidade) || 1, categoriaNome: p.categoria?.nome }
      })
      .filter(Boolean) as { preco: number; quantidade: number; categoriaNome?: string }[]

    return NextResponse.json({ desconto: calcularDescontoLancamentos(base) })
  } catch (error) {
    console.error('[POST /api/promocao]', error)
    return NextResponse.json({ desconto: 0 })
  }
}
