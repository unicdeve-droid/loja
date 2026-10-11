export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  PAGO:                 'Pago',
  EM_SEPARACAO:         'Em separação',
  ENVIADO:              'Enviado',
  ENTREGUE:             'Entregue',
  CANCELADO:            'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: 'bg-yellow-100 text-yellow-800',
  PAGO:                 'bg-green-100 text-green-800',
  EM_SEPARACAO:         'bg-blue-100 text-blue-800',
  ENVIADO:              'bg-purple-100 text-purple-800',
  ENTREGUE:             'bg-emerald-100 text-emerald-800',
  CANCELADO:            'bg-red-100 text-red-800',
}

interface Props {
  searchParams: { status?: string; pagina?: string }
}

const POR_PAGINA = 20

export default async function AdminPedidosPage({ searchParams }: Props) {
  const statusFiltro = searchParams.status
  const paginaAtual  = Math.max(1, parseInt(searchParams.pagina ?? '1'))

  const where: any = {}
  if (statusFiltro) where.status = statusFiltro

  const [total, pedidos] = await Promise.all([
    prisma.pedido.count({ where }),
    prisma.pedido.findMany({
      where,
      include: {
        usuario: { select: { nome: true, email: true } },
        itens:   { select: { id: true, entregaEmail: true, entregaWhatsapp: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (paginaAtual - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
  ])

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pedidos</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        <FilterLink href="/admin/pedidos"                             label="Todos"             active={!statusFiltro} />
        <FilterLink href="/admin/pedidos?status=AGUARDANDO_PAGAMENTO" label="Aguardando pgto."  active={statusFiltro === 'AGUARDANDO_PAGAMENTO'} />
        <FilterLink href="/admin/pedidos?status=PAGO"                 label="Pagos"             active={statusFiltro === 'PAGO'} />
        <FilterLink href="/admin/pedidos?status=EM_SEPARACAO"         label="Em separação"      active={statusFiltro === 'EM_SEPARACAO'} />
        <FilterLink href="/admin/pedidos?status=ENVIADO"              label="Enviados"          active={statusFiltro === 'ENVIADO'} />
        <FilterLink href="/admin/pedidos?status=ENTREGUE"             label="Entregues"         active={statusFiltro === 'ENTREGUE'} />
        <FilterLink href="/admin/pedidos?status=CANCELADO"            label="Cancelados"        active={statusFiltro === 'CANCELADO'} />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Itens</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Pagamento</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pedidos.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              )}
              {pedidos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {p.id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.usuario.nome}</p>
                    {!p.usuario.email.startsWith('guest_') && (
                      <p className="text-xs text-gray-400">{p.usuario.email}</p>
                    )}
                    <ContatoEntrega itens={p.itens} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.itens.length}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(p.total)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.formaPagamento === 'PIX' ? 'PIX' : 'Cartão'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[p.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/pedidos/${p.id}`}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>
              {total} pedidos · página {paginaAtual} de {totalPaginas}
            </span>
            <div className="flex gap-2">
              {paginaAtual > 1 && (
                <Link
                  href={`/admin/pedidos?pagina=${paginaAtual - 1}${statusFiltro ? `&status=${statusFiltro}` : ''}`}
                  className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  ← Anterior
                </Link>
              )}
              {paginaAtual < totalPaginas && (
                <Link
                  href={`/admin/pedidos?pagina=${paginaAtual + 1}${statusFiltro ? `&status=${statusFiltro}` : ''}`}
                  className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Próxima →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ContatoEntrega({ itens }: { itens: any[] }) {
  const wa = itens.find((i) => i.entregaWhatsapp)?.entregaWhatsapp
  const em = itens.find((i) => i.entregaEmail)?.entregaEmail
  if (wa) return <p className="text-xs text-green-700 font-medium mt-0.5">💬 {wa}</p>
  if (em) return <p className="text-xs text-blue-700 font-medium mt-0.5">✉️ {em}</p>
  return null
}

function FilterLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      {label}
    </Link>
  )
}
