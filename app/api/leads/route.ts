export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const s = await getServerSession(authOptions)
  return s?.user && (s.user as any).role === 'ADMIN'
}

// POST público: o checkout grava o lead assim que a pessoa preenche os dados.
// Nunca retorna erro que atrapalhe o checkout — é "fire and forget".
export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => ({}))
    const limpar = (v: any) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 300) : null)

    // Precisa de pelo menos um contato para servir de lead
    const email    = limpar(b.email)
    const whatsapp = limpar(b.whatsapp)
    const nome     = limpar(b.nome)
    if (!email && !whatsapp && !nome) {
      return NextResponse.json({ ok: true, ignorado: true })
    }

    await prisma.lead.create({
      data: {
        nome,
        email,
        whatsapp,
        cep:         limpar(b.cep),
        rua:         limpar(b.rua),
        numero:      limpar(b.numero),
        bairro:      limpar(b.bairro),
        cidade:      limpar(b.cidade),
        estado:      limpar(b.estado),
        valor:       typeof b.valor === 'number' ? b.valor : null,
        itensResumo: limpar(b.itensResumo),
        origem:      limpar(b.origem) || 'checkout',
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Se a tabela ainda não existir ou qualquer outra falha, não quebra o checkout
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

// GET admin: lista os leads no painel
export async function GET(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  try {
    const { searchParams } = new URL(req.url)
    const pagina    = parseInt(searchParams.get('pagina') || '1')
    const porPagina = 30

    const [total, leads] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
        skip:    (pagina - 1) * porPagina,
        take:    porPagina,
      }),
    ])

    return NextResponse.json({
      leads,
      total,
      pagina,
      totalPaginas: Math.ceil(total / porPagina),
    })
  } catch {
    return NextResponse.json({ leads: [], total: 0, pagina: 1, totalPaginas: 1 })
  }
}
