'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'

interface Avaliacao {
  id: string
  produtoId: string
  nomeCliente: string
  estrelas: number
  comentario: string | null
  cidade: string | null
  data: string
  ativo: boolean
  produto: { nome: string; slug: string }
}

function Estrelas({ n }: { n: number }) {
  return (
    <span className="text-yellow-400 text-sm">
      {'★'.repeat(n)}{'☆'.repeat(5 - n)}
    </span>
  )
}

export default function AdminAvaliacoesPage() {
  const [avaliacoes,  setAvaliacoes]  = useState<Avaliacao[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filtro,      setFiltro]      = useState<'todos' | 'ativos' | 'inativos'>('todos')
  const [editando,    setEditando]    = useState<Avaliacao | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [erro,        setErro]        = useState('')

  /* estados do modal de edição */
  const [enomeCliente, setENomeCliente] = useState('')
  const [eestrelas,    setEEstrelas]    = useState(5)
  const [ecomentario,  setEComentario]  = useState('')
  const [ecidade,      setECidade]      = useState('')
  const [eativo,       setEAtivo]       = useState(true)

  /* Carrega todas avaliações de todos os produtos via API */
  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      // Busca produtos e depois avaliações de cada um
      const resProd = await fetch('/api/admin/produtos?porPagina=100')
      const dataProd = await resProd.json()
      const produtos: { id: string; nome: string; slug: string }[] = (dataProd.produtos ?? [])

      const listas = await Promise.all(
        produtos.map((p) =>
          fetch(`/api/admin/avaliacoes/${p.id}`)
            .then((r) => r.json())
            .then((avs: Avaliacao[]) =>
              avs.map((a) => ({ ...a, produto: { nome: p.nome, slug: p.slug } }))
            )
            .catch(() => [] as Avaliacao[])
        )
      )
      const todas = listas.flat().sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      )
      setAvaliacoes(todas)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function abrirEditar(av: Avaliacao) {
    setEditando(av)
    setENomeCliente(av.nomeCliente)
    setEEstrelas(av.estrelas)
    setEComentario(av.comentario ?? '')
    setECidade(av.cidade ?? '')
    setEAtivo(av.ativo)
    setErro('')
  }

  async function salvarEdicao() {
    if (!editando) return
    setSaving(true); setErro('')
    try {
      const res = await fetch(`/api/admin/avaliacoes/${editando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeCliente: enomeCliente,
          estrelas:    eestrelas,
          comentario:  ecomentario || null,
          cidade:      ecidade     || null,
          ativo:       eativo,
        }),
      })
      if (res.ok) { setEditando(null); carregar() }
      else { const d = await res.json(); setErro(d.erro || 'Erro ao salvar.') }
    } catch { setErro('Erro ao salvar.') }
    finally { setSaving(false) }
  }

  async function toggleAtivo(av: Avaliacao) {
    await fetch(`/api/admin/avaliacoes/${av.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...av, ativo: !av.ativo }),
    })
    carregar()
  }

  async function deletar(av: Avaliacao) {
    if (!confirm(`Excluir avaliação de "${av.nomeCliente}"?`)) return
    await fetch(`/api/admin/avaliacoes/${av.id}`, { method: 'DELETE' })
    carregar()
  }

  const filtradas = avaliacoes.filter((a) => {
    if (filtro === 'ativos')   return a.ativo
    if (filtro === 'inativos') return !a.ativo
    return true
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Avaliações</h1>
        <p className="text-sm text-gray-400">{avaliacoes.length} no total</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {(['todos', 'ativos', 'inativos'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors capitalize ${
              filtro === f
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {loading && <p className="text-gray-400 text-sm">Carregando…</p>}
        {!loading && filtradas.length === 0 && (
          <p className="text-gray-400 text-sm">Nenhuma avaliação encontrada.</p>
        )}

        {filtradas.map((av) => (
          <div
            key={av.id}
            className={`bg-white rounded-xl border p-5 ${av.ativo ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-gray-900 text-sm">{av.nomeCliente}</span>
                  {av.cidade && <span className="text-xs text-gray-400">{av.cidade}</span>}
                  <Estrelas n={av.estrelas} />
                  <span className="text-xs text-gray-300">
                    {new Date(av.data).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-xs text-blue-500 mb-2">{av.produto.nome}</p>
                {av.comentario && (
                  <p className="text-sm text-gray-600 leading-relaxed">{av.comentario}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleAtivo(av)}
                  className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                    av.ativo
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {av.ativo ? 'Visível' : 'Oculto'}
                </button>
                <button
                  onClick={() => abrirEditar(av)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => deletar(av)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de edição */}
      {editando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Editar avaliação</h2>
              <button onClick={() => setEditando(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {erro && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do cliente</label>
                <input
                  type="text" value={enomeCliente}
                  onChange={(e) => setENomeCliente(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estrelas (1–5)</label>
                <input
                  type="number" min="1" max="5" value={eestrelas}
                  onChange={(e) => setEEstrelas(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <input
                  type="text" value={ecidade}
                  onChange={(e) => setECidade(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comentário</label>
                <textarea
                  rows={3} value={ecomentario}
                  onChange={(e) => setEComentario(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox" checked={eativo}
                  onChange={(e) => setEAtivo(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Visível na loja</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={salvarEdicao} disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
                <button
                  onClick={() => setEditando(null)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
