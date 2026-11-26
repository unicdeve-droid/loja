'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
}

interface Pedido {
  id: string
  status: string
  total: number
  createdAt: string
  itens: ItemPedido[]
}

function fmtData(d: string) {
  try {
    return new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function MeusPedidosPage() {
  const { status: authStatus } = useSession()
  const router = useRouter()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (authStatus === 'loading') return
    if (authStatus === 'unauthenticated') {
      router.push('/login?callbackUrl=/minha-conta/pedidos')
      return
    }
    let ativo = true
    ;(async () => {
      try {
        const r = await fetch('/api/pedidos', { cache: 'no-store' })
        if (r.status === 401) {
          router.push('/login?callbackUrl=/minha-conta/pedidos')
          return
        }
        const d = await r.json()
        if (!ativo) return
        if (!r.ok) {
          setErro(d?.erro || 'Não foi possível carregar seus pedidos.')
        } else {
          setPedidos(Array.isArray(d) ? d : [])
        }
      } catch {
        if (ativo) setErro('Não foi possível carregar seus pedidos.')
      } finally {
        if (ativo) setLoading(false)
      }
    })()
    return () => { ativo = false }
  }, [authStatus, router])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Meus pedidos</h1>

      {loading && (
        <div className="text-center text-gray-500 py-16">Carregando seus pedidos…</div>
      )}

      {!loading && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {erro}
        </div>
      )}

      {!loading && !erro && pedidos.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <p className="text-gray-500 mb-4">Você ainda não fez nenhum pedido.</p>
          <Link href="/" className="inline-block bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
            Começar a comprar
          </Link>
        </div>
      )}

      {!loading && !erro && pedidos.length > 0 && (
        <div className="flex flex-col gap-4">
          {pedidos.map(p => (
            <Link
              key={p.id}
              href={`/minha-conta/pedidos/${p.id}`}
              className="block bg-white border border-gray-200 rounded-2xl p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-400">Pedido</p>
                  <p className="text-sm font-mono font-semibold text-gray-700">#{p.id.slice(-8).toUpperCase()}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[p.status] || 'bg-gray-100 text-gray-700'}`}>
                  {STATUS_LABEL[p.status] || p.status}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                {p.itens.slice(0, 4).map(it => (
                  <div key={it.id} className="w-12 h-12 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex-shrink-0">
                    {it.foto
                      ? <img src={it.foto} alt={it.nome} className="w-full h-full object-cover" />
                      : <div className="w-full h-full" />}
                  </div>
                ))}
                {p.itens.length > 4 && (
                  <span className="text-xs text-gray-400">+{p.itens.length - 4}</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{fmtData(p.createdAt)}</span>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(p.total)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
