'use client'

import { useState } from 'react'
import Link from 'next/link'

function VisaIcon() {
  return (
    <svg viewBox="0 0 60 38" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',display:'block'}}>
      <rect width="60" height="38" rx="3" fill="#1A1F71"/>
      <text x="6" y="26" fontSize="16" fontWeight="bold" fill="white" fontFamily="Arial,sans-serif">VISA</text>
    </svg>
  )
}
function MasterIcon() {
  return (
    <svg viewBox="0 0 60 38" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',display:'block'}}>
      <rect width="60" height="38" rx="3" fill="#252525"/>
      <circle cx="22" cy="19" r="11" fill="#EB001B"/>
      <circle cx="38" cy="19" r="11" fill="#F79E1B"/>
      <path d="M30 10.4a11 11 0 0 1 0 17.2 11 11 0 0 1 0-17.2z" fill="#FF5F00"/>
    </svg>
  )
}
function EloIcon() {
  return (
    <svg viewBox="0 0 60 38" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',display:'block'}}>
      <rect width="60" height="38" rx="3" fill="#FFD100"/>
      <text x="8" y="26" fontSize="15" fontWeight="900" fill="#000" fontFamily="Arial,sans-serif">elo</text>
    </svg>
  )
}
function AmexIcon() {
  return (
    <svg viewBox="0 0 60 38" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',display:'block'}}>
      <rect width="60" height="38" rx="3" fill="#2E77BC"/>
      <text x="5" y="25" fontSize="11" fontWeight="bold" fill="white" fontFamily="Arial,sans-serif">AMEX</text>
    </svg>
  )
}
function BoletoIcon() {
  return (
    <svg viewBox="0 0 60 38" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%',display:'block'}}>
      <rect width="60" height="38" rx="3" fill="#fff" stroke="#ddd"/>
      <rect x="7" y="8" width="3" height="22" fill="#000"/>
      <rect x="12" y="8" width="1.5" height="22" fill="#000"/>
      <rect x="15" y="8" width="3" height="22" fill="#000"/>
      <rect x="20" y="8" width="1.5" height="22" fill="#000"/>
      <rect x="23" y="8" width="4" height="22" fill="#000"/>
      <rect x="29" y="8" width="1.5" height="22" fill="#000"/>
      <rect x="32" y="8" width="3" height="22" fill="#000"/>
      <rect x="37" y="8" width="1.5" height="22" fill="#000"/>
      <rect x="40" y="8" width="3" height="22" fill="#000"/>
      <rect x="45" y="8" width="1.5" height="22" fill="#000"/>
      <rect x="48" y="8" width="3" height="22" fill="#000"/>
    </svg>
  )
}

export default function Footer({ siteNome }: { siteNome?: string }) {
  const [email, setEmail] = useState('')
  const nome = siteNome || 'Minha Loja'

  function handleNewsletter(e: React.FormEvent) {
    e.preventDefault()
    setEmail('')
    alert('Obrigado! Você receberá nossas novidades em breve.')
  }

  return (
    <>
      <footer className="gazin-footer">
        <div className="footer-top">
          <div className="footer-atendimento">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                <path clipRule="evenodd" d="M13.6 14.2c.4.3.4.9,0,1.2l-1,.8c-.4.3-1.2.5-1.7.3 0,0-2.1-.4-4.6-2.9C3.8 11.1 3.4 9.1 3.4 9.1 3.2 8.5 3.4 7.8 3.7 7.4l.8-1c.3-.4.9-.4 1.2 0L6.9 7.9c.2.3.2.7 0 1L6.3 9.7s0 1.4 1.1 2.5c1.1 1.1 2.5 1.1 2.5 1.1l.8-.5c.3-.2.8-.2 1 0L13.6 14.2Z" fillRule="evenodd" stroke="#0D71F0" strokeLinecap="round" strokeWidth="1.5"/>
              </svg>
              <span className="text-sm font-semibold text-gazin-dark">Atendimento</span>
            </div>
            <div className="horarios">
              <span>Segunda à sexta das 08:00 h às 19:00 h</span>
              <span>Sábado das 08:00 h às 16:00 h</span>
            </div>
            {/* Newsletter */}
            <form onSubmit={handleNewsletter} className="mt-3 flex gap-2">
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Seu e-mail para novidades"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button type="submit" className="bg-blue-600 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">Cadastrar</button>
            </form>
          </div>

          <nav className="footer-nav">
            <div className="footer-nav-col">
              <h3>Institucional</h3>
              <ul>
                <li><Link href="/pagina/a-empresa">A empresa</Link></li>
                <li><Link href="/pagina/trabalhe-conosco">Trabalhe conosco</Link></li>
              </ul>
            </div>
            <div className="footer-nav-col">
              <h3>Dúvidas</h3>
              <ul>
                <li><Link href="/pagina/como-comprar">Como comprar</Link></li>
                <li><Link href="/pagina/formas-de-pagamento">Formas de pagamento</Link></li>
                <li><Link href="/minha-conta/pedidos">Acompanhar pedido</Link></li>
                <li><Link href="/pagina/troca-e-devolucao">Troca e devolução</Link></li>
                <li><Link href="/pagina/politica-de-entrega">Política de Entrega</Link></li>
                <li><Link href="/pagina/privacidade-e-seguranca">Privacidade e Segurança</Link></li>
              </ul>
            </div>
            <div className="footer-nav-col">
              <h3>Categorias</h3>
              <ul>
                <li><Link href="/categoria/celulares-e-smartphones">Celulares</Link></li>
                <li><Link href="/categoria/eletrodomesticos">Eletrodomésticos</Link></li>
                <li><Link href="/categoria/tvs-e-video">TV e Vídeo</Link></li>
                <li><Link href="/categoria/moveis">Móveis</Link></li>
                <li><Link href="/categoria/informatica">Informática</Link></li>
                <li><Link href="/categoria/infoprodutos">Infoprodutos</Link></li>
              </ul>
            </div>
            <div className="footer-nav-col">
              <h3>Redes Sociais</h3>
              <ul>
                <li><a href="#" className="flex items-center gap-2"><svg width="16" height="16" fill="#0D71F0" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>Facebook</a></li>
                <li><a href="#" className="flex items-center gap-2"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" stroke="#0D71F0" strokeWidth="1.8"/><circle cx="12" cy="12" r="4" stroke="#0D71F0" strokeWidth="1.8"/><circle cx="17.5" cy="6.5" r="1" fill="#0D71F0"/></svg>Instagram</a></li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="footer-payment">
          <div>
            <h3>Formas de Pagamento</h3>
            <div className="payment-icons">
              <div className="payment-card-icon"><VisaIcon/></div>
              <div className="payment-card-icon"><MasterIcon/></div>
              <div className="payment-card-icon"><EloIcon/></div>
              <div className="payment-card-icon"><AmexIcon/></div>
              <div className="payment-card-icon"><BoletoIcon/></div>
            </div>
          </div>
          <div className="footer-trust">
            <div className="trust-badge">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#6BB70B" strokeLinecap="round" strokeWidth="1.8"/>
                <path d="M9 12l2 2 4-4" stroke="#6BB70B" strokeLinecap="round" strokeWidth="1.8"/>
              </svg>
              <span>Site Seguro</span>
            </div>
            <div className="trust-badge">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#6BB70B" strokeLinecap="round" strokeWidth="1.8"/>
              </svg>
              <span>SSL Certificado</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {nome}. Todos os direitos reservados.</p>
          <p className="mt-1 text-xs opacity-70">Os preços e condições de pagamento são exclusivos para compras via internet.</p>
        </div>
      </footer>
    </>
  )
}
