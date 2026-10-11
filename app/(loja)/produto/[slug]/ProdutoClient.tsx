'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCarrinho } from '@/contexts/CarrinhoContext'
import ProductShelf from '@/components/loja/ProductShelf'
import ModalCadastroLogin from '@/components/loja/ModalCadastroLogin'

interface Variacao { id: string; tipo: string; valor: string; ativo: boolean }
interface Avaliacao {
  id: string; estrelas: number; comentario?: string
  nomeCliente: string; cidade?: string; data: string
}
interface Produto {
  id: string; nome: string; slug: string; codigo?: string
  tipo?: string // 'DIGITAL' | 'FISICO' — precisa vir do page.tsx
  descricao: string; fichaTecnica?: Record<string, string>
  precoOriginal?: number; preco: number
  mediaEstrelas: number; totalAvaliacoes: number
  temCor: boolean; temVoltagem: boolean; temTamanho: boolean
  fotos: string[]; variacoes: Variacao[]; avaliacoes: Avaliacao[]
  categoria: { nome: string; slug: string }
}

// Tamanhos exibidos nos produtos digitais quando o banco não tem variações de dimensão
const TAMANHOS_DIGITAL_PADRAO = ['10x10', '15x15', '20x20', '25x25', '30x30']
const FORMATOS_DIGITAL_PADRAO = ['PES', 'DEF', 'PDF']

function ehDimensao(valor: string) {
  return /^\d+\s*x\s*\d+$/i.test(valor.trim())
}

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function desconto(orig: number, preco: number) {
  return Math.round(((orig - preco) / orig) * 100)
}

function Estrelas({ media, total }: { media: number; total: number }) {
  return (
    <div className="produto-stars">
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} viewBox="0 0 24 24" width={16} height={16}
          fill={n <= Math.round(media) ? '#F6C90E' : 'none'}
          stroke="#F6C90E" strokeWidth={1}>
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
      {total > 0 && (
        <button
          className="produto-stars-count"
          onClick={() => document.querySelector('.tabs-nav')?.scrollIntoView({ behavior: 'smooth' })}
        >
          ({total} {total > 1 ? 'avaliações' : 'avaliação'})
        </button>
      )}
    </div>
  )
}

// Extrai primeiros ~2 parágrafos do HTML de descrição para exibir como prévia
function extrairDescricaoCurta(html: string): string {
  const semTags = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return semTags.length > 220 ? semTags.slice(0, 220) + '…' : semTags
}

