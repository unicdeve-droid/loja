export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PUBLIC_KEYS = [
  'logo_url',
  'prazo_entrega_dias',
  'frete_gratis_acima',
  'site_nome',
  'site_descricao',
]

export async function GET() {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: { key: { in: PUBLIC_KEYS } },
    })

    const resultado: Record<string, string> = {}
    configs.forEach((c) => { resultado[c.key] = c.value })

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('[GET /api/config]', error)
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 })
  }
}
