'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

interface BannerObj {
  id: string
  titulo: string
  imagem: string
  link: string
}

type Banner = BannerObj | string

interface Props {
  banners: Banner[]
}

function getUrl(b: Banner): string {
  return typeof b === 'string' ? b : b.imagem
}

function getLink(b: Banner): string {
  return typeof b === 'string' ? '/' : (b as BannerObj).link || '/'
}

function getAlt(b: Banner, idx: number): string {
  return typeof b === 'string' ? `Banner ${idx + 1}` : (b as BannerObj).titulo
}

export default function BannerCarousel({ banners }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  function goTo(idx: number) {
    const track = containerRef.current?.querySelector<HTMLElement>('.banner-track')
    if (!track) return
    track.style.transform = `translateX(-${idx * 100}%)`
    setCurrent(idx)
  }

  function startAutoplay() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent(prev => {
        const next = (prev + 1) % banners.length
        const track = containerRef.current?.querySelector<HTMLElement>('.banner-track')
        if (track) track.style.transform = `translateX(-${next * 100}%)`
        return next
      })
    }, 5000)
  }

  useEffect(() => {
    if (!banners.length) return
    startAutoplay()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [banners])

  // Suporte a swipe no mobile
  const touchStartX = useRef(0)
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) < 40) return
    if (timerRef.current) clearInterval(timerRef.current)
    if (diff > 0) {
      const next = (current + 1) % banners.length
      goTo(next)
    } else {
      const prev = (current - 1 + banners.length) % banners.length
      goTo(prev)
    }
    startAutoplay()
  }

  function handleDot(idx: number) {
    if (timerRef.current) clearInterval(timerRef.current)
    goTo(idx)
    startAutoplay()
  }

  if (!banners.length) {
    return (
      <div
        className="w-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center"
        style={{ height: 'clamp(180px, 28vw, 530px)' }}
      >
        <div className="text-center text-white opacity-50">
          <p className="text-lg font-semibold">Configure banners no painel admin</p>
          <p className="text-sm mt-1">Admin → Configurações → Banners</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="banner-3d-wrapper"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Track */}
      <div
        className="banner-track flex h-full transition-transform duration-500 ease-in-out"
        style={{ transform: 'translateX(0)' }}
      >
        {banners.map((b, idx) => (
          <a
            key={idx}
            href={getLink(b)}
            className="banner-slide relative shrink-0 w-full h-full block"
          >
            <Image
              src={getUrl(b)}
              alt={getAlt(b, idx)}
              fill
              priority={idx === 0}
              sizes="100vw"
              className="object-cover"
            />
          </a>
        ))}
      </div>

      {/* Dots — sem setas */}
      {banners.length > 1 && (
        <div className="banner-dots-wrapper">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDot(idx)}
              className={`banner-dot-3d ${idx === current ? 'active' : ''}`}
              aria-label={`Banner ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
