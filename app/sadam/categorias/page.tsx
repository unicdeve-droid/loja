'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect, FormEvent } from 'react'
import { slugify } from '@/lib/utils'

interface Categoria {
  id: string
  nome: string
  slug: string
  imagemUrl: string | null
  ativo: boolean
  ordem: number
  _count: { produtos: number }
}

export default function AdminCategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading,    setLoading]    = useState(true)

  /* modal */
  const [editando,     setEditando]     = useState<Categoria | null>(null)
  const [showModal,    setShowModal]    = useState(false)
  const [nome,         setNome]         = useState('')
  const [slug,         setSlug]         = useState('')
  const [imagemUrl,    setImagemUrl]    = useState('')
  const [ativo,        setAtivo]        = useState(true)
  const [ordem,        setOrdem]        = useState(0)
  const [saving,       setSaving]       = useState(false)
  const [erro,         setErro]         = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const res  = await fetch('/api/admin/categorias')
    const data = await res.json()
    setCategorias(data)
    setLoading(false)
  }

  function abrirNova() {
    setEditando(null)
    setNome(''); setSlug(''); setImagemUrl(''); setAtivo(true); setOrdem(0); setErro('')
    setShowModal(true)
  }

  function abrirEditar(c: Categoria) {
    setEditando(c)
    setNome(c.nome); setSlug(c.slug); setImagemUrl(c.imagemUrl ?? '')
    setAtivo(c.ativo); setOrdem(c.ordem); setErro('')
    setShowModal(true)
  }

  /* auto-slug apenas ao criar */
  function handleNomeChange(v: string) {
    setNome(v)
    if (!editando) setSlug(slugify(v))
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setSaving(true); setErro('')
    const payload = { nome, slug, imagemUrl: imagemUrl || null, ativo, ordem }
    try {
      const url    = editando ? `/api/admin/categorias/${editando.id}` : '/api/admin/categorias'
      const method = editando ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) { setShowModal(false); carregar() }
      else { const d = await res.json(); setErro(d.erro || 'Erro ao salvar.') }
    } catch { setErro('Erro ao salvar.') }
    finally { setSaving(false) }
  }

  async function deletar(c: Categoria) {
    if (c._count.produtos > 0) {
      alert(`Essa categoria possui ${c._count.produtos} produto(s). Remova ou mova-os antes de excluir.`)
      return
    }
    if (!confirm(`Excluir "${c.nome}"?`)) return
    await fetch(`/api/admin/categorias/${c.id}`, { method: 'DELETE' })
    carregar()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
        <button
          onClick={abrirNova}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          + Nova categoria
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">Ordem</th>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Produtos</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Carregando…</td></tr>
            )}
            {!loading && categorias.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Nenhuma categoria cadastrada.</td></tr>
            )}
            {categorias.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{c.ordem}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {c.imagemUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imagemUrl} alt={c.nome} className="w-8 h-8 object-cover rounded border border-gray-200" />
                    )}
                    <span className="font-medium text-gray-900">{c.nome}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{c.slug}</td>
                <td className="px-4 py-3 text-gray-600">{c._count.produtos}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                    {c.ativo ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => abrirEditar(c)} className="text-blue-600 hover:underline text-xs font-medium">Editar</button>
                    <button onClick={() => deletar(c)} className="text-red-400 hover:text-red-600 text-xs">Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {editando ? 'Editar categoria' : 'Nova categoria'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <form onSubmit={salvar} className="p-6 space-y-4">
              {erro && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text" required value={nome}
                  onChange={(e) => handleNomeChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text" value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL da imagem</label>
                <input
                  type="text" value={imagemUrl}
                  onChange={(e) => setImagemUrl(e.target.value)}
                  placeholder="https://… ou /uploads/…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
                <input
                  type="number" min="0" value={ordem}
                  onChange={(e) => setOrdem(parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox" checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Ativa</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
