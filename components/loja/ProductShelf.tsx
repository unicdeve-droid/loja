'use client'
import { useEffect, useId } from 'react'
import Link from 'next/link'
import ProductCard from './ProductCard'

interface Produto {
  id: string
  slug: string
  nome: string
  variante?: string
  precoOriginal?: number
  preco: number
  avaliacoes?: number
  mediaAvaliacoes?: number
  imagem?: string
  desconto?: number
  tipo?: string
}

interface Props {
  titulo: string
  subtitulo?: string
  linkVerMais?: string
  produtos: Produto[]
  /** Se true, no mobile vira scroll horizontal em vez de grade 2x3 */
  scrollHorizontal?: boolean
}

export default function ProductShelf({ titulo, subtitulo, linkVerMais, produtos, scrollHorizontal }: Props) {
  const uid = useId().replace(/:/g, '')

  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).Swiper) return
    new (window as any).Swiper(`.shelf-swiper-${uid}`, {
      slidesPerView: 2,
      spaceBetween: 12,
      navigation: {
        nextEl: `.shelf-next-${uid}`,
        prevEl: `.shelf-prev-${uid}`,
      },
      breakpoints: {
        640:  { slidesPerView: 3, spaceBetween: 12 },
        768:  { slidesPerView: 4, spaceBetween: 12 },
        1024: { slidesPerView: 5, spaceBetween: 16 },
        1280: { slidesPerView: 6, spaceBetween: 16 },
      },
    })
  }, [uid])

  if (!produtos.length) return null

  return (
    <section className="product-shelf">
      <div className="shelf-header">
        <div>
          <h2 className="shelf-title">{titulo}</h2>
          {subtitulo && (
            <p className="shelf-subtitle">{subtitulo}</p>
          )}
        </div>
        {linkVerMais && (
          <Link href={linkVerMais} className="shelf-link">
            Confira mais
            <svg width="6" height="10" fill="none" viewBox="0 0 6 10">
              <path d="M1 9L5 5L1 1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/>
            </svg>
          </Link>
        )}
      </div>

      {/* Desktop: Swiper */}
      <div className="relative hidden md:block">
        <div className={`swiper shelf-swiper-${uid}`}>
          <div className="swiper-wrapper">
            {produtos.map(p => (
              <div key={p.id} className="swiper-slide">
                <ProductCard {...p} />
              </div>
            ))}
          </div>
        </div>
        <button className={`shelf-prev-${uid} absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white border rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow`}>
          <svg width="8" height="14" fill="none" viewBox="0 0 8 14">
            <path d="M7 1L1 7l6 6" stroke="#363843" strokeLinecap="round" strokeWidth="2"/>
          </svg>
        </button>
        <button className={`shelf-next-${uid} absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white border rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow`}>
          <svg width="8" height="14" fill="none" viewBox="0 0 8 14">
            <path d="M1 13L7 7 1 1" stroke="#363843" strokeLinecap="round" strokeWidth="2"/>
          </svg>
        </button>
      </div>

      {/* Mobile: scroll horizontal ou grade */}
      {scrollHorizontal ? (
        /* ── Scroll horizontal (desliza o dedo) ── */
        <div className="md:hidden shelf-mobile-scroll">
          {produtos.map(p => (
            <div key={p.id} className="shelf-mobile-scroll-item">
              <ProductCard {...p} />
            </div>
          ))}
        </div>
      ) : (
        /* ── Grade 2 colunas (padrão) ── */
        <>
          <div className="md:hidden grid grid-cols-2 gap-3">
            {produtos.slice(0, 6).map(p => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
          {linkVerMais && produtos.length > 6 && (
            <div className="md:hidden mt-3 text-center">
              <Link href={linkVerMais} className="text-blue-600 text-sm font-medium">
                Ver todos →
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  )
}
