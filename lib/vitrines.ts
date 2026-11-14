// lib/vitrines.ts
// Vitrines "virtuais" da home: não existem no banco, são montadas a cada visita
// misturando produtos de TODAS as categorias (uma de cada vez, em rodízio), para que
// uma categoria grande (ex.: "Nomes") não domine a tela.
import { prisma } from '@/lib/prisma'

export interface VitrineDef { titulo: string; subtitulo: string }

// Para trocar os nomes das vitrines da home, edite aqui.
export const VITRINES: VitrineDef[] = [
  { titulo: 'Descubra algo novo',       subtitulo: 'Uma seleção diferente a cada visita' },
  { titulo: 'Achados para bordar hoje', subtitulo: 'Misturamos várias coleções para você' },
  { titulo: 'Sugestões do dia',         subtitulo: 'Escolhidas entre todas as categorias' },
  { titulo: 'Você também pode gostar',  subtitulo: 'Inspire-se com estilos variados' },
]

export const LINK_DESCUBRA = '/categoria/descubra'

export function embaralhar<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Sorteia `qtd` itens em rodízio entre as categorias. Não repete ninguém de `usados`
// (e acrescenta os sorteados em `usados`). Não altera a lista original.
export function sortearVariado<T extends { id: string; categoriaId?: string | null }>(
  itens: T[], qtd: number, usados: Set<string> = new Set()
): T[] {
  const grupos = new Map<string, T[]>()
  for (const it of itens) {
    if (usados.has(it.id)) continue
    const k = it.categoriaId ?? '_sem_categoria'
    if (!grupos.has(k)) grupos.set(k, [])
    grupos.get(k)!.push(it)
  }
  const filas = embaralhar(Array.from(grupos.values())).map(g => embaralhar(g))

  const escolhidos: T[] = []
  while (escolhidos.length < qtd && filas.some(f => f.length > 0)) {
    for (const fila of embaralhar(filas)) {
      if (escolhidos.length >= qtd) break
      const it = fila.pop()
      if (it) { escolhidos.push(it); usados.add(it.id) }
    }
  }
  return embaralhar(escolhidos)
}

// Monta várias vitrines de uma vez, "dando as cartas": cada categoria reparte seus
// produtos entre as vitrines (1 por vez), então categorias pequenas aparecem em TODAS
// as vitrines em vez de se esgotarem nas primeiras. Sem produto repetido entre vitrines.
// `evitar` = produtos que já aparecem em outras vitrines da página: só são usados quando
// a categoria não tem outro produto disponível (variedade vem antes de não repetir).
export function sortearVitrines<T extends { id: string; categoriaId?: string | null }>(
  itens: T[], nVitrines: number, qtd: number,
  usados: Set<string> = new Set(), evitar: Set<string> = new Set()
): T[][] {
  const grupos = new Map<string, T[]>()
  for (const it of itens) {
    if (usados.has(it.id)) continue
    const k = it.categoriaId ?? '_sem_categoria'
    if (!grupos.has(k)) grupos.set(k, [])
    grupos.get(k)!.push(it)
  }
  // fila é consumida pelo FIM: os "a evitar" ficam no começo (saem por último)
  const filas = Array.from(grupos.values()).map(g => [
    ...embaralhar(g.filter(i => evitar.has(i.id))),
    ...embaralhar(g.filter(i => !evitar.has(i.id))),
  ])
  const vitrines: T[][] = Array.from({ length: nVitrines }, () => [])

  let progrediu = true
  while (progrediu && vitrines.some(v => v.length < qtd)) {
    progrediu = false
    for (const fila of embaralhar(filas)) {
      for (const v of embaralhar(vitrines)) {
        if (v.length < qtd && fila.length > 0) {
          const it = fila.pop()!
          v.push(it)
          usados.add(it.id)
          progrediu = true
        }
      }
    }
  }
  return vitrines.map(v => embaralhar(v))
}

// Mesmo formato que a home e as prateleiras já usam
export function paraCard(p: any) {
  return {
    id:              p.id as string,
    slug:            p.slug as string,
    nome:            p.nome as string,
    precoOriginal:   p.precoOriginal ? Number(p.precoOriginal) : undefined,
    preco:           Number(p.preco),
    avaliacoes:      (p.totalAvaliacoes ?? 0) as number,
    mediaAvaliacoes: Number(p.mediaEstrelas ?? 0),
    imagem:          (p.fotos?.[0] ?? '/images/placeholder.jpg') as string,
    tipo:            p.tipo as string,
    desconto:        p.precoOriginal
      ? Math.round((1 - Number(p.preco) / Number(p.precoOriginal)) * 100) : 0,
  }
}

async function carregarPorIds(ids: string[]) {
  if (ids.length === 0) return []
  const rows = await prisma.produto.findMany({ where: { id: { in: ids }, ativo: true } })
  const porId = new Map(rows.map(r => [r.id, r]))
  return ids.map(id => porId.get(id)).filter(Boolean) as typeof rows
}

// Vitrines da home. `exibidos` = produtos que já aparecem em outras vitrines da página
// (são evitados quando há alternativa na mesma categoria). Nunca lança erro.
export async function getVitrinesVirtuais(
  qtd = 12, exibidos: Set<string> = new Set()
): Promise<{ titulo: string; subtitulo: string; produtos: ReturnType<typeof paraCard>[] }[]> {
  try {
    const todos = await prisma.produto.findMany({
      where: { ativo: true }, select: { id: true, categoriaId: true },
    })
    const sorteadas = sortearVitrines(todos, VITRINES.length, qtd, new Set(), exibidos)
    const vitrines = VITRINES.map((v, i) => ({ v, itens: sorteadas[i] })).filter(s => s.itens.length >= 3)

    const ids = Array.from(new Set(vitrines.flatMap(s => s.itens.map(i => i.id))))
    const rows = await carregarPorIds(ids)
    const porId = new Map(rows.map(r => [r.id, r]))

    return vitrines
      .map(s => ({
        titulo: s.v.titulo,
        subtitulo: s.v.subtitulo,
        produtos: s.itens.map(i => porId.get(i.id)).filter(Boolean).map(paraCard),
      }))
      .filter(v => v.produtos.length > 0)
  } catch {
    return []
  }
}

// Página "Descubra" (destino do "Confira mais" das vitrines virtuais)
export async function getProdutosDescubra(qtd = 48) {
  const todos = await prisma.produto.findMany({
    where: { ativo: true }, select: { id: true, categoriaId: true },
  })
  const ids = sortearVariado(todos, qtd).map(i => i.id)
  return carregarPorIds(ids)
}

// "Produtos Relacionados" da página do produto: 8 produtos ALEATÓRIOS a cada visita,
// misturando as categorias (rodízio) e sem incluir o próprio produto.
export async function getRelacionadosAleatorios(excluirId: string, qtd = 8) {
  try {
    const todos = await prisma.produto.findMany({
      where: { ativo: true, id: { not: excluirId } },
      select: { id: true, categoriaId: true },
    })
    const ids = sortearVariado(todos, qtd).map(i => i.id)
    return await carregarPorIds(ids)
  } catch {
    return []
  }
}
