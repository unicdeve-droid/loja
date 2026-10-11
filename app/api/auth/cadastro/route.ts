export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { nome, email, senha, cpf, telefone } = await req.json()

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { erro: 'Nome, email e senha são obrigatórios.' },
        { status: 400 }
      )
    }

    if (senha.length < 6) {
      return NextResponse.json(
        { erro: 'A senha deve ter no mínimo 6 caracteres.' },
        { status: 400 }
      )
    }

    const existe = await prisma.usuario.findUnique({ where: { email } })
    if (existe) {
      return NextResponse.json({ erro: 'Email já cadastrado.' }, { status: 409 })
    }

    const senhaHash = await bcrypt.hash(senha, 10)

    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: senhaHash, cpf, telefone },
      select: { id: true, nome: true, email: true, role: true, createdAt: true },
    })

    return NextResponse.json(usuario, { status: 201 })
  } catch (error) {
    console.error('[CADASTRO]', error)
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 })
  }
}
