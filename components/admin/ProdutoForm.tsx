'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/utils'

interface Variacao {
  id?: string
  tipo: string
  valor: string
  ativo: boolean
}

interface Categoria {
  id: string
  nome: string
}

interface ProdutoFormProps {
  produto?: {
    id: string
    nome: string
    slug: string
    codigo: string | null
    descricao: string
    preco: number
    precoOriginal: number | null
    categoriaId: string
    fotos: string[]
    ativo: boolean
    mediaEstrelas: number
    totalAvaliacoes: number
    temCor: boolean
    temVoltagem: boolean
    temTamanho: boolean
    variacoes: Variacao[]
    tipo?: 'FISICO' | 'DIGITAL'
    conteudoDigital?: string | null
    pixQrCodeEstatico?: string | null
    pixCopiaCola?: string | null
  }
}

export function ProdutoForm({ produto }: ProdutoFormProps) {
  const router = useRouter()
  const isEdit = !!produto

  /* ── Estados existentes ─────────────────────────────────────── */
  const [nome,           setNome]           = useState(produto?.nome           ?? '')
  const [slug,           setSlug]           = useState(produto?.slug           ?? '')
  const [codigo,         setCodigo]         = useState(produto?.codigo         ?? '')
  const [descricao,      setDescricao]      = useState(produto?.descricao      ?? '')
  const [preco,          setPreco]          = useState(String(produto?.preco   ?? ''))
  const [precoOriginal,  setPrecoOriginal]  = useState(String(produto?.precoOriginal ?? ''))
  const [categoriaId,    setCategoriaId]    = useState(produto?.categoriaId    ?? '')
  const [fotos,          setFotos]          = useState<string[]>(produto?.fotos ?? [])
  const [ativo,          setAtivo]          = useState(produto?.ativo          ?? true)
  const [mediaEstrelas,  setMediaEstrelas]  = useState(String(produto?.mediaEstrelas  ?? '0'))
  const [totalAvaliacoes,setTotalAvaliacoes]= useState(String(produto?.totalAvaliacoes ?? '0'))
  const [temCor,         setTemCor]         = useState(produto?.temCor         ?? false)
  const [temVoltagem,    setTemVoltagem]    = useState(produto?.temVoltagem    ?? false)
  const [temTamanho,     setTemTamanho]     = useState(produto?.temTamanho     ?? false)
  const [variacoes,      setVariacoes]      = useState<Variacao[]>(produto?.variacoes ?? [])
  const [categorias,     setCategorias]     = useState<Categoria[]>([])
  const [uploading,      setUploading]      = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [erro,           setErro]           = useState('')

  /* ── Novos estados: produto digital ────────────────────────── */
  const [tipo,              setTipo]              = useState<'FISICO'|'DIGITAL'>(produto?.tipo ?? 'DIGITAL')
  const [conteudoDigital,   setConteudoDigital]   = useState(produto?.conteudoDigital ?? '')
  const [pixQrCodeEstatico, setPixQrCodeEstatico] = useState(produto?.pixQrCodeEstatico ?? '')
  const [pixCopiaCola,      setPixCopiaCola]      = useState(produto?.pixCopiaCola ?? '')
  const [uploadandoQr,      setUploadandoQr]      = useState(false)

  useEffect(() => {
    fetch('/api/categorias').then(r => r.json()).then(setCategorias).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit && nome) setSlug(slugify(nome))
  }, [nome, isEdit])

  /* ── Helpers existentes ──────────────────────────────────────── */
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) setFotos(prev => [...prev, data.url])
    } catch { setErro('Erro ao fazer upload.') }
    finally  { setUploading(false) }
  }

  function removerFoto(url: string) {
    setFotos(prev => prev.filter(f => f !== url))
  }

  function addVariacao(tipo: string) {
    setVariacoes(prev => [...prev, { tipo, valor: '', ativo: true }])
  }

  function removeVariacao(idx: number) {
    setVariacoes(prev => prev.filter((_, i) => i !== idx))
  }

  function updateVariacao(idx: number, field: keyof Variacao, value: string | boolean) {
    setVariacoes(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v))
  }

  /* ── Upload de QR Code estático ────────────────────────────── */
  async function handleUploadQr(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadandoQr(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) setPixQrCodeEstatico(data.url)
      else setErro('Erro ao fazer upload do QR Code.')
    } catch { setErro('Erro ao fazer upload do QR Code.') }
    finally  { setUploadandoQr(false) }
  }

  /* ── Submit ─────────────────────────────────────────────────── */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErro('')

    const payload = {
      nome, slug, codigo: codigo || null,
      descricao, preco, precoOriginal: precoOriginal || null,
      categoriaId, fotos, ativo,
      mediaEstrelas, totalAvaliacoes,
      temCor, temVoltagem, temTamanho,
      variacoes,
      // Campos digitais
      tipo,
      conteudoDigital:   tipo === 'DIGITAL' ? (conteudoDigital || null) : null,
      pixQrCodeEstatico: pixQrCodeEstatico || null,
      pixCopiaCola:      pixCopiaCola      || null,
    }

    try {
      const url    = isEdit ? `/api/admin/produtos/${produto!.id}` : '/api/admin/produtos'
      const method = isEdit ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.erro || 'Erro ao salvar.'); return }
      router.push('/admin/produtos')
      router.refresh()
    } catch  { setErro('Erro ao salvar.')
    } finally { setSaving(false) }
  }

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {erro}
        </div>
      )}

      {/* ── Tipo de produto ── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Tipo de produto</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${tipo === 'FISICO' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <input type="radio" name="tipo" value="FISICO" checked={tipo === 'FISICO'} onChange={() => setTipo('FISICO')} className="text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-gray-800">🏠 Produto Físico</p>
              <p className="text-xs text-gray-500">Entregue pelos Correios ou transportadora</p>
            </div>
          </label>
          <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${tipo === 'DIGITAL' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <input type="radio" name="tipo" value="DIGITAL" checked={tipo === 'DIGITAL'} onChange={() => setTipo('DIGITAL')} className="text-purple-600" />
            <div>
              <p className="text-sm font-semibold text-gray-800">💻 Infoproduto / Digital</p>
              <p className="text-xs text-gray-500">Entregue por e-mail ou WhatsApp</p>
            </div>
          </label>
        </div>
      </section>

      {/* ── Informações básicas ── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Informações básicas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome <span className="text-red-500">*</span></label>
            <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código (SKU)</label>
            <input type="text" value={codigo} onChange={(e) => setCodigo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) <span className="text-red-500">*</span></label>
            <input type="number" step="0.01" min="0" required value={preco} onChange={(e) => setPreco(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço original (R$) <span className="text-xs text-gray-400 ml-1">— exibido riscado</span></label>
            <input type="number" step="0.01" min="0" value={precoOriginal} onChange={(e) => setPrecoOriginal(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria <span className="text-red-500">*</span></label>
            <select required value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Selecione…</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={ativo}
              aria-label="Produto ativo"
              onClick={() => setAtivo((v) => !v)}
              style={{
                position: 'relative', width: 46, height: 26, flexShrink: 0,
                borderRadius: 9999, border: 'none', cursor: 'pointer', padding: 0,
                background: ativo ? '#16a34a' : '#9ca3af', transition: 'background .15s',
              }}
            >
              <span
                style={{
                  position: 'absolute', top: 3, left: ativo ? 23 : 3, width: 20, height: 20,
                  borderRadius: '50%', background: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,.35)', transition: 'left .15s',
                }}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {ativo ? 'Ativo — visível na loja' : 'Inativo — oculto da loja'}
            </span>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição <span className="text-red-500">*</span></label>
            <textarea required rows={5} value={descricao} onChange={(e) => setDescricao(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </section>

      {/* ── Entrega digital (só aparece se tipo = DIGITAL) ── */}
      {tipo === 'DIGITAL' && (
        <section className="bg-white rounded-xl border border-purple-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">📦 Entrega do produto digital</h2>
          <p className="text-sm text-gray-500 mb-5">Informe o link, acesso ou instruções que serão enviados ao cliente após o pagamento confirmado.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link / Instruções de entrega</label>
            <textarea rows={4} value={conteudoDigital} onChange={(e) => setConteudoDigital(e.target.value)}
              placeholder="Ex: https://drive.google.com/... ou 'Acesse com email X e senha Y em plataforma.com'"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <p className="text-xs text-gray-400 mt-1">Esse conteúdo é enviado ao cliente por e-mail/WhatsApp após confirmação do pagamento.</p>
          </div>
        </section>
      )}

      {/* ── Fotos ── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Fotos do produto</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          {fotos.map((url, i) => (
            <div key={i} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`foto ${i + 1}`} className="w-full h-full object-cover" />
              <button type="button" onClick={() => removerFoto(url)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xl">
                ✕
              </button>
            </div>
          ))}
          <label className={`w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-blue-400 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <span className="text-2xl mb-1">+</span>
            <span className="text-xs">Upload</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
          </label>
        </div>
        {uploading && <p className="text-sm text-blue-600">Enviando imagem…</p>}
        <p className="text-xs text-gray-400">JPG, PNG ou WebP · máx 5 MB · primeira foto = capa</p>
      </section>

      {/* ── PIX Estático por produto ── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">💚 PIX estático deste produto</h2>
        <p className="text-sm text-gray-500 mb-5">Usado como fallback se o gateway PIX não estiver configurado. Deixe vazio para usar o PIX global da loja.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* QR Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">QR Code PIX (imagem)</label>
            {pixQrCodeEstatico && (
              <div className="mb-2 flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pixQrCodeEstatico} alt="QR Code" className="w-20 h-20 border rounded bg-white object-contain p-1" />
                <button type="button" onClick={() => setPixQrCodeEstatico('')}
                  className="text-xs text-red-500 hover:text-red-700 mt-1">
                  Remover
                </button>
              </div>
            )}
            <label className={`flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-green-400 transition-colors text-sm text-gray-500 ${uploadandoQr ? 'opacity-50 pointer-events-none' : ''}`}>
              <span>📷</span>
              {uploadandoQr ? 'Enviando QR Code…' : 'Fazer upload do QR Code'}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" onChange={handleUploadQr} />
            </label>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP ou SVG</p>
          </div>

          {/* Copia e cola */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Código PIX copia e cola</label>
            <textarea rows={5} value={pixCopiaCola} onChange={(e) => setPixCopiaCola(e.target.value)}
              placeholder="00020126..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500" />
            <p className="text-xs text-gray-400 mt-1">Código gerado pelo seu banco para este produto</p>
          </div>
        </div>
      </section>

      {/* ── Variações (só para físicos) ── */}
      {tipo === 'FISICO' && (
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Variações</h2>
          <p className="text-sm text-gray-500 mb-5">Ative os tipos de variação e cadastre os valores disponíveis.</p>

          <div className="flex flex-wrap gap-4 mb-6">
            {[
              { key: 'temCor',      label: 'Cor',     val: temCor,      set: setTemCor,      tipo: 'cor'      },
              { key: 'temVoltagem', label: 'Voltagem', val: temVoltagem, set: setTemVoltagem, tipo: 'voltagem' },
              { key: 'temTamanho',  label: 'Tamanho',  val: temTamanho,  set: setTemTamanho,  tipo: 'tamanho'  },
            ].map(({ key, label, val, set, tipo: t }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={val}
                  onChange={(e) => {
                    set(e.target.checked)
                    if (!e.target.checked) setVariacoes(prev => prev.filter(v => v.tipo !== t))
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            {temCor      && <button type="button" onClick={() => addVariacao('cor')}      className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">+ Cor</button>}
            {temVoltagem && <button type="button" onClick={() => addVariacao('voltagem')} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">+ Voltagem</button>}
            {temTamanho  && <button type="button" onClick={() => addVariacao('tamanho')}  className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">+ Tamanho</button>}
          </div>

          {variacoes.length > 0 && (
            <div className="space-y-2">
              {variacoes.map((v, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-500 w-14 shrink-0 capitalize">{v.tipo}</span>
                  <input type="text" value={v.valor} onChange={e => updateVariacao(i, 'valor', e.target.value)}
                    placeholder="Valor da variação" className="flex-1 border border-gray-200 rounded-md px-2 py-1 text-sm" />
                  <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer whitespace-nowrap">
                    <input type="checkbox" checked={v.ativo} onChange={e => updateVariacao(i, 'ativo', e.target.checked)} className="w-3.5 h-3.5" />
                    Ativo
                  </label>
                  <button type="button" onClick={() => removeVariacao(i)} className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none">✕</button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Avaliações (apenas edição) ── */}
      {isEdit && (
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Dados de avaliação</h2>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Média de estrelas</label>
              <input type="number" step="0.1" min="0" max="5" value={mediaEstrelas} onChange={(e) => setMediaEstrelas(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total de avaliações</label>
              <input type="number" min="0" value={totalAvaliacoes} onChange={(e) => setTotalAvaliacoes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </section>
      )}

      {/* ── Ações ── */}
      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={saving}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
          {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar produto'}
        </button>
        <button type="button" onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
