// lib/destaque.ts
// Página de categoria aberta por anúncio: o produto clicado (?destaque=<slug>) vai para o topo.
// Ignora maiúsculas/minúsculas no slug (ex.: "Crucci" = "crucci").

export function limparDestaque(valor?: string | string[]): string {
  const v = Array.isArray(valor) ? valor[0] : valor
  return (v ?? '').trim().slice(0, 100)
}

// Se o produto já está na lista, sobe para a 1ª posição (sem duplicar).
// Se não está, devolve achou=false para o chamador buscá-lo no banco.
export function moverDestaqueParaTopo<T extends { slug: string }>(
  lista: T[], slug: string
): { lista: T[]; achou: boolean } {
  const alvo = slug.toLowerCase()
  const idx = alvo ? lista.findIndex(p => p.slug.toLowerCase() === alvo) : -1
  if (idx < 0) return { lista, achou: false }
  return { lista: [lista[idx], ...lista.filter((_, i) => i !== idx)], achou: true }
}
