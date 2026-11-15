/* O selo «Rumo à Florida»: o logótipo do Junior Orange Bowl num carimbo
 * redondo, com «Apoie a Francisca» à volta, que leva ao /fundme.
 *
 * Na página inicial vive por cima da fotografia do hero, grande. Nas outras
 * páginas flutua no canto, mais pequeno, e tem um × que o fecha até ao fim da
 * visita. No /fundme não aparece (lá já está o bilhete, com o mesmo selo).
 *
 * Só aparece enquanto a angariação estiver aberta: lê o data/fundme.json e
 * esconde-se com `aberto: false` ou depois do dia da partida. Não entra no
 * HTML gravado pelo scripts/estatico.mjs (não vive em nenhum contentor da
 * lista), por isso nunca fica congelado num ficheiro depois de a campanha
 * acabar.
 *
 * A ligação leva `?o=site` (ou `site-inicio`): o formulário passa isso para os
 * metadados do pagamento, e fica-se a saber quantos apoios vieram daqui. */

const TEXTOS = {
  pt: { cima: 'Apoie a Francisca', baixo: 'Rumo à Florida · 2027', bt: 'Apoiar', fechar: 'Fechar o selo',
        rotulo: 'Rumo à Florida: apoie a Francisca a chegar ao Junior Orange Bowl 2027' },
  en: { cima: 'Support Francisca', baixo: 'Road to Florida · 2027', bt: 'Give', fechar: 'Close the badge',
        rotulo: 'Road to Florida: help Francisca get to the Junior Orange Bowl 2027' },
};
const GUARDA = 'fs-selo-fm';

const ler = (k) => { try { return sessionStorage.getItem(k); } catch { return null; } };
const guardar = (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* modo privado */ } };
const hojeLisboa = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date());

async function campanhaAberta() {
  try {
    const d = await (await fetch('/data/fundme.json')).json();
    return Boolean(d.aberto) && (!d.partida || hojeLisboa() <= d.partida);
  } catch {
    return false;
  }
}

function desenho(t) {
  /* Um carimbo em SVG: o texto de cima corre por um arco por cima, o de baixo
     por um arco por baixo (os dois direitos, de leitura normal). */
  return `<span class="selo-fm__in">
    <svg class="selo-fm__anel" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <path id="seloFmCima" d="M30 100a70 70 0 0 1 140 0"/>
        <path id="seloFmBaixo" d="M15 100a85 85 0 0 0 170 0"/>
      </defs>
      <circle class="selo-fm__fundo" cx="100" cy="100" r="97"/>
      <circle class="selo-fm__risco" cx="100" cy="100" r="91"/>
      <circle class="selo-fm__tracejado" cx="100" cy="100" r="64"/>
      <text class="selo-fm__txt"><textPath href="#seloFmCima" startOffset="50%" text-anchor="middle">${t.cima}</textPath></text>
      <text class="selo-fm__txt selo-fm__txt--b"><textPath href="#seloFmBaixo" startOffset="50%" text-anchor="middle">${t.baixo}</textPath></text>
      <path class="selo-fm__estrela" d="M23 100l2.6-3 2.6 3-2.6 3zM171.8 100l2.6-3 2.6 3-2.6 3z"/>
    </svg>
    <img class="selo-fm__logo" src="/img/fundme/junior-orange-bowl.webp" alt="" width="446" height="235" decoding="async" data-credito-feito="1" />
    <span class="selo-fm__bt">${t.bt} <span aria-hidden="true">→</span></span>
  </span>`;
}

export async function seloFundme(lingua = 'pt') {
  document.querySelectorAll('.selo-fm, .selo-fm-x').forEach((e) => e.remove());
  if (/fundme/.test(location.pathname)) return;
  if (!(await campanhaAberta())) return;
  // a corrida pode ter repintado entretanto: só um selo de cada vez
  document.querySelectorAll('.selo-fm, .selo-fm-x').forEach((e) => e.remove());

  const t = TEXTOS[lingua] || TEXTOS.pt;
  const hero = document.querySelector('.hero');
  const base = lingua === 'en' ? '/en/fundme' : '/fundme';

  const a = document.createElement('a');
  a.className = `selo-fm ${hero ? 'selo-fm--hero' : 'selo-fm--flutua'}`;
  a.href = `${base}?o=${hero ? 'site-inicio' : 'site'}`;
  a.setAttribute('aria-label', t.rotulo);
  a.dataset.semSeta = '';
  a.innerHTML = desenho(t);

  if (hero) {
    hero.append(a);
    return;
  }
  if (ler(GUARDA) === 'fechado') return;

  const caixa = document.createElement('div');
  caixa.className = 'selo-fm-x';
  const x = document.createElement('button');
  x.type = 'button';
  x.className = 'selo-fm-x__fechar';
  x.setAttribute('aria-label', t.fechar);
  x.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>';
  x.addEventListener('click', () => { guardar(GUARDA, 'fechado'); caixa.remove(); });
  caixa.append(a, x);
  document.body.append(caixa);
}
