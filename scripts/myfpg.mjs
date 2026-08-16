/* Lê o registo de federada no myFPG — a área reservada da federação.
 *
 *   FPG_USER=43832 FPG_PASS=… node scripts/myfpg.mjs
 *   … --seco     # lê e mostra, não escreve nada
 *
 * ── o que isto vai buscar, e o que não ───────────────────────────────────
 * A área reservada tem centenas de voltas contadas para handicap, cada uma com
 * campo, par, stableford e resultado bruto. Publicar isso seria um extrato de
 * conta — e já ficou decidido, quando a página das épocas passou a resumo, que
 * os dias maus não são conteúdo.
 *
 * Daqui saem duas coisas, e mais nenhuma:
 *
 *   · o **histórico do índice de handicap** — data e número. É a curva que um
 *     treinador universitário procura primeiro;
 *   · a **lista de provas**, que não se escreve sozinha: serve para o vigia
 *     apontar as que faltam e uma pessoa decidir. Estrutura entra, prosa não.
 *
 * ── o caminho, que não se adivinha ───────────────────────────────────────
 * O primeiro palpite falhou cinco vezes seguidas, e a razão só apareceu quando
 * alguém guardou a página e ma deu: a página de resultados não tem tabela
 * nenhuma. É uma casca de iframes, três níveis fundo.
 *
 *   Home/Results.aspx            casca, com o iframe MainContent_ifrm1
 *     └ Home/Federated_V3.aspx   a ficha, com os iframes ifrm1 e ifrmWhp
 *         ├ Home/PlayerResults.aspx?no=…&clubCode=…&pp=N   as provas
 *         └ Home/PlayerWHS.aspx?no=…&clubCode=…&pp=N       o handicap
 *
 * Segue-se a cadeia lendo o `src` de cada iframe, em vez de construir o
 * endereço à mão: o `clubCode` muda se ela mudar de clube, e um endereço
 * construído com um número velho devolve a ficha errada ou nada.
 *
 * ── as duas tabelas ──────────────────────────────────────────────────────
 * A PlayerWHS tem `Novo` e `Anterior`: o índice depois e antes daquela volta.
 * É o `Novo` que faz a curva. Existe também uma coluna `Index`, nas duas
 * tabelas, que é outra coisa — o índice com que se entrou em jogo. Confundi-las
 * dava uma curva atrasada uma volta inteira.
 *
 * ── credenciais ──────────────────────────────────────────────────────────
 * Vêm do ambiente, nunca de um ficheiro. Em GitHub Actions são segredos do
 * repositório. A senha não é escrita em lado nenhum, nem em erro. Os dados
 * pessoais que a área reservada mostra não são lidos: o que não se lê não se
 * perde.
 */

const AJAX = 'https://area.my.fpg.pt/wp-admin/admin-ajax.php';
const ATERRAR = 'https://my.fpg.pt/ExternalLandingPage.aspx';
const CASCA = 'https://my.fpg.pt/Home/Results.aspx';

const COMO_BROWSER = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    + ' (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
};

/* Um frasco de cookies à mão: o fetch do Node não tem nenhum, e a sessão do
   ASP.NET nasce entre dois saltos. O mesmo problema do api/_handicap.js. */
function frasco() {
  const m = new Map();
  return {
    guardar: (r) => {
      for (const posto of r.headers.getSetCookie?.() ?? []) {
        const [, k, v] = /^\s*([^=;]+)=([^;]*)/.exec(posto) || [];
        if (k) m.set(k, v);
      }
    },
    cabeca: () => (m.size ? { Cookie: [...m].map(([k, v]) => `${k}=${v}`).join('; ') } : {}),
    vazio: () => m.size === 0,
  };
}

async function ir(url, jar, opcoes = {}, limite = 6) {
  let actual = url;
  let opts = opcoes;
  for (let salto = 0; salto < limite; salto += 1) {
    const r = await fetch(actual, {
      redirect: 'manual',
      ...opts,
      headers: { ...COMO_BROWSER, ...jar.cabeca(), ...(opts.headers || {}) },
    });
    jar.guardar(r);
    const seguinte = r.status >= 300 && r.status < 400 && r.headers.get('location');
    if (!seguinte) return r;
    actual = new URL(seguinte, actual).toString();
    opts = { headers: opts.headers };                 // uma redireção vira GET
  }
  throw new Error('demasiadas redireções');
}

