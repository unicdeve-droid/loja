'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Produto {
  id: string
  nome: string
  codigo: string | null
  preco: number
  ativo: boolean
  fotos: string[]
  categoria: { nome: string }
  createdAt: string
}

export default function AdminProdutosPage() {
  const router = useRouter()
  const [produtos,      setProdutos]      = useState<Produto[]>([])
  const [total,         setTotal]         = useState(0)
  const [pagina,        setPagina]        = useState(1)
  const [totalPaginas,  setTotalPaginas]  = useState(1)
  const [busca,         setBusca]         = useState('')
  const [buscaInput,    setBuscaInput]    = useState('')
  const [loading,       setLoading]       = useState(true)
  const [deletingId,    setDeletingId]    = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ pagina: String(pagina) })
    if (busca) params.set('busca', busca)
    try {
      const res  = await fetch(`/api/admin/produtos?${params}`)
      const data = await res.json()
      setProdutos(data.produtos ?? [])
      setTotal(data.total ?? 0)
      setTotalPaginas(data.totalPaginas ?? 1)
    } finally {
      setLoading(false)
    }
  }, [busca, pagina])

  useEffect(() => { carregar() }, [carregar])

  function pesquisar(e: React.FormEvent) {
    e.preventDefault()
    setBusca(buscaInput)
    setPagina(1)
  }

  const [cloningId, setCloningId] = useState<string | null>(null)

  async function clonarProduto(id: string) {
    setCloningId(id)
    try {
      const res  = await fetch(`/api/admin/produtos/${id}/clonar`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { alert(data.erro || 'Erro ao clonar o produto.'); return }
      router.push(`/admin/produtos/${data.id}`)
    } catch {
      alert('Erro ao clonar o produto.')
    } finally {
      setCloningId(null)
    }
  }

  async function deletar(id: string, nome: string) {
    if (!confirm(`Excluir "${nome}"? Esta ação não pode ser desfeita.`)) return
    setDeletingId(id)
    try {
      await fetch(`/api/admin/produtos/${id}`, { method: 'DELETE' })
      carregar()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
        <Link
          href="/admin/produtos/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          + Novo produto
        </Link>
      </div>

      {/* Busca */}
      <form onSubmit={pesquisar} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Buscar por nome ou código…"
          value={buscaInput}
          onChange={(e) => setBuscaInput(e.target.value)}
          className="flex-1 max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
        >
          Buscar
        </button>
        {busca && (
          <button
            type="button"
            onClick={() => { setBusca(''); setBuscaInput(''); setPagina(1) }}
            className="text-sm text-gray-500 hover:text-gray-700 px-2"
          >
            ✕ Limpar
          </button>
        )}
      </form>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs text-gray-500">
          {loading ? 'Carregando…' : `${total} produto${total !== 1 ? 's' : ''}`}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">Foto</th>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Criado em</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading && produtos.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
              {produtos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {p.fotos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.fotos[0]} alt={p.nome} className="w-10 h-10 object-cover rounded-lg border border-gray-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-lg">📷</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.nome}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.codigo ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.categoria.nome}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(p.preco)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {p.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/produtos/${p.id}`}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => clonarProduto(p.id)}
                        disabled={cloningId === p.id}
                        className="text-gray-500 hover:text-gray-800 text-xs disabled:opacity-40"
                      >
                        {cloningId === p.id ? '…' : 'Clonar'}
                      </button>
                      <button
                        onClick={() => deletar(p.id, p.nome)}
                        disabled={deletingId === p.id}
                        className="text-red-400 hover:text-red-600 text-xs disabled:opacity-40"
                      >
                        {deletingId === p.id ? '…' : 'Excluir'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Página {pagina} de {totalPaginas}</span>
            <div className="flex gap-2">
              <button
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => p - 1)}
                className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <button
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((p) => p + 1)}
                className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
