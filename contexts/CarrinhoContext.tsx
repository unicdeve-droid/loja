'use client'

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'

export interface ItemCarrinho {
  id: string
  slug: string
  nome: string
  preco: number
  precoOriginal: number
  imagem: string
  quantidade: number
  varianteCor?: string
  varianteVoltagem?: string
  varianteFormato?: string
  varianteTamanho?: string
  tipo?: 'FISICO' | 'DIGITAL'
  entregaEmail?: string
  entregaWhatsapp?: string
}

interface CarrinhoState {
  itens: ItemCarrinho[]
  cepFrete?: string
  freteOpcaoSelecionada?: string
  freteSelecionadoValor?: number
  cupom?: string
  descontoCupom?: number
}

type Action =
  | { type: 'ADICIONAR'; item: Omit<ItemCarrinho, 'quantidade'> & { quantidade?: number } }
  | { type: 'REMOVER'; id: string }
  | { type: 'ATUALIZAR_QTD'; id: string; quantidade: number }
  | { type: 'LIMPAR' }
  | { type: 'SET_FRETE'; cep: string; opcao: string; valor: number }
  | { type: 'SET_CUPOM'; cupom: string; desconto: number }
  | { type: 'SET_ENTREGA_DIGITAL'; id: string; email?: string; whatsapp?: string }
  | { type: 'HYDRATE'; state: CarrinhoState }

function reducer(state: CarrinhoState, action: Action): CarrinhoState {
  switch (action.type) {
    case 'ADICIONAR': {
      const existe = state.itens.find(i => i.id === action.item.id)
      if (existe) {
        return {
          ...state,
          itens: state.itens.map(i =>
            i.id === action.item.id
              ? {
                  ...i,
                  quantidade: action.item.tipo === 'FISICO'
                    ? i.quantidade + (action.item.quantidade ?? 1)
                    : i.quantidade,
                  tipo: action.item.tipo ?? i.tipo,
                  varianteFormato: action.item.varianteFormato ?? i.varianteFormato,
                  varianteTamanho: action.item.varianteTamanho ?? i.varianteTamanho,
                }
              : i
          ),
        }
      }
      return {
        ...state,
        itens: [...state.itens, { ...action.item, quantidade: action.item.quantidade ?? 1 }],
      }
    }
    case 'REMOVER':
      return { ...state, itens: state.itens.filter(i => i.id !== action.id) }
    case 'ATUALIZAR_QTD':
      if (action.quantidade <= 0) {
        return { ...state, itens: state.itens.filter(i => i.id !== action.id) }
      }
      return {
        ...state,
        itens: state.itens.map(i =>
          i.id === action.id ? { ...i, quantidade: action.quantidade } : i
        ),
      }
    case 'SET_ENTREGA_DIGITAL':
      return {
        ...state,
        itens: state.itens.map(i =>
          i.id === action.id
            ? { ...i, entregaEmail: action.email, entregaWhatsapp: action.whatsapp }
            : i
        ),
      }
    case 'LIMPAR':
      return { itens: [] }
    case 'SET_FRETE':
      return {
        ...state,
        cepFrete:              action.cep,
        freteOpcaoSelecionada: action.opcao,
        freteSelecionadoValor: action.valor,
      }
    case 'SET_CUPOM':
      return { ...state, cupom: action.cupom, descontoCupom: action.desconto }
    case 'HYDRATE':
      return action.state
    default:
      return state
  }
}

interface CarrinhoContextType {
  itens: ItemCarrinho[]
  totalItens: number
  subtotal: number
  frete: number
  total: number
  adicionarItem: (item: Omit<ItemCarrinho, 'quantidade'> & { quantidade?: number }) => void
  removerItem: (id: string) => void
  atualizarQuantidade: (id: string, quantidade: number) => void
  limparCarrinho: () => void
  setFrete: (cep: string, opcao: string, valor: number) => void
  setCupom: (cupom: string, desconto: number) => void
  setEntregaDigital: (id: string, email?: string, whatsapp?: string) => void
  temDigital: boolean
  temFisico: boolean
  todoDigital: boolean
}

const CarrinhoContext = createContext<CarrinhoContextType | null>(null)

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { itens: [] })

  // Hidrata do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('carrinho')
      if (saved) dispatch({ type: 'HYDRATE', state: JSON.parse(saved) })
    } catch {}
  }, [])

  // Persiste no localStorage
  useEffect(() => {
    try { localStorage.setItem('carrinho', JSON.stringify(state)) } catch {}
  }, [state])

  const totalItens = state.itens.reduce((acc, i) => acc + i.quantidade, 0)
  const subtotal   = state.itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0)
  const frete      = state.freteSelecionadoValor ?? 0
  const desconto   = state.descontoCupom ?? 0
  const total      = subtotal + frete - desconto
  const temDigital = state.itens.some(i => i.tipo !== 'FISICO')
  const temFisico  = state.itens.some(i => i.tipo === 'FISICO')
  const todoDigital = temDigital && !temFisico

  return (
    <CarrinhoContext.Provider value={{
      itens: state.itens,
      totalItens, subtotal, frete, total,
      temDigital, temFisico, todoDigital,
      adicionarItem:  (item) => dispatch({ type: 'ADICIONAR', item }),
      removerItem:    (id)   => dispatch({ type: 'REMOVER', id }),
      atualizarQuantidade: (id, quantidade) => dispatch({ type: 'ATUALIZAR_QTD', id, quantidade }),
      limparCarrinho: () => dispatch({ type: 'LIMPAR' }),
      setFrete: (cep, opcao, valor) => dispatch({ type: 'SET_FRETE', cep, opcao, valor }),
      setCupom: (cupom, desconto) => dispatch({ type: 'SET_CUPOM', cupom, desconto }),
      setEntregaDigital: (id, email, whatsapp) => dispatch({ type: 'SET_ENTREGA_DIGITAL', id, email, whatsapp }),
    }}>
      {children}
    </CarrinhoContext.Provider>
  )
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext)
  if (!ctx) throw new Error('useCarrinho must be used within CarrinhoProvider')
  return ctx
}
