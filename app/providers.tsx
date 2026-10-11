'use client'

import { SessionProvider } from 'next-auth/react'
import { CarrinhoProvider } from '@/contexts/CarrinhoContext'
import { ReactNode } from 'react'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CarrinhoProvider>
        {children}
      </CarrinhoProvider>
    </SessionProvider>
  )
}
