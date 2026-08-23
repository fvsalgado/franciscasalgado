/* Lê as classificações dela no sistema de scoring da federação.
 *
 *   node scripts/classificacoes.mjs           # escreve data/classificacoes-fpg.json
 *   node scripts/classificacoes.mjs --forcar  # ignora o que já foi lido
 *
 * ── de onde vem isto ─────────────────────────────────────────────────────
 * O scoring da FPG é a plataforma «datagolf» (scoring.fpg.pt e
 * scoring.datagolf.pt são a mesma máquina). O registo de federada dela — que
 * o scripts/myfpg.mjs já lê sem credenciais — diz *que* provas jogou e com
 * que voltas; este script vai buscar *como ficou*: a posição na classificação
 * publicada de cada prova.
 *
 * A cadeia, descoberta a 23 ago 2026 e sem nenhuma credencial:
 *
 *   1. registo dela (my.fpg.pt)                 → datas e nomes das provas
 *   2. tournaments.aspx/TournamentsLST          → código da prova + clube
 *      (sessão aberta por 1PreparePage.aspx?club=All; ClubCode:'0' pesquisa
 *      todos os clubes — '' devolve zero, e custou descobrir a diferença)
 *   3. Classifications.aspx?ccode&tcode         → os parâmetros da tabela
 *      (uma mão-cheia de <span id="lbl…"> escondidos, que o POST tem de
 *      devolver tal e qual; e o menu das classificações da prova)
 *   4. classif.aspx/ClassifLST                  → a classificação inteira,
 *      onde ela aparece como «SALGADO,Francisca» — o formato é
 *      APELIDO,Nome, e foi por isso que a primeira busca por
 *      «francisca salgado» não encontrou uma vitória com 88 jogadores.
 *
 * ── o que fica escrito, e o que não ──────────────────────────────────────
 * Só a linha dela e o tamanho do campo. A classificação inteira tem nomes,
 * idades e handicaps de toda a gente — não é nosso para republicar. O que
 * sai daqui é estrutura (posição, totais, voltas), por isso pode ser escrito
 * automaticamente; o cartão da prova no sítio continua a precisar de uma
 * pessoa, porque leva nome em português e contexto.
 *
 * As provas em Espanha, França e afins não estão neste sistema: ficam
 * marcadas «sem correspondência» e não é erro.
 *
 * ── maneiras ─────────────────────────────────────────────────────────────
 * Uma chamada de cada vez, com um quarto de segundo entre elas, e um ponto
 * de retoma no ficheiro de saída: se cair a meio, recomeça onde ia. É a
 * plataforma da federação — lê-se com a mão leve. */

import { readFile, writeFile } from 'node:fs/promises';
import { buscarRegisto, porProva } from './myfpg.mjs';

const RAIZ = new URL('../', import.meta.url);
const SAIDA = new URL('data/classificacoes-fpg.json', RAIZ);
const FORCAR = process.argv.includes('--forcar');
const SO = process.argv.find((a) => a.startsWith('--ano='))?.slice(6);

const BASE = 'https://scoring.datagolf.pt/pt';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  + ' (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const dia = 86400000;
const pausa = (ms = 250) => new Promise((x) => { setTimeout(x, ms); });

/* ── sessão: o frasco de cookies que o redirect:'manual' obriga a carregar ── */
function sessao() {
  const frasco = new Map();
  return {
    bolo: () => [...frasco].map(([k, v]) => `${k}=${v}`).join('; '),
    guardar(r) {
      for (const c of r.headers.getSetCookie?.() ?? []) {
        const [, k, v] = /^\s*([^=;]+)=([^;]*)/.exec(c) || [];
        if (k) frasco.set(k, v);
      }
    },
    tem: () => frasco.size > 0,
  };
}

async function navegar(s, url, referer) {
  for (let salto = 0; salto < 8; salto += 1) {
    const r = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(30000),
      headers: {
        'User-Agent': UA,
        'Accept-Language': 'pt-PT,pt;q=0.9',
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Sec-Fetch-Dest': 'iframe',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        Referer: referer,
        ...(s.tem() ? { Cookie: s.bolo() } : {}),
      },
    });
    s.guardar(r);
    const loc = r.status >= 300 && r.status < 400 && r.headers.get('location');
    if (!loc) return r.text();
    url = new URL(loc, url).toString();
  }
  throw new Error('demasiados saltos');
}

async function metodo(s, caminho, referer, corpo) {
  const r = await fetch(`${BASE}/${caminho}`, {
    method: 'POST',
    signal: AbortSignal.timeout(30000),
    headers: {
      'User-Agent': UA,
      'Content-Type': 'application/json; charset=utf-8',
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'Accept-Language': 'pt-PT,pt;q=0.9',
      Cookie: s.bolo(),
      Referer: referer,
    },
    body: JSON.stringify(corpo),
  });
  if (!r.ok) throw new Error(`${caminho}: HTTP ${r.status}`);
  const { d } = await r.json();
  if (d?.Result !== 'OK') throw new Error(`${caminho}: ${d?.Result}`);
  return d;
}

