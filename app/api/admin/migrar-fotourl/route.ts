export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ROTA TEMPORÁRIA — cria a coluna "fotoUrl" na tabela "Avaliacao" (idempotente).
// Só ADMIN logado consegue chamar. Depois de usar, apague este arquivo.
export async function GET() {
  const s = await getServerSession(authOptions)
  if (!s?.user || (s.user as any).role !== 'ADMIN') {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })
  }
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "Avaliacao" ADD COLUMN IF NOT EXISTS "fotoUrl" TEXT')
    const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'Avaliacao' ORDER BY ordinal_position`
    )
    const colunas = cols.map(c => c.column_name)
    return NextResponse.json({ ok: colunas.includes('fotoUrl'), colunas })
  } catch (error: any) {
    console.error('[migrar-fotourl]', error)
    return NextResponse.json({ ok: false, erro: String(error?.message || error) }, { status: 500 })
  }
}
