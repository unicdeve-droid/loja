import Link from 'next/link'
import ProductCard from '@/components/loja/ProductCard'

export interface ProdutoListagem {
  id: string
  slug: string
  nome: string
  preco: number
  precoOriginal: number | null
  totalAvaliacoes: number | null
  mediaEstrelas: number | null
  fotos: string[]
  tipo: string
}

// Página de listagem usada pelos botões "Confira mais" da home
// (Mais Populares, Novidades e Promoções).
export default function ListagemEspecial({
  titulo,
  produtos,
}: {
  titulo: string
  produtos: ProdutoListagem[]
}) {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="flex gap-2 text-sm mb-6 text-gray-500">
          <Link href="/">Início</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{titulo}</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">{titulo}</h1>
          <p className="text-sm text-gray-500">
            {produtos.length} produto{produtos.length !== 1 ? 's' : ''} encontrado{produtos.length !== 1 ? 's' : ''}
          </p>
        </div>

        {produtos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {produtos.map(p => (
              <ProductCard
                key={p.id}
                id={p.id}
                slug={p.slug}
                nome={p.nome}
                preco={Number(p.preco)}
                precoOriginal={p.precoOriginal ? Number(p.precoOriginal) : undefined}
                avaliacoes={p.totalAvaliacoes ?? 0}
                mediaAvaliacoes={Number(p.mediaEstrelas ?? 0)}
                imagem={p.fotos[0] ?? '/images/placeholder.jpg'}
                tipo={p.tipo}
                desconto={
                  p.precoOriginal
                    ? Math.round((1 - Number(p.preco) / Number(p.precoOriginal)) * 100)
                    : 0
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-lg font-semibold mb-1">Nenhum produto encontrado</p>
            <Link href="/" className="mt-4 text-sm text-blue-600 hover:underline">
              Voltar para o início
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
