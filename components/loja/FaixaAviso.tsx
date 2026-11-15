// Faixa fina de aviso na home (entre o header e os banners): texto rolando da direita
// para a esquerda em loop infinito. Para trocar o texto, edite TEXTO abaixo.
// Para tirar a faixa, apague a linha <FaixaAviso /> do app/(loja)/page.tsx.
const TEXTO = 'Coleção Natal 2026 disponível - Glass Matrizes - Pague e receba via Whatsapp'

// O grupo repete o texto o bastante para ser mais largo que qualquer tela; o trilho
// tem 2 grupos iguais e anda -50% (1 grupo), então o loop não tem emenda.
function Grupo({ escondido = false }: { escondido?: boolean }) {
  return (
    <div className="faixa-aviso-grupo" aria-hidden={escondido || undefined}>
      {Array.from({ length: 6 }).map((_, i) => (
        <span className="faixa-aviso-item" key={i}>
          {TEXTO}
          <span className="faixa-aviso-sep"> •</span>
        </span>
      ))}
    </div>
  )
}

export default function FaixaAviso() {
  return (
    <div className="faixa-aviso" role="note" aria-label={TEXTO}>
      <div className="faixa-aviso-trilho">
        <Grupo escondido />
        <Grupo escondido />
      </div>
    </div>
  )
}
