import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const [
    totalProdutos,
    totalCategorias,
    totalPedidos,
    pedidosHoje,
    receitaTotal,
    pedidosPorStatus,
    ultimosPedidos,
  ] = await Promise.all([
    prisma.produto.count(),
    prisma.categoria.count(),
    prisma.pedido.count(),
    prisma.pedido.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.pedido.aggregate({ _sum: { total: true } }),
    prisma.pedido.groupBy({ by: ['status'], _count: true }),
    prisma.pedido.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { usuario: { select: { nome: true } } },
    }),
  ])

  return {
    totalProdutos,
    totalCategorias,
    totalPedidos,
    pedidosHoje,
    receitaTotal: receitaTotal._sum.total ?? 0,
    pedidosPorStatus,
    ultimosPedidos,
  }
}

const STATUS_LABEL: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: 'Aguardando pgto.',
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

export default async function AdminDashboardPage() {
  const d = await getDashboardData()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        <StatCard icon="💰" label="Receita total" value={formatCurrency(d.receitaTotal)} />
        <StatCard icon="📦" label="Total de pedidos" value={String(d.totalPedidos)} />
        <StatCard icon="🛍️" label="Pedidos hoje" value={String(d.pedidosHoje)} />
        <StatCard icon="📁" label="Produtos cadastrados" value={String(d.totalProdutos)} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Pedidos por status */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Pedidos por status</h2>
          <ul className="space-y-2">
            {d.pedidosPorStatus.map((s) => (
              <li key={s.status} className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[s.status] ?? 'bg-gray-100 text-gray-700'}`}>
                  {STATUS_LABEL[s.status] ?? s.status}
                </span>
                <span className="text-sm font-semibold text-gray-900">{s._count}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Últimos pedidos */}
        <section className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Últimos pedidos</h2>
            <Link href="/admin/pedidos" className="text-sm text-blue-600 hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">ID</th>
                  <th className="pb-2 font-medium">Cliente</th>
                  <th className="pb-2 font-medium">Total</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {d.ultimosPedidos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5">
                      <Link href={`/admin/pedidos/${p.id}`} className="text-blue-600 hover:underline font-mono text-xs">
                        {p.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="py-2.5 text-gray-700">{p.usuario.nome}</td>
                    <td className="py-2.5 font-medium">{formatCurrency(p.total)}</td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[p.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Atalhos */}
      <section className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Atalhos rápidos</h2>
        <div className="flex flex-wrap gap-3">
          <QuickLink href="/admin/produtos/novo" label="+ Novo produto" />
          <QuickLink href="/admin/categorias"    label="Gerenciar categorias" />
          <QuickLink href="/admin/config"        label="Configurações do site" />
          <QuickLink href="/admin/avaliacoes"    label="Moderar avaliações" />
        </div>
      </section>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
    >
      {label}
    </Link>
  )
}
