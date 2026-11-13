'use client'
import { useEffect, useState } from 'react'

// Busca no servidor o desconto "Lançamentos" do carrinho atual (só para exibição).
export function usePromocaoLancamentos(itens: { id: string; quantidade: number }[]): number {
  const [desconto, setDesconto] = useState(0)
  const chave = itens.map(i => `${i.id}:${i.quantidade}`).sort().join('|')

  useEffect(() => {
    if (!chave) { setDesconto(0); return }
    let cancelado = false
    fetch('/api/promocao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens: itens.map(i => ({ id: i.id, quantidade: i.quantidade })) }),
    })
      .then(r => r.json())
      .then(d => { if (!cancelado) setDesconto(Number(d?.desconto) || 0) })
      .catch(() => { if (!cancelado) setDesconto(0) })
    return () => { cancelado = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])

  return desconto
}
