'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useCarrinho } from '@/contexts/CarrinhoContext'
import ToastCarrinho from './ToastCarrinho'

interface Props {
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

function estrelas(media: number) {
  return Array.from({ length: 5 }, (_, i) => {
    const fill = i < Math.floor(media) ? 'full' : i < media ? 'half' : 'empty'
    return fill
  })
}

export default function ProductCard({
  id, slug, nome, variante, precoOriginal, preco,
  avaliacoes, mediaAvaliacoes, imagem, desconto, tipo,
}: Props) {
  const { adicionarItem } = useCarrinho()
  const [added, setAdded] = useState(false)
  const [toast, setToast] = useState(false)

  const descontoCalc = desconto ?? (precoOriginal ? Math.round((1 - preco / precoOriginal) * 100) : 0)

  function handleComprar(e: React.MouseEvent) {
    e.preventDefault()
    adicionarItem({ id, slug, nome, preco, precoOriginal: precoOriginal ?? preco, imagem: imagem ?? '/images/placeholder.jpg', quantidade: 1, ...(tipo === 'DIGITAL' ? { tipo: 'DIGITAL' as const } : {}) })
    setAdded(true)
    setToast(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <>
    <Link href={`/produto/${slug}`} className="product-card">
      <div className="product-card-img">
        <Image
          src={imagem ?? '/images/placeholder.jpg'}
          alt={nome}
          fill
          sizes="(max-width: 768px) 50vw, 220px"
          className="object-contain p-2 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.jpg' }}
        />
        {descontoCalc > 0 && (
          <span className="product-card-badge">-{descontoCalc}%</span>
        )}
      </div>

      <div className="product-card-body">
        <span className="product-card-name">{nome}</span>
        {variante && <span className="product-card-variant">{variante}</span>}

        {avaliacoes !== undefined && avaliacoes > 0 && (
          <div className="product-card-stars">
            {estrelas(mediaAvaliacoes ?? 4).map((type, i) => (
              <svg key={i} viewBox="0 0 24 24" className="w-3 h-3">
                <path
                  d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                  fill={type === 'empty' ? 'none' : '#FF9D2E'}
                  stroke="#FF9D2E"
                  strokeWidth="0.5"
                />
              </svg>
            ))}
            <span>({avaliacoes})</span>
          </div>
        )}

        <div className="product-card-prices">
          {precoOriginal && descontoCalc > 0 && (
            <div className="flex items-center gap-1">
              <span className="product-card-original-price">
                {precoOriginal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <span className="product-card-discount">-{descontoCalc}%</span>
            </div>
          )}
          <div>
            <span className="product-card-pix-price">
              {preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>

        <button className="product-card-buy-btn" onClick={handleComprar}>
          {added ? (
            <>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" stroke="white" strokeLinecap="round" strokeWidth="2.5"/>
              </svg>
              Adicionado!
            </>
          ) : (
            <>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
                <path d="M3 6h18" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
                <path d="M16 10a4 4 0 0 1-8 0" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
              </svg>
              Comprar
            </>
          )}
        </button>
      </div>
    </Link>

    <ToastCarrinho
      open={toast}
      onClose={() => setToast(false)}
      produto={{ nome, imagem: imagem ?? '/images/placeholder.jpg', preco }}
    />
    </>
  )
}
