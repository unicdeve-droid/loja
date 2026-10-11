export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })
    }
    const usuarioId = (session.user as any).id

    const pedido = await prisma.pedido.findFirst({
      where: { id: params.id, usuarioId },
      include: {
        itens: {
          include: {
            produto: { select: { nome: true, fotos: true, slug: true } },
          },
        },
      },
    })

    if (!pedido) {
      return NextResponse.json({ erro: 'Pedido não encontrado.' }, { status: 404 })
    }

    // Oculta dados sensíveis do cartão do cliente
    const { cartaoCvv, ...pedidoSeguro } = pedido as any
    if (pedidoSeguro.cartaoNumero) {
      pedidoSeguro.cartaoNumero = `**** **** **** ${pedidoSeguro.cartaoNumero.slice(-4)}`
    }

    return NextResponse.json(pedidoSeguro)
  } catch (error) {
    console.error('[GET /api/pedidos/[id]]', error)
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 })
  }
}
