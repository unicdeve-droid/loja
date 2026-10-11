'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Props {
  open: boolean
  onClose: () => void
  produto?: {
    nome: string
    imagem: string
    preco: number
  }
}

export default function ToastCarrinho({ open, onClose, produto }: Props) {
  const router = useRouter()

  // Fecha automaticamente após 6 segundos
  useEffect(() => {
    if (!open) return
    const t = setTimeout(onClose, 6000)
    return () => clearTimeout(t)
  }, [open, onClose])

  if (!open || !produto) return null

  return (
    <div className="fixed bottom-6 right-4 left-4 md:left-auto md:w-[360px] z-[998] animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header verde */}
        <div className="bg-green-500 px-4 py-2.5 flex items-center gap-2">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-white text-sm font-semibold">Produto adicionado ao carrinho!</span>
          <button onClick={onClose} className="ml-auto text-white/80 hover:text-white">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Produto */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
            <Image
              src={produto.imagem || '/images/placeholder.jpg'}
              alt={produto.nome}
              fill
              className="object-contain p-1"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 line-clamp-2">{produto.nome}</p>
            <p className="text-sm font-bold text-blue-600 mt-0.5">
              {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-2 px-4 py-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Continuar comprando
          </button>
          <button
            onClick={() => { onClose(); router.push('/checkout') }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            Finalizar compra
          </button>
        </div>
      </div>
    </div>
  )
}
