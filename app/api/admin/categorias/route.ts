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

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  const categorias = await prisma.categoria.findMany({
    orderBy: { ordem: 'asc' },
    include: { _count: { select: { produtos: true } } },
  })
  return NextResponse.json(categorias)
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  const { nome, slug, imagemUrl, ativo, ordem } = await req.json()

  const categoria = await prisma.categoria.create({
    data: { nome, slug: slug || slugify(nome), imagemUrl, ativo: ativo ?? true, ordem: ordem || 0 },
  })
  return NextResponse.json(categoria, { status: 201 })
}