/** Entra e devolve o frasco com a sessão aberta. */
export async function entrar(utilizador, senha) {
  if (!utilizador || !senha) throw new Error('faltam FPG_USER e FPG_PASS no ambiente');

  const jar = frasco();
  const r = await fetch(AJAX, {
    method: 'POST',
    headers: {
      ...COMO_BROWSER,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Origin: 'https://area.my.fpg.pt',
      Referer: 'https://area.my.fpg.pt/login/',
    },
    body: new URLSearchParams({
      action: 'myfpg_login', user: String(utilizador), password: String(senha),
    }),
  });
  if (!r.ok) throw new Error(`login: HTTP ${r.status}`);

  let d;
  try { d = JSON.parse(await r.text()); }
  catch { throw new Error('login: resposta que não é JSON — o myFPG mudou de formato?'); }

  /* O plugin deles escreve mesmo «sucess». Aceitam-se as duas grafias. */
  if (!(d.sucess ?? d.success)) {
    throw new Error(`login recusado — ${String(d.message || '').slice(0, 80)}`);
  }
  if (!d.user_id || !d.auth_token) throw new Error('login sem token — o myFPG mudou de formato?');

  const u = new URL(ATERRAR);
  u.searchParams.set('loginuser', d.user_id);
  u.searchParams.set('token', d.auth_token);
  u.searchParams.set('startpage', 'comeback');
  const a = await ir(u.toString(), jar, { headers: { Referer: 'https://area.my.fpg.pt/login/' } });
  if (!a.ok) throw new Error(`aterragem: HTTP ${a.status}`);
  if (jar.vazio()) throw new Error('a FPG não abriu sessão — mudou a aterragem?');
  return jar;
}

/** O `src` de um iframe, por id, resolvido contra a página onde estava. */
export function iframe(html, id, base) {
  for (const [tag] of html.matchAll(/<iframe[^>]*>/gi)) {
    const seu = /\bid="([^"]*)"/i.exec(tag)?.[1] || '';
    if (seu !== id && !seu.endsWith(`_${id}`)) continue;
    const src = /\bsrc="([^"]+)"/i.exec(tag)?.[1];
    if (!src || src.startsWith('cid:')) return null;
    try { return new URL(src, base).toString(); } catch { return null; }
  }
  return null;
}

/* ── ler as tabelas ────────────────────────────────────────────────────── */
const limpo = (s) => (s || '')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim();

/** Todas as linhas de uma tabela HTML, como listas de células. */
export function linhas(html) {
  const fora = [];
  for (const [, tr] of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cel = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => limpo(c[1]));
    if (cel.length) fora.push(cel);
  }
  return fora;
}

/* As colunas vêm por nome e não por posição: uma coluna nova pelo meio não
   pode fazer o índice passar a ler o stableford. */
function porNome(cabecalho) {
  /* A chave é o nome sem nada que não seja letra ou algarismo. «Gross (aj)»,
     «Dif.Net» e «Campo / Comentário» são todos escritos com pontuação que muda
     de página para página — e um parêntese esquecido deixava a coluna por
     encontrar em silêncio, com o campo a sair vazio. */
  const chave = (c) => c.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
  const i = {};
  cabecalho.forEach((c, n) => { i[chave(c)] = n; });
  return (...nomes) => {
    for (const n of nomes) {
      const k = chave(n);
      if (i[k] !== undefined) return i[k];
    }
    return -1;
  };
}

const cabecalhoCom = (todas, ...nomes) => todas.find(
  (l) => nomes.every((n) => l.some((c) => c.toLowerCase() === n.toLowerCase())));

const numero = (v) => {
  const n = Number.parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

/**
 * PlayerWHS: o índice depois de cada volta.
 *
 * `Novo` e não `Index` — o `Index` é o índice de entrada, e usá-lo dava uma
 * curva atrasada uma volta inteira.
 */
export function lerWHS(html) {
  const todas = linhas(html);
  const cab = cabecalhoCom(todas, 'Data', 'Novo');
  if (!cab) return [];
  const col = porNome(cab);
  const iData = col('data');
  const iNovo = col('novo');
  const fora = [];
  for (const l of todas) {
    if (l === cab) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(l[iData] || '')) continue;
    const hcp = numero(l[iNovo]);
    if (hcp !== null) fora.push({ data: l[iData], hcp });
  }
  return fora;
}

/** PlayerResults: as provas, com campo e resultado. */
export function lerProvas(html) {
  const todas = linhas(html);
  const cab = cabecalhoCom(todas, 'Data', 'Torneio');
  if (!cab) return [];
  const col = porNome(cab);
  const iData = col('data');
  const iProva = col('torneio', 'prova');
  const iCampo = col('campo', 'campocomentario', 'course');
  const iPar = col('par');
  const iBruto = col('grossaj', 'gross', 'bruto');
  const iAoPar = col('topar', 'aopar');
  const fora = [];
  for (const l of todas) {
    if (l === cab) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(l[iData] || '')) continue;
    if (!l[iProva]) continue;
    fora.push({
      data: l[iData],
      torneio: l[iProva],
      campo: iCampo >= 0 ? l[iCampo] || '' : '',
      par: iPar >= 0 ? numero(l[iPar]) : null,
      bruto: iBruto >= 0 ? numero(l[iBruto]) : null,
      aoPar: iAoPar >= 0 ? l[iAoPar] || '' : '',
    });
  }
  return fora;
}

