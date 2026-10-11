'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useCarrinho } from '@/contexts/CarrinhoContext'
import ModalCadastroLogin from '@/components/loja/ModalCadastroLogin'

interface Categoria { id: string; nome: string; slug: string }

function StoreLogo({ logoUrl, siteNome }: { logoUrl?: string; siteNome?: string }) {
  if (logoUrl) {
    return <img src={logoUrl} alt={siteNome || 'Logo'} style={{ height: 40, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 1px 2px rgba(60,40,0,0.35))' }} />
  }
  return (
    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1f3b5c', letterSpacing: '-0.5px', lineHeight: 1 }}>
      {siteNome || 'Reino Matrizes'}
    </span>
  )
}

export default function Header({ logoUrl, siteNome }: { logoUrl?: string; siteNome?: string }) {
  const router = useRouter()
  const { data: session } = useSession()
  const { totalItens } = useCarrinho()
  const [modalAuth, setModalAuth] = useState(false)
  const [busca, setBusca] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Carrega categorias do banco (dinâmico — reflete mudanças do admin)
  useEffect(() => {
    fetch('/api/categorias')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCategorias(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleBusca(e: React.FormEvent) {
    e.preventDefault()
    if (busca.trim()) router.push(`/busca?q=${encodeURIComponent(busca.trim())}`)
  }

  const NAV_ITEMS = categorias.slice(0, 9)

  return (
    <>
      {/* Sidebar overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <div className={`sidebar-menu ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-menu-header">
          <span>Categorias</span>
          <button onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <ul>
          {categorias.map(cat => (
            <li key={cat.slug}>
              <Link href={`/categoria/${cat.slug}`} className="sidebar-cat" onClick={() => setSidebarOpen(false)}>
                {cat.nome}
                <svg width="6" height="10" fill="none" viewBox="0 0 6 10">
                  <path d="M1 9L5 5L1 1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/>
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* ══ HEADER ══ */}
      <header className="gazin-header">
        <div className="header-inner">

          {/* MOBILE */}
          <div className="md:hidden w-full flex flex-col gap-2">
            <div className="flex items-center w-full gap-3">
              <button aria-label="Menu" onClick={() => setSidebarOpen(true)} className="text-white p-1 flex-shrink-0">
                <svg width="24" height="18" fill="none" viewBox="0 0 25 18">
                  <path d="M1 9H23.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/>
                  <path d="M1 1.6H23.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/>
                  <path d="M1 16.4H23.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/>
                </svg>
              </button>
              <Link href="/" className="flex-shrink-0">
                <StoreLogo logoUrl={logoUrl} siteNome={siteNome} />
              </Link>
              <div className="flex-1" />
              <div className="flex items-center gap-3">
                {/* Perfil mobile */}
                {session ? (
                  <Link href="/minha-conta" className="text-white">
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
                      <circle cx="12" cy="7" r="4" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
                    </svg>
                  </Link>
                ) : (
                  <button onClick={() => setModalAuth(true)} className="text-white">
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
                      <circle cx="12" cy="7" r="4" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
                    </svg>
                  </button>
                )}
                <Link href="/carrinho"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.85)' }}
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 22">
                    <path d="M1 1h3l1.68 8.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L21 4H6" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
                    <circle cx="9" cy="19" r="1.5" fill="white"/>
                    <circle cx="18" cy="19" r="1.5" fill="white"/>
                  </svg>
                  <span className="text-white text-sm font-bold">{totalItens}</span>
                </Link>
              </div>
            </div>
            <form onSubmit={handleBusca} className="search-bar">
              <input type="text" placeholder="O que você procura?" value={busca} onChange={e => setBusca(e.target.value)} />
              <button type="submit" className="search-btn-orange">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="2"/>
                  <path d="M21 21l-4.35-4.35" stroke="white" strokeLinecap="round" strokeWidth="2"/>
                </svg>
              </button>
            </form>
          </div>

          {/* DESKTOP */}
          <div className="hidden md:flex flex-col w-full gap-2">
            <div className="header-top">
              <p className="welcome">Olá! <strong>Seja bem-vindo!</strong></p>
              <ul>
                <li>
                  <Link href="/minha-conta/pedidos" className="flex items-center gap-1 text-white text-xs">
                    Meus pedidos
                  </Link>
                </li>
              </ul>
            </div>
            <div className="header-bottom">
              <button aria-label="Menu" onClick={() => setSidebarOpen(true)} className="text-white flex-shrink-0">
                <svg width="25" height="18" fill="none" viewBox="0 0 25 18">
                  <path d="M1 9H23.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/>
                  <path d="M1 1.6H23.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/>
                  <path d="M1 16.4H23.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/>
                </svg>
              </button>
              <Link href="/" className="flex-shrink-0">
                <StoreLogo logoUrl={logoUrl} siteNome={siteNome} />
              </Link>
              <form onSubmit={handleBusca} className="search-bar">
                <input type="text" placeholder="Buscar produtos..." value={busca} onChange={e => setBusca(e.target.value)} />
                <button type="submit" className="search-btn-orange">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="2"/>
                    <path d="M21 21l-4.35-4.35" stroke="white" strokeLinecap="round" strokeWidth="2"/>
                  </svg>
                </button>
              </form>

              {/* Perfil desktop */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => session ? setUserMenuOpen(v => !v) : setModalAuth(true)}
                  className="header-user-area"
                >
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
                    <circle cx="12" cy="7" r="4" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
                  </svg>
                  <div className="hidden xl:block text-left">
                    {session ? (
                      <><p className="text-white text-xs opacity-80">Olá,</p><p className="text-white text-xs font-semibold">{(session.user?.name || '').split(' ')[0]}</p></>
                    ) : (
                      <><p className="text-white text-xs opacity-80">Faça seu</p><p className="text-white text-xs font-semibold">Login / Cadastro</p></>
                    )}
                  </div>
                </button>
                {userMenuOpen && session && (
                  <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-48 z-50 overflow-hidden">
                    <Link href="/minha-conta" onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 border-b border-gray-100">Minha conta</Link>
                    <Link href="/minha-conta/pedidos" onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 border-b border-gray-100">Meus pedidos</Link>
                    <button onClick={() => { signOut({ callbackUrl: '/' }); setUserMenuOpen(false) }}
                      className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50">Sair</button>
                  </div>
                )}
              </div>

              {/* Carrinho desktop */}
              <Link href="/carrinho" className="header-cart relative">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
                  <path d="M3 6h18" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
                  <path d="M16 10a4 4 0 0 1-8 0" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
                </svg>
                <div className="hidden xl:block text-left">
                  <p className="text-white text-xs opacity-80">Meu</p>
                  <p className="text-white text-xs font-semibold">Carrinho</p>
                </div>
                {totalItens > 0 && <span className="cart-count">{totalItens}</span>}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Nav categorias desktop — dinâmico */}
      <nav className="gazin-nav hidden md:block">
        <div className="gazin-nav-inner">
          <div className="gazin-nav-item categorias-btn relative group">
            <svg width="14" height="14" fill="none" viewBox="0 0 25 18">
              <path d="M1 9H23.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"/>
              <path d="M1 1.6H23.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"/>
              <path d="M1 16.4H23.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"/>
            </svg>
            Todas categorias
            <ul className="mega-menu group-hover:!block">
              {categorias.map(cat => (
                <li key={cat.slug}>
                  <Link href={`/categoria/${cat.slug}`}>
                    {cat.nome}
                    <svg width="6" height="10" fill="none" viewBox="0 0 6 10">
                      <path d="M1 9L5 5L1 1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/>
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {NAV_ITEMS.map(cat => (
            <Link key={cat.slug} href={`/categoria/${cat.slug}`} className="gazin-nav-item">
              {cat.nome}
            </Link>
          ))}
        </div>
      </nav>

      <ModalCadastroLogin open={modalAuth} onClose={() => setModalAuth(false)} abaInicial="cadastro" />
    </>
  )
}
