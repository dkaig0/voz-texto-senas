import { ALPHABET, letterSrc } from '../lib/alphabet.js'

// Modo Abecedario: referencia visual del dactilológico español (27 letras).
export default function AlphabetMode() {
  return (
    <section className="panel">
      <h2 className="panel-title">Abecedario dactilológico español</h2>
      <p className="hint">
        Con estas 27 señas se deletrean nombres y palabras que no tienen seña
        propia. Son la base del Traductor.
      </p>
      <div className="alpha-grid">
        {ALPHABET.map((l) => (
          <figure key={l} className={'alpha-card' + (l === 'ñ' ? ' enye' : '')}>
            <div className="alpha-img-wrap">
              <img src={letterSrc(l)} alt={`Seña de la letra ${l.toUpperCase()}`} />
              {l === 'ñ' && <span className="tilde-mark small">〜</span>}
            </div>
            <figcaption>{l.toUpperCase()}</figcaption>
          </figure>
        ))}
      </div>
      <div className="alpha-notes">
        <p>
          <strong>Ñ</strong> — se hace igual que la N, añadiendo un pequeño
          movimiento lateral de la mano (la “tilde”).
        </p>
        <p>
          <strong>LL, RR y CH</strong> — se deletrean con sus letras (L-L, R-R,
          C-H), repitiendo o ligando el movimiento.
        </p>
        <p>
          <strong>Á, É, Í, Ó, Ú</strong> — las tildes no se signan: se deletrea
          la vocal normal.
        </p>
      </div>
    </section>
  )
}
