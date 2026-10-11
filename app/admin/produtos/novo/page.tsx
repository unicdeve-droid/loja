export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { ProdutoForm } from '@/components/admin/ProdutoForm'

export default function AdminNovoProdutoPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/produtos" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Produtos
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Novo produto</h1>
      </div>

      <ProdutoForm />
    </div>
  )
}
