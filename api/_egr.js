/* Leitor da ficha do European Golf Rankings.
 *
 * O EGR não tem API: serve HTML feito no servidor, com uma tabela por prova.
 * São 12 KB e a estrutura é estável há anos, por isso lê-se com expressões
 * regulares em vez de arrastar um parser de HTML para dentro de uma função
 * que só faz isto.
 *
 * Vive num ficheiro à parte, começado por `_`, para a Vercel não o publicar
 * como rota: é uma biblioteca partilhada entre api/egr.js e scripts/egr.mjs,
 * e assim o site e o instantâneo lêem a página exactamente da mesma maneira.
 */

export const PLAYER_ID = 39992;
export const FICHA = `https://www.europeangolfrankings.com/players/${PLAYER_ID}`;

const limpo = (s) => (s || '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#x27;|&apos;/g, "'")
  .replace(/&amp;/g, '&')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const num = (v) => {
  const n = Number.parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

/* «21. Jul 26» → «2026-07-21». O EGR escreve o ano com dois dígitos e o mês
   em inglês abreviado; sem isto não se consegue ordenar nem formatar nada. */
const MES = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
              jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };

function data(txt) {
  const m = /(\d{1,2})\.\s*([A-Za-z]{3})\s*(\d{2})/.exec(txt || '');
  if (!m) return null;
  const mes = MES[m[2].toLowerCase()];
  if (!mes) return null;
  return `20${m[3]}-${mes}-${m[1].padStart(2, '0')}`;
}

function nomeDireito(v) {
  if (!v) return 'Francisca Salgado';
  const [apelido, proprio] = v.split(',').map((x) => x.trim());
  if (!proprio) return v;
  const capitalizar = (t) => t.split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return `${capitalizar(proprio)} ${capitalizar(apelido)}`;
}

export function lerEgr(html) {
  const texto = limpo(html);
  const campo = (re) => { const m = re.exec(texto); return m ? m[1].trim() : null; };

  const provas = [];
  // cada <tr> com resultados é uma prova; as células vêm sempre pela mesma ordem
  for (const [, linha] of html.matchAll(/<tr class='(?:odd|even) has_results'>([\s\S]*?)<\/tr>/g)) {
    const celulas = [...linha.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => limpo(c[1]));
    if (celulas.length < 11) continue;
    const [, pos, evento, campoJogo, pais, quando, r1, r2, r3, r4, pontos] = celulas;
    const voltas = [r1, r2, r3, r4].map(num).filter((v) => v != null);
    provas.push({
      pos: num(pos),
      evento,
      campo: campoJogo,
      pais,
      data: data(quando),
      voltas,
      total: voltas.length ? voltas.reduce((a, b) => a + b, 0) : null,
      pontos: num(pontos),
    });
  }

  return {
    atualizado: new Date().toISOString().slice(0, 10),
    playerId: PLAYER_ID,
    ficha: FICHA,
    // o EGR escreve «SALGADO, Francisca»; aqui usa-se como as pessoas o dizem
    nome: nomeDireito(campo(/Details for ([^(]+?)\s*\(ID/)),
    idEgr: campo(/\(ID (\w+)\)/),
    pais: campo(/Country:\s*([A-Za-zÀ-ÿ ]+?)\s*Golf Club/),
    clube: campo(/Golf Club\s*:\s*(.+?)\s*Age Group/),
    escalao: campo(/Age Group:\s*(\S+)/),
    provasContadas: num(campo(/Tournaments Played\s*:\s*(\d+)/)),
    posicao: num(campo(/EGR Ranking:\s*([\d.]+)/)),
    pontos: num(campo(/EGR Points:\s*([\d.]+)/)),
    mediaVolta: num(campo(/Average Score\s*:\s*([\d.]+)/)),
    mediaCr: num(campo(/Avg\. to CR:\s*([\d.]+)/)),
    provas,
  };
}

/* ── a posição dentro do escalão ───────────────────────────────────────────
 *
 * A ficha da jogadora publica um número só, «EGR Ranking», e esse número é o
 * lugar dela na lista feminina inteira — de Sub-14 a adultas. O selector de
 * escalão que lá está muda as provas que contam, não muda o lugar: pedindo a
 * ficha com U18 vem o mesmo 620 de sempre.
 *
 * O ranking por escalão existe, mas noutro sítio: na lista feminina filtrada,
 * que traz uma coluna «EGR Ranking» própria. É de lá que sai a posição entre
 * as Sub-18 — publicada pelo EGR, não calculada aqui.
 *
 * Os parâmetros vazios (`last_name`, `first_name`, `club`) não são engano: sem
 * eles a página devolve a vista de pesquisa, que não tem coluna de posição.
 */
const LISTA = (escalao, pagina) =>
  'https://www.europeangolfrankings.com/search'
  + `?gender=F&last_name=&first_name=&club=&country=Europe&open_closed=Both&age_group=${
    encodeURIComponent(escalao)}&page=${pagina}`;

export async function posicaoNoEscalao(escalao, fetchImpl = fetch, maxPaginas = 8) {
  if (!escalao) return null;
  for (let pagina = 1; pagina <= maxPaginas; pagina += 1) {
    const r = await fetchImpl(LISTA(escalao, pagina), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; franciscasalgado.golf)', Accept: 'text/html' },
    });
    if (!r.ok) return null;
    const html = await r.text();

    const linhas = [...html.matchAll(/<tr class='(?:odd|even)[^']*'>([\s\S]*?)<\/tr>/g)].map((m) => m[1]);
    if (!linhas.length) return null;                      // acabou a lista

    /* Pelo número da ficha e não pelo nome: há homónimos, e o nome vem escrito
       à maneira do EGR, que pode mudar de um dia para o outro. */
    const dela = linhas.find((l) => l.includes(`/players/${PLAYER_ID}/`));
    if (dela) {
      const pos = num(limpo(/<td[^>]*>([\s\S]*?)<\/td>/.exec(dela)?.[1]));
      return pos || null;
    }
  }
  return null;
}

export async function buscarEgr(fetchImpl = fetch) {
  const r = await fetchImpl(FICHA, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; franciscasalgado.golf)', Accept: 'text/html' },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = lerEgr(await r.text());
  if (!d.posicao) throw new Error('ficha lida mas sem classificação — o EGR mudou de formato?');

  /* Se a lista do escalão não responder, fica só a posição geral e o cartão
     diz «feminino» em vez de «Sub-18». Nunca se mostra o número geral com o
     rótulo do escalão, que era exactamente o erro que havia aqui. */
  try {
    d.posicaoEscalao = await posicaoNoEscalao(d.escalao, fetchImpl);
  } catch { d.posicaoEscalao = null; }

  return d;
}
