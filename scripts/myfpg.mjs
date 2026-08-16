/* Lê o registo de federada no myFPG — a área reservada da federação.
 *
 *   FPG_USER=43832 FPG_PASS=… node scripts/myfpg.mjs
 *   … --seco     # lê e mostra, não escreve nada
 *
 * ── o que isto vai buscar, e o que não ───────────────────────────────────
 * A área reservada tem centenas de linhas: todas as voltas contadas para
 * handicap, cada uma com campo, par, stableford e resultado bruto. Publicar
 * isso seria transformar o sítio num extrato de conta — e já ficou decidido,
 * quando a página das épocas passou a resumo, que os dias maus não são
 * conteúdo.
 *
 * Daqui saem duas coisas, e mais nenhuma:
 *
 *   · o **histórico do índice de handicap** — data e número, nada mais. É a
 *     curva que um treinador universitário procura primeiro, e é o único sítio
 *     onde 400 registos valem mais do que 4;
 *   · a **lista de provas**, que não se escreve sozinha: serve para o vigia
 *     apontar as que faltam em data/resultados.json e uma pessoa decidir. Vale
 *     aqui a mesma regra do resto do vigia — estrutura entra, prosa não.
 *
 * ── credenciais ──────────────────────────────────────────────────────────
 * Vêm do ambiente, nunca do ficheiro. Em GitHub Actions são segredos do
 * repositório; à mão, passam-se na linha de comando. Sem elas isto não corre e
 * não estraga nada: quem chama trata a ausência como «hoje não há».
 *
 * A senha nunca é escrita em lado nenhum — nem em erro, nem em registo. Os
 * dados pessoais que a área reservada mostra (morada, contactos, data de
 * nascimento) não são lidos nem guardados: o que não se lê não se perde.
 */

const AJAX = 'https://area.my.fpg.pt/wp-admin/admin-ajax.php';
const ATERRAR = 'https://my.fpg.pt/ExternalLandingPage.aspx';
/* O endereço da página de resultados foi lido de uma barra de endereço cortada
   a meio — «my.fpg.pt/Home/Resul…». Em vez de apostar num, tentam-se os
   plausíveis por ordem e fica o primeiro que traga tabela. Assim, se eles
   mudarem o nome ou se o palpite estiver errado, isto encontra o caminho em vez
   de falhar com um 404 que ninguém sabe interpretar. */
const RESULTADOS = [
  'https://my.fpg.pt/Home/Results',
  'https://my.fpg.pt/Home/ResultsWHS',
  'https://my.fpg.pt/Home/Resultados',
  'https://my.fpg.pt/Home/Result',
  'https://my.fpg.pt/Home/Index',
];

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

/* Segue redireções à mão, guardando cookies pelo caminho. */
async function ir(url, jar, opcoes = {}, limite = 6) {
  let actual = url;
  for (let salto = 0; salto < limite; salto += 1) {
    const r = await fetch(actual, {
      redirect: 'manual',
      ...opcoes,
      headers: { ...COMO_BROWSER, ...jar.cabeca(), ...(opcoes.headers || {}) },
    });
    jar.guardar(r);
    const seguinte = r.status >= 300 && r.status < 400 && r.headers.get('location');
    if (!seguinte) return r;
    actual = new URL(seguinte, actual).toString();
    opcoes = { headers: opcoes.headers };            // uma redireção vira GET
  }
  throw new Error('demasiadas redireções');
}

/** Entra e devolve o frasco com a sessão aberta. */
export async function entrar(utilizador, senha) {
  if (!utilizador || !senha) throw new Error('faltam FPG_USER e FPG_PASS no ambiente');

  const jar = frasco();
  const corpo = new URLSearchParams({
    action: 'myfpg_login', user: String(utilizador), password: String(senha),
  });

  const r = await fetch(AJAX, {
    method: 'POST',
    headers: {
      ...COMO_BROWSER,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Origin: 'https://area.my.fpg.pt',
      Referer: 'https://area.my.fpg.pt/login/',
    },
    body: corpo,
  });
  if (!r.ok) throw new Error(`login: HTTP ${r.status}`);

  const texto = await r.text();
  let d;
  try { d = JSON.parse(texto); }
  catch { throw new Error('login: resposta que não é JSON — o myFPG mudou de formato?'); }

  /* O plugin deles escreve mesmo «sucess». Aceitam-se as duas grafias, para o
     dia em que corrigirem o erro isto não parar. */
  if (!(d.sucess ?? d.success)) {
    /* A mensagem deles é sobre a credencial, não a credencial. Ainda assim
       corta-se, para nada do que foi enviado poder voltar num registo. */
    throw new Error(`login recusado — ${String(d.message || '').slice(0, 80)}`);
  }
  if (!d.user_id || !d.auth_token) throw new Error('login sem token — o myFPG mudou de formato?');

  /* A página de aterragem é o que troca o token pela sessão do ASP.NET. Sem
     ela, o my.fpg.pt não conhece ninguém. */
  const u = new URL(ATERRAR);
  u.searchParams.set('loginuser', d.user_id);
  u.searchParams.set('token', d.auth_token);
  u.searchParams.set('startpage', 'comeback');
  const a = await ir(u.toString(), jar, { headers: { Referer: 'https://area.my.fpg.pt/login/' } });
  if (!a.ok) throw new Error(`aterragem: HTTP ${a.status}`);
  if (jar.vazio()) throw new Error('a FPG não abriu sessão — mudou a aterragem?');

  return jar;
}

