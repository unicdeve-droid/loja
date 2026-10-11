export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { cep: string } }
) {
  try {
    const cep = params.cep.replace(/\D/g, '')

    if (cep.length !== 8) {
      return NextResponse.json({ erro: 'CEP inválido.' }, { status: 400 })
    }

    const res  = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await res.json()

    if (data.erro) {
      return NextResponse.json({ erro: 'CEP não encontrado.' }, { status: 404 })
    }

    return NextResponse.json({
      cep:    data.cep,
      rua:    data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      estado: data.uf,
    })
  } catch (error) {
    console.error('[GET /api/cep/[cep]]', error)
    return NextResponse.json({ erro: 'Erro ao buscar CEP.' }, { status: 500 })
  }
}
