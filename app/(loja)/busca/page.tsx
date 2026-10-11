import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/loja/ProductCard'
import BuscaClient from './BuscaClient'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: { q?: string; pagina?: string; ordem?: string }
}

const POR_PAGINA = 24

export default async function BuscaPage({ searchParams }: Props) {
  const query  = searchParams.q?.trim() ?? ''
  const pagina = Math.max(1, parseInt(searchParams.pagina ?? '1'))
  const ordem  = searchParams.ordem ?? 'populares'

  let produtos: any[] = []
  let total = 0

  if (query.length >= 2) {
    const where: any = {
      ativo: true,
      OR: [
        { nome:      { contains: query, mode: 'insensitive' } },
        { descricao: { contains: query, mode: 'insensitive' } },
        { codigo:    { contains: query, mode: 'insensitive' } },
        { categoria: { nome: { contains: query, mode: 'insensitive' } } },
      ],
    }

    const orderBy: any =
      ordem === 'menor_preco' ? { preco: 'asc'  } :
      ordem === 'maior_preco' ? { preco: 'desc' } :
      ordem === 'novidades'   ? { createdAt: 'desc' } :
                                { totalAvaliacoes: 'desc' }

    ;[total, produtos] = await Promise.all([
      prisma.produto.count({ where }),
      prisma.produto.findMany({
        where,
        orderBy,
        skip: (pagina - 1) * POR_PAGINA,
        take: POR_PAGINA,
      }),
    ])
  }

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

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Busca + ordenação — totalmente client-side (sem evento em server component) */}
        <Suspense fallback={null}>
          <BuscaClient
            initialQuery={query}
            initialOrdem={ordem}
            total={query.length >= 2 ? total : undefined}
          />
        </Suspense>

        {query.length < 2 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg text-gray-500">Digite o que você procura acima.</p>
          </div>
        ) : (
          <>
            {/* Header de resultados */}
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900">
                Resultados para &ldquo;{query}&rdquo;
              </h1>
            </div>

            {produtosSerializados.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {produtosSerializados.map(p => (
                    <ProductCard key={p.id} {...p} />
                  ))}
                </div>

                {totalPaginas > 1 && (
                  <nav className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 2)
                      .map((p, i, arr) => {
                        const prev = arr[i - 1]
                        return (
                          <span key={p}>
                            {prev && p - prev > 1 && <span className="px-2 text-gray-400">…</span>}
                            <a
                              href={`/busca?q=${encodeURIComponent(query)}&pagina=${p}&ordem=${ordem}`}
                              className={`inline-block px-3 py-1 rounded border text-sm ${
                                p === pagina ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100 border-gray-200'
                              }`}
                            >
                              {p}
                            </a>
                          </span>
                        )
                      })
                    }
                  </nav>
                )}
              </>
            ) : (
              <div className="text-center py-24">
                <p className="text-4xl mb-4">😔</p>
                <p className="text-lg font-semibold text-gray-700">Nenhum produto encontrado</p>
                <p className="text-sm text-gray-500 mt-2">Tente palavras-chave diferentes ou mais simples.</p>
                <a href="/" className="mt-6 inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Ver todos os produtos
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
