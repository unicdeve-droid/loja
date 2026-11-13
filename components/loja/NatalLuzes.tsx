// Decoração de Natal do header: fio com pisca-pisca vermelho, verde e dourado.
// Puramente visual (não captura cliques). Para remover depois do Natal:
// apague a linha <NatalLuzes /> do Header.tsx.
export default function NatalLuzes() {
  return (
    <div className="natal-luzes" aria-hidden="true">
      {Array.from({ length: 60 }).map((_, i) => (
        <i key={i} />
      ))}
    </div>
  )
}
