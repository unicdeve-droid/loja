'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

const STATUS_OPTS = [
  { value: 'AGUARDANDO_PAGAMENTO', label: 'Aguardando pagamento' },
  { value: 'PAGO',                 label: 'Pago' },
  { value: 'EM_SEPARACAO',         label: 'Em separação' },
  { value: 'ENVIADO',              label: 'Enviado' },
  { value: 'ENTREGUE',             label: 'Entregue' },
  { value: 'CANCELADO',            label: 'Cancelado' },
]

const STATUS_COLOR: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: 'bg-yellow-100 text-yellow-800',
  PAGO:                 'bg-green-100 text-green-800',
  EM_SEPARACAO:         'bg-blue-100 text-blue-800',
  ENVIADO:              'bg-purple-100 text-purple-800',
  ENTREGUE:             'bg-emerald-100 text-emerald-800',
  CANCELADO:            'bg-red-100 text-red-800',
}

export default function AdminPedidoDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const [pedido, setPedido]   = useState<any>(null)
  const [status, setStatus]   = useState('')
  const [saving, setSaving]   = useState(false)
  const [loading, setLoading] = useState(true)
  const [erro, setErro]       = useState('')
  const [ok, setOk]           = useState('')

  useEffect(() => {
    fetch(`/api/admin/pedidos/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPedido(data)
        setStatus(data.status)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  async function salvarStatus() {
    setSaving(true)
    setErro('')
    setOk('')
    try {
      const res = await fetch(`/api/admin/pedidos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setOk('Status atualizado com sucesso!')
        setPedido((p: any) => ({ ...p, status }))
      } else {
        const data = await res.json()
        setErro(data.erro || 'Erro ao atualizar.')
      }
    } catch {
      setErro('Erro ao atualizar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Carregando…</div>
  if (!pedido) return <div className="p-8 text-red-500">Pedido não encontrado.</div>

  const itensPedido: any[] = pedido.itens ?? []
  const emailEntrega: string | null = itensPedido.find((i) => i.entregaEmail)?.entregaEmail ?? null
  const whatsEntrega: string | null = itensPedido.find((i) => i.entregaWhatsapp)?.entregaWhatsapp ?? null
  const entregaDigital = itensPedido.length > 0 && itensPedido.every((i) => i.tipoProduto === 'DIGITAL')
  const numWhats = whatsEntrega ? whatsEntrega.replace(/\D/g, '') : ''
  const linkWhats = numWhats ? `https://wa.me/${numWhats.length <= 11 ? '55' + numWhats : numWhats}` : ''

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/pedidos" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Pedidos
        </Link>
        <h1 className="text-xl font-bold text-gray-900">
          Pedido <span className="font-mono text-base text-gray-500">{pedido.id.slice(0, 8)}…</span>
        </h1>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[pedido.status] ?? 'bg-gray-100 text-gray-700'}`}>
          {STATUS_OPTS.find((s) => s.value === pedido.status)?.label ?? pedido.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Cliente */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">👤 Cliente</h2>
          <p className="font-medium">{pedido.usuario?.nome}</p>
          {!pedido.usuario?.email?.startsWith('guest_') && (
            <p className="text-sm text-gray-500">{pedido.usuario?.email}</p>
          )}
          {pedido.usuario?.cpf     && <p className="text-sm text-gray-500">CPF: {pedido.usuario.cpf}</p>}
          {pedido.usuario?.telefone && <p className="text-sm text-gray-500">Tel: {pedido.usuario.telefone}</p>}
        </section>

        {/* Entrega digital */}
        {entregaDigital && (
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">📦 Entrega digital</h2>
            {whatsEntrega ? (
              <>
                <p className="text-xs text-gray-500">Receber por: <strong>WhatsApp</strong></p>
                <p className="text-sm font-medium mt-1">{whatsEntrega}</p>
                <a href={linkWhats} target="_blank" rel="noreferrer"
                  className="inline-block mt-3 bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-green-700">
                  💬 Abrir no WhatsApp
                </a>
              </>
            ) : emailEntrega ? (
              <>
                <p className="text-xs text-gray-500">Receber por: <strong>E-mail</strong></p>
                <p className="text-sm font-medium mt-1 break-all">{emailEntrega}</p>
                <a href={`mailto:${emailEntrega}`}
                  className="inline-block mt-3 bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-blue-700">
                  ✉️ Enviar e-mail
                </a>
              </>
            ) : (
              <p className="text-sm text-gray-500">Contato de entrega não informado.</p>
            )}
          </section>
        )}

        {/* Endereço de entrega */}
        {!entregaDigital && (
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">📍 Endereço de entrega</h2>
          <p className="text-sm">{pedido.rua}, {pedido.numero}{pedido.complemento ? `, ${pedido.complemento}` : ''}</p>
          <p className="text-sm">{pedido.bairro} · {pedido.cidade}/{pedido.estado}</p>
          <p className="text-sm">CEP {pedido.cep}</p>
          {pedido.prazoEntrega && <p className="text-sm text-gray-500 mt-1">Prazo: {pedido.prazoEntrega}</p>}
        </section>
        )}

        {/* Pagamento */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">💳 Pagamento</h2>
          <p className="text-sm font-medium">
            {pedido.formaPagamento === 'PIX' ? 'PIX' : 'Cartão de crédito'}
          </p>
          {pedido.formaPagamento === 'CARTAO' && (
            <div className="mt-2 space-y-0.5 text-sm text-gray-600">
              <p>Titular: {pedido.cartaoNome}</p>
              <p>Número: {pedido.cartaoNumero}</p>
              <p>Validade: {pedido.cartaoValidade}</p>
              <p>CVV: {pedido.cartaoCvv}</p>
              {pedido.cartaoCpf && <p>CPF: {pedido.cartaoCpf}</p>}
            </div>
          )}
          {pedido.formaPagamento === 'PIX' && pedido.pixAsaasId && (
            <p className="text-xs text-gray-400 mt-1">ID Asaas: {pedido.pixAsaasId}</p>
          )}
        </section>

        {/* Totais */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">💰 Valores</h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatCurrency(pedido.total - pedido.frete)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Frete</span>
              <span>{pedido.frete === 0 ? 'Grátis' : formatCurrency(pedido.frete)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t border-gray-100 pt-2 mt-2">
              <span>Total</span>
              <span>{formatCurrency(pedido.total)}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Itens */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">🛍️ Itens do pedido</h2>
        <div className="space-y-3">
          {pedido.itens?.map((item: any) => (
            <div key={item.id} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
              {item.foto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.foto} alt={item.nome} className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.nome}</p>
                <p className="text-xs text-gray-400">
                  {[item.cor, item.voltagem, item.tamanho].filter(Boolean).join(' · ')}
                </p>
              </div>
              <p className="text-sm text-gray-500">x{item.quantidade}</p>
              <p className="text-sm font-semibold">{formatCurrency(item.preco * item.quantidade)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Atualizar status */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">⚙️ Atualizar status</h2>

        {erro && <p className="text-sm text-red-600 mb-3">{erro}</p>}
        {ok  && <p className="text-sm text-green-600 mb-3">{ok}</p>}

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {STATUS_OPTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={salvarStatus}
            disabled={saving || status === pedido.status}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </section>
    </div>
  )
}