export default function ProdutoClient({ produto, relacionados }: { produto: Produto; relacionados: Produto[] }) {
  const router = useRouter()
  const { data: session } = useSession()
  const { adicionarItem } = useCarrinho()

  const ehDigital = produto.tipo === 'DIGITAL'

  // Produto digital: "Formato" (PES, DEF, PDF) e "Tamanho" (10x10, 15x15...)
  // Aceita tanto tipo 'formato' quanto os antigos tipo 'tamanho' que não são dimensões (PES/DEF/PDF)
  const formatosDigitalDB = produto.variacoes.filter(
    v => v.tipo === 'formato' || (v.tipo === 'tamanho' && !ehDimensao(v.valor))
  )
  const formatosDigital: Variacao[] = formatosDigitalDB.length > 0
    ? formatosDigitalDB
    : FORMATOS_DIGITAL_PADRAO.map(valor => ({ id: `fmt-${valor}`, tipo: 'formato', valor, ativo: true }))
  const tamanhosDigitalDB = produto.variacoes.filter(v => v.tipo === 'tamanho' && ehDimensao(v.valor))
  const tamanhosDigital: Variacao[] = tamanhosDigitalDB.length > 0
    ? tamanhosDigitalDB
    : TAMANHOS_DIGITAL_PADRAO.map(valor => ({ id: `tam-${valor}`, tipo: 'tamanho', valor, ativo: true }))

  const [modalAuth, setModalAuth] = useState(false)
  const [imgAtiva, setImgAtiva]   = useState(0)
  const [corSelecionada,        setCorSelecionada]        = useState<string | undefined>(
    produto.variacoes.find(v => v.tipo === 'cor' && v.ativo)?.valor
  )
  const [voltagemSelecionada,   setVoltagemSelecionada]   = useState<string | undefined>(
    produto.variacoes.find(v => v.tipo === 'voltagem' && v.ativo)?.valor
  )
  const [tamanhoSelecionado,    setTamanhoSelecionado]    = useState<string | undefined>(
    produto.variacoes.find(v => v.tipo === 'tamanho' && v.ativo)?.valor
  )
  const [formatoDigitalSel, setFormatoDigitalSel] = useState<string>('PES')
  const [tamanhoDigitalSel, setTamanhoDigitalSel] = useState<string>('10x10')
  const [quantidade,    setQuantidade]    = useState(1)
  const [cep,           setCep]           = useState('')
  const [freteLoading,  setFreteLoading]  = useState(false)
  const [freteResultado,setFreteResultado]= useState<{ opcao: string; prazo: string; valor: number }[] | null>(null)
  const [freteErro,     setFreteErro]     = useState('')
  const [tabAtiva,      setTabAtiva]      = useState<'descricao' | 'ficha' | 'avaliacoes'>('descricao')

  const coresDisponiveis      = produto.variacoes.filter(v => v.tipo === 'cor')
  const voltagensDisponiveis  = produto.variacoes.filter(v => v.tipo === 'voltagem')
  const tamanhosDispo         = produto.variacoes.filter(v => v.tipo === 'tamanho')
  const imagemPrincipal       = produto.fotos[imgAtiva] || '/images/placeholder.jpg'

  // Preço parcelado estimado (sem juros, 9x)
  const parcelas    = 9
  const vlrParcela  = produto.preco / parcelas
  const vlrCartao   = produto.precoOriginal && produto.precoOriginal > produto.preco
    ? produto.precoOriginal
    : produto.preco * 1.05  // fallback: 5% a mais no cartão

  function handleAdicionarCarrinho() {
    adicionarItem({
      id: produto.id, slug: produto.slug, nome: produto.nome,
      preco: produto.preco, precoOriginal: produto.precoOriginal ?? produto.preco,
      imagem: produto.fotos[0] || '/images/placeholder.jpg',
      quantidade: ehDigital ? 1 : quantidade,
      tipo: ehDigital ? 'DIGITAL' : 'FISICO',
      ...(ehDigital
        ? { varianteFormato: formatoDigitalSel, varianteTamanho: tamanhoDigitalSel }
        : {}),
    })
  }

  function handleComprarAgora() {
    handleAdicionarCarrinho()
    router.push('/checkout')
  }

  function handleMaisFormasPagamento() {
    if (ehDigital) {
      handleAdicionarCarrinho()
      router.push('/checkout')
      return
    }
    handleComprarAgora()
  }

  async function handleCalcularFrete() {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) { setFreteErro('CEP inválido'); return }
    setFreteLoading(true); setFreteErro(''); setFreteResultado(null)
    try {
      const res = await fetch('/api/frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep: cepLimpo, produtoId: produto.id }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setFreteResultado(data.opcoes || [])
    } catch {
      setFreteErro('Não foi possível calcular o frete. Tente novamente.')
    } finally {
      setFreteLoading(false)
    }
  }

  const descricaoCurta = extrairDescricaoCurta(produto.descricao)
  const tabs: ('descricao' | 'ficha' | 'avaliacoes')[] = ['descricao', 'ficha', 'avaliacoes']

  // ── Bloco preço + quantidade + botões (usado nas duas posições) ──
  const blocoCompra = (
    <>
      {/* Preços */}
      <div className="produto-prices">
        {produto.precoOriginal && produto.precoOriginal > produto.preco && (
          <p className="preco-original">
            De: <span>{fmtBRL(produto.precoOriginal)}</span>
          </p>
        )}
        <div className="preco-pix">
          <span className="preco-pix-valor">{fmtBRL(produto.preco)}</span>
          <span className="preco-pix-label">No Pix</span>
        </div>
        <p className="produto-parcelamento">
          {fmtBRL(vlrCartao)} em até <strong>{parcelas}x</strong> de <strong>{fmtBRL(vlrParcela)}</strong> sem juros
        </p>
        <button className="produto-pagamento-link" onClick={handleMaisFormasPagamento}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M2 10h20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8"/>
          </svg>
          Mais formas de pagamento
          <svg width="6" height="10" fill="none" viewBox="0 0 6 10">
            <path d="M1 9L5 5L1 1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/>
          </svg>
        </button>
      </div>

      {/* Quantidade (não se aplica a produto digital) */}
      {!ehDigital && (<>
      <div className="produto-quantidade">
        <span className="variante-label">Quantidade: <strong>1</strong></span>
        <span style={{ fontSize: '0.75rem', color: '#a0a4b3' }}>(Últimas unidades)</span>
      </div>
      <div className="qty-control" style={{ marginBottom: '1rem' }}>
        <button onClick={() => setQuantidade(q => Math.max(1, q - 1))}>−</button>
        <span>{quantidade}</span>
        <button onClick={() => setQuantidade(q => q + 1)}>+</button>
      </div>
      </>)}

      {/* Botões */}
      <div className="produto-botoes">
        <button className="btn-comprar-agora" onClick={handleComprarAgora}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
            <path d="M3 6h18" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
            <path d="M16 10a4 4 0 0 1-8 0" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
          </svg>
          Comprar agora
        </button>
        <button className="btn-add-carrinho" onClick={handleAdicionarCarrinho}>
          Adicionar ao carrinho
        </button>
      </div>
    </>
  )

  return (
    <>
    <div className="container">

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Início</Link>
        <span>/</span>
        <Link href={`/categoria/${produto.categoria.slug}`}>{produto.categoria.nome}</Link>
        <span>/</span>
        <span>{produto.nome}</span>
      </nav>

      {/* Layout principal: galeria + info */}
      <div className="produto-layout">

        {/* ── GALERIA ── */}
        <div className="produto-gallery">
          <div className="produto-gallery-main">
            <div style={{ position: 'relative', width: '100%', paddingBottom: '100%' }}>
              <Image
                src={imagemPrincipal}
                alt={produto.nome}
                fill
                style={{ objectFit: 'contain' }}
                sizes="(max-width: 768px) 100vw, 480px"
                priority
              />
              {produto.precoOriginal && produto.precoOriginal > produto.preco && (
                <span className="badge-desconto">
                  -{desconto(produto.precoOriginal, produto.preco)}%
                </span>
              )}
            </div>
          </div>

          {/* Miniaturas */}
          {produto.fotos.length > 1 && (
            <div className="produto-gallery-thumbs">
              {produto.fotos.map((foto, idx) => (
                <button
                  key={idx}
                  onClick={() => setImgAtiva(idx)}
                  className={`produto-thumb-btn${idx === imgAtiva ? ' active' : ''}`}
                >
                  <Image src={foto} alt={`Imagem ${idx + 1}`} width={70} height={70}
                    style={{ objectFit: 'contain' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── INFO ── */}
        <div className="produto-info">

          {/* Nome */}
          <h1 className="produto-title">{produto.nome}</h1>

          {/* SKU */}
          {produto.codigo && (
            <span className="produto-sku">Cód. {produto.codigo}</span>
          )}

          {/* Estrelas */}
          <Estrelas media={produto.mediaEstrelas} total={produto.totalAvaliacoes} />

          {/* ═════════ PRODUTO DIGITAL ═════════ */}
          {ehDigital && (
            <>
              {/* Preço, quantidade e botões logo abaixo das estrelas */}
              {blocoCompra}

              {/* Formato (PES, DEF, PDF) */}
              {formatosDigital.length > 0 && (
                <div className="produto-variantes">
                  <p className="variante-label">Formato: <strong>{formatoDigitalSel}</strong></p>
                  <div className="variante-opcoes">
                    {formatosDigital.map(v => (
                      <button
                        key={v.id}
                        onClick={() => v.ativo && setFormatoDigitalSel(v.valor)}
                        disabled={!v.ativo}
                        className={`variante-voltagem-btn${formatoDigitalSel === v.valor ? ' selected' : ''}${!v.ativo ? ' indisponivel' : ''}`}
                      >
                        {v.valor}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tamanho (10x10, 15x15...) */}
              {tamanhosDigital.length > 0 && (
                <div className="produto-variantes">
                  <p className="variante-label">Tamanho: <strong>{tamanhoDigitalSel}</strong></p>
                  <div className="variante-opcoes">
                    {tamanhosDigital.map(v => (
                      <button
                        key={v.id}
                        onClick={() => v.ativo && setTamanhoDigitalSel(v.valor)}
                        disabled={!v.ativo}
                        className={`variante-voltagem-btn${tamanhoDigitalSel === v.valor ? ' selected' : ''}${!v.ativo ? ' indisponivel' : ''}`}
                      >
                        {v.valor}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═════════ PRODUTO FÍSICO (layout original) ═════════ */}
          {!ehDigital && (
            <>
              {/* Descrição curta */}
              {descricaoCurta && (
                <p className="produto-descricao-curta">{descricaoCurta}</p>
              )}

              {/* Link mais informações */}
              <button
                className="produto-mais-info"
                onClick={() => {
                  setTabAtiva('descricao')
                  setTimeout(() => document.querySelector('.tabs')?.scrollIntoView({ behavior: 'smooth' }), 50)
                }}
              >
                Mais informações
              </button>

              {/* Variante: Cor */}
              {produto.temCor && coresDisponiveis.length > 0 && (
                <div className="produto-variantes">
                  <p className="variante-label">Cor: <strong>{corSelecionada}</strong></p>
                  <div className="variante-opcoes">
                    {coresDisponiveis.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setCorSelecionada(v.valor)}
                        disabled={!v.ativo}
                        className={`variante-cor-btn${corSelecionada === v.valor ? ' selected' : ''}${!v.ativo ? ' indisponivel' : ''}`}
                      >
                        {v.valor}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Variante: Voltagem */}
              {produto.temVoltagem && voltagensDisponiveis.length > 0 && (
                <div className="produto-variantes">
                  <p className="variante-label">Voltagem: <strong>{voltagemSelecionada}</strong></p>
                  <div className="variante-opcoes">
                    {voltagensDisponiveis.map(v => (
                      <button
                        key={v.id}
                        onClick={() => v.ativo && setVoltagemSelecionada(v.valor)}
                        disabled={!v.ativo}
                        className={`variante-voltagem-btn${voltagemSelecionada === v.valor ? ' selected' : ''}${!v.ativo ? ' indisponivel' : ''}`}
                      >
                        {v.valor}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Variante: Tamanho */}
              {produto.temTamanho && tamanhosDispo.length > 0 && (
                <div className="produto-variantes">
                  <p className="variante-label">Tamanho: <strong>{tamanhoSelecionado}</strong></p>
                  <div className="variante-opcoes">
                    {tamanhosDispo.map(v => (
                      <button
                        key={v.id}
                        onClick={() => v.ativo && setTamanhoSelecionado(v.valor)}
                        disabled={!v.ativo}
                        className={`variante-voltagem-btn${tamanhoSelecionado === v.valor ? ' selected' : ''}${!v.ativo ? ' indisponivel' : ''}`}
                      >
                        {v.valor}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Box vendedor */}
              <div className="produto-vendedor">
                <div>Vendido por <strong>Gazin</strong></div>
                <div>Entregue por <strong>Gazin</strong></div>
              </div>

              {/* Preço, quantidade e botões */}
              {blocoCompra}

              {/* Frete */}
              <div className="frete-calc">
                <h4 className="frete-title">Calcular frete e prazo</h4>
                <div className="frete-input-row">
                  <input
                    type="text"
                    placeholder="Digite seu CEP"
                    value={cep}
                    onChange={e => setCep(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    onKeyDown={e => e.key === 'Enter' && handleCalcularFrete()}
                    className="frete-input"
                    maxLength={9}
                  />
                  <button onClick={handleCalcularFrete} disabled={freteLoading} className="frete-btn">
                    {freteLoading ? '...' : 'Ok'}
                  </button>
                </div>
                {freteErro && <p className="frete-erro">{freteErro}</p>}
                {freteResultado && freteResultado.length > 0 && (
                  <ul className="frete-resultado">
                    {freteResultado.map((op, i) => (
                      <li key={i} className="frete-opcao">
                        <span className="frete-opcao-nome">{op.opcao}</span>
                        <span className="frete-opcao-prazo">{op.prazo}</span>
                        <span className="frete-opcao-valor">
                          {op.valor === 0 ? 'Grátis' : fmtBRL(op.valor)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── ABAS ── */}
      <div className="tabs">
        <div className="tabs-nav">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setTabAtiva(tab)}
              className={`tab-btn${tabAtiva === tab ? ' active' : ''}`}
            >
              {tab === 'descricao'  && 'Informações do Produto'}
              {tab === 'ficha'      && 'Ficha Técnica'}
              {tab === 'avaliacoes' && `Avaliações (${produto.totalAvaliacoes})`}
            </button>
          ))}
        </div>

        {tabAtiva === 'descricao' && (
          <div className="tab-content">
            <div className="produto-descricao" dangerouslySetInnerHTML={{ __html: produto.descricao }} />
          </div>
        )}

        {tabAtiva === 'ficha' && (
          <div className="tab-content">
            {produto.fichaTecnica && Object.keys(produto.fichaTecnica).length > 0 ? (
              <table className="ficha-tecnica">
                <tbody>
                  {Object.entries(produto.fichaTecnica).map(([key, val]) => (
                    <tr key={key}>
                      <td className="ficha-key">{key}</td>
                      <td className="ficha-val">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#7C8096', padding: '1rem 0' }}>Ficha técnica não disponível.</p>
            )}
          </div>
        )}

        {tabAtiva === 'avaliacoes' && (
          <div className="tab-content">
            {produto.avaliacoes.length === 0 ? (
              <p style={{ color: '#7C8096', padding: '1rem 0' }}>
                Ainda não há avaliações para este produto.
              </p>
            ) : (
              <div className="avaliacoes-lista">
                {produto.avaliacoes.map(av => (
                  <div key={av.id} className="avaliacao-item">
                    <div className="avaliacao-header">
                      <div className="avaliacao-estrelas">
                        {[1, 2, 3, 4, 5].map(n => (
                          <svg key={n} viewBox="0 0 24 24" width={14} height={14}
                            fill={n <= av.estrelas ? '#F6C90E' : 'none'}
                            stroke="#F6C90E" strokeWidth={1}>
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                        ))}
                      </div>
                      <span className="avaliacao-nome">{av.nomeCliente}</span>
                      {av.cidade && <span className="avaliacao-cidade"> — {av.cidade}</span>}
                      <span className="avaliacao-data">
                        {new Date(av.data).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {av.comentario && (
                      <p className="avaliacao-comentario">{av.comentario}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Produtos relacionados */}
      {relacionados.length > 0 && (
        <ProductShelf
          titulo="Produtos Relacionados"
          produtos={relacionados.map(p => ({
            id: p.id, slug: p.slug, nome: p.nome,
            precoOriginal: p.precoOriginal,
            preco: Number(p.preco),
            mediaAvaliacoes: Number(p.mediaEstrelas ?? 0),
            avaliacoes: p.totalAvaliacoes,
            imagem: p.fotos?.[0] ?? '/images/placeholder.jpg',
          }))}
        />
      )}
    </div>

    <ModalCadastroLogin
      open={modalAuth}
      onClose={() => setModalAuth(false)}
      onSuccess={() => {
        handleAdicionarCarrinho()
        router.push('/checkout')
      }}
      abaInicial="cadastro"
      mostrarContinuarSemCadastro={true}
      onContinuarSemCadastro={() => {
        setModalAuth(false)
        handleAdicionarCarrinho()
        router.push('/checkout')
      }}
    />
    </>
  )
}
