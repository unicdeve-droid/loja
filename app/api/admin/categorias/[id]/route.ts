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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  const { nome, slug, imagemUrl, ativo, ordem } = await req.json()
  const categoria = await prisma.categoria.update({
    where: { id: params.id },
    data:  { nome, slug: slug || slugify(nome), imagemUrl, ativo: ativo ?? true, ordem: ordem || 0 },
  })
  return NextResponse.json(categoria)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  await prisma.categoria.delete({ where: { id: params.id } })
  return NextResponse.json({ sucesso: true })
}
