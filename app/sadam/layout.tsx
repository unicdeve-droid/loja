import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AdminNav } from '@/components/admin/AdminNav'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Painel',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Segunda barreira (a primeira é o middleware): só administrador vê o painel
  const s = await getServerSession(authOptions)
  if ((s?.user as any)?.role !== 'ADMIN') notFound()

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminNav />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
