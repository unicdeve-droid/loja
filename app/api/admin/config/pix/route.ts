export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const PRECOS_VALIDOS = ['660', '990', '1490', '1990', '2990']

async function checkAdmin() {
  const s = await getServerSession(authOptions)
  return s?.user && (s.user as any).role === 'ADMIN'
}

// GET — retorna todos os QR codes configurados
export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })
  const keys = [
    ...PRECOS_VALIDOS.flatMap(p => [`pix_qr_${p}`, `pix_copia_${p}`]),
    'pix_qr_estatico', 'pix_copia_cola',
  ]
  const rows = await prisma.siteConfig.findMany({ where: { key: { in: keys } } })
  const result: Record<string, string> = {}
  rows.forEach(r => { result[r.key] = r.value })
  return NextResponse.json(result)
}

// PUT — salva QR e/ou copia-cola para um preço
export async function PUT(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })
  const { key, value } = await req.json()
  if (!key) return NextResponse.json({ erro: 'key obrigatório.' }, { status: 400 })
  const config = await prisma.siteConfig.upsert({
    where: { key }, update: { value: String(value) }, create: { key, value: String(value) },
  })
  return NextResponse.json(config)
}