/**
 * Um ponto por cada dia em que o índice mudou. Centenas de voltas viram
 * dezenas de degraus — que é o que é verdade: entre duas voltas que não
 * mexeram no número não houve evolução nenhuma para desenhar.
 */
export function degraus(pontos) {
  const ordem = [...pontos].sort((a, b) => a.data.localeCompare(b.data));
  const fora = [];
  for (const p of ordem) {
    if (!fora.length || fora[fora.length - 1].hcp !== p.hcp) fora.push(p);
  }
  return fora;
}

/* ── a cadeia de iframes ───────────────────────────────────────────────── */
async function paginaDosDados(jar, utilizador) {
  const passos = [];

  const casca = await ir(CASCA, jar, { headers: { Referer: 'https://my.fpg.pt/' } });
  passos.push(`Results.aspx: HTTP ${casca.status}`);
  if (!casca.ok) throw new Error(passos.join(' · '));
  const htmlCasca = await casca.text();

  const urlFicha = iframe(htmlCasca, 'ifrm1', CASCA);
  if (!urlFicha) throw new Error(`${passos.join(' · ')} · sem iframe da ficha em Results.aspx`);

  const ficha = await ir(urlFicha, jar, { headers: { Referer: CASCA } });
  passos.push(`ficha: HTTP ${ficha.status}`);
  if (!ficha.ok) throw new Error(passos.join(' · '));
  const htmlFicha = await ficha.text();

  /* Se algum iframe não estiver lá, constrói-se o endereço com o clube que a
     ficha revela. É o recurso, não a primeira escolha. */
  const clube = /clubCode=(\d+)/i.exec(htmlFicha)?.[1];
  const recurso = (pagina) => (clube
    ? `https://my.fpg.pt/Home/${pagina}.aspx?no=${utilizador}&clubCode=${clube}&pp=N` : null);

  return {
    whs: iframe(htmlFicha, 'ifrmWhp', urlFicha) || recurso('PlayerWHS'),
    provas: iframe(htmlFicha, 'ifrm1', urlFicha) || recurso('PlayerResults'),
    urlFicha,
    passos,
  };
}

export async function buscarRegisto(utilizador, senha) {
  const jar = await entrar(utilizador, senha);
  const { whs, provas: urlProvas, urlFicha, passos } = await paginaDosDados(jar, utilizador);

  if (!whs) throw new Error(`não encontrei a tabela de handicap. ${passos.join(' · ')} · ficha em ${urlFicha}`);

  const rWhs = await ir(whs, jar, { headers: { Referer: urlFicha } });
  if (!rWhs.ok) throw new Error(`PlayerWHS: HTTP ${rWhs.status} (${whs})`);
  const pontos = lerWHS(await rWhs.text());
  if (!pontos.length) throw new Error(`PlayerWHS lido mas sem coluna «Novo» — mudou o formato? (${whs})`);

  let provas = [];
  if (urlProvas && urlProvas !== whs) {
    const r = await ir(urlProvas, jar, { headers: { Referer: urlFicha } });
    if (r.ok) provas = lerProvas(await r.text());
  }

  return { pontos: degraus(pontos), provas, brutos: pontos.length, de: whs };
}

/* ── correr à mão ──────────────────────────────────────────────────────── */
if (import.meta.url === `file://${process.argv[1]}`) {
  const { writeFile } = await import('node:fs/promises');
  const SECO = process.argv.includes('--seco');
  const d = await buscarRegisto(process.env.FPG_USER, process.env.FPG_PASS);

  console.log(`${d.brutos} voltas · ${d.pontos.length} mudanças de índice · ${d.provas.length} provas`);
  if (d.pontos.length) {
    const a = d.pontos[0];
    const z = d.pontos[d.pontos.length - 1];
    console.log(`handicap: ${a.hcp} em ${a.data} → ${z.hcp} em ${z.data}`);
  }
  if (SECO) console.log(d.pontos.slice(-8).map((p) => `  ${p.data}  ${p.hcp}`).join('\n'));
  else {
    await writeFile(new URL('../data/handicap-historico.json', import.meta.url),
      `${JSON.stringify({ atualizado: new Date().toISOString().slice(0, 10), pontos: d.pontos }, null, 2)}\n`);
    console.log('data/handicap-historico.json escrito');
  }
}
