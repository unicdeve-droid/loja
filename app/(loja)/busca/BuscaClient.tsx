'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Props {
  initialQuery: string
  initialOrdem?: string
  total?: number
}

export default function BuscaClient({ initialQuery, initialOrdem = 'populares', total }: Props) {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/busca?q=${encodeURIComponent(query.trim())}`)
    }
  }

  function handleOrdem(e: React.ChangeEvent<HTMLSelectElement>) {
    const q = searchParams.get('q') || initialQuery
    router.push(`/busca?q=${encodeURIComponent(q)}&ordem=${e.target.value}`)
  }

  const opcoes = [
    { value: 'populares',   label: 'Mais relevantes' },
    { value: 'menor_preco', label: 'Menor preço'     },
    { value: 'maior_preco', label: 'Maior preço'     },
    { value: 'novidades',   label: 'Novidades'       },
  ]

  return (
    <div className="mb-8">
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busque por produto, marca, modelo…"
          autoFocus
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          🔍 Buscar
        </button>
      </form>

      {/* Ordenação — renderizada no cliente para evitar erro de evento em server component */}
      {total !== undefined && total > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{total} resultado{total !== 1 ? 's' : ''}</span>
          <select
            value={initialOrdem}
            onChange={handleOrdem}
            className="ml-auto border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {opcoes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}
    </div>
  )
}
