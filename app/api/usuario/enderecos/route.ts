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

    const { cep, rua, numero, complemento, bairro, cidade, estado, principal } =
      await req.json()

    if (!cep || !rua || !numero || !bairro || !cidade || !estado) {
      return NextResponse.json({ erro: 'Endereço incompleto.' }, { status: 400 })
    }

    // Se for principal, desmarca os outros
    if (principal) {
      await prisma.endereco.updateMany({
        where: { usuarioId },
        data:  { principal: false },
      })
    }

    const endereco = await prisma.endereco.create({
      data: { usuarioId, cep, rua, numero, complemento, bairro, cidade, estado, principal: !!principal },
    })

    return NextResponse.json(endereco, { status: 201 })
  } catch (error) {
    console.error('[POST /api/usuario/enderecos]', error)
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 })
  }
}
