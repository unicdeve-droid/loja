'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  slug:                  string
  ordem:                 string
  precoMin:              number
  precoMax:              number
  precoRangeMin:         number
  precoRangeMax:         number
  voltagemAtiva:         string
  voltagensDisponiveis:  string[]
}

export default function CategoriaClient({
  slug,
  ordem,
  precoMin,
  precoMax,
  precoRangeMin,
  precoRangeMax,
  voltagemAtiva,
  voltagensDisponiveis,
}: Props) {
  const router = useRouter()

  // ── Estado local dos filtros ───────────────────────────────────────────────
  const [min,      setMin]      = useState(precoMin)
  const [max,      setMax]      = useState(precoMax)
  const [voltagem, setVoltagem] = useState(voltagemAtiva)

  // ── Estado de abertura dos acordeões ──────────────────────────────────────
  const [openPreco,    setOpenPreco]    = useState(true)
  const [openVoltagem, setOpenVoltagem] = useState(true)

  // ── Estado do modal mobile ────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)

  // ── Aplicar filtros → atualiza URL via router.push ────────────────────────
  const aplicar = useCallback((
    novoMin?: number,
    novoMax?: number,
    novaVoltagem?: string,
  ) => {
    const p = new URLSearchParams()
    p.set('pagina', '1')
    p.set('ordem', ordem)
    const minVal = novoMin      !== undefined ? novoMin      : min
    const maxVal = novoMax      !== undefined ? novoMax      : max
    const volVal = novaVoltagem !== undefined ? novaVoltagem : voltagem

    if (minVal > precoRangeMin) p.set('preco_min', String(minVal))
    if (maxVal < precoRangeMax) p.set('preco_max', String(maxVal))
    if (volVal)                 p.set('voltagem',  volVal)

    router.push(`/categoria/${slug}?${p.toString()}`)
  }, [min, max, voltagem, ordem, precoRangeMin, precoRangeMax, slug, router])

  // ── Limpar todos os filtros ───────────────────────────────────────────────
  const limpar = () => {
    setMin(precoRangeMin)
    setMax(precoRangeMax)
    setVoltagem('')
    router.push(`/categoria/${slug}?ordem=${ordem}&pagina=1`)
  }

  const temFiltro = (
    min > precoRangeMin ||
    max < precoRangeMax ||
    voltagem !== ''
  )

  // ── Sidebar interna (reutilizada no desktop e no modal mobile) ────────────
  const sidebarContent = (
    <div>
      {/* Limpar filtros */}
      {temFiltro && (
        <button
          onClick={limpar}
          className="w-full text-left text-sm text-gazin-blue font-medium mb-3 hover:underline flex items-center gap-1"
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Limpar filtros
        </button>
      )}

      {/* ── Filtro de Preço ─────────────────────────────────────────────── */}
      <div className="sidebar-filter">
        <button
          type="button"
          className="sidebar-filter-header w-full"
          onClick={() => setOpenPreco(v => !v)}
        >
          <span>Preço</span>
          <svg
            width="12" height="8" fill="none" viewBox="0 0 12 8"
            style={{ transform: openPreco ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {openPreco && (
          <div className="sidebar-filter-body">
            {/* Inputs de preço */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="text-xs text-gazin-gray mb-1 block">Mínimo</label>
                <input
                  type="text"
                  value={`R$ ${min.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '')
                    setMin(parseFloat(raw) / 100 || precoRangeMin)
                  }}
                  onBlur={() => aplicar(min, max, voltagem)}
                  className="w-full border border-gazin-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-gazin-blue"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gazin-gray mb-1 block">Máximo</label>
                <input
                  type="text"
                  value={`R$ ${max.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '')
                    setMax(parseFloat(raw) / 100 || precoRangeMax)
                  }}
                  onBlur={() => aplicar(min, max, voltagem)}
                  className="w-full border border-gazin-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-gazin-blue"
                />
              </div>
            </div>

            {/* Slider duplo */}
            <div className="relative h-5 flex items-center">
              {/* Track */}
              <div className="absolute left-0 right-0 h-1 bg-gazin-border rounded-full" />
              {/* Fill */}
              <div
                className="absolute h-1 bg-gazin-blue rounded-full"
                style={{
                  left:  `${((min - precoRangeMin) / (precoRangeMax - precoRangeMin)) * 100}%`,
                  right: `${100 - ((max - precoRangeMin) / (precoRangeMax - precoRangeMin)) * 100}%`,
                }}
              />
              {/* Thumb Min */}
              <input
                type="range"
                min={precoRangeMin}
                max={precoRangeMax}
                step={(precoRangeMax - precoRangeMin) / 100}
                value={min}
                onChange={e => {
                  const v = parseFloat(e.target.value)
                  if (v < max) setMin(v)
                }}
                onMouseUp={() => aplicar(min, max, voltagem)}
                onTouchEnd={() => aplicar(min, max, voltagem)}
                className="absolute w-full h-1 appearance-none bg-transparent cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-3.5
                  [&::-webkit-slider-thumb]:h-3.5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-gazin-blue
                  [&::-webkit-slider-thumb]:shadow-sm"
                style={{ zIndex: min > precoRangeMax - (precoRangeMax - precoRangeMin) * 0.1 ? 5 : 3 }}
              />
              {/* Thumb Max */}
              <input
                type="range"
                min={precoRangeMin}
                max={precoRangeMax}
                step={(precoRangeMax - precoRangeMin) / 100}
                value={max}
                onChange={e => {
                  const v = parseFloat(e.target.value)
                  if (v > min) setMax(v)
                }}
                onMouseUp={() => aplicar(min, max, voltagem)}
                onTouchEnd={() => aplicar(min, max, voltagem)}
                className="absolute w-full h-1 appearance-none bg-transparent cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-3.5
                  [&::-webkit-slider-thumb]:h-3.5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-gazin-blue
                  [&::-webkit-slider-thumb]:shadow-sm"
                style={{ zIndex: 4 }}
              />
            </div>

            {/* Labels extremos */}
            <div className="flex justify-between text-xs text-gazin-gray mt-2">
              <span>{precoRangeMin.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              <span>{precoRangeMax.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>

            <button
              onClick={() => aplicar(min, max, voltagem)}
              className="mt-3 w-full bg-gazin-blue text-white text-sm font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Aplicar
            </button>
          </div>
        )}
      </div>

      {/* ── Filtro de Voltagem ──────────────────────────────────────────── */}
      {voltagensDisponiveis.length > 0 && (
        <div className="sidebar-filter">
          <button
            type="button"
            className="sidebar-filter-header w-full"
            onClick={() => setOpenVoltagem(v => !v)}
          >
            <span>Voltagem</span>
            <svg
              width="12" height="8" fill="none" viewBox="0 0 12 8"
              style={{ transform: openVoltagem ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          {openVoltagem && (
            <div className="sidebar-filter-body">
              {/* Opção "Todas" */}
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={voltagem === ''}
                  onChange={() => {
                    setVoltagem('')
                    aplicar(min, max, '')
                  }}
                />
                <span>Todas</span>
              </label>

              {voltagensDisponiveis.map(v => (
                <label key={v} className="filter-option">
                  <input
                    type="checkbox"
                    checked={voltagem === v}
                    onChange={() => {
                      const nova = voltagem === v ? '' : v
                      setVoltagem(nova)
                      aplicar(min, max, nova)
                    }}
                  />
                  <span>{v}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* ── Botão "Filtrar" mobile ─────────────────────────────────────────── */}
      <div className="block lg:hidden mb-4">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-white border border-gazin-border rounded-lg px-4 py-2.5 text-sm font-semibold text-gazin-dark shadow-sm w-full justify-center"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path d="M3 6h18M6 12h12M9 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Filtrar
          {temFiltro && (
            <span className="ml-1 bg-gazin-blue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {[min > precoRangeMin, max < precoRangeMax, voltagem !== ''].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* ── Sidebar desktop ───────────────────────────────────────────────── */}
      <div className="hidden lg:block">
        {sidebarContent}
      </div>

      {/* ── Modal de filtros mobile ───────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setModalOpen(false)}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Drawer */}
          <div
            className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header do drawer */}
            <div className="flex items-center justify-between p-4 border-b border-gazin-border">
              <h2 className="text-base font-bold text-gazin-dark">Filtros</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                aria-label="Fechar filtros"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Conteúdo do drawer */}
            <div className="p-4">
              {sidebarContent}
            </div>

            {/* Footer do drawer */}
            <div className="sticky bottom-0 bg-white border-t border-gazin-border p-4">
              <button
                onClick={() => setModalOpen(false)}
                className="w-full bg-gazin-blue text-white font-bold py-3 rounded-lg text-base hover:bg-blue-700 transition-colors"
              >
                Ver resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
