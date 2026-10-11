export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProdutoForm } from '@/components/admin/ProdutoForm'

interface Props {
  params: { id: string }
}

export default async function AdminEditarProdutoPage({ params }: Props) {
  const produto = await prisma.produto.findUnique({
    where: { id: params.id },
    include: {
      variacoes: true,
    },
  })

  if (!produto) notFound()

  const produtoData = {
    id:              produto.id,
    nome:            produto.nome,
    slug:            produto.slug,
    codigo:          produto.codigo,
    descricao:       produto.descricao,
    preco:           Number(produto.preco),
    precoOriginal:   produto.precoOriginal ? Number(produto.precoOriginal) : null,
    categoriaId:     produto.categoriaId,
    fotos:           produto.fotos,
    ativo:           produto.ativo,
    mediaEstrelas:   Number(produto.mediaEstrelas),
    totalAvaliacoes: produto.totalAvaliacoes,
    temCor:          produto.temCor,
    temVoltagem:     produto.temVoltagem,
    temTamanho:      produto.temTamanho,
    tipo:              produto.tipo as 'FISICO' | 'DIGITAL',
    conteudoDigital:   produto.conteudoDigital ?? undefined,
    pixQrCodeEstatico: produto.pixQrCodeEstatico ?? undefined,
    pixCopiaCola:      produto.pixCopiaCola ?? undefined,
    variacoes:       produto.variacoes.map(v => ({
      id:    v.id,
      tipo:  v.tipo,
      valor: v.valor,
      ativo: v.ativo,
    })),
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/produtos" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Produtos
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Editar produto</h1>
        <span className="text-sm text-gray-400 font-mono">{produto.nome}</span>
      </div>

      <ProdutoForm produto={produtoData} />
    </div>
  )
}