const lbl = (html, id) => {
  const m = html.match(new RegExp(`id="${id}"[^>]*>([^<]*)`));
  return m ? m[1].trim() : '';
};

/* ── casar nomes entre os dois lados ──────────────────────────────────────
   O registo corta aos 50 caracteres e mete o dia no nome; o scoring escreve
   o nome inteiro e sem dia. Tokens normalizados e sobreposição. */
const VAZIAS = new Set(['de', 'da', 'do', 'dos', 'das', 'e', 'the', 'of', 'by', 'em', 'no', 'na']);
const tokens = (s) => new Set(String(s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/\s*[-–]?\s*(dia|day)\s*\d+\s*$/i, '')
  .replace(/\s*[-–]?\s*d\d\s*$/i, '')
  .replace(/[^a-z0-9 ]/g, ' ')
  .split(/\s+/)
  .filter((w) => w.length > 1 && !VAZIAS.has(w)));

function afinidade(a, b) {
  const A = tokens(a); const B = tokens(b);
  if (!A.size || !B.size) return 0;
  let comuns = 0;
  for (const w of A) if (B.has(w)) comuns += 1;
  return comuns / Math.min(A.size, B.size);
}

/* Ela, numa linha de classificação. Cada clube escreve o nome à sua maneira —
   o dela põe «SALGADO,Francisca», a federação põe «Francisca Salgado» — e a
   primeira versão disto exigia a vírgula: deu um campeonato nacional inteiro
   como «sem linha dela» com ela em primeiro. Basta terem lá as duas palavras. */
const ela = (x) => {
  const n = String(x.player_name || '').toLowerCase();
  return n.includes('salgado') && n.includes('francisca');
};

/* ── a pesquisa de torneios, uma sessão para tudo ───────────────────────── */
let BUSCA = null;
async function abrirBusca() {
  BUSCA = sessao();
  await navegar(BUSCA,
    `${BASE}/1PreparePage.aspx?user=fpguser&page=tournlist&club=All&pagelang=PT`,
    'https://scoring-pt.datagolf.pt/');
}

async function torneiosEntre(ini, fim) {
  const d = await metodo(BUSCA, 'tournaments.aspx/TournamentsLST', `${BASE}/tournaments.aspx`, {
    jtStartIndex: 0, jtPageSize: 400, jtSorting: '',
    ClubCode: '0', dtIni: ini, dtFim: fim, CourseName: '', TournCode: '', TournName: '',
  });
  return (d.Records || []).map((x) => ({
    id: x.id,
    tcode: String(x.code),
    clube: String(x.club_code),
    clubeNome: x.acronym,
    nome: x.description,
    campo: x.course_description,
    data: new Date(Number((String(x.started_at).match(/\d+/) || [0])[0])).toISOString().slice(0, 10),
    voltas: x.rounds,
  }));
}

