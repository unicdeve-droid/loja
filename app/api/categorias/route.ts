export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Rota PÚBLICA — usada pelo Header e sidebar para listar categorias ativas
export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      where:   { ativo: true },
      orderBy: { ordem: 'asc' },
      select:  { id: true, nome: true, slug: true, imagemUrl: true },
    })
    return NextResponse.json(categorias)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