/* ── ler as tabelas ────────────────────────────────────────────────────── */
const limpo = (s) => (s || '')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();

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
   pode fazer o índice de handicap passar a ler o stableford. */
function porNome(cabecalho) {
  const i = {};
  cabecalho.forEach((c, n) => { i[c.toLowerCase().replace(/\s+/g, '')] = n; });
  return (...nomes) => {
    for (const n of nomes) {
      const k = n.toLowerCase().replace(/\s+/g, '');
      if (i[k] !== undefined) return i[k];
    }
    return -1;
  };
}

/**
 * Do registo de resultados tira-se o que interessa: a data, o índice de
 * handicap desse dia, e o nome da prova.
 */
export function lerRegisto(html) {
  const todas = linhas(html);
  const cab = todas.find((l) => l.some((c) => /^data$/i.test(c)));
  if (!cab) return { pontos: [], provas: [] };
  const col = porNome(cab);
  const iData = col('data');
  const iIndex = col('index', 'índice', 'hcpindex');
  const iProva = col('torneio', 'prova', 'competição');
  const iCampo = col('campo', 'course');
  const iPar = col('par');
  const iBruto = col('gross(aj)', 'gross', 'bruto');
  const iAoPar = col('topar', 'aopar');

  const pontos = [];
  const provas = [];
  for (const l of todas) {
    if (l === cab) continue;
    const data = l[iData];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data || '')) continue;

    const idx = Number.parseFloat(String(l[iIndex] ?? '').replace(',', '.'));
    if (Number.isFinite(idx)) pontos.push({ data, hcp: idx });

    const nome = l[iProva];
    if (nome) {
      provas.push({
        data,
        torneio: nome,
        campo: iCampo >= 0 ? l[iCampo] || '' : '',
        par: iPar >= 0 ? Number.parseInt(l[iPar], 10) || null : null,
        bruto: iBruto >= 0 ? Number.parseInt(l[iBruto], 10) || null : null,
        aoPar: iAoPar >= 0 ? l[iAoPar] || '' : '',
      });
    }
  }
  return { pontos, provas };
}

/**
 * Um ponto por dia em que o índice mudou. Quatrocentas linhas viram poucas
 * dezenas de degraus — que é o que a curva precisa, e o que é verdade: entre
 * duas voltas que não mexeram no índice não houve evolução nenhuma.
 */
export function degraus(pontos) {
  const ordem = [...pontos].sort((a, b) => a.data.localeCompare(b.data));
  const fora = [];
  for (const p of ordem) {
    if (!fora.length || fora[fora.length - 1].hcp !== p.hcp) fora.push(p);
  }
  return fora;
}

export async function buscarRegisto(utilizador, senha) {
  const jar = await entrar(utilizador, senha);

  const tentados = [];
  for (const url of RESULTADOS) {
    let r;
    try { r = await ir(url, jar, { headers: { Referer: 'https://my.fpg.pt/' } }); }
    catch (e) { tentados.push(`${url.split('/').pop()}: ${e.message}`); continue; }
    if (!r.ok) { tentados.push(`${url.split('/').pop()}: HTTP ${r.status}`); continue; }

    const { pontos, provas } = lerRegisto(await r.text());
    if (!pontos.length && !provas.length) { tentados.push(`${url.split('/').pop()}: sem tabela`); continue; }
    return { pontos: degraus(pontos), provas, brutos: pontos.length, de: url };
  }
  throw new Error(`nenhuma página de resultados deu tabela — ${tentados.join(' · ')}`);
}

/* ── correr à mão ──────────────────────────────────────────────────────── */
if (import.meta.url === `file://${process.argv[1]}`) {
  const { writeFile } = await import('node:fs/promises');
  const SECO = process.argv.includes('--seco');
  const d = await buscarRegisto(process.env.FPG_USER, process.env.FPG_PASS);

  console.log(`${d.brutos} voltas lidas · ${d.pontos.length} mudanças de índice · ${d.provas.length} provas`);
  if (d.pontos.length) {
    const a = d.pontos[0];
    const z = d.pontos[d.pontos.length - 1];
    console.log(`handicap: ${a.hcp} em ${a.data} → ${z.hcp} em ${z.data}`);
  }
  if (SECO) {
    console.log(d.pontos.slice(-8).map((p) => `  ${p.data}  ${p.hcp}`).join('\n'));
  } else {
    await writeFile(new URL('../data/handicap-historico.json', import.meta.url),
      `${JSON.stringify({ atualizado: new Date().toISOString().slice(0, 10), pontos: d.pontos }, null, 2)}\n`);
    console.log('data/handicap-historico.json escrito');
  }
}
