export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const s = await getServerSession(authOptions)
  return s?.user && (s.user as any).role === 'ADMIN'
}

// GET — admin vê todos os dados, incluindo cartão em claro
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  const pedido = await prisma.pedido.findUnique({
    where:   { id: params.id },
    include: {
      usuario: true,
      itens: {
        include: { produto: { select: { nome: true, fotos: true, slug: true } } },
      },
    },
  })
  if (!pedido) return NextResponse.json({ erro: 'Não encontrado.' }, { status: 404 })
  return NextResponse.json(pedido)
}

// PUT — atualiza status do pedido
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  const { status } = await req.json()

  const validos = ['AGUARDANDO_PAGAMENTO', 'PAGO', 'EM_SEPARACAO', 'ENVIADO', 'ENTREGUE', 'CANCELADO']
  if (!validos.includes(status)) {
    return NextResponse.json({ erro: 'Status inválido.' }, { status: 400 })
  }

  const pedido = await prisma.pedido.update({
    where: { id: params.id },
    data:  { status },
  })
  return NextResponse.json(pedido)
}
