export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.pedido.update({
      where: { id: params.id },
      data: {
        avisouPagamento: true,
        avisouEm: new Date(),
        status: 'AGUARDANDO_CONFIRMACAO',
      },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 })
  }
}
