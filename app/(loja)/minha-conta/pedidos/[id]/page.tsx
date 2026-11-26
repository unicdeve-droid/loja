'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  AGUARDANDO_PAGAMENTO:   'Aguardando pagamento',
  AGUARDANDO_CONFIRMACAO: 'Aguardando confirmação',
  PAGO:                   'Pago',
  EM_SEPARACAO:           'Em separação',
  ENVIADO:                'Enviado',
  ENTREGUE:               'Entregue',
  CANCELADO:              'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  AGUARDANDO_PAGAMENTO:   'bg-yellow-100 text-yellow-800',
  AGUARDANDO_CONFIRMACAO: 'bg-amber-100 text-amber-800',
  PAGO:                   'bg-green-100 text-green-800',
  EM_SEPARACAO:           'bg-blue-100 text-blue-800',
  ENVIADO:                'bg-purple-100 text-purple-800',
  ENTREGUE:               'bg-emerald-100 text-emerald-800',
  CANCELADO:              'bg-red-100 text-red-800',
}

interface ItemPedido {
  id: string
  nome: string
  foto: string | null
  preco: number
  quantidade: number
  cor: string | null
  voltagem: string | null
  tamanho: string | null
}

interface Pedido {
  id: string
  status: string
  formaPagamento: string
  total: number
  frete: number
  prazoEntrega: string | null
  cep: string | null
  rua: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  createdAt: string
  itens: ItemPedido[]
}

function fmtData(d: string) {
  try {
    return new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function PedidoDetalhePage() {
  const { status: authStatus } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = String(params?.id || '')
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (authStatus === 'loading') return
    if (authStatus === 'unauthenticated') {
      router.push(`/login?callbackUrl=/minha-conta/pedidos/${id}`)
      return
    }
    let ativo = true
    ;(async () => {
      try {
        const r = await fetch(`/api/pedidos/${id}`, { cache: 'no-store' })
        if (r.status === 401) {
          router.push(`/login?callbackUrl=/minha-conta/pedidos/${id}`)
          return
        }
        const d = await r.json()
        if (!ativo) return
        if (!r.ok) {
          setErro(d?.erro || 'Pedido não encontrado.')
        } else {
          setPedido(d)
        }
      } catch {
        if (ativo) setErro('Não foi possível carregar o pedido.')
      } finally {
        if (ativo) setLoading(false)
      }
    })()
    return () => { ativo = false }
  }, [authStatus, id, router])

  const temEndereco = pedido && (pedido.rua || pedido.cidade)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/minha-conta/pedidos" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 mb-5">
        ← Voltar aos meus pedidos
      </Link>

      {loading && (
        <div className="text-center text-gray-500 py-16">Carregando pedido…</div>
      )}

      {!loading && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {erro}
        </div>
      )}

      {!loading && !erro && pedido && (
        <>
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-xs text-gray-400">Pedido</p>
              <h1 className="text-lg font-bold font-mono text-gray-900">#{pedido.id.slice(-8).toUpperCase()}</h1>
              <p className="text-xs text-gray-400 mt-1">{fmtData(pedido.createdAt)}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_COLOR[pedido.status] || 'bg-gray-100 text-gray-700'}`}>
              {STATUS_LABEL[pedido.status] || pedido.status}
            </span>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 mb-5">
            {pedido.itens.map(it => (
              <div key={it.id} className="flex items-center gap-3 p-4">
                <div className="w-16 h-16 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex-shrink-0">
                  {it.foto
                    ? <img src={it.foto} alt={it.nome} className="w-full h-full object-cover" />
                    : <div className="w-full h-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-clamp-2">{it.nome}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[it.cor, it.voltagem, it.tamanho].filter(Boolean).join(' · ')}
                    {[it.cor, it.voltagem, it.tamanho].filter(Boolean).length ? ' · ' : ''}
                    Qtd: {it.quantidade}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                  {formatCurrency(it.preco * it.quantidade)}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 text-sm">
            <div className="flex justify-between text-gray-600 mb-1">
              <span>Frete</span>
              <span>{pedido.frete > 0 ? formatCurrency(pedido.frete) : 'Grátis'}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100 mt-2">
              <span>Total</span>
              <span>{formatCurrency(pedido.total)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Pagamento: {pedido.formaPagamento === 'PIX' ? 'PIX' : 'Cartão'}
              {pedido.prazoEntrega ? ` · ${pedido.prazoEntrega}` : ''}
            </p>
          </div>

          {temEndereco && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 text-sm">
              <p className="font-semibold text-gray-800 mb-1">Endereço de entrega</p>
              <p className="text-gray-600">
                {pedido.rua}{pedido.numero ? `, ${pedido.numero}` : ''}{pedido.complemento ? ` - ${pedido.complemento}` : ''}
              </p>
              <p className="text-gray-600">
                {[pedido.bairro, pedido.cidade, pedido.estado].filter(Boolean).join(', ')}
                {pedido.cep ? ` - CEP ${pedido.cep}` : ''}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
