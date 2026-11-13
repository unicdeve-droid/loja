// lib/pixel.ts — Meta (Facebook) Pixel
export const PIXEL_ID = '1433853425452200'

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
  }
}

// Dispara um evento padrão do Pixel. Nunca lança erro (não pode quebrar a loja):
// se o script do Pixel ainda não carregou, tenta de novo por até ~10s.
export function pixelTrack(evento: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === 'undefined') return
  const enviar = () => {
    try {
      if (eventId) window.fbq?.('track', evento, params ?? {}, { eventID: eventId })
      else window.fbq?.('track', evento, params ?? {})
    } catch {}
  }
  if (window.fbq) { enviar(); return }
  let tentativas = 0
  const t = setInterval(() => {
    if (window.fbq) { clearInterval(t); enviar() }
    else if (++tentativas > 40) clearInterval(t)
  }, 250)
}
