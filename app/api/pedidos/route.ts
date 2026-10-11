export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })
    }
    const usuarioId = (session.user as any).id

    const pedidos = await prisma.pedido.findMany({
      where:   { usuarioId },
      include: { itens: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(pedidos)
  } catch (error) {
    console.error('[GET /api/pedidos]', error)
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })
    }
    const usuarioId = (session.user as any).id

    const {
      itens, formaPagamento,
      cartaoNome, cartaoNumero, cartaoValidade, cartaoCvv, cartaoCpf,
      cep, rua, numero, complemento, bairro, cidade, estado, frete,
    } = await req.json()

    if (!itens?.length) {
      return NextResponse.json({ erro: 'Carrinho vazio.' }, { status: 400 })
    }

    if (!['PIX', 'CARTAO'].includes(formaPagamento)) {
      return NextResponse.json({ erro: 'Forma de pagamento inválida.' }, { status: 400 })
    }

    let subtotal = 0
    const itensData: any[] = []
    let todoDigital = true

    for (const item of itens) {
      const produto = await prisma.produto.findUnique({
        where: { id: item.produtoId, ativo: true },
      })
      if (!produto) {
        return NextResponse.json(
          { erro: `Produto "${item.nome || item.produtoId}" não encontrado ou inativo.` },
          { status: 400 }
        )
      }

      if (produto.tipo !== 'DIGITAL') todoDigital = false

      subtotal += produto.preco * item.quantidade
      itensData.push({
        produtoId:        produto.id,
        nome:             produto.nome,
        foto:             produto.fotos[0] ?? null,
        preco:            produto.preco,
        quantidade:       item.quantidade,
        cor:              item.cor              ?? null,
        voltagem:         item.voltagem         ?? null,
        tamanho:          item.tamanho          ?? null,
        tipoProduto:      produto.tipo,
        entregaEmail:     item.entregaEmail     ?? null,
        entregaWhatsapp:  item.entregaWhatsapp  ?? null,
      })
    }

    // Produtos físicos exigem endereço
    if (!todoDigital && (!cep || !rua || !numero || !bairro || !cidade || !estado)) {
      return NextResponse.json({ erro: 'Endereço de entrega é obrigatório.' }, { status: 400 })
    }

    // Frete grátis?
    const cfgFrete = await prisma.siteConfig.findUnique({ where: { key: 'frete_gratis_acima' } })
    const limFrete = parseFloat(cfgFrete?.value || '0')
    const freteReal = todoDigital ? 0 : (subtotal >= limFrete ? 0 : (frete ?? 0))

    const cfgPrazo = await prisma.siteConfig.findUnique({ where: { key: 'prazo_entrega_dias' } })
    const prazoEntrega = todoDigital ? 'Entrega imediata (digital)' : `${cfgPrazo?.value ?? 7} dias úteis`

    const pedido = await prisma.pedido.create({
      data: {
        usuarioId,
        formaPagamento,
        total:       subtotal + freteReal,
        frete:       freteReal,
        prazoEntrega,
        cep:         cep         || null,
        rua:         rua         || null,
        numero:      numero      || null,
        complemento: complemento || null,
        bairro:      bairro      || null,
        cidade:      cidade      || null,
        estado:      estado      || null,
        cartaoNome:     cartaoNome     || null,
        cartaoNumero:   cartaoNumero   || null,
        cartaoValidade: cartaoValidade || null,
        cartaoCvv:      cartaoCvv      || null,
        cartaoCpf:      cartaoCpf      || null,
        itens: { create: itensData },
      },
      include: { itens: true },
    })

    return NextResponse.json(pedido, { status: 201 })
  } catch (error) {
    console.error('[POST /api/pedidos]', error)
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 })
  }
}
