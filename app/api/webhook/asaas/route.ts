export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Webhook do Asaas — recebe notificações de pagamento PIX.
 * Configure no painel Asaas: POST https://seudominio.com.br/api/webhook/asaas
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[WEBHOOK ASAAS] evento:', body?.event, 'payment:', body?.payment?.id)

    const eventosConfirmados = ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED']

    if (eventosConfirmados.includes(body?.event)) {
      const paymentId = body?.payment?.id

      if (!paymentId) {
        return NextResponse.json({ ok: true, msg: 'Sem payment.id' })
      }

      const pedido = await prisma.pedido.findFirst({
        where: { pixAsaasId: paymentId },
      })

      if (!pedido) {
        console.warn(`[WEBHOOK ASAAS] Nenhum pedido com pixAsaasId=${paymentId}`)
        return NextResponse.json({ ok: true, msg: 'Pedido não encontrado' })
      }

      if (pedido.status !== 'PAGO') {
        await prisma.pedido.update({
          where: { id: pedido.id },
          data:  { status: 'PAGO' },
        })
        console.log(`[WEBHOOK ASAAS] Pedido ${pedido.id} → PAGO`)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[WEBHOOK ASAAS]', error)
    // Retorna 200 para o Asaas não retentar indefinidamente
    return NextResponse.json({ ok: true })
  }
}
