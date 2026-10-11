export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const s = await getServerSession(authOptions)
  return s?.user && (s.user as any).role === 'ADMIN'
}

export async function GET(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const busca    = searchParams.get('busca') || ''
  const pagina   = parseInt(searchParams.get('pagina') || '1')
  const porPagina = 20

  const where: any = {}
  if (busca) {
    where.OR = [
      { nome:  { contains: busca, mode: 'insensitive' } },
      { email: { contains: busca, mode: 'insensitive' } },
      { cpf:   { contains: busca } },
    ]
  }

  const [total, usuarios] = await Promise.all([
    prisma.usuario.count({ where }),
    prisma.usuario.findMany({
      where,
      select: {
        id:        true,
        nome:      true,
        email:     true,
        cpf:       true,
        telefone:  true,
        role:      true,
        createdAt: true,
        _count:    { select: { pedidos: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip:    (pagina - 1) * porPagina,
      take:    porPagina,
    }),
  ])

  return NextResponse.json({
    usuarios,
    total,
    pagina,
    totalPaginas: Math.ceil(total / porPagina),
  })
}
