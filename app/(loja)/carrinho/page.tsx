'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCarrinho } from '@/contexts/CarrinhoContext'

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CarrinhoPage() {
  const router = useRouter()
  const {
    itens,
    totalItens,
    subtotal,
    frete,
    total,
    removerItem,
    atualizarQuantidade,
    limparCarrinho,
    todoDigital,
  } = useCarrinho()

  if (itens.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-20">
        <div className="text-center">
          <p className="text-7xl mb-4">🛒</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Carrinho vazio</h1>
          <p className="text-gray-500 mb-8">Você ainda não adicionou produtos ao carrinho.</p>
          <Link
            href="/"
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Ver produtos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-gray-600">Início</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Carrinho</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Meu Carrinho <span className="text-gray-400 text-lg font-normal">({totalItens} {totalItens === 1 ? 'item' : 'itens'})</span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Lista de itens */}
          <div className="flex-1 space-y-3">
            {itens.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4">
                {/* Imagem */}
                <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                  <Image
                    src={item.imagem}
                    alt={item.nome}
                    fill
                    style={{ objectFit: 'contain' }}
                    sizes="96px"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/produto/${item.slug}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2 leading-tight">
                    {item.nome}
                  </Link>

                  {item.varianteCor && (
                    <p className="text-xs text-gray-500 mt-1">Cor: {item.varianteCor}</p>
                  )}
                  {item.varianteVoltagem && (
                    <p className="text-xs text-gray-500">Voltagem: {item.varianteVoltagem}</p>
                  )}
                  {item.varianteFormato && (
                    <p className="text-xs text-gray-500 mt-1">Formato: {item.varianteFormato}</p>
                  )}
                  {item.varianteTamanho && (
                    <p className="text-xs text-gray-500">Tamanho: {item.varianteTamanho}</p>
                  )}

                  <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                    {/* Seletor de quantidade (produto digital não tem) */}
                    {item.tipo !== 'FISICO' ? (
                      <span className="text-xs text-gray-500">Produto digital</span>
                    ) : (
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => atualizarQuantidade(item.id, item.quantidade - 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-lg"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{item.quantidade}</span>
                      <button
                        onClick={() => atualizarQuantidade(item.id, item.quantidade + 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-lg"
                      >
                        +
                      </button>
                    </div>
                    )}

                    {/* Preço */}
                    <div className="text-right">
                      {item.precoOriginal > item.preco && (
                        <p className="text-xs text-gray-400 line-through">
                          {fmtBRL(item.precoOriginal * item.quantidade)}
                        </p>
                      )}
                      <p className="text-base font-bold text-gray-900">
                        {fmtBRL(item.preco * item.quantidade)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Remover */}
                <button
                  onClick={() => removerItem(item.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-xl self-start shrink-0"
                  title="Remover item"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Limpar carrinho */}
            <div className="text-right">
              <button
                onClick={limparCarrinho}
                className="text-sm text-gray-400 hover:text-red-500 transition-colors"
              >
                Limpar carrinho
              </button>
            </div>
          </div>

          {/* Resumo */}
          <div className="lg:w-80 shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-4">
              <h2 className="text-base font-bold text-gray-900 mb-4">Resumo do pedido</h2>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({totalItens} itens)</span>
                  <span className="font-medium">{fmtBRL(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frete</span>
                  <span className={frete === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                    {todoDigital ? 'Não se aplica' : frete === 0 ? 'A calcular no checkout' : fmtBRL(frete)}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-between items-center mb-5">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">{fmtBRL(total)}</span>
              </div>

              <button
                onClick={() => router.push('/checkout')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-bold text-sm transition-colors"
              >
                Finalizar compra →
              </button>

              <Link
                href="/"
                className="block text-center text-sm text-blue-600 hover:underline mt-3"
              >
                ← Continuar comprando
              </Link>

              {/* Selos de segurança */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex justify-center gap-4 text-xs text-gray-400">
                  <span>🔒 Compra segura</span>
                  <span>🚚 Entrega garantida</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
