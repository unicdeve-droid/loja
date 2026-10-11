'use client'

interface Props {
  slug: string
  ordemAtual: string
  searchParams: Record<string, string | undefined>
}

export default function OrdenacaoSelectClient({ slug, ordemAtual, searchParams }: Props) {
  function makeUrl(novaOrdem: string) {
    const p = new URLSearchParams()
    p.set('ordem', novaOrdem)
    p.set('pagina', '1')
    if (searchParams.preco_min) p.set('preco_min', searchParams.preco_min)
    if (searchParams.preco_max) p.set('preco_max', searchParams.preco_max)
    if (searchParams.voltagem)  p.set('voltagem',  searchParams.voltagem)
    return `/categoria/${slug}?${p.toString()}`
  }

  const opcoes = [
    { value: 'populares',   label: 'Mais Populares' },
    { value: 'menor_preco', label: 'Menor Preço'    },
    { value: 'maior_preco', label: 'Maior Preço'    },
    { value: 'novidades',   label: 'Novidades'      },
  ]

  return (
    <select
      defaultValue={ordemAtual}
      onChange={e => { window.location.href = makeUrl(e.target.value) }}
      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
    >
      {opcoes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
