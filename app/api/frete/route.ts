export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cepDestino = searchParams.get('cep')?.replace(/\D/g, '')
    const peso       = searchParams.get('peso') || '1'

    if (!cepDestino || cepDestino.length !== 8) {
      return NextResponse.json({ erro: 'CEP inválido.' }, { status: 400 })
    }

    const configOrigem = await prisma.siteConfig.findUnique({
      where: { key: 'correios_cep_origem' },
    })
    const cepOrigem = configOrigem?.value?.replace(/\D/g, '') || '87013060'

    // Tenta API dos Correios (WebService gratuito)
    try {
      const url =
        `http://ws.correios.com.br/calculador/CalcPrecoPrazo.asmx/CalcPrecoPrazo` +
        `?nCdEmpresa=&sDsSenha=&nCdServico=04510` +
        `&sCepOrigem=${cepOrigem}&sCepDestino=${cepDestino}` +
        `&nVlPeso=${peso}&nCdFormato=1` +
        `&nVlComprimento=20&nVlAltura=10&nVlLargura=15&nVlDiametro=0` +
        `&sCdMaoPropria=N&nVlValorDeclarado=0&sCdAvisoRecebimento=N`

      const res  = await fetch(url, { signal: AbortSignal.timeout(5000) })
      const xml  = await res.text()

      const erro  = xml.match(/<Erro>([^<]+)<\/Erro>/)?.[1]
      const valor = xml.match(/<Valor>([^<]+)<\/Valor>/)?.[1]
      const prazo = xml.match(/<PrazoEntrega>([^<]+)<\/PrazoEntrega>/)?.[1]

      if (erro === '0' && valor && prazo) {
        return NextResponse.json({
          servico: 'PAC',
          prazo:   parseInt(prazo),
          valor:   parseFloat(valor.replace(',', '.')),
        })
      }
    } catch {
      // Correios indisponível — usa fallback
    }

    // Fallback: frete fixo
    return NextResponse.json({ servico: 'PAC', prazo: 7, valor: 19.90 })
  } catch (error) {
    console.error('[GET /api/frete]', error)
    return NextResponse.json({ erro: 'Erro ao calcular frete.' }, { status: 500 })
  }
}