/* ── a classificação de um torneio, vista a vista ───────────────────────── */
async function classificacoes(t) {
  const s = sessao();
  await navegar(s,
    `${BASE}/1PreparePage.aspx?user=fpguser&page=tournclassif&club=${t.clube}&pagelang=PT&score=1&tcode=${t.tcode}`,
    'https://scoring-pt.datagolf.pt/');
  const pagina = (ordem = '') => navegar(s,
    `${BASE}/Classifications.aspx?ccode=${t.clube}&tcode=${t.tcode}&score=1&classif_order=${ordem}`,
    `${BASE}/`);

  const raiz = await pagina();
  if (/Torneio n[aã]o dispon[ií]vel|Param Error/i.test(raiz)) return { erro: 'torneio não disponível' };

  // os nomes das vistas vêm com entidades («Classifica&#231;&#227;o») — desfaz-se
  const semEntidades = (s) => s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  let opcoes = [...raiz.matchAll(/<option[^>]*value="(\d+)"[^>]*>([^<]*)/g)]
    .map((m) => ({ v: m[1], nome: semEntidades(m[2].trim()) }));
  if (!opcoes.length) opcoes = [{ v: lbl(raiz, 'lblClassifOrder') || '1', nome: lbl(raiz, 'lblMod') || 'Geral' }];

  const vistas = [];
  for (const op of opcoes.slice(0, 6)) {
    await pausa();
    const p = op.v === lbl(raiz, 'lblClassifOrder') ? raiz : await pagina(op.v);
    try {
      const d = await metodo(s, 'classif.aspx/ClassifLST',
        `${BASE}/Classifications.aspx?ccode=${t.clube}&tcode=${t.tcode}`, {
          jtStartIndex: 0, jtPageSize: 999, jtSorting: 'score_id DESC',
          Classi: op.v, tclub: t.clube, tcode: t.tcode,
          classiforder: lbl(p, 'lblClassifOrder'), classiftype: lbl(p, 'lblClassifType'),
          classifroundtype: lbl(p, 'lblClassifRoundType'), scoringtype: lbl(p, 'lblScoringType'),
          round: lbl(p, 'lblRound'), members: lbl(p, 'lblMembers'),
          playertypes: lbl(p, 'lblPlayerTypes'), gender: lbl(p, 'lblGender'),
          minagemen: lbl(p, 'lblMinAgeMen'), maxagemen: lbl(p, 'lblMaxAgeMen'),
          minageladies: lbl(p, 'lblMinAgeLadies'), maxageladies: lbl(p, 'lblMaxAgeLadies'),
          minhcp: lbl(p, 'lblMinHcp'), maxhcp: lbl(p, 'lblMaxHcp'),
          idfilter: lbl(p, 'lblIdFilter') || '-1',
        });
      const linha = (d.Records || []).find(ela);
      if (linha) {
        vistas.push({
          classificacao: op.nome,
          pos: Number(linha.classif_pos) || linha.classif_pos,
          de: d.TotalRecordCount,
          total: linha.classif_total,
          gross: linha.gross_total,
          voltas: ['classif_r1', 'classif_r2', 'classif_r3', 'classif_r4']
            .map((k) => String(linha[k] || '').trim()).filter((v) => v && v !== ' '),
        });
      }
    } catch { /* uma vista que recuse não deita as outras abaixo */ }
  }
  return { campo: lbl(raiz, 'lblCourse'), dataTorneio: lbl(raiz, 'lblDate'), vistas };
}

/* ── o percurso todo ─────────────────────────────────────────────────────── */
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

const antes = FORCAR ? {} : await readFile(SAIDA, 'utf8').then(JSON.parse).catch(() => ({}));
const feito = antes.provas || {};

const registo = await buscarRegisto();
let provas = porProva(registo.provas).sort((a, b) => b.data.localeCompare(a.data));
if (SO) provas = provas.filter((p) => p.data.startsWith(SO));

console.error(`${provas.length} prova(s) no registo; ${Object.keys(feito).length} já lidas.`);
await abrirBusca();

let n = 0;
const gravar = () => writeFile(SAIDA, `${JSON.stringify({
  atualizado: new Date().toISOString().slice(0, 10),
  fonte: 'scoring.datagolf.pt (plataforma do scoring da FPG)',
  nota: 'Só a linha dela e o tamanho do campo; a classificação inteira não é nossa para guardar.',
  provas: feito,
}, null, 1)}\n`);

for (const p of provas) {
  const chave = `${p.data}|${p.torneio}`;
  if (feito[chave] && !feito[chave].erro) continue;
  n += 1;

  try {
    await pausa();
    const ini = iso(new Date(p.data).getTime() - 3 * dia);
    const fim = iso(new Date(p.fim).getTime() + 3 * dia);
    const candidatos = (await torneiosEntre(ini, fim))
      .map((t) => ({ ...t, af: afinidade(p.torneio, t.nome) }))
      .filter((t) => t.af >= 0.5)
      .sort((a, b) => b.af - a.af);

    if (!candidatos.length) {
      feito[chave] = { data: p.data, torneio: p.torneio, erro: 'sem correspondência' };
    } else {
      let resolvida = null;
      for (const c of candidatos.slice(0, 2)) {
        await pausa();
        const r = await classificacoes(c);
        if (r.vistas?.length) {
          resolvida = {
            data: p.data, torneio: p.torneio, torneioScoring: c.nome,
            tcode: c.tcode, clube: c.clube, clubeNome: c.clubeNome,
            campo: r.campo || c.campo, dataTorneio: r.dataTorneio || c.data,
            vistas: r.vistas,
          };
          break;
        }
      }
      feito[chave] = resolvida
        || { data: p.data, torneio: p.torneio, tcodeTentado: candidatos[0].tcode, erro: 'sem linha dela na classificação' };
    }
  } catch (e) {
    feito[chave] = { data: p.data, torneio: p.torneio, erro: e.message.slice(0, 90) };
  }

  const r = feito[chave];
  console.error(`[${n}] ${p.data} ${p.torneio.slice(0, 46).padEnd(46)} → ${
    r.erro || r.vistas.map((v) => `${v.classificacao.slice(0, 22)}: ${v.pos}.ª/${v.de}`).join(' · ')}`);
  if (n % 5 === 0) await gravar();
}

await gravar();
const ok = Object.values(feito).filter((x) => x.vistas?.length);
console.error(`\n${ok.length} prova(s) com classificação dela · ${Object.keys(feito).length - ok.length} sem.`);
