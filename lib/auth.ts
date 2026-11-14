import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { estaBloqueado, registrarFalha, limparFalhas } from './rateLimit'

// Hash de mentira: gasta o mesmo tempo quando o e-mail não existe (evita descobrir e-mails pelo tempo de resposta)
const HASH_FALSO = '$2a$10$X3sNJc4.H7Q2vHQ/TYVabuuKVNd80ocqDabvVOyDDlqIGdlmSiELC'

function obterIp(req: any): string {
  const h = (req?.headers ?? {}) as Record<string, any>
  const xff = String(h['x-forwarded-for'] ?? '').split(',')[0].trim()
  return xff || String(h['x-real-ip'] ?? '').trim() || 'desconhecido'
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios')
        }

        // Limite de tentativas: 5 por e-mail+IP e 20 por IP, a cada 15 minutos
        const ip = obterIp(req)
        const kEmailIp = `login:${String(credentials.email).toLowerCase()}|${ip}`
        const kIp = `loginip:${ip}`
        if ((await estaBloqueado(kEmailIp, 5)) || (await estaBloqueado(kIp, 20))) {
          throw new Error('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
        }

        const usuario = await prisma.usuario.findUnique({
          where: { email: credentials.email },
        })

        if (!usuario) {
          await bcrypt.compare(credentials.password, HASH_FALSO)
          await registrarFalha(kEmailIp, kIp)
          throw new Error('Email ou senha inválidos')
        }

        const senhaCorreta = await bcrypt.compare(
          credentials.password,
          usuario.senha
        )

        if (!senhaCorreta) {
          await registrarFalha(kEmailIp, kIp)
          throw new Error('Email ou senha inválidos')
        }

        await limparFalhas(kEmailIp)

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nome,
          role: usuario.role,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
}
