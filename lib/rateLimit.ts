// lib/rateLimit.ts — limite de tentativas (login, 2FA) guardado no banco (SiteConfig),
// para valer em todas as instâncias da Vercel. Se o banco falhar, NÃO derruba o login.
import crypto from 'crypto'
import { prisma } from './prisma'

const JANELA_MS = 15 * 60 * 1000
const chaveRL = (k: string) => 'sec:rl:' + crypto.createHash('sha256').update(k).digest('hex').slice(0, 32)

interface Reg { n: number; ini: number }

async function ler(k: string): Promise<Reg | null> {
  const row = await prisma.siteConfig.findUnique({ where: { key: chaveRL(k) } })
  if (!row) return null
  try {
    const r = JSON.parse(row.value) as Reg
    return Date.now() - r.ini > JANELA_MS ? null : r
  } catch { return null }
}

export async function estaBloqueado(k: string, max: number): Promise<boolean> {
  try {
    const r = await ler(k)
    return !!r && r.n >= max
  } catch { return false }
}

export async function registrarFalha(...ks: string[]): Promise<void> {
  for (const k of ks) {
    try {
      const atual = await ler(k)
      const reg: Reg = atual ? { n: atual.n + 1, ini: atual.ini } : { n: 1, ini: Date.now() }
      const value = JSON.stringify(reg)
      await prisma.siteConfig.upsert({
        where: { key: chaveRL(k) }, update: { value }, create: { key: chaveRL(k), value },
      })
    } catch {}
  }
  // limpeza ocasional de registros velhos
  if (Math.random() < 0.02) {
    try {
      await prisma.siteConfig.deleteMany({
        where: { key: { startsWith: 'sec:rl:' }, updatedAt: { lt: new Date(Date.now() - JANELA_MS * 2) } },
      })
    } catch {}
  }
}

export async function limparFalhas(...ks: string[]): Promise<void> {
  for (const k of ks) {
    try { await prisma.siteConfig.deleteMany({ where: { key: chaveRL(k) } }) } catch {}
  }
}
