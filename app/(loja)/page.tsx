import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import BannerCarousel from '@/components/loja/BannerCarousel'
import ProductShelf from '@/components/loja/ProductShelf'
import BuscaMobile from '@/components/loja/BuscaMobile'
import Link from 'next/link'
import { Fragment } from 'react'
import { getVitrinesVirtuais, LINK_DESCUBRA } from '@/lib/vitrines'

export const dynamic = 'force-dynamic'

async function getSiteNome() {
  try {
    const row = await prisma.siteConfig.findUnique({ where: { key: 'site_nome' } })
    return row?.value || 'Reino Matrizes'
  } catch { return 'Reino Matrizes' }
}

export async function generateMetadata(): Promise<Metadata> {
  const nome = await getSiteNome()
  return {
    title: `${nome} — Sua Loja Online`,
    description: `Compre online com segurança em ${nome}. Entrega para todo o Brasil.`,
  }
}

async function getProdutos(secao: 'promocoes' | 'populares' | 'novidades', limit = 12) {
  const orderBy: any = secao === 'novidades' ? { createdAt: 'desc' } : { totalAvaliacoes: 'desc' }
  const where: any = { ativo: true }
  if (secao === 'promocoes') where.precoOriginal = { not: null }
  // Populares e Promocoes: sorteio a cada visita (home e force-dynamic). Novidades segue por data.
  let produtos = await prisma.produto.findMany({ where, orderBy, take: secao === 'novidades' ? limit : undefined })
  if (secao !== 'novidades') {
    for (let i = produtos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[produtos[i], produtos[j]] = [produtos[j], produtos[i]]
    }
    produtos = produtos.slice(0, limit)
  }
  return produtos.map(p => ({
    id:              p.id, slug: p.slug, nome: p.nome,
    precoOriginal:   p.precoOriginal ? Number(p.precoOriginal) : undefined,
    preco:           Number(p.preco),
    avaliacoes:      p.totalAvaliacoes ?? 0,
    mediaAvaliacoes: Number(p.mediaEstrelas ?? 0),
    imagem:          p.fotos[0] ?? '/images/placeholder.jpg',
    tipo:            p.tipo,
    desconto:        p.precoOriginal
      ? Math.round((1 - Number(p.preco) / Number(p.precoOriginal)) * 100) : 0,
  }))
}

async function getProdutosPorCategoria(categoriaId: string, limit = 12) {
  const todos = await prisma.produto.findMany({ where: { ativo: true, categoriaId } })
  for (let i = todos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[todos[i], todos[j]] = [todos[j], todos[i]]
  }
  return todos.slice(0, limit).map(p => ({
    id:              p.id, slug: p.slug, nome: p.nome,
    precoOriginal:   p.precoOriginal ? Number(p.precoOriginal) : undefined,
    preco:           Number(p.preco),
    avaliacoes:      p.totalAvaliacoes ?? 0,
    mediaAvaliacoes: Number(p.mediaEstrelas ?? 0),
    imagem:          p.fotos[0] ?? '/images/placeholder.jpg',
    tipo:            p.tipo,
    desconto:        p.precoOriginal
      ? Math.round((1 - Number(p.preco) / Number(p.precoOriginal)) * 100) : 0,
  }))
}

async function getConfig() {
  try {
    const rows = await prisma.siteConfig.findMany({
      where: { key: { in: ['banner_imagens', 'home_blocos'] } }
    })
    const map: Record<string, string> = {}
    rows.forEach(r => { map[r.key] = r.value })
    let banners: string[] = []
    try { banners = JSON.parse(map['banner_imagens'] || '[]') } catch {}
    let blocos: { imagem: string; link: string }[] = []
    try { blocos = JSON.parse(map['home_blocos'] || '[]') } catch {}
    return { banners, blocos }
  } catch { return { banners: [], blocos: [] } }
}

async function getCategorias() {
  try {
    return await prisma.categoria.findMany({
      where: { ativo: true }, orderBy: { ordem: 'asc' }, take: 8,
    })
  } catch { return [] }
}

export default async function HomePage() {
  const [{ banners, blocos }, promocoes, populares, novidades, categorias] = await Promise.all([
    getConfig(),
    getProdutos('promocoes', 12),
    getProdutos('populares', 12),
    getProdutos('novidades', 12),
    getCategorias(),
  ])

  const prateleiras = (await Promise.all(
    categorias.map(async c => ({ cat: c, produtos: await getProdutosPorCategoria(c.id, 12) }))
  )).filter(x => x.produtos.length > 0)

  // Vitrines virtuais: misturam todas as categorias e mudam a cada visita.
  // Evita repetir o que já aparece nas outras vitrines da página.
  const jaExibidos = new Set<string>([
    ...populares.map(p => p.id), ...novidades.map(p => p.id), ...promocoes.map(p => p.id),
    ...prateleiras.flatMap(x => x.produtos.map(p => p.id)),
  ])
  const vitrines = await getVitrinesVirtuais(12, jaExibidos)
  const vitrineNo = (i: number) => {
    const v = vitrines[i]
    return v ? (
      <ProductShelf key={`vitrine-${i}`} titulo={v.titulo} subtitulo={v.subtitulo}
        linkVerMais={LINK_DESCUBRA} produtos={v.produtos} scrollHorizontal />
    ) : null
  }
  // 1ª vitrine logo após Novidades; as demais, a cada 2 categorias; sobras no fim
  const vitrinesUsadas = 1 + Math.floor(prateleiras.length / 2)

  return (
    <div>
      <BannerCarousel banners={banners} />
      <BuscaMobile />

      <ProductShelf titulo="Mais Populares" subtitulo="Confira o que todo mundo está comprando"
        linkVerMais="/categoria/mais-populares" produtos={populares} scrollHorizontal />

      <ProductShelf titulo="Novidades" subtitulo="Os lançamentos mais recentes"
        linkVerMais="/categoria/novidades" produtos={novidades} scrollHorizontal />

      {vitrineNo(0)}

      {/* Uma prateleira por categoria */}
      {prateleiras.map(({ cat, produtos }, i) => (
        <Fragment key={cat.id}>
          <ProductShelf titulo={cat.nome} subtitulo={`Confira os destaques de ${cat.nome}`}
            linkVerMais={`/categoria/${cat.slug}`} produtos={produtos} scrollHorizontal />
          {i % 2 === 1 && vitrineNo((i + 1) / 2)}
        </Fragment>
      ))}
      {vitrines.slice(vitrinesUsadas).map((_, k) => vitrineNo(vitrinesUsadas + k))}

      {/* Categorias dinâmicas do banco */}
      {categorias.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Explore por categoria</h2>
          <div className="flex flex-wrap gap-2">
            {categorias.map(cat => (
              <Link key={cat.slug} href={`/categoria/${cat.slug}`}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition-colors">
                {cat.nome}
              </Link>
            ))}
          </div>
        </section>
      )}

      {promocoes.length > 0 && (
        <ProductShelf titulo="Promoções" subtitulo="Melhores ofertas do dia"
          linkVerMais="/categoria/promocoes" produtos={promocoes} scrollHorizontal />
      )}

      {blocos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {blocos.map((b, i) => (
            <Link key={i} href={b.link || '#'} className="rounded-xl overflow-hidden block">
              <img src={b.imagem} alt="" className="w-full h-32 object-cover hover:opacity-90 transition-opacity" />
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}
