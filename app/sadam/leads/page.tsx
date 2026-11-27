'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'

interface Lead {
  id: string
  nome: string | null
  email: string | null
  whatsapp: string | null
  cep: string | null
  rua: string | null
  numero: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  valor: number | null
  itensResumo: string | null
  origem: string
  createdAt: string
}

function fmtData(d: string) {
  try {
    return new Date(d).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    })
  } catch { return '' }
}
function fmtBRL(v: number | null) {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function soDigitos(v: string | null) {
  return (v || '').replace(/\D/g, '')
}

export default function AdminLeadsPage() {
  const [leads,        setLeads]        = useState<Lead[]>([])
  const [total,        setTotal]        = useState(0)
  const [pagina,       setPagina]       = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [loading,      setLoading]      = useState(true)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/leads?pagina=${pagina}`)
      const data = await res.json()
      setLeads(data.leads ?? [])
      setTotal(data.total ?? 0)
      setTotalPaginas(data.totalPaginas ?? 1)
    } finally {
      setLoading(false)
    }
  }, [pagina])

  useEffect(() => { carregar() }, [carregar])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} contato{total !== 1 ? 's' : ''} que preencheu{total !== 1 ? 'ram' : ''} o checkout — use para remarketing
          </p>
        </div>
        <button
          onClick={carregar}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Atualizar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Quando</th>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Contato</th>
              <th className="px-4 py-3 font-medium">Cidade/UF</th>
              <th className="px-4 py-3 font-medium">Carrinho</th>
              <th className="px-4 py-3 font-medium">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Carregando…</td></tr>
            )}
            {!loading && leads.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Nenhum lead ainda.</td></tr>
            )}
            {!loading && leads.map(l => (
              <tr key={l.id} className="hover:bg-gray-50 align-top">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtData(l.createdAt)}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{l.nome || '—'}</td>
                <td className="px-4 py-3 text-gray-600">
                  {l.whatsapp && <div>📱 {l.whatsapp}</div>}
                  {l.email && <div className="text-xs text-gray-500">✉️ {l.email}</div>}
                  {!l.whatsapp && !l.email && '—'}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {l.cidade ? `${l.cidade}${l.estado ? '/' + l.estado : ''}` : '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {l.itensResumo || '—'}
                  {l.valor != null && <div className="text-xs text-gray-400">{fmtBRL(l.valor)}</div>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {soDigitos(l.whatsapp).length >= 10 ? (
                    <a
                      href={`https://wa.me/55${soDigitos(l.whatsapp)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-block bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700"
                    >
                      WhatsApp
                    </a>
                  ) : l.email ? (
                    <a
                      href={`mailto:${l.email}`}
                      className="inline-block bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700"
                    >
                      E-mail
                    </a>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina <= 1}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-500">{pagina} / {totalPaginas}</span>
          <button
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina >= totalPaginas}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  )
}
