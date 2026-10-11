export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const s = await getServerSession(authOptions)
  return s?.user && (s.user as any).role === 'ADMIN'
}

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  const configs = await prisma.siteConfig.findMany()
  const resultado: Record<string, string> = {}
  configs.forEach((c) => { resultado[c.key] = c.value })
  return NextResponse.json(resultado)
}

export async function PUT(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  const { key, value } = await req.json()
  if (!key) return NextResponse.json({ erro: 'key é obrigatório.' }, { status: 400 })

  const config = await prisma.siteConfig.upsert({
    where:  { key },
    update: { value: String(value) },
    create: { key,   value: String(value) },
  })
  return NextResponse.json(config)
}
