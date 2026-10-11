import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const role = req.nextauth.token?.role
    const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
    if (isAdminRoute && role !== 'ADMIN') {
      if (pathname.startsWith('/api/'))
        return NextResponse.json({ erro: 'Acesso restrito a administradores.' }, { status: 403 })
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl
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
    '/admin/:path*',
    '/minha-conta/:path*',
    // checkout REMOVIDO — gerenciado internamente pela página
    '/api/admin/:path*',
    '/api/pedidos/:path*',
    '/api/pagamento/:path*',
    '/api/usuario/:path*',
  ],
}
