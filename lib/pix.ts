// lib/pix.ts
// Gera o "copia e cola" do PIX (BR Code) com o valor exato do pedido.
//
// Usa como MODELO um código que já foi salvo no admin (/admin/config): ele já traz
// a chave, o nome e a cidade de quem recebe. Só o valor (campo 54) e o CRC final
// são recalculados. Nenhum dado de recebedor fica escrito neste arquivo.

interface Campo {
  id: string
  valor: string
}

// CRC16/CCITT-FALSE (polinômio 0x1021, início 0xFFFF), exigido pelo BR Code
export function crc16(texto: string): string {
  const bytes = Buffer.from(texto, 'utf8')
  let crc = 0xffff
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i] << 8
    for (let b = 0; b < 8; b++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1)
      crc &= 0xffff
    }
  }
  return ('0000' + crc.toString(16).toUpperCase()).slice(-4)
}

// Lê o código no formato TLV: 2 dígitos de id, 2 dígitos de tamanho, valor.
// Devolve null se o texto não fechar exatamente.
function lerCampos(payload: string): Campo[] | null {
  const campos: Campo[] = []
  let i = 0
  while (i < payload.length) {
    if (i + 4 > payload.length) return null
    const id = payload.slice(i, i + 2)
    const tamTxt = payload.slice(i + 2, i + 4)
    if (!/^\d{2}$/.test(id) || !/^\d{2}$/.test(tamTxt)) return null
    const fim = i + 4 + parseInt(tamTxt, 10)
    if (fim > payload.length) return null
    campos.push({ id, valor: payload.slice(i + 4, fim) })
    i = fim
  }
  return campos
}

// Confere se um código está bem formado e com o CRC correto
export function pixValido(payload: string): boolean {
  const txt = payload.trim()
  if (txt.indexOf('000201') !== 0) return false
  if (txt.length < 12 || txt.slice(-8, -4) !== '6304') return false
  if (crc16(txt.slice(0, -4)) !== txt.slice(-4).toUpperCase()) return false
  return lerCampos(txt) !== null
}

// Recebe um código modelo e devolve outro igual, com o valor trocado.
// Devolve null se o modelo não for confiável (nesse caso o chamador não deve usá-lo).
export function gerarPixComValor(modelo: string, valor: number): string | null {
  const txt = modelo.trim()
  if (!isFinite(valor) || valor <= 0 || valor > 100000) return null
  if (!pixValido(txt)) return null

  const campos = lerCampos(txt)
  if (!campos) return null

  const semCrc = campos.filter((c) => c.id !== '63')
  const novo: Campo = { id: '54', valor: valor.toFixed(2) }
  const idx = semCrc.findIndex((c) => c.id === '54')
  if (idx >= 0) {
    semCrc[idx] = novo
  } else {
    // o campo 54 fica depois da moeda (53) e antes do país (58)
    const pos = semCrc.findIndex((c) => parseInt(c.id, 10) > 54)
    if (pos >= 0) semCrc.splice(pos, 0, novo)
    else semCrc.push(novo)
  }

  let corpo = ''
  for (let i = 0; i < semCrc.length; i++) {
    const c = semCrc[i]
    if (c.valor.length > 99) return null
    corpo += c.id + ('0' + c.valor.length).slice(-2) + c.valor
  }
  corpo += '6304'

  const resultado = corpo + crc16(corpo)
  return pixValido(resultado) ? resultado : null
}
