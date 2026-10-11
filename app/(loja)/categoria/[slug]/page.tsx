import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/loja/ProductCard'
import CategoriaClient from './CategoriaClient'
import OrdenacaoSelectClient from './OrdenacaoSelectClient'

interface PageProps {
  params: { slug: string }
  searchParams: {
    pagina?:    string
    ordem?:     string
    preco_min?: string
    preco_max?: string
    voltagem?:  string
  }
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const categoria = await prisma.categoria.findUnique({
    where: { slug: params.slug },
    select: { nome: true },
  })
  if (!categoria) return { title: 'Categoria não encontrada' }
  return {
    title: `${categoria.nome} | Loja`,
    description: `Confira os melhores produtos de ${categoria.nome} com os melhores preços.`,
  }
}

const POR_PAGINA = 20

export default async function CategoriaPage({ params, searchParams }: PageProps) {
  const { slug } = params
  const pagina   = Math.max(1, parseInt(searchParams.pagina    || '1'))
  const ordem    = searchParams.ordem    || 'populares'
  const precoMin = searchParams.preco_min ? parseFloat(searchParams.preco_min) : undefined
  const precoMax = searchParams.preco_max ? parseFloat(searchParams.preco_max) : undefined
  const voltagem = searchParams.voltagem || ''

  const categoria = await prisma.categoria.findUnique({
    where: { slug },
    select: { id: true, nome: true, slug: true },
  })
  if (!categoria) notFound()

  const where: any = {
    ativo:       true,
    categoriaId: categoria.id,
  }

  if (precoMin !== undefined || precoMax !== undefined) {
    where.preco = {}
    if (precoMin !== undefined) where.preco.gte = precoMin
    if (precoMax !== undefined) where.preco.lte = precoMax
  }

  if (voltagem) {
    where.variacoes = {
      some: {
        tipo:  'voltagem',
        valor: { contains: voltagem, mode: 'insensitive' },
        ativo: true,
      },
    }
  }

  const orderBy: any =
    ordem === 'menor_preco' ? { preco: 'asc'  } :
    ordem === 'maior_preco' ? { preco: 'desc' } :
    ordem === 'novidades'   ? { createdAt: 'desc' } :
                              { totalAvaliacoes: 'desc' }

  const [total, produtos, precoRange, voltagensDisponiveis] = await Promise.all([
    prisma.produto.count({ where }),
    prisma.produto.findMany({
      where,
      orderBy,
      skip:  (pagina - 1) * POR_PAGINA,
      take:  POR_PAGINA,
      include: {
        variacoes: { where: { ativo: true, tipo: 'voltagem' }, select: { valor: true } },
      },
    }),
    prisma.produto.aggregate({
      where: { ativo: true, categoriaId: categoria.id },
      _min: { preco: true },
      _max: { preco: true },
    }),
    prisma.variacao.findMany({
      where: {
        tipo:    'voltagem',
        ativo:   true,
        produto: { ativo: true, categoriaId: categoria.id },
      },
      select: { valor: true },
      distinct: ['valor'],
      orderBy:  { valor: 'asc' },
    }),
  ])

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  const produtosSerializados = produtos.map(p => ({
    id:              p.id,
    slug:            p.slug,
    nome:            p.nome,
    precoOriginal:   p.precoOriginal ? Number(p.precoOriginal) : undefined,
    preco:           Number(p.preco),
    avaliacoes:      p.totalAvaliacoes ?? 0,
    mediaAvaliacoes: Number(p.mediaEstrelas ?? 0),
    imagem:          p.fotos[0] ?? '/images/placeholder.jpg',
    desconto:        p.precoOriginal
                     ? Math.round((1 - Number(p.preco) / Number(p.precoOriginal)) * 100)
                     : 0,
  }))

  // Serializa searchParams para passar ao client
  const searchParamsSerialized: Record<string, string | undefined> = {
    pagina:    searchParams.pagina,
    ordem:     searchParams.ordem,
    preco_min: searchParams.preco_min,
    preco_max: searchParams.preco_max,
    voltagem:  searchParams.voltagem,
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="flex gap-2 text-sm mb-6 text-gray-500">
          <Link href="/">Início</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{categoria.nome}</span>
        </nav>

        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 shrink-0">
            <CategoriaClient
              slug={slug}
              ordem={ordem}
              precoMin={precoMin ?? Number(precoRange._min.preco ?? 0)}
              precoMax={precoMax ?? Number(precoRange._max.preco ?? 9999)}
              precoRangeMin={Number(precoRange._min.preco ?? 0)}
              precoRangeMax={Number(precoRange._max.preco ?? 9999)}
              voltagemAtiva={voltagem}
              voltagensDisponiveis={voltagensDisponiveis.map(v => v.valor)}
            />
          </aside>

          <main className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">{categoria.nome}</h1>
                <p className="text-sm text-gray-500">
                  {total} produto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
                </p>
              </div>
              {/* ✅ FIXADO: OrdenacaoSelect agora é client component */}
              <OrdenacaoSelectClient
                slug={slug}
                ordemAtual={ordem}
                searchParams={searchParamsSerialized}
              />
            </div>

            {produtosSerializados.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {produtosSerializados.map(p => (
                    <ProductCard key={p.id} {...p} />
                  ))}
                </div>
                {totalPaginas > 1 && (
                  <Paginacao
                    slug={slug}
                    searchParams={searchParamsSerialized}
                    paginaAtual={pagina}
                    totalPaginas={totalPaginas}
                  />
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-lg font-semibold mb-1">Nenhum produto encontrado</p>
                <p className="text-sm text-gray-500">Tente ajustar os filtros para ver mais resultados.</p>
                <Link href={`/categoria/${slug}`} className="mt-4 text-sm text-blue-600 hover:underline">
                  Limpar filtros
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

function Paginacao({ slug, searchParams, paginaAtual, totalPaginas }: {
  slug: string
  searchParams: Record<string, string | undefined>
  paginaAtual: number
  totalPaginas: number
}) {
  function makeUrl(p: number) {
    const params = new URLSearchParams()
    params.set('pagina', String(p))
    if (searchParams.ordem)     params.set('ordem',     searchParams.ordem)
    if (searchParams.preco_min) params.set('preco_min', searchParams.preco_min)
    if (searchParams.preco_max) params.set('preco_max', searchParams.preco_max)
    if (searchParams.voltagem)  params.set('voltagem',  searchParams.voltagem)
    return `/categoria/${slug}?${params.toString()}`
  }

  const pages: (number | '...')[] = []
  if (totalPaginas <= 7) {
    for (let i = 1; i <= totalPaginas; i++) pages.push(i)
  } else {
    pages.push(1)
    if (paginaAtual > 3) pages.push('...')
    for (let i = Math.max(2, paginaAtual - 1); i <= Math.min(totalPaginas - 1, paginaAtual + 1); i++) pages.push(i)
    if (paginaAtual < totalPaginas - 2) pages.push('...')
    pages.push(totalPaginas)
  }

  return (
    <nav className="flex gap-2 justify-center mt-8">
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e-${i}`} className="px-3 py-1">…</span>
        ) : (
          <Link
            key={p}
            href={makeUrl(p)}
            className={`px-3 py-1 rounded border ${p === paginaAtual ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100 border-gray-200'}`}
          >
            {p}
          </Link>
        )
      )}
    </nav>
  )
}
