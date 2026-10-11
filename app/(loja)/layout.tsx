import { prisma } from '@/lib/prisma'
import Header from '@/components/loja/Header'
import Footer from '@/components/loja/Footer'

export const dynamic = 'force-dynamic'

async function getSiteConfig() {
  try {
    const [logoRow, nomeRow] = await Promise.all([
      prisma.siteConfig.findUnique({ where: { key: 'logo_url' } }),
      prisma.siteConfig.findUnique({ where: { key: 'site_nome' } }),
    ])
    return {
      logoUrl:  logoRow?.value  || undefined,
      siteNome: nomeRow?.value  || 'Minha Loja',
    }
  } catch {
    return { logoUrl: undefined, siteNome: 'Minha Loja' }
  }
}

export async function generateMetadata() {
  const { siteNome } = await getSiteConfig()
  return {
    title: {
      default:  `${siteNome} - Sua Loja Online`,
      template: `%s | ${siteNome}`,
    },
    description: `Compre online com segurança em ${siteNome}. Entrega para todo o Brasil.`,
  }
}

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  const { logoUrl, siteNome } = await getSiteConfig()
  return (
    <div className="flex flex-col min-h-screen">
      <Header logoUrl={logoUrl} siteNome={siteNome} />
      <main className="flex-1 bg-gazin-bg">
        {children}
      </main>
      <Footer siteNome={siteNome} />
    </div>
  )
}
