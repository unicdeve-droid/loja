import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { decidirAdmin } from '@/lib/adminGate'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const decisao = decidirAdmin(pathname, req.nextauth.token)
    switch (decisao) {
      case 'nao-encontrado':
        // visitante comum: o painel "não existe"
        return NextResponse.rewrite(new URL('/nao-encontrado', req.url))
      case 'proibido':
        return NextResponse.json({ erro: 'Acesso restrito a administradores.' }, { status: 403 })
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl
        // /sadam e /api/admin: a decisão (inclusive 404/403) é tomada na função acima
        if (decidirAdmin(pathname, token) !== null) return true
        const publicPaths = [
          '/api/produtos', '/api/categorias', '/api/frete',
          '/api/cep', '/api/config', '/api/webhook', '/api/auth',
          '/login', '/cadastro',
          '/api/pedidos/digital',   // pedidos de infoprodutos sem login
          '/api/pagamento/pix',    // PIX sempre público
          '/api/pagamento/cartao', // cartão sempre público
        ]
        if (publicPaths.some(p => pathname.startsWith(p))) return true
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/sadam/:path*',
    '/admin/:path*', // nome antigo: sempre 404
    '/minha-conta/:path*',
    // checkout REMOVIDO — gerenciado internamente pela página
    '/api/admin/:path*',
    '/api/pedidos/:path*',
    '/api/pagamento/:path*',
    '/api/usuario/:path*',
  ],
}
