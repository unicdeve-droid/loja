export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })
    }
    const usuarioId = (session.user as any).id

    const { pedidoId, cartaoNome, cartaoNumero, cartaoValidade, cartaoCvv, cartaoCpf } =
      await req.json()

    if (!pedidoId || !cartaoNome || !cartaoNumero || !cartaoValidade || !cartaoCvv) {
      return NextResponse.json(
        { erro: 'Dados do cartão incompletos.' },
        { status: 400 }
      )
    }

    const pedido = await prisma.pedido.findFirst({
      where: { id: pedidoId, usuarioId },
    })

    if (!pedido) {
      return NextResponse.json({ erro: 'Pedido não encontrado.' }, { status: 404 })
    }

    await prisma.pedido.update({
      where: { id: pedidoId },
      data: { cartaoNome, cartaoNumero, cartaoValidade, cartaoCvv, cartaoCpf },
    })

    return NextResponse.json({ sucesso: true, pedidoId })
  } catch (error) {
    console.error('[POST /api/pagamento/cartao]', error)
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 })
  }
}
