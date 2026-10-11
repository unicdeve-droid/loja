'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect, FormEvent } from 'react'

interface Config {
  site_nome?: string
  site_descricao?: string
  logo_url?: string
  banner_imagens?: string
  home_blocos?: string
  prazo_entrega_dias?: string
  frete_gratis_acima?: string
  correios_cep_origem?: string
  asaas_api_key?: string
  asaas_env?: string
}

interface Bloco { imagem: string; link: string }

export default function AdminConfigPage() {
  const [config,          setConfig]          = useState<Config>({})
  const [banners,         setBanners]         = useState<string[]>([])
  const [blocos,          setBlocos]          = useState<Bloco[]>([])
  const [loading,         setLoading]         = useState(true)
  const [saving,          setSaving]          = useState(false)
  const [uploadingLogo,   setUploadingLogo]   = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingBloco,  setUploadingBloco]  = useState<number | null>(null)
  const [ok,              setOk]              = useState('')
  const [erro,            setErro]            = useState('')
  const [pixCfg,          setPixCfg]          = useState<Record<string,string>>({})
  const [uploadingPix,    setUploadingPix]    = useState<string|null>(null)
  const [pixPendente,    setPixPendente]    = useState<Record<string,string>>({})

  useEffect(() => {
    fetch('/api/admin/config')
      .then(r => r.json())
      .then(data => {
        setConfig(data)
        try { const p = JSON.parse(data.banner_imagens || '[]'); setBanners(Array.isArray(p) ? p : []) } catch { setBanners([]) }
        try { const p = JSON.parse(data.home_blocos || '[]'); setBlocos(Array.isArray(p) ? p : []) } catch { setBlocos([]) }
        setLoading(false)
      })
      .catch(() => setLoading(false))
    fetch('/api/admin/config/pix')
      .then(r => r.json())
      .then(data => { if (typeof data === 'object') setPixCfg(data) })
      .catch(() => {})
  }, [])

  async function salvarChave(key: string, value: string) {
    const res = await fetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    return res.ok
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true); setOk(''); setErro('')
    try {
      const toSave = {
        ...config,
        banner_imagens: JSON.stringify(banners),
        home_blocos:    JSON.stringify(blocos),
      }
      const results = await Promise.all(Object.entries(toSave).map(([k, v]) => salvarChave(k, v ?? '')))
      if (results.every(Boolean)) setOk('Configurações salvas com sucesso!')
      else setErro('Algumas configurações não puderam ser salvas.')
    } catch { setErro('Erro ao salvar.') }
    finally { setSaving(false) }
  }

  async function handlePixQrUpload(precoKey: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingPix(precoKey)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('tipo', 'pix')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        setPixPendente(p => ({ ...p, [precoKey]: data.url }))
        setErro('')
        setOk('Imagem enviada. Confira o preview e clique em Confirmar e ativar.')
      } else setErro('Erro no upload.')
    } catch { setErro('Erro no upload.') }
    finally { setUploadingPix(null); e.target.value = '' }
  }

  async function confirmarPixQr(precoKey: string) {
    const url = pixPendente[precoKey]; if (!url) return
    const qrKey = `pix_qr_${precoKey}`
    setOk(''); setErro('')
    try {
      const res = await fetch('/api/admin/config/pix', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: qrKey, value: url }) })
      if (!res.ok) { setErro(`NÃO foi salvo (erro ${res.status}). O QR anterior continua valendo.`); return }
      const conf = await fetch('/api/admin/config/pix', { cache: 'no-store' }).then(r => r.json())
      if (!conf || conf[qrKey] !== url) { setErro('O servidor não confirmou o QR salvo. Recarregue a página e confira antes de vender.'); return }
      setPixCfg(p => ({ ...p, [qrKey]: conf[qrKey] }))
      setPixPendente(p => { const n = { ...p }; delete n[precoKey]; return n })
      setOk('QR Code salvo e confirmado no servidor. Escaneie na loja uma vez para conferir.')
    } catch { setErro('Erro ao salvar o QR. O anterior continua valendo.') }
  }

  function cancelarPixQr(precoKey: string) {
    setPixPendente(p => { const n = { ...p }; delete n[precoKey]; return n })
  }

  async function salvarPixCopia(precoKey: string, valor: string) {
    const key = `pix_copia_${precoKey}`
    setOk(''); setErro('')
    let v = (valor || '').trim()
    const i = v.indexOf('000201')
    if (i < 0) { setErro('Código inválido: um copia e cola do Pix começa com 000201.'); return }
    v = v.slice(i).replace(/[\r\n]+/g, '')
    try {
      const res = await fetch('/api/admin/config/pix', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value: v }) })
      if (!res.ok) { setErro(`NÃO foi salvo (erro ${res.status}).`); return }
      setPixCfg(p => ({ ...p, [key]: v }))
      setOk('Código PIX salvo!')
    } catch { setErro('Erro ao salvar o código PIX.') }
  }


  function field(key: keyof Config) {
    return {
      value: config[key] ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setConfig(c => ({ ...c, [key]: e.target.value })),
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingLogo(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('tipo', 'logo')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) { setConfig(c => ({ ...c, logo_url: data.url })); await salvarChave('logo_url', data.url); setOk('Logo atualizado!') }
      else setErro(data.erro || 'Erro no upload do logo.')
    } catch { setErro('Erro no upload do logo.') }
    finally { setUploadingLogo(false); e.target.value = '' }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingBanner(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('tipo', 'banner')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) { setBanners(b => [...b, data.url]); setOk('Banner adicionado! Clique em Salvar.') }
      else setErro(data.erro || 'Erro no upload.')
    } catch { setErro('Erro no upload.') }
    finally { setUploadingBanner(false); e.target.value = '' }
  }

  async function handleBlocoUpload(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingBloco(idx)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('tipo', 'banner')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        setBlocos(b => { const n = [...b]; n[idx] = { ...n[idx], imagem: data.url }; return n })
        setOk('Imagem enviada! Clique em Salvar.')
      } else setErro(data.erro || 'Erro no upload.')
    } catch { setErro('Erro no upload.') }
    finally { setUploadingBloco(null); e.target.value = '' }
  }

  function moverBanner(idx: number, dir: -1 | 1) {
    setBanners(b => { const n = [...b]; [n[idx], n[idx + dir]] = [n[idx + dir], n[idx]]; return n })
  }

  function removerBanner(url: string) {
    setBanners(b => b.filter(x => x !== url))
  }

  function addBloco() {
    if (blocos.length >= 4) return
    setBlocos(b => [...b, { imagem: '', link: '/' }])
  }

  function removeBloco(idx: number) {
    setBlocos(b => b.filter((_, i) => i !== idx))
  }

  function updateBlocoLink(idx: number, link: string) {
    setBlocos(b => { const n = [...b]; n[idx] = { ...n[idx], link }; return n })
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Configurações da Loja</h1>

      {ok   && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{ok}</div>}
      {erro && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{erro}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Identidade */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Identidade da loja</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do site</label>
            <input type="text" {...field('site_nome')} placeholder="Minha Loja" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea rows={2} value={config.site_descricao ?? ''} onChange={e => setConfig(c => ({ ...c, site_descricao: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo do site</label>
            <div className="flex items-center gap-4">
              {config.logo_url
                ? <img src={config.logo_url} alt="Logo" className="h-16 max-w-[200px] object-contain border border-gray-200 rounded-lg p-2 bg-gray-50"/>
                : <div className="h-16 w-40 bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs">Sem logo</div>
              }
              <label className={`text-sm px-4 py-2 rounded-lg border cursor-pointer transition-colors text-center ${uploadingLogo ? 'opacity-50 pointer-events-none border-gray-200 text-gray-400' : 'border-blue-500 text-blue-600 hover:bg-blue-50'}`}>
                {uploadingLogo ? 'Enviando…' : config.logo_url ? '🔄 Trocar logo' : '📤 Upload logo'}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" onChange={handleLogoUpload}/>
              </label>
            </div>
          </div>
        </section>

        {/* Banners */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Banners principais</h2>
              <p className="text-xs text-gray-400 mt-0.5">Ideal 1920×500 px · arraste para reordenar</p>
            </div>
            <label className={`text-sm px-4 py-2 rounded-lg border cursor-pointer transition-colors ${uploadingBanner ? 'opacity-50 pointer-events-none border-gray-200 text-gray-400' : 'border-green-500 text-green-600 hover:bg-green-50'}`}>
              {uploadingBanner ? 'Enviando…' : '+ Adicionar banner'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleBannerUpload}/>
            </label>
          </div>
          {banners.length === 0
            ? <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center"><p className="text-gray-400 text-sm">Nenhum banner. Clique em + Adicionar banner.</p></div>
            : <div className="space-y-3">
                {banners.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <img src={url} alt={`Banner ${idx + 1}`} className="h-16 w-32 object-cover rounded border border-gray-200 shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700">Banner {idx + 1}</p>
                      <p className="text-xs text-gray-400 truncate">{url}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moverBanner(idx, -1)} disabled={idx === 0} className="p-1.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 text-sm">↑</button>
                      <button type="button" onClick={() => moverBanner(idx, 1)} disabled={idx === banners.length - 1} className="p-1.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 text-sm">↓</button>
                      <button type="button" onClick={() => removerBanner(url)} className="p-1.5 rounded text-gray-400 hover:text-red-500 text-sm ml-1">✕</button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </section>

        {/* 4 Blocos de destaque */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Blocos de destaque (4 imagens)</h2>
              <p className="text-xs text-gray-400 mt-0.5">Aparecem abaixo dos banners · ideal 600×400 px · máx 4</p>
            </div>
            {blocos.length < 4 && (
              <button type="button" onClick={addBloco} className="text-sm px-4 py-2 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50">
                + Adicionar bloco
              </button>
            )}
          </div>
          {blocos.length === 0
            ? <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center"><p className="text-gray-400 text-sm">Nenhum bloco. Clique em + Adicionar bloco.</p></div>
            : <div className="space-y-4">
                {blocos.map((bloco, idx) => (
                  <div key={idx} className="flex items-start gap-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex flex-col items-center gap-2">
                      {bloco.imagem
                        ? <img src={bloco.imagem} alt={`Bloco ${idx+1}`} className="w-28 h-20 object-cover rounded border border-gray-200"/>
                        : <div className="w-28 h-20 bg-gray-200 rounded border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">Sem imagem</div>
                      }
                      <label className={`text-xs px-3 py-1.5 rounded border cursor-pointer text-center ${uploadingBloco === idx ? 'opacity-50 pointer-events-none border-gray-200 text-gray-400' : 'border-blue-400 text-blue-600 hover:bg-blue-50'}`}>
                        {uploadingBloco === idx ? 'Enviando…' : '📤 Imagem'}
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => handleBlocoUpload(idx, e)}/>
                      </label>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-xs font-semibold text-gray-600">Bloco {idx + 1}</p>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Link ao clicar</label>
                        <input type="text" value={bloco.link} onChange={e => updateBlocoLink(idx, e.target.value)} placeholder="/categoria/celulares-e-smartphones" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeBloco(idx)} className="text-gray-400 hover:text-red-500 text-lg leading-none mt-0.5">✕</button>
                  </div>
                ))}
              </div>
          }
        </section>

        {/* Entrega */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Entrega e frete</h2>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de entrega (dias úteis)</label>
              <input type="number" min="1" {...field('prazo_entrega_dias')} placeholder="7" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frete grátis acima de (R$)</label>
              <input type="number" min="0" step="0.01" {...field('frete_gratis_acima')} placeholder="200" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CEP de origem (Correios)</label>
            <input type="text" maxLength={9} {...field('correios_cep_origem')} placeholder="87013-060" className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"/>
          </div>
        </section>

        {/* Asaas */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Pagamentos (Asaas)</h2>
            <a href="https://www.asaas.com" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Painel Asaas ↗</a>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente</label>
            <select value={config.asaas_env ?? 'sandbox'} onChange={e => setConfig(c => ({ ...c, asaas_env: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="sandbox">Sandbox (testes)</option>
              <option value="producao">Produção</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input type="password" {...field('asaas_api_key')} placeholder="$aact_…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"/>
          </div>
        </section>

        {/* ── PIX por preço ── */}
        <section className="bg-white rounded-xl border border-green-200 p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">💚 PIX por preço</h2>
            <p className="text-xs text-gray-400 mt-1">Configure o QR Code e o código copia-e-cola para cada valor. O sistema exibe automaticamente o QR correto conforme o preço do produto.</p>
          </div>
          {[
            { label: 'R$ 6,60',  key: '660'  },
            { label: 'R$ 9,90',  key: '990'  },
            { label: 'R$ 14,90', key: '1490' },
            { label: 'R$ 19,90', key: '1990' },
            { label: 'R$ 29,90', key: '2990' },
          ].map(({ label, key: pk }) => (
            <div key={pk} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-800">{label}</p>
              {pixPendente[pk] && (
                <div className="flex items-center gap-4 bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                  <img src={pixPendente[pk]} alt="QR novo" className="w-28 h-28 border rounded-lg bg-white object-contain p-1" />
                  <div className="space-y-2 text-xs text-gray-700">
                    <p className="font-semibold">Este QR novo AINDA NÃO está ativo.</p>
                    <p>Escaneie esta imagem com o app do seu banco (sem pagar) e confira se o recebedor é a sua conta. Só depois confirme.</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => confirmarPixQr(pk)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">Confirmar e ativar</button>
                      <button type="button" onClick={() => cancelarPixQr(pk)} className="border border-gray-300 px-3 py-1.5 rounded-lg">Cancelar</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* QR Code */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  {pixCfg[`pix_qr_${pk}`]
                    ? <img src={pixCfg[`pix_qr_${pk}`]} alt="QR" className="w-28 h-28 border rounded-lg bg-white object-contain p-1" />
                    : <div className="w-28 h-28 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400">Sem QR</div>
                  }
                  <label className={`text-xs px-3 py-1.5 rounded border cursor-pointer text-center whitespace-nowrap ${uploadingPix === pk ? 'opacity-50 pointer-events-none border-gray-200 text-gray-400' : 'border-green-500 text-green-600 hover:bg-green-50'}`}>
                    {uploadingPix === pk ? 'Enviando…' : '📷 Upload QR'}
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" onChange={e => handlePixQrUpload(pk, e)} />
                  </label>
                </div>
                {/* Copia e cola */}
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-gray-500 font-medium block">Código copia e cola</label>
                  <textarea
                    rows={5}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                    placeholder="00020126..."
                    value={pixCfg[`pix_copia_${pk}`] || ''}
                    onChange={e => setPixCfg(p => ({ ...p, [`pix_copia_${pk}`]: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => salvarPixCopia(pk, pixCfg[`pix_copia_${pk}`] || '')}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
                  >
                    Salvar código
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>

        <div className="flex items-center gap-4 pt-2">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Salvando…' : 'Salvar configurações'}
          </button>
        </div>
      </form>
    </div>
  )
}
