// Decoração de Natal do header.
//  • Desktop/tablet: fio reto com pisca-pisca vermelho, verde e dourado (div .natal-luzes).
//  • Celular (≤ 520px): guirlanda com ondas no topo + "cortinas" de luzes penduradas
//    nos dois cantos, com laços de Natal (svg .natal-mobile).
// Puramente visual (não captura cliques). Para remover depois do Natal:
// apague a linha <NatalLuzes /> do Header.tsx.

type P = [number, number]

const quad = (t: number, a: P, b: P, c: P): P => {
  const u = 1 - t
  return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]]
}
const cubic = (t: number, a: P, b: P, c: P, d: P): P => {
  const u = 1 - t
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ]
}

// Ondas no topo: 4 arcos entre x=0 e x=400
const ARCOS: [P, P, P][] = [0, 100, 200, 300].map(x0 => [[x0, 2], [x0 + 50, 16], [x0 + 100, 2]] as [P, P, P])

// Cortinas de luzes: curva do fio + posições (0..1) das lâmpadas
const CORTINAS: { fio: [P, P, P, P]; n: number }[] = [
  { fio: [[4, 8], [0, 38], [8, 76], [3, 112]], n: 7 },
  { fio: [[12, 8], [9, 26], [15, 46], [11, 66]], n: 4 },
  { fio: [[397, 8], [400, 36], [394, 70], [398, 100]], n: 6 },
  { fio: [[390, 8], [392, 22], [388, 34], [391, 46]], n: 2 },
]

const r1 = (n: number) => Math.round(n * 10) / 10

function Lampada({ x, y, i, pendente }: { x: number; y: number; i: number; pendente: boolean }) {
  const cls = `nm-b nm-c${i % 3} nm-d${i % 5} nm-p${i % 2}`
  if (pendente) {
    // pendurada no fio por um fiozinho
    return (
      <g className={cls}>
        <circle className="nm-glow" cx={r1(x)} cy={r1(y + 7)} r="4.2" />
        <line x1={r1(x)} y1={r1(y)} x2={r1(x)} y2={r1(y + 3)} stroke="#2e5d33" strokeWidth="0.8" />
        <rect x={r1(x - 1.3)} y={r1(y + 2.6)} width="2.6" height="2.4" rx="0.6" fill="#2e5d33" />
        <ellipse className="nm-bulb" cx={r1(x)} cy={r1(y + 8)} rx="2.6" ry="3.5" />
        <ellipse cx={r1(x - 0.8)} cy={r1(y + 6.8)} rx="0.7" ry="1.1" fill="#fff" opacity="0.7" />
      </g>
    )
  }
  // lâmpada "no fio" (cortinas laterais)
  return (
    <g className={cls}>
      <circle className="nm-glow" cx={r1(x)} cy={r1(y)} r="4.6" />
      <rect x={r1(x - 1.3)} y={r1(y - 5.4)} width="2.6" height="2.6" rx="0.6" fill="#2e5d33" />
      <ellipse className="nm-bulb" cx={r1(x)} cy={r1(y)} rx="2.6" ry="3.6" />
      <ellipse cx={r1(x - 0.8)} cy={r1(y - 1.2)} rx="0.7" ry="1.1" fill="#fff" opacity="0.7" />
    </g>
  )
}

function Laco({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* folhas de azevinho */}
      <ellipse cx="-7" cy="3.5" rx="5" ry="2" transform="rotate(28 -7 3.5)" fill="#2e7d32" />
      <ellipse cx="7" cy="3.5" rx="5" ry="2" transform="rotate(-28 7 3.5)" fill="#388e3c" />
      {/* fitas */}
      <path d="M-1 1 L-4.5 9 L-1.8 7.4 L-0.4 2.2Z" fill="#b71c1c" />
      <path d="M1 1 L4.5 9 L1.8 7.4 L0.4 2.2Z" fill="#c62828" />
      {/* laços */}
      <path d="M0 0 C-4 -6.5 -11 -5.5 -9 0 C-11 5.5 -4 4.5 0 0Z" fill="#d32f2f" />
      <path d="M0 0 C4 -6.5 11 -5.5 9 0 C11 5.5 4 4.5 0 0Z" fill="#e53935" />
      <circle cx="0" cy="0" r="1.9" fill="#b71c1c" />
      {/* frutinhas */}
      <circle cx="-1.6" cy="4.4" r="1.2" fill="#d32f2f" />
      <circle cx="1.4" cy="4.8" r="1.2" fill="#e53935" />
    </g>
  )
}

function Brilho({ x, y, d }: { x: number; y: number; d: number }) {
  return (
    <path
      className="nm-star"
      style={{ animationDelay: `${d}s` }}
      d={`M${x} ${y - 4} L${x + 1} ${y - 1} L${x + 4} ${y} L${x + 1} ${y + 1} L${x} ${y + 4} L${x - 1} ${y + 1} L${x - 4} ${y} L${x - 1} ${y - 1}Z`}
      fill="#ffd966"
    />
  )
}

export default function NatalLuzes() {
  let k = 0
  return (
    <>
      {/* Desktop / tablet */}
      <div className="natal-luzes" aria-hidden="true">
        {Array.from({ length: 60 }).map((_, i) => (
          <i key={i} />
        ))}
      </div>

      {/* Celular */}
      <svg className="natal-mobile" viewBox="0 0 400 120" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
        {/* fios */}
        <g fill="none" stroke="#3f7a43" strokeWidth="1.3" strokeLinecap="round" opacity="0.9">
          {ARCOS.map(([a, b, c], i) => (
            <path key={`a${i}`} d={`M${a[0]} ${a[1]} Q${b[0]} ${b[1]} ${c[0]} ${c[1]}`} />
          ))}
          {CORTINAS.map(({ fio: [a, b, c, d] }, i) => (
            <path key={`c${i}`} d={`M${a[0]} ${a[1]} C${b[0]} ${b[1]} ${c[0]} ${c[1]} ${d[0]} ${d[1]}`} />
          ))}
        </g>

        {/* lâmpadas das ondas do topo */}
        {ARCOS.flatMap(([a, b, c], ai) =>
          [0.25, 0.5, 0.75].map(t => {
            const [x, y] = quad(t, a, b, c)
            return <Lampada key={`la${ai}-${t}`} x={x} y={y} i={k++} pendente />
          })
        )}

        {/* lâmpadas das cortinas laterais */}
        {CORTINAS.flatMap(({ fio: [a, b, c, d], n }, ci) =>
          Array.from({ length: n }).map((_, j) => {
            const t = (j + 0.8) / (n + 0.3)
            const [x, y] = cubic(t, a, b, c, d)
            return <Lampada key={`lc${ci}-${j}`} x={x + (j % 2 ? 1.2 : -1.2)} y={y} i={k++} pendente={false} />
          })
        )}

        {/* laços nos cantos e brilhos */}
        <Laco x={9} y={6} />
        <Laco x={391} y={6} />
        <Brilho x={128} y={27} d={0} />
        <Brilho x={272} y={27} d={0.7} />
      </svg>
    </>
  )
}
