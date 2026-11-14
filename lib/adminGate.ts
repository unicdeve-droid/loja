// lib/adminGate.ts
// Regra única de acesso ao painel (/sadam) e às APIs de admin (/api/admin).
// Função pura (sem Node/Prisma) para rodar no middleware (Edge) e ser testada.

export type DecisaoAdmin =
  | 'liberar'
  | 'nao-encontrado'   // finge que a página não existe (visitante comum e o antigo /admin)
  | 'proibido'         // API: 403

export function decidirAdmin(pathname: string, token: any): DecisaoAdmin | null {
  // O nome antigo do painel deixou de existir: sempre 404
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'nao-encontrado'

  const pagina = pathname === '/sadam' || pathname.startsWith('/sadam/')
  const api = pathname === '/api/admin' || pathname.startsWith('/api/admin/')
  if (!pagina && !api) return null // não é rota de admin

  if (token?.role === 'ADMIN') return 'liberar'
  return api ? 'proibido' : 'nao-encontrado'
}
