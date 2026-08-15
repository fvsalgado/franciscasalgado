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
    e_sub: 'Ranking europeu feminino',
    e_subEsc: (esc) => `Ranking europeu feminino · ${esc}`,
    geral: 'Lugar entre todas',
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
    e_sub: 'European women\'s ranking',
    e_subEsc: (esc) => `European women's ranking · ${esc}`,
    geral: 'Place among all',
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

/* `valida` diz o que faz de uma resposta uma resposta boa. Era `d.posicao`
   fixo, o que servia os dois rankings e mais nada — o handicap não tem
   posição, tem handicap. */
export async function buscar(rota, instantaneo, valida = (d) => d?.posicao != null) {
  try {
    const r = await fetch(rota, { cache: 'no-cache' });
    if (r.ok) {
      const d = await r.json();
      if (valida(d)) return { d, vivo: true };
    }
  } catch { /* sem funções, ou sem rede — segue para o instantâneo */ }
  try {
    const d = await (await fetch(instantaneo, { cache: 'no-cache' })).json();
    if (valida(d)) return { d, vivo: false };
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
/* `curto` serve a página inicial. Lá o cartão inteiro — média de pontos, melhor
   de sempre, vitórias, top 10, provas contadas — era a página de resultados
   escrita outra vez, e a página inicial não é para isso. Fica o número, de onde
   vem, de quando é, e a ligação à ficha oficial. O resto está a um clique. */
/* A ficha do EGR publica um número só, e esse número é o lugar dela na lista
   feminina inteira — de Sub-14 a adultas. O lugar dentro do escalão sai da
   lista filtrada, e é o que faz sentido mostrar em grande: é entre estas que
   ela joga. Quando a lista do escalão não responde, mostra-se o geral com o
   rótulo do geral — nunca o geral com o rótulo do escalão. */
const posEgr = (d) => d.posicaoEscalao || d.posicao;
const escPt = (esc) => String(esc || '').replace(/^U(\d+)$/, 'Sub-$1');
const subEgr = (d, t, lingua) => (d.posicaoEscalao && d.escalao
  ? t.e_subEsc(lingua === 'en' ? d.escalao : escPt(d.escalao))
  : t.e_sub);

export async function rankings(cx, lingua = 'pt', { curto = false } = {}) {
  if (!cx) return;
  const t = T[lingua] || T.pt;

  if (curto) return breves(cx, lingua, t);

  const [m, e] = await Promise.all([
    buscar('/api/wagr', '/data/wagr.json'),
    buscar('/api/egr', '/data/egr.json'),
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
    variante: 'europeu', rot: t.europeu, sub: subEgr(e.d, t, lingua), estado: e.vivo,
    posicao: posEgr(e.d), lingua,
    principal: { v: dec(e.d.mediaVolta, lingua), r: t.mediaVolta },
    miudos: [
      /* O lugar na lista feminina inteira, quando o do escalão está a ser o
         número grande: são dois números diferentes e é preciso ver os dois
         para perceber qualquer um deles. */
      ...(e.d.posicaoEscalao && e.d.posicao
        ? [{ r: t.geral, v: `${milhares(e.d.posicao, lingua)}${ord(lingua)}` }] : []),
      { r: t.pontos, v: milhares(e.d.pontos, lingua) },
      { r: t.faceCr, v: dec(e.d.mediaCr, lingua) },
      { r: t.provas, v: e.d.provasContadas },
    ],
    verTxt: t.verE, verUrl: e.d.ficha, atualizado: e.d.atualizado,
  }) : vazio(t.europeu);

  cx.className = 'rks';
  cx.innerHTML = mundial + europeu;
}

/* ── versão reduzida ──────────────────────────────────────── */
async function breves(cx, lingua, t) {
  const [m, e] = await Promise.all([
    buscar('/api/wagr', '/data/wagr.json'),
    buscar('/api/egr', '/data/egr.json'),
  ]);

  const um = (v, dados) => {
    if (!dados) return '';
    const { d, vivo } = dados;
    return `
      <a class="rkb rkb--${v.chave}" href="${v.url(d)}" target="_blank" rel="noopener" data-sem-seta data-mag>
        <span class="rkb__r">${v.rot}</span>
        <span class="rkb__n num">${milhares(v.pos(d), lingua)}<sup>${ord(lingua)}</sup></span>
        <span class="rkb__x">${v.sub(d)}</span>
        <span class="rkb__e">${vivo ? t.aovivo : t.guardado} · ${d.atualizado}</span>
        <span class="rkb__s" aria-hidden="true">↗</span>
      </a>`;
  };

  cx.className = 'rkbs';
  cx.innerHTML =
    um({ chave: 'mundial', rot: t.mundial, sub: () => t.m_sub, pos: (d) => d.posicao, url: (d) => d.perfil }, m) +
    um({ chave: 'europeu', rot: t.europeu, sub: (d) => subEgr(d, t, lingua), pos: posEgr, url: (d) => d.ficha }, e);
}
