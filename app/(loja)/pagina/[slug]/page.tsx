export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

interface Props {
  params: { slug: string }
}

const PAGINAS_ESTATICAS: Record<string, { titulo: string; conteudo: string }> = {
  'termos-de-uso': {
    titulo: 'Termos de Uso',
    conteudo: `
      <p>Ao utilizar este site, você concorda com os presentes termos de uso.</p>
      <h3>1. Aceitação dos Termos</h3>
      <p>O uso deste site está condicionado à aceitação e cumprimento destes Termos. Se você não concordar com qualquer parte dos termos, não poderá acessar o serviço.</p>
      <h3>2. Uso do Site</h3>
      <p>Você concorda em utilizar o site apenas para fins lícitos e de acordo com estes termos. Você não deve usar o site de nenhuma forma que viole quaisquer leis ou regulamentos locais, nacionais ou internacionais aplicáveis.</p>
      <h3>3. Produtos e Preços</h3>
      <p>Nos reservamos o direito de modificar ou descontinuar qualquer produto sem aviso prévio. Os preços estão sujeitos a alteração sem aviso prévio.</p>
      <h3>4. Privacidade</h3>
      <p>O uso do site é também regido pela nossa Política de Privacidade, que é incorporada a estes Termos por referência.</p>
      <h3>5. Contato</h3>
      <p>Em caso de dúvidas, entre em contato através do e-mail disponível no site.</p>
    `,
  },
  'politica-de-privacidade': {
    titulo: 'Política de Privacidade',
    conteudo: `
      <p>A sua privacidade é importante para nós. Esta política explica como coletamos e usamos suas informações.</p>
      <h3>1. Informações Coletadas</h3>
      <p>Coletamos informações que você nos fornece diretamente, como nome, endereço de e-mail, endereço de entrega e dados de pagamento ao realizar uma compra.</p>
      <h3>2. Uso das Informações</h3>
      <p>Utilizamos as informações coletadas para processar pedidos, enviar confirmações e atualizações sobre sua compra, e melhorar nossos serviços.</p>
      <h3>3. Compartilhamento de Dados</h3>
      <p>Não vendemos ou compartilhamos suas informações pessoais com terceiros, exceto quando necessário para processar pagamentos ou entregar produtos.</p>
      <h3>4. Segurança</h3>
      <p>Implementamos medidas de segurança para proteger suas informações pessoais contra acesso não autorizado.</p>
      <h3>5. Seus Direitos</h3>
      <p>Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento.</p>
    `,
  },
  'trocas-e-devolucoes': {
    titulo: 'Trocas e Devoluções',
    conteudo: `
      <p>Nosso prazo para trocas e devoluções é de 7 dias após o recebimento do produto, conforme o Código de Defesa do Consumidor.</p>
      <h3>Como solicitar</h3>
      <p>Entre em contato conosco pelo e-mail ou WhatsApp informando o número do pedido e o motivo da devolução ou troca.</p>
      <h3>Condições</h3>
      <p>O produto deve estar em perfeito estado, na embalagem original e acompanhado da nota fiscal. Produtos com danos causados pelo mau uso não são aceitos.</p>
      <h3>Prazo de reembolso</h3>
      <p>Após a confirmação da devolução, o reembolso será processado em até 10 dias úteis na forma de pagamento original.</p>
    `,
  },
  'sobre-nos': {
    titulo: 'Sobre Nós',
    conteudo: `
      <p>Somos uma loja online comprometida em oferecer os melhores produtos com preços competitivos e atendimento de qualidade.</p>
      <p>Nossa missão é proporcionar uma experiência de compra simples, segura e satisfatória para todos os nossos clientes.</p>
      <h3>Nossa história</h3>
      <p>Nascemos da vontade de levar produtos de qualidade para todo o Brasil, com preços justos e entrega garantida.</p>
      <h3>Nossos valores</h3>
      <ul>
        <li>Transparência com o cliente</li>
        <li>Qualidade nos produtos</li>
        <li>Agilidade na entrega</li>
        <li>Suporte pós-venda</li>
      </ul>
    `,
  },
  'contato': {
    titulo: 'Contato',
    conteudo: `
      <p>Entre em contato conosco pelos canais abaixo:</p>
      <h3>WhatsApp</h3>
      <p>Atendimento de segunda a sexta, das 8h às 18h.</p>
      <h3>E-mail</h3>
      <p>Respondemos em até 24 horas úteis.</p>
      <h3>Redes Sociais</h3>
      <p>Siga-nos para novidades, promoções e lançamentos.</p>
    `,
  },
}

export default async function PaginaEstaticaPage({ params }: Props) {
  const { slug } = params

  // Primeiro tenta buscar no banco de dados (SiteConfig)
  let titulo   = ''
  let conteudo = ''

  try {
    const [tituloConfig, conteudoConfig] = await Promise.all([
      prisma.siteConfig.findUnique({ where: { key: `pagina_${slug}_titulo` } }),
      prisma.siteConfig.findUnique({ where: { key: `pagina_${slug}_conteudo` } }),
    ])

    if (tituloConfig?.value) titulo   = tituloConfig.value
    if (conteudoConfig?.value) conteudo = conteudoConfig.value
  } catch {}

  // Se não encontrou no banco, usa as estáticas
  if (!titulo) {
    const estatica = PAGINAS_ESTATICAS[slug]
    if (!estatica) notFound()
    titulo   = estatica.titulo
    conteudo = estatica.conteudo
  }

  // Formata slug em título legível
  function slugToTitle(s: string) {
    return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <nav className="flex gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-gray-600">Início</Link>
          <span>/</span>
          <span className="text-gray-700">{titulo || slugToTitle(slug)}</span>
        </nav>

        <article className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {titulo || slugToTitle(slug)}
          </h1>

          <div
            className="prose prose-sm max-w-none text-gray-600 leading-relaxed
              [&_h3]:text-gray-900 [&_h3]:font-bold [&_h3]:text-base [&_h3]:mt-6 [&_h3]:mb-2
              [&_p]:mb-4
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1"
            dangerouslySetInnerHTML={{ __html: conteudo }}
          />

          <div className="mt-8 pt-6 border-t border-gray-100">
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              ← Voltar à loja
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}
