export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })
    }
    const usuarioId = (session.user as any).id

    const usuario = await prisma.usuario.findUnique({
      where:  { id: usuarioId },
      select: { id: true, nome: true, email: true, cpf: true, telefone: true, role: true, createdAt: true, enderecos: true },
    })

    return NextResponse.json(usuario)
  } catch (error) {
    console.error('[GET /api/usuario/perfil]', error)
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })
    }
    const usuarioId = (session.user as any).id
    const { nome, cpf, telefone } = await req.json()

    const usuario = await prisma.usuario.update({
      where:  { id: usuarioId },
      data:   { nome, cpf, telefone },
      select: { id: true, nome: true, email: true, cpf: true, telefone: true },
    })

    return NextResponse.json(usuario)
  } catch (error) {
    console.error('[PUT /api/usuario/perfil]', error)
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 })
  }
}
