'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Barra de busca exibida FORA do header, só no celular (na home e na página do produto).
// No desktop ela fica escondida (o desktop continua com a busca dentro do header).
export default function BuscaMobile() {
  const router = useRouter()
  const [busca, setBusca] = useState('')

  function handleBusca(e: React.FormEvent) {
    e.preventDefault()
    if (busca.trim()) router.push(`/busca?q=${encodeURIComponent(busca.trim())}`)
  }

  return (
    <div className="busca-mobile">
      <form onSubmit={handleBusca} className="search-bar">
        <input
          type="text"
          placeholder="O que você procura?"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <button type="submit" className="search-btn-orange" aria-label="Buscar">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="white" strokeLinecap="round" strokeWidth="2"/>
          </svg>
        </button>
      </form>
    </div>
  )
}
