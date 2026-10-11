'use client'

import { useState, FormEvent, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCarrinho } from '@/contexts/CarrinhoContext'

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function formatCEP(v: string) {
  return v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d{1,3})/, '$1-$2')
}
function formatCardNumber(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}
function formatExpiry(v: string) {
  return v.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d{1,2})/, '$1/$2')
}

function formatWhats(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

type Step = 'entrega' | 'pagamento' | 'confirmado'
type Pagamento = 'PIX' | 'CARTAO'

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { itens, subtotal, setFrete, limparCarrinho } = useCarrinho()

  // Detecta se o carrinho tem só digitais
  const todoDigital = itens.length > 0 && itens.every(i => i.tipo !== 'FISICO')
  const temFisico   = itens.some(i => i.tipo === 'FISICO')

  const [step,      setStep]      = useState<Step>('entrega')
  const [pagamento, setPagamento] = useState<Pagamento>('PIX')
  const [loading,   setLoading]   = useState(false)
  const [erro,      setErro]      = useState('')

  // Guest info (digital sem login)
  const [nomeGuest,      setNomeGuest]      = useState('')
  const [emailGuest,     setEmailGuest]     = useState('')
  const [whatsappGuest,  setWhatsappGuest]  = useState('')
  const [canalEntrega,   setCanalEntrega]   = useState<'EMAIL' | 'WHATSAPP'>('EMAIL')

  // Endereço (físico)
  const [cep,         setCep]         = useState('')
  const [rua,         setRua]         = useState('')
  const [numero,      setNumero]      = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro,      setBairro]      = useState('')
  const [cidade,      setCidade]      = useState('')
  const [estado,      setEstado]      = useState('')
  const [freteOpcoes, setFreteOpcoes] = useState<any[]>([])
  const [freteAtivo,  setFreteAtivo]  = useState<any>(null)
  const [freteBuscado,setFreteBuscado]= useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)

  // Cartão
  const [cartaoNome,     setCartaoNome]     = useState('')
  const [cartaoNumero,   setCartaoNumero]   = useState('')
  const [cartaoValidade, setCartaoValidade] = useState('')
  const [cartaoCvv,      setCartaoCvv]      = useState('')
  const [cartaoCpf,      setCartaoCpf]      = useState('')

  // Confirmado
  const [pedidoId,      setPedidoId]      = useState('')
  const [pixQrCode,     setPixQrCode]     = useState('')
  const [pixCopiaECola, setPixCopiaECola] = useState('')
  const [pixAviso,      setPixAviso]      = useState('')
  const [jaPaguei,      setJaPaguei]      = useState(false)
  const [copiado,       setCopiado]       = useState(false)

  useEffect(() => {
    if (itens.length === 0 && step !== 'confirmado') router.push('/')
  }, [itens, step, router])

  async function buscarCep(rawCep: string) {
    if (rawCep.length !== 8) return
    setBuscandoCep(true)
    try {
      const r = await fetch(`/api/cep/${rawCep}`)
      const d = await r.json()
      if (d.rua)    setRua(d.rua)
      if (d.bairro) setBairro(d.bairro)
      if (d.cidade) setCidade(d.cidade)
      if (d.estado) setEstado(d.estado)
    } catch {} finally { setBuscandoCep(false) }
  }

  async function handleEntrega(e: FormEvent) {
    e.preventDefault()
    setErro('')

    if (todoDigital) {
      if (canalEntrega === 'EMAIL') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailGuest.trim())) {
          setErro('Informe um e-mail válido para receber o produto digital.')
          return
        }
        setWhatsappGuest('')
      } else {
        if (whatsappGuest.replace(/\D/g, '').length < 10) {
          setErro('Informe um WhatsApp válido, com DDD.')
          return
        }
        setEmailGuest('')
      }
      setFrete('', 'digital', 0)
      setFreteAtivo({ opcao: 'digital', prazo: 'Imediato', valor: 0 })
      setFreteBuscado(true)
      setStep('pagamento')
      return
    }

    if (!freteBuscado) {
      if (cep.replace(/\D/g,'').length !== 8) { setErro('CEP inválido.'); return }
      try {
        const r = await fetch('/api/frete', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cep: cep.replace(/\D/g,''), itens }),
        })
        const d = await r.json()
        if (d.erro) { setErro(d.erro); return }
        setFreteOpcoes(d.opcoes || [])
        setFreteBuscado(true)
      } catch { setErro('Erro ao calcular frete.') }
      return
    }
    if (!freteAtivo) { setErro('Selecione uma opção de frete.'); return }
    setStep('pagamento')
  }

  async function handleFinalizar(e: FormEvent) {
    e.preventDefault()
    setErro(''); setLoading(true)
    try {
      let pedidoData: any

      if (todoDigital) {
        // Pedido guest sem login
        const r = await fetch('/api/pedidos/digital', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itens: itens.map(i => ({ produtoId: i.id, quantidade: i.quantidade, formato: i.varianteFormato, tamanho: i.varianteTamanho })),
            nomeCliente: nomeGuest || 'Cliente',
            email:    emailGuest    || null,
            whatsapp: whatsappGuest || null,
            formaPagamento: pagamento,
            ...(pagamento === 'CARTAO'
              ? { cartaoNome, cartaoNumero: cartaoNumero.replace(/\s/g, ''), cartaoValidade, cartaoCvv, cartaoCpf }
              : {}),
          }),
        })
        pedidoData = await r.json()
        if (!r.ok) { setErro(pedidoData.erro || 'Erro ao criar pedido.'); setLoading(false); return }
      } else {
        // Pedido com login (físico ou misto)
        if (!session) { router.push('/login?callbackUrl=/checkout'); return }
        const body: any = {
          formaPagamento: pagamento,
          frete: freteAtivo?.valor ?? 0,
          cep: cep.replace(/\D/g,''), rua, numero, complemento, bairro, cidade, estado,
          itens: itens.map(i => ({
            produtoId: i.id, nome: i.nome, quantidade: i.quantidade,
            cor: i.varianteCor, voltagem: i.varianteVoltagem,
            entregaEmail: emailGuest || null, entregaWhatsapp: whatsappGuest || null,
          })),
        }
        if (pagamento === 'CARTAO') Object.assign(body, { cartaoNome, cartaoNumero: cartaoNumero.replace(/\s/g,''), cartaoValidade, cartaoCvv, cartaoCpf })
        const r = await fetch('/api/pedidos', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        pedidoData = await r.json()
        if (!r.ok) { setErro(pedidoData.erro || 'Erro ao criar pedido.'); setLoading(false); return }
      }

      const pid = pedidoData.id
      setPedidoId(pid)

      if (pagamento === 'PIX') {
        const r = await fetch('/api/pagamento/pix', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pedidoId: pid, total: subtotal }),
        })
        const pixData = await r.json()
        setPixQrCode(pixData.pixQrCode || '')
        setPixCopiaECola(pixData.pixCopiaECola || '')
        setPixAviso(pixData.aviso || '')
      }

      limparCarrinho()
      setStep('confirmado')
    } catch { setErro('Erro ao processar pedido. Tente novamente.') }
    finally { setLoading(false) }
  }

  async function handleJaPaguei() {
    if (!pedidoId) return
    try {
      await fetch(`/api/pedidos/${pedidoId}/pago`, { method: 'POST' }).catch(() => {})
      setJaPaguei(true)
    } catch {}
  }

  function copiarPix() {
    if (!pixCopiaECola) return
    navigator.clipboard.writeText(pixCopiaECola).then(() => {
      setCopiado(true); setTimeout(() => setCopiado(false), 3000)
    })
  }

  const totalFinal = subtotal + (freteAtivo?.valor ?? 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Finalizar compra</h1>

        {step !== 'confirmado' && (
          <div className="flex items-center gap-4 mb-8">
            <StepBadge n={1} label="Entrega"   active={step === 'entrega'}   done={step === 'pagamento'} />
            <div className="flex-1 h-px bg-gray-200" />
            <StepBadge n={2} label="Pagamento" active={step === 'pagamento'} done={false} />
          </div>
        )}

        {/* ── CONFIRMADO ── */}
        {step === 'confirmado' && (
          <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Pedido recebido!</h2>
            <p className="text-sm text-gray-500 mb-6">
              {todoDigital
                ? `Enviaremos o produto para ${emailGuest || whatsappGuest} após confirmar o pagamento.`
                : 'Seu pedido foi registrado com sucesso.'}
            </p>

            {pagamento === 'PIX' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-4">
                <p className="font-semibold text-green-800 mb-3">💚 Pague via PIX</p>

                {pixAviso && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 text-sm text-yellow-800">
                    {pixAviso}
                  </div>
                )}

                {pixQrCode && (
                  <div className="flex justify-center mb-3">
                    <img
                      src={pixQrCode.startsWith('data:') || pixQrCode.startsWith('http')
                        ? pixQrCode : `data:image/png;base64,${pixQrCode}`}
                      alt="QR Code PIX"
                      className="w-44 h-44 border rounded-lg bg-white p-2"
                    />
                  </div>
                )}

                {pixCopiaECola && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2 text-center">📋 Copie o código e pague no seu banco</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-2">
                      <p className="text-xs font-mono text-gray-600 break-all leading-relaxed">{pixCopiaECola.slice(0,60)}…</p>
                    </div>
                    <button onClick={copiarPix}
                      className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold py-3 rounded-xl transition-colors">
                      {copiado
                        ? <><span>✅</span> Código copiado!</>
                        : <><span>📋</span> Copiar código PIX</>
                      }
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-2">Abra o app do seu banco → PIX → Copia e Cola → Cole o código</p>
                  </div>
                )}

                {!jaPaguei ? (
                  <button onClick={handleJaPaguei}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-700 mt-2">
                    ✅ Já realizei o pagamento
                  </button>
                ) : (
                  <div className="bg-green-100 text-green-800 rounded-xl p-3 text-sm font-semibold">
                    ✅ Avisamos nossa equipe! Confirmaremos e enviaremos seu produto em breve.
                  </div>
                )}
              </div>
            )}

            {pagamento === 'CARTAO' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm text-blue-800">
                💳 Seus dados foram recebidos. Nossa equipe processará o pagamento e confirmará o pedido.
              </div>
            )}

            <p className="text-xs text-gray-400 mb-6">Pedido #{pedidoId}</p>
            <Link href="/" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold text-sm">
              Continuar comprando
            </Link>
          </div>
        )}

        {step !== 'confirmado' && (
          <div className="flex flex-col-reverse lg:flex-row gap-6">
            <div className="flex-1">

              {/* STEP 1 */}
              {step === 'entrega' && (
                <form onSubmit={handleEntrega}>
                  <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4 space-y-4">

                    {/* Digital: email/whatsapp */}
                    <div>
                      <h2 className="text-base font-bold text-gray-900 mb-3">
                        {todoDigital ? '📦 Onde você quer receber?' : '📍 Seus dados'}
                      </h2>
                      {todoDigital ? (
                        <div className="space-y-3 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Seu nome</label>
                            <input type="text" value={nomeGuest} onChange={e => setNomeGuest(e.target.value)}
                              placeholder="Nome completo" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Como deseja receber? *</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button type="button" onClick={() => setCanalEntrega('EMAIL')}
                                className={`py-2.5 rounded-lg border-2 text-sm font-semibold ${canalEntrega === 'EMAIL' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}>
                                ✉️ E-mail
                              </button>
                              <button type="button" onClick={() => setCanalEntrega('WHATSAPP')}
                                className={`py-2.5 rounded-lg border-2 text-sm font-semibold ${canalEntrega === 'WHATSAPP' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
                                💬 WhatsApp
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {canalEntrega === 'EMAIL' ? 'Seu e-mail *' : 'Seu WhatsApp (com DDD) *'}
                            </label>
                            {canalEntrega === 'EMAIL' ? (
                              <input type="email" value={emailGuest} onChange={e => setEmailGuest(e.target.value)}
                                placeholder="seu@email.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            ) : (
                              <input type="tel" inputMode="tel" value={whatsappGuest} onChange={e => setWhatsappGuest(formatWhats(e.target.value))}
                                placeholder="(00) 00000-0000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            )}
                          </div>
                        </div>
                      ) : !session && (
                        <div className="space-y-3 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Seu nome</label>
                            <input type="text" value={nomeGuest} onChange={e => setNomeGuest(e.target.value)}
                              placeholder="Nome completo" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">E-mail *</label>
                            <input type="email" value={emailGuest} onChange={e => setEmailGuest(e.target.value)}
                              placeholder="seu@email.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp</label>
                            <input type="tel" value={whatsappGuest} onChange={e => setWhatsappGuest(e.target.value)}
                              placeholder="(00) 00000-0000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Endereço (só físico) */}
                    {temFisico && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-700">Endereço de entrega</h3>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">CEP *</label>
                          <input required value={cep}
                            onChange={e => { const v = formatCEP(e.target.value); setCep(v); if (v.replace(/\D/g,'').length === 8) buscarCep(v.replace(/\D/g,'')) }}
                            placeholder="00000-000" maxLength={9}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          {buscandoCep && <p className="text-xs text-gray-400 mt-1">Buscando CEP…</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Rua *</label>
                            <input required value={rua} onChange={e => setRua(e.target.value)} placeholder="Nome da rua"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Número *</label>
                            <input required value={numero} onChange={e => setNumero(e.target.value)} placeholder="123"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
                            <input value={complemento} onChange={e => setComplemento(e.target.value)} placeholder="Apto"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Bairro *</label>
                            <input required value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Bairro"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Cidade *</label>
                            <input required value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Cidade"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Estado *</label>
                            <input required value={estado} onChange={e => setEstado(e.target.value)} placeholder="SP" maxLength={2}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                        </div>

                        {freteBuscado && freteOpcoes.length > 0 && (
                          <div className="space-y-2 mt-3">
                            {freteOpcoes.map(op => (
                              <label key={op.opcao} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${freteAtivo?.opcao === op.opcao ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                <input type="radio" name="frete" checked={freteAtivo?.opcao === op.opcao}
                                  onChange={() => { setFreteAtivo(op); setFrete(cep.replace(/\D/g,''), op.opcao, op.valor) }} />
                                <div className="flex-1"><span className="text-sm font-medium">{op.opcao}</span><span className="text-xs text-gray-500 ml-2">{op.prazo}</span></div>
                                <span className="text-sm font-semibold">{op.valor === 0 ? <span className="text-green-600">Grátis</span> : fmtBRL(op.valor)}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {erro && <p className="text-red-500 text-sm mb-3">{erro}</p>}
                  <button type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-bold text-sm transition-colors">
                    {todoDigital ? 'Continuar para pagamento →' : (freteBuscado && freteAtivo ? 'Continuar →' : 'Calcular frete →')}
                  </button>
                </form>
              )}

              {/* STEP 2 */}
              {step === 'pagamento' && (
                <form onSubmit={handleFinalizar}>
                  <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
                    <h2 className="text-base font-bold text-gray-900 mb-4">💳 Forma de pagamento</h2>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer ${pagamento === 'PIX' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                        <input type="radio" name="pag" value="PIX" checked={pagamento === 'PIX'} onChange={() => setPagamento('PIX')} />
                        <div><p className="text-sm font-semibold">PIX</p><p className="text-xs text-gray-500">Aprovação imediata</p></div>
                        <span className="ml-auto text-xl">💚</span>
                      </label>
                      <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer ${pagamento === 'CARTAO' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                        <input type="radio" name="pag" value="CARTAO" checked={pagamento === 'CARTAO'} onChange={() => setPagamento('CARTAO')} />
                        <div><p className="text-sm font-semibold">Cartão</p><p className="text-xs text-gray-500">1-2 dias úteis</p></div>
                        <span className="ml-auto text-xl">💳</span>
                      </label>
                    </div>

                    {pagamento === 'PIX' && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                        ✅ Após finalizar, o QR Code PIX será exibido para pagamento.
                      </div>
                    )}

                    {pagamento === 'CARTAO' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Nome no cartão *</label>
                          <input required value={cartaoNome} onChange={e => setCartaoNome(e.target.value.toUpperCase())} placeholder="NOME NO CARTÃO"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Número do cartão *</label>
                          <input required value={cartaoNumero} onChange={e => setCartaoNumero(formatCardNumber(e.target.value))} placeholder="0000 0000 0000 0000" maxLength={19}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Validade *</label>
                            <input required value={cartaoValidade} onChange={e => setCartaoValidade(formatExpiry(e.target.value))} placeholder="MM/AA" maxLength={5}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">CVV *</label>
                            <input required value={cartaoCvv} onChange={e => setCartaoCvv(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="123" maxLength={4}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">CPF do titular</label>
                          <input value={cartaoCpf} onChange={e => setCartaoCpf(e.target.value.replace(/\D/g,'').slice(0,11))} placeholder="00000000000"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                    )}
                  </div>

                  {erro && <p className="text-red-500 text-sm mb-3">{erro}</p>}
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep('entrega')}
                      className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium text-sm hover:bg-gray-50">← Voltar</button>
                    <button type="submit" disabled={loading}
                      className="flex-grow bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-50">
                      {loading ? 'Processando…' : `Finalizar · ${fmtBRL(totalFinal)}`}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Resumo lateral — topo da página (mobile: acima do form) */}
            <div className="lg:w-64 shrink-0 order-first lg:order-last">
              <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-4">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Seu pedido</h2>
                <div className="space-y-2">
                  {itens.map(item => (
                    <div key={item.id} className="flex gap-2 items-center text-xs">
                      <div className="relative w-10 h-10 rounded border overflow-hidden shrink-0">
                        <Image src={item.imagem} alt={item.nome} fill style={{ objectFit: 'contain' }} sizes="40px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-gray-700 font-medium">{item.nome}</p>
                        <p className="text-gray-400">x{item.quantidade}{(item as any).tipo !== 'FISICO' && ' · Digital'}</p>
                      </div>
                      <span className="font-semibold shrink-0 text-gray-800">{fmtBRL(item.preco * item.quantidade)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StepBadge({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
        {done ? '✓' : n}
      </div>
      <span className={`text-sm font-medium ${active ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
    </div>
  )
}
