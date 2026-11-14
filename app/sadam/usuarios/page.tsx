'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'

interface Usuario {
  id: string
  nome: string
  email: string
  cpf: string | null
  telefone: string | null
  role: string
  createdAt: string
  _count: { pedidos: number }
}

export default function AdminUsuariosPage() {
  const [usuarios,     setUsuarios]     = useState<Usuario[]>([])
  const [total,        setTotal]        = useState(0)
  const [pagina,       setPagina]       = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [busca,        setBusca]        = useState('')
  const [buscaInput,   setBuscaInput]   = useState('')
  const [loading,      setLoading]      = useState(true)

  const carregar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ pagina: String(pagina) })
    if (busca) params.set('busca', busca)
    try {
      const res  = await fetch(`/api/admin/usuarios?${params}`)
      const data = await res.json()
      setUsuarios(data.usuarios ?? [])
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500 mt-1">{total} usuário{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Busca */}
      <form onSubmit={pesquisar} className="flex gap-2 mb-6">
        <input
          type="text"
          value={buscaInput}
          onChange={e => setBuscaInput(e.target.value)}
          placeholder="Buscar por nome, email ou CPF..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Buscar
        </button>
        {busca && (
          <button
            type="button"
            onClick={() => { setBusca(''); setBuscaInput(''); setPagina(1) }}
            className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Limpar
          </button>
        )}
      </form>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">CPF</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Pedidos</th>
                <th className="px-4 py-3 font-medium">Perfil</th>
                <th className="px-4 py-3 font-medium">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Carregando...
                  </td>
                </tr>
              )}
              {!loading && usuarios.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
              {!loading && usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.nome}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                    {u.cpf ? u.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {u.telefone || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u._count.pedidos}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {u.role === 'ADMIN' ? 'Admin' : 'Cliente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>{total} usuários · página {pagina} de {totalPaginas}</span>
            <div className="flex gap-2">
              {pagina > 1 && (
                <button
                  onClick={() => setPagina(p => p - 1)}
                  className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  ← Anterior
                </button>
              )}
              {pagina < totalPaginas && (
                <button
                  onClick={() => setPagina(p => p + 1)}
                  className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Próxima →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
