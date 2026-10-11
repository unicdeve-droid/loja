export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { prisma } from '@/lib/prisma'
import { gerarPixComValor } from '@/lib/pix'

// Converte preço para chave de config: 6.60 → "660", 14.90 → "1490"
function precoParaKey(preco: number) {
  return String(Math.round(preco * 100))
}

// ── Validação do código Pix (copia e cola) ──────────────────────────
// Lê o valor (campo 54) de dentro do código
function valorDoPix(code: string): number | null {
  let i = 0
  while (i + 4 <= code.length) {
    const id  = code.slice(i, i + 2)
    const len = parseInt(code.slice(i + 2, i + 4), 10)
    if (Number.isNaN(len)) return null
    const val = code.slice(i + 4, i + 4 + len)
    if (id === '54') {
      const n = parseFloat(val)
      return Number.isNaN(n) ? null : n
    }
    i += 4 + len
  }
  return null
}

function crc16(str: string): string {
  let crc = 0xFFFF
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// Só aceita o código se o CRC estiver certo E o valor for exatamente o do pedido
function pixValido(code: string, centavos: number): boolean {
  if (!code || code.length < 12) return false
  if (crc16(code.slice(0, -4)) !== code.slice(-4).toUpperCase()) return false
  const v = valorDoPix(code)
  return v !== null && Math.round(v * 100) === centavos
}

async function getPixParaPreco(preco: number) {
  const key = precoParaKey(preco)
  const [qrRow, copiaRow] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { key: `pix_qr_${key}` } }),
    prisma.siteConfig.findUnique({ where: { key: `pix_copia_${key}` } }),
  ])
  if (qrRow?.value || copiaRow?.value) {
    return { qr: qrRow?.value || '', copia: copiaRow?.value || '', fonte: 'preco' }
  }
  // Fallback: QR estático global
  const [globalQr, globalCopia] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { key: 'pix_qr_estatico' } }),
    prisma.siteConfig.findUnique({ where: { key: 'pix_copia_cola' } }),
  ])
  return {
    qr:    globalQr?.value    || '',
    copia: globalCopia?.value || '',
    fonte: globalQr?.value ? 'global' : 'manual',
  }
}

// Procura, entre os códigos salvos no admin, um que sirva de modelo
// e gera o código com o valor exato do pedido.
async function gerarPixDinamico(valor: number): Promise<string> {
  const linhas = await prisma.siteConfig.findMany({
    where:   { key: { startsWith: 'pix_copia' } },
    orderBy: { key: 'asc' },
  })
  for (const linha of linhas) {
    if (!linha.value) continue
    const gerado = gerarPixComValor(linha.value, valor)
    if (gerado && pixValido(gerado, Math.round(valor * 100))) return gerado
  }
  return ''
}

export async function POST(req: NextRequest) {
  try {
    const { pedidoId, total } = await req.json()

    // Valor do pedido: sempre o total gravado no banco quando o pedido existe
    let preco = parseFloat(total || '0')
    let pedidoValido = false

    if (pedidoId) {
      const pedido = await prisma.pedido.findFirst({ where: { id: pedidoId } })
      if (pedido) { preco = pedido.total; pedidoValido = true }
    }

    let { qr, copia, fonte } = await getPixParaPreco(preco)

    // O código copia e cola é a fonte da verdade: só é usado se o valor dentro dele
    // for exatamente o total do pedido (e o CRC estiver certo). Senão, gera na hora.
    // O QR é sempre desenhado a partir desse código validado.
    const centavos = Math.round(preco * 100)
    if (!pedidoValido) console.warn('[PIX] pedido nao encontrado; usando o total informado:', preco)
    if (preco > 0) {
      if (fonte === 'preco' && pixValido(copia, centavos)) {
        qr = ''
      } else {
        const gerado = await gerarPixDinamico(preco)
        if (gerado) {
          copia = gerado; qr = ''; fonte = 'gerado'
        } else {
          console.error('[PIX] nenhum codigo valido para o valor', preco, '- slot:', fonte)
          copia = ''; qr = ''; fonte = 'sem-codigo'
        }
      }
    }

    // Se há código mas não há imagem de QR, desenha o QR a partir do código
    if (copia && !qr) {
      try {
        qr = await QRCode.toDataURL(copia, { errorCorrectionLevel: 'M', margin: 2, width: 320 })
      } catch (e) {
        console.error('[PIX] erro ao gerar QR', e)
      }
    }

    if (pedidoId && (qr || copia)) {
      await prisma.pedido.update({
        where: { id: pedidoId },
        // QR desenhado na hora não é gravado (é grande); o copia e cola fica no pedido
        data:  { pixQrCode: qr.indexOf('data:') === 0 ? '' : qr, pixCopiaECola: copia },
      }).catch(() => {})
    }

    return NextResponse.json({
      pixQrCode:     qr,
      pixCopiaECola: copia,
      pedidoId:      pedidoId || '',
      fonte,
      aviso: (!qr && !copia)
        ? 'Seu pedido foi registrado. Nossa equipe enviará os dados PIX via WhatsApp/email em breve.'
        : '',
    })
  } catch (error) {
    console.error('[PIX]', error)
    return NextResponse.json({
      pixQrCode: '', pixCopiaECola: '', pedidoId: '', fonte: 'erro',
      aviso: 'Pedido registrado. Nossa equipe enviará os dados PIX em breve.',
    })
  }
}
