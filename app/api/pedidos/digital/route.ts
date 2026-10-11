export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Pedido de infoproduto sem necessidade de login
export async function POST(req: NextRequest) {
  try {
    const {
      itens, nomeCliente, email, whatsapp, formaPagamento,
      cartaoNome, cartaoNumero, cartaoValidade, cartaoCvv, cartaoCpf,
    } = await req.json()

    if (!itens?.length)
      return NextResponse.json({ erro: 'Carrinho vazio.' }, { status: 400 })
    if (!email && !whatsapp)
      return NextResponse.json({ erro: 'Informe e-mail ou WhatsApp para receber o produto.' }, { status: 400 })
    if (!formaPagamento)
      return NextResponse.json({ erro: 'Forma de pagamento obrigatória.' }, { status: 400 })
    if (formaPagamento === 'CARTAO' && !(cartaoNome && cartaoNumero && cartaoValidade && cartaoCvv))
      return NextResponse.json({ erro: 'Dados do cartão incompletos.' }, { status: 400 })

    let subtotal = 0
    const itensData: any[] = []

    for (const item of itens) {
      const produto = await prisma.produto.findUnique({ where: { id: item.produtoId, ativo: true } })
      if (!produto) return NextResponse.json({ erro: `Produto não encontrado.` }, { status: 400 })
      subtotal += produto.preco * item.quantidade
      const sufixo = [item.formato, item.tamanho].filter(Boolean).join(' • ')
      itensData.push({
        produtoId:       produto.id,
        nome:            sufixo ? `${produto.nome} (${sufixo})` : produto.nome,
        foto:            produto.fotos[0] ?? null,
        preco:           produto.preco,
        quantidade:      item.quantidade,
        tipoProduto:     'DIGITAL',
        entregaEmail:    email    || null,
        entregaWhatsapp: whatsapp || null,
      })
    }

    // Cria ou encontra usuário guest
    let usuarioId: string
    const guestEmail = email || `guest_${Date.now()}@reinomatrizes.app`
    let usuario = await prisma.usuario.findUnique({ where: { email: guestEmail } }).catch(() => null)
    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          nome:  nomeCliente || 'Cliente',
          email: guestEmail,
          senha: 'guest_no_login',
        },
      })
    }
    usuarioId = usuario.id

    const pedido = await prisma.pedido.create({
      data: {
        usuarioId,
        formaPagamento,
        total:       subtotal,
        frete:       0,
        prazoEntrega: 'Entrega imediata (digital)',
        cartaoNome:     formaPagamento === 'CARTAO' ? (cartaoNome     || null) : null,
        cartaoNumero:   formaPagamento === 'CARTAO' ? (cartaoNumero   || null) : null,
        cartaoValidade: formaPagamento === 'CARTAO' ? (cartaoValidade || null) : null,
        cartaoCvv:      formaPagamento === 'CARTAO' ? (cartaoCvv      || null) : null,
        cartaoCpf:      formaPagamento === 'CARTAO' ? (cartaoCpf       || null) : null,
        itens: { create: itensData },
      },
      include: { itens: true },
    })

    return NextResponse.json(pedido, { status: 201 })
  } catch (error) {
    console.error('[POST /api/pedidos/digital]', error)
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 })
  }
}
