// lib/promocao.ts
// Regra "Lançamentos": dentro das categorias cujo nome começa com "Lançamentos"
// (ex.: "Lançamentos Novembro", "Lançamentos Dezembro"), a cada 2 unidades no
// carrinho a de MENOR preço sai com 50% de desconto.
// Esta é a única fonte da regra: o pedido (e portanto o copia e cola) e a tela
// do carrinho usam a mesma função.

export const DESCONTO_SEGUNDO_ITEM = 0.5
const MAX_UNIDADES_POR_ITEM = 100

export function ehCategoriaLancamento(nome?: string | null): boolean {
  if (!nome) return false
  const n = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  return n.startsWith('lancamentos')
}

export interface ItemParaPromocao {
  preco: number
  quantidade: number
  categoriaNome?: string | null
}

// Devolve o valor total do desconto em reais (já arredondado em centavos).
export function calcularDescontoLancamentos(itens: ItemParaPromocao[]): number {
  const centavos: number[] = []
  for (const it of itens) {
    if (!ehCategoriaLancamento(it.categoriaNome)) continue
    const qtd = Math.min(Math.max(0, Math.floor(Number(it.quantidade) || 0)), MAX_UNIDADES_POR_ITEM)
    const c = Math.round((Number(it.preco) || 0) * 100)
    for (let i = 0; i < qtd; i++) centavos.push(c)
  }
  // Maiores primeiro: forma pares (1º+2º, 3º+4º...) e o 2º de cada par ganha o desconto
  centavos.sort((a, b) => b - a)
  let desconto = 0
  for (let i = 1; i < centavos.length; i += 2) {
    desconto += Math.round(centavos[i] * DESCONTO_SEGUNDO_ITEM)
  }
  return desconto / 100
}
