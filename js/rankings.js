/* Os dois cartões de ranking: o mundial (WAGR) e o europeu (EGR).

   São um par, e por isso partilham a mesma caixa escura e a mesma anatomia —
   cabeça, número grande, uma fila de números pequenos, rodapé. Muda só o
   acento: verde no mundial, dourado no europeu. Assim vê-se num relance que
   são a mesma espécie de coisa sem que se confundam um com o outro.

   Cada um tem dois caminhos, por esta ordem:
   1. /api/wagr e /api/egr — funções que vão às fichas oficiais na hora. É o
      caminho normal, e tem de ser do lado do servidor: o WAGR só autoriza
      pedidos vindos de wagr.com, e o EGR nem sequer manda cabeçalho de CORS.
   2. data/wagr.json e data/egr.json — instantâneos guardados no repositório,
      para quando não há funções (alojamento estático, `npx serve`) ou a fonte
      está em baixo.

   O cartão diz sempre qual dos dois está a usar, de quando são os dados, e
   leva a ligação para a ficha oficial: quem quiser confirmar, confirma na
   fonte. Nenhum destes números é escrito à mão em lado nenhum. */

const T = {
  pt: {
    mundial: 'World Amateur Golf Ranking',
    europeu: 'European Golf Rankings',
    m_sub: 'Ranking mundial · R&A e USGA',
    e_sub: 'Ranking europeu · escalão Sub-18',
    pos: 'Classificação',
    melhor: 'Melhor de sempre',
    media: 'Média de pontos',
    mediaVolta: 'Média por volta',
    faceCr: 'Face ao course rating',
    provas: 'Provas contadas',
    pontos: 'Pontos',
    top10: 'Top 10',
    vitorias: 'Vitórias',
    verM: 'Ver a ficha no WAGR',
    verE: 'Ver a ficha no EGR',
    de: 'Dados de',
    aovivo: 'Em direto',
    guardado: 'Instantâneo',
    falha: 'Não foi possível ler esta classificação agora.',
  },
  en: {
    mundial: 'World Amateur Golf Ranking',
    europeu: 'European Golf Rankings',
    m_sub: 'World ranking · The R&A and the USGA',
    e_sub: 'European ranking · U18 category',
    pos: 'Ranking',
    melhor: 'Career best',
    media: 'Points average',
    mediaVolta: 'Scoring average',
    faceCr: 'Against course rating',
    provas: 'Counting events',
    pontos: 'Points',
    top10: 'Top 10s',
    vitorias: 'Wins',
    verM: 'See the WAGR profile',
    verE: 'See the EGR profile',
    de: 'Data from',
    aovivo: 'Live',
    guardado: 'Snapshot',
    falha: 'Could not read this ranking right now.',
  },
};

/* Os números vêm das fontes com quatro casas decimais, que ninguém lê. E em
   português a vírgula é vírgula. */
function dec(v, lingua, casas = 2) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  const s = n.toFixed(casas);
  return lingua === 'en' ? s : s.replace('.', ',');
}

const milhares = (v, lingua) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString(lingua === 'en' ? 'en-GB' : 'pt-PT', { maximumFractionDigits: 0 });
};

const dataLonga = (iso, lingua) => {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lingua === 'en' ? 'en-GB' : 'pt-PT',
    { day: 'numeric', month: 'long', year: 'numeric' });
};

export async function buscar(rota, instantaneo) {
  try {
    const r = await fetch(rota, { cache: 'no-cache' });
    if (r.ok) {
      const d = await r.json();
      if (d?.posicao) return { d, vivo: true };
    }
  } catch { /* sem funções, ou sem rede — segue para o instantâneo */ }
  try {
    const d = await (await fetch(instantaneo, { cache: 'no-cache' })).json();
    if (d?.posicao) return { d, vivo: false };
  } catch (e) { console.warn(`${rota}:`, e.message); }
  return null;
}

/* ── uma peça do cartão ───────────────────────────────────── */
const ord = (lingua) => (lingua === 'en' ? '' : '.ª');

function cartao({ variante, rot, sub, estado, posicao, lingua, principal, miudos, verTxt, verUrl, atualizado }) {
  const t = T[lingua] || T.pt;
  return `
    <article class="rk rk--${variante}">
      <header class="rk__cab">
        <div class="rk__id">
          <p class="rk__rot">${rot}</p>
          <p class="rk__sub">${sub}</p>
        </div>
        <span class="rk__estado ${estado ? 'rk__estado--vivo' : ''}">${estado ? t.aovivo : t.guardado}</span>
      </header>

      <div class="rk__grande">
        <span class="rk__pos num">${milhares(posicao, lingua)}<sup>${ord(lingua)}</sup></span>
        <span class="rk__pr">${t.pos}</span>
        ${principal ? `<span class="rk__lado num">${principal.v} <i>${principal.r}</i></span>` : ''}
      </div>

      <dl class="rk__l">
        ${miudos.filter((n) => n.v != null && n.v !== '—').map((n) => `
          <div><dt>${n.r}</dt><dd class="num">${n.v}</dd></div>`).join('')}
      </dl>

      <footer class="rk__pe">
        <a class="cap cap--cheio" href="${verUrl}" target="_blank" rel="noopener" data-mag>${verTxt}</a>
        <span class="rk__data num">${t.de} ${dataLonga(atualizado, lingua)}</span>
      </footer>
    </article>`;
}

/* ── os dois, lado a lado ─────────────────────────────────── */
export async function rankings(cx, lingua = 'pt') {
  if (!cx) return;
  const t = T[lingua] || T.pt;

  const [m, e] = await Promise.all([
    buscar('/api/wagr', 'data/wagr.json'),
    buscar('/api/egr', 'data/egr.json'),
  ]);

  const vazio = (nome) => `<article class="rk rk--vazio"><p>${nome}: ${t.falha}</p></article>`;

  const mundial = m ? cartao({
    variante: 'mundial', rot: t.mundial, sub: t.m_sub, estado: m.vivo,
    posicao: m.d.posicao, lingua,
    principal: { v: dec(m.d.mediaPontos, lingua), r: t.media },
    miudos: [
      { r: t.melhor, v: m.d.melhorPosicao != null ? `${milhares(m.d.melhorPosicao, lingua)}${ord(lingua)}` : null },
      { r: t.vitorias, v: m.d.vitorias },
      { r: t.top10, v: m.d.top10 },
      { r: t.provas, v: m.d.provasContadas },
    ],
    verTxt: t.verM, verUrl: m.d.perfil, atualizado: m.d.atualizado,
  }) : vazio(t.mundial);

  const europeu = e ? cartao({
    variante: 'europeu', rot: t.europeu, sub: t.e_sub, estado: e.vivo,
    posicao: e.d.posicao, lingua,
    principal: { v: dec(e.d.mediaVolta, lingua), r: t.mediaVolta },
    miudos: [
      { r: t.pontos, v: milhares(e.d.pontos, lingua) },
      { r: t.faceCr, v: dec(e.d.mediaCr, lingua) },
      { r: t.provas, v: e.d.provasContadas },
    ],
    verTxt: t.verE, verUrl: e.d.ficha, atualizado: e.d.atualizado,
  }) : vazio(t.europeu);

  cx.className = 'rks';
  cx.innerHTML = mundial + europeu;
}
