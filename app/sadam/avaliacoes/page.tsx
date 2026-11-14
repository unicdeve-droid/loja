'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback, useRef } from 'react'

interface Avaliacao {
  id: string
  produtoId: string
  nomeCliente: string
  estrelas: number
  comentario: string | null
  cidade: string | null
  fotoUrl: string | null
  data: string
  ativo: boolean
  produto: { nome: string; slug: string }
}

interface ProdutoOpcao { id: string; nome: string }

function Estrelas({ n }: { n: number }) {
  return (
    <span className="text-yellow-400 text-sm">
      {'★'.repeat(n)}{'☆'.repeat(5 - n)}
    </span>
  )
}

// yyyy-mm-dd no fuso local (valor do <input type="date">)
function paraInputData(iso?: string) {
  const d = iso ? new Date(iso) : new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dia}`
}

export default function AdminAvaliacoesPage() {
  const [avaliacoes,  setAvaliacoes]  = useState<Avaliacao[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filtro,      setFiltro]      = useState<'todos' | 'ativos' | 'inativos'>('todos')
  const [saving,      setSaving]      = useState(false)
  const [erro,        setErro]        = useState('')

  /* modal (nova avaliação ou edição) */
  const [modalAberto, setModalAberto] = useState(false)
  const [editando,    setEditando]    = useState<Avaliacao | null>(null) // null = nova
  const [eprodutoId,  setEProdutoId]  = useState('')
  const [enomeCliente, setENomeCliente] = useState('')
  const [eestrelas,    setEEstrelas]    = useState(5)
  const [ecomentario,  setEComentario]  = useState('')
  const [ecidade,      setECidade]      = useState('')
  const [edata,        setEData]        = useState(paraInputData())
  const [efotoUrl,     setEFotoUrl]     = useState('')
  const [eativo,       setEAtivo]       = useState(true)
  const [enviandoFoto, setEnviandoFoto] = useState(false)

  /* busca de produto (só na criação) */
  const [buscaProd,    setBuscaProd]    = useState('')
  const [opcoesProd,   setOpcoesProd]   = useState<ProdutoOpcao[]>([])
  const timerBusca = useRef<ReturnType<typeof setTimeout> | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/avaliacoes')
      const data = await res.json()
      setAvaliacoes(Array.isArray(data) ? data : [])
    } catch {
      setAvaliacoes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function buscarProdutos(termo: string) {
    try {
      const url = termo.trim()
        ? `/api/admin/produtos?busca=${encodeURIComponent(termo.trim())}`
        : '/api/admin/produtos'
      const r = await fetch(url)
      const d = await r.json()
      setOpcoesProd((d.produtos ?? []).map((p: any) => ({ id: p.id, nome: p.nome })))
    } catch { setOpcoesProd([]) }
  }

  function onBuscaProd(v: string) {
    setBuscaProd(v)
    if (timerBusca.current) clearTimeout(timerBusca.current)
    timerBusca.current = setTimeout(() => buscarProdutos(v), 300)
  }

  function abrirNova() {
    setEditando(null)
    setEProdutoId('')
    setENomeCliente('')
    setEEstrelas(5)
    setEComentario('')
    setECidade('')
    setEData(paraInputData())
    setEFotoUrl('')
    setEAtivo(true)
    setBuscaProd('')
    setErro('')
    buscarProdutos('')
    setModalAberto(true)
  }

  function abrirEditar(av: Avaliacao) {
    setEditando(av)
    setEProdutoId(av.produtoId)
    setENomeCliente(av.nomeCliente)
    setEEstrelas(av.estrelas)
    setEComentario(av.comentario ?? '')
    setECidade(av.cidade ?? '')
    setEData(paraInputData(av.data))
    setEFotoUrl(av.fotoUrl ?? '')
    setEAtivo(av.ativo)
    setErro('')
    setModalAberto(true)
  }

  function fecharModal() { setModalAberto(false); setEditando(null) }

  async function enviarFoto(file: File) {
    setEnviandoFoto(true); setErro('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tipo', 'avaliacao')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (res.ok && d.url) setEFotoUrl(d.url)
      else setErro(d.erro || 'Erro ao enviar a foto.')
    } catch { setErro('Erro ao enviar a foto.') }
    finally { setEnviandoFoto(false) }
  }

  async function salvar() {
    if (!editando && !eprodutoId) { setErro('Escolha o produto.'); return }
    if (!enomeCliente.trim())      { setErro('Informe o nome do cliente.'); return }
    setSaving(true); setErro('')
    try {
      const corpo = {
        nomeCliente: enomeCliente.trim(),
        estrelas:    eestrelas,
        comentario:  ecomentario || null,
        cidade:      ecidade     || null,
        fotoUrl:     efotoUrl    || null,
        data:        edata ? new Date(`${edata}T12:00:00`).toISOString() : undefined,
        ativo:       eativo,
      }
      const res = editando
        ? await fetch(`/api/admin/avaliacoes/${editando.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(corpo),
          })
        : await fetch('/api/admin/avaliacoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...corpo, produtoId: eprodutoId }),
          })
      if (res.ok) { fecharModal(); carregar() }
      else { const d = await res.json(); setErro(d.erro || 'Erro ao salvar.') }
    } catch { setErro('Erro ao salvar.') }
    finally { setSaving(false) }
  }

  async function toggleAtivo(av: Avaliacao) {
    await fetch(`/api/admin/avaliacoes/${av.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !av.ativo }),
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
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-400">{avaliacoes.length} no total</p>
          <button
            onClick={abrirNova}
            className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Nova avaliação
          </button>
        </div>
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
              {av.fotoUrl && (
                <img src={av.fotoUrl} alt="" className="w-14 h-14 rounded-lg object-cover border border-gray-100 shrink-0" />
              )}
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

      {/* Modal (nova / editar) */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{editando ? 'Editar avaliação' : 'Nova avaliação'}</h2>
              <button onClick={fecharModal} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {erro && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}

              {/* Produto: escolhe só ao criar */}
              {!editando ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>
                  <input
                    type="text" value={buscaProd}
                    onChange={(e) => onBuscaProd(e.target.value)}
                    placeholder="Buscar produto pelo nome ou código…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={eprodutoId}
                    onChange={(e) => setEProdutoId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione…</option>
                    {opcoesProd.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-xs text-blue-500">{editando.produto.nome}</p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do cliente</label>
                <input
                  type="text" value={enomeCliente}
                  onChange={(e) => setENomeCliente(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input
                    type="text" value={ecidade}
                    onChange={(e) => setECidade(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input
                    type="date" value={edata}
                    onChange={(e) => setEData(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estrelas</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n} type="button"
                      onClick={() => setEEstrelas(n)}
                      className={`text-2xl leading-none ${n <= eestrelas ? 'text-yellow-400' : 'text-gray-300'}`}
                      aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comentário</label>
                <textarea
                  rows={3} value={ecomentario}
                  onChange={(e) => setEComentario(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto do cliente</label>
                {efotoUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={efotoUrl} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                    <button
                      type="button" onClick={() => setEFotoUrl('')}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remover foto
                    </button>
                  </div>
                ) : (
                  <input
                    type="file" accept="image/jpeg,image/png,image/webp"
                    disabled={enviandoFoto}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) enviarFoto(f); e.target.value = '' }}
                    className="block w-full text-sm text-gray-600"
                  />
                )}
                {enviandoFoto && <p className="text-xs text-gray-400 mt-1">Enviando foto…</p>}
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
                  onClick={salvar} disabled={saving || enviandoFoto}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
                <button
                  onClick={fecharModal}
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
