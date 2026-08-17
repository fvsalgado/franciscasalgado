/* Lê o registo de federada dela na Federação Portuguesa de Golfe.
 *
 *   node scripts/myfpg.mjs           # escreve data/handicap-historico.json
 *   node scripts/myfpg.mjs --seco    # lê e mostra, não escreve
 *
 * ── o que sai daqui, e o que não ─────────────────────────────────────────
 * O registo tem mais de quatrocentas voltas contadas para handicap, cada uma
 * com campo, par, stableford e resultado bruto. Publicar isso seria um extrato
 * de conta — e já ficou decidido, quando a página das épocas passou a resumo,
 * que os dias maus não são conteúdo.
 *
 * Saem duas coisas:
 *
 *   · o **histórico do índice**, um degrau por cada dia em que mudou. É a curva
 *     que um treinador universitário procura primeiro;
 *   · a **lista de provas**, que não se escreve sozinha — serve para o vigia
 *     apontar as que faltam e uma pessoa decidir. Estrutura entra, prosa não.
 *
 * ── como se lá chega, depois de três tentativas falhadas ─────────────────
 * A primeira versão adivinhou o endereço e levou cinco 404. A segunda seguiu a
 * cadeia de iframes até à página certa — e encontrou-a vazia, porque a tabela
 * é pintada por AJAX depois de a página abrir. Só a terceira acertou: pede-se
 * ao método que a própria tabela usa.
 *
 *   POST Home/PlayerWHS.aspx/HCPWhsFederLST       o índice, volta a volta
 *   POST Home/PlayerResults.aspx/ResultsLST       as provas
 *
 * Três coisas que não são óbvias e custaram uma tarde:
 *
 *   1. o `fed_code` vai **no corpo**, não na query string. A extensão jTable
 *      deles funde a query no JSON antes de enviar, e o método só lê de lá;
 *   2. o `jtPageSize` não passa de 100. São cinco chamadas, não uma;
 *   3. tem de ir um **`Accept-Language` a sério**. O `fetch` do Node manda
 *      `*` por omissão, e o servidor deles corta os dois primeiros caracteres
 *      desse cabeçalho para saber a língua — um asterisco não tem dois, e
 *      rebenta com «Index and length must refer to a location within the
 *      string». O curl funcionava e o Node não, e a diferença era esta.
 *
 * ── sem credenciais ──────────────────────────────────────────────────────
 * Estes métodos respondem sem sessão nenhuma. Houve aqui, durante umas horas,
 * um leitor que fazia login com utilizador e senha guardados em segredos do
 * repositório; deixou de ser preciso, e foi-se embora. Uma credencial que não
 * existe não se perde nem se usa mal.
 */

const BASE = 'https://my.fpg.pt/Home';
const NUMERO = 43832;
const POR_PAGINA = 100;                 // o servidor recusa mais

const CABECA = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Requested-With': 'XMLHttpRequest',
  Accept: 'application/json, text/javascript, */*; q=0.01',
  /* Obrigatório, e não por educação — ver a nota 3 lá em cima. */
  'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    + ' (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
};

/** Todos os registos de um método jTable, página a página. */
async function todosOsRegistos(metodo, numero, fetchImpl = fetch, limite = 12) {
  const fora = [];
  let total = null;

  for (let pagina = 0; pagina < limite; pagina += 1) {
    const r = await fetchImpl(`${BASE}/${metodo}`, {
      method: 'POST',
      headers: { ...CABECA, Referer: `${BASE}/PlayerWHS.aspx?no=${numero}&pp=N` },
      body: JSON.stringify({
        jtStartIndex: pagina * POR_PAGINA,
        jtPageSize: POR_PAGINA,
        fed_code: String(numero),
        pp: 'N',
      }),
    });
    if (!r.ok) throw new Error(`${metodo}: HTTP ${r.status}`);

    let d;
    try { ({ d } = await r.json()); }
    catch { throw new Error(`${metodo}: resposta que não é JSON`); }
    if (d?.Result !== 'OK') throw new Error(`${metodo}: ${d?.Result} — ${String(d?.Message || '').slice(0, 90)}`);

    fora.push(...(d.Records || []));
    total = d.TotalRecordCount ?? fora.length;
    if (fora.length >= total || !d.Records?.length) break;
  }

  if (total !== null && fora.length < total) {
    throw new Error(`${metodo}: só ${fora.length} de ${total} registos — o limite de páginas é curto?`);
  }
  return fora;
}

/**
 * Um ponto por cada dia em que o índice mudou. Quatrocentas voltas viram
 * duzentos degraus — que é o que é verdade: entre duas voltas que não mexeram
 * no número não houve evolução nenhuma para desenhar.
 */
export function degraus(pontos) {
  const ordem = [...pontos].sort((a, b) => a.data.localeCompare(b.data));
  return ordem.filter((p, i) => i === 0 || ordem[i - 1].hcp !== p.hcp);
}

/* `new_handicap` é o índice **depois** daquela volta. Há também `exact_handicap`,
   que é o de entrada em jogo — usá-lo dava uma curva atrasada uma volta. */
export function pontosDoRegisto(registos) {
  return registos
    .filter((x) => /^\d{4}-\d{2}-\d{2}/.test(x.hcp_dateStr || '') && Number.isFinite(Number(x.new_handicap)))
    .map((x) => ({ data: String(x.hcp_dateStr).slice(0, 10), hcp: Number(x.new_handicap) }));
}

export function provasDoRegisto(registos) {
  return registos
    .filter((x) => /^\d{4}-\d{2}-\d{2}/.test(x.score_dateStr || ''))
    .map((x) => ({
      data: String(x.score_dateStr).slice(0, 10),
      torneio: String(x.tournament_description || '').trim(),
      campo: String(x.course_description || '').trim(),
      par: Number.isFinite(Number(x.par_total)) ? Number(x.par_total) : null,
      bruto: Number.isFinite(Number(x.gross_total)) ? Number(x.gross_total) : null,
      buracos: Number(x.hole_count) || null,
    }))
    .filter((p) => p.torneio);
}

/* Uma prova, e não uma volta.
 *
 * O registo da federação conta **voltas**: um campeonato de quatro dias entra
 * quatro vezes, e entra com o dia no nome — «Campeonato Nacional Absoluto - S»,
 * «... Dia 2», «... D2». Contar linhas dava um número inflacionado que não é
 * o número de provas que ela jogou.
 *
 * Duas voltas são a mesma prova quando lhes tiramos o sufixo do dia e sobra o
 * mesmo nome, e quando estão a menos de uma semana uma da outra. A janela é
 * generosa de propósito: nomes iguais em meses diferentes — o mesmo torneio no
 * ano seguinte, uma etapa que se repete — são provas diferentes e têm de ficar
 * separadas. */
export function porProva(voltas) {
  /* O campo do nome da prova é cortado aos 50 caracteres do lado deles. Numa
     mão-cheia de casos o corte cai em cima do sufixo do dia e sobra «Senhoras
     D» ou «BPI  S Dia» — que sem esta terceira regra ficavam a contar como
     provas à parte. Só se apara o que está encostado ao limite: num nome curto,
     um «D» final é o nome. */
  const LIMITE = 50;
  const chave = (t) => (t.length >= LIMITE ? t.replace(/\s+(d|dia|day)$/i, '') : t)
    .replace(/\s*[-–]?\s*(dia|day)\s*\d+\s*$/i, '')
    .replace(/\s*[-–]?\s*d\d\s*$/i, '')
    .trim().toLowerCase();

  const ordem = [...voltas].sort((a, b) => a.data.localeCompare(b.data));
  const provas = [];
  for (const v of ordem) {
    const k = chave(v.torneio);
    const aberta = provas.find((p) => p.k === k
      && (new Date(v.data) - new Date(p.fim)) / 864e5 <= 7);
    if (aberta) { aberta.fim = v.data; aberta.voltas += 1; }
    else provas.push({ k, torneio: v.torneio, data: v.data, fim: v.data, voltas: 1 });
  }
  return provas;
}

/** Quantas provas por ano, para o resumo de cada época. */
export function porAno(provas) {
  const conta = {};
  for (const p of provas) conta[p.data.slice(0, 4)] = (conta[p.data.slice(0, 4)] || 0) + 1;
  return conta;
}

export async function buscarRegisto(numero = NUMERO, fetchImpl = fetch) {
  const [whs, res] = await Promise.all([
    todosOsRegistos('PlayerWHS.aspx/HCPWhsFederLST', numero, fetchImpl),
    todosOsRegistos('PlayerResults.aspx/ResultsLST', numero, fetchImpl).catch(() => []),
  ]);

  const pontos = pontosDoRegisto(whs);
  if (!pontos.length) throw new Error('registo lido mas sem índices — a FPG mudou de formato?');

  return { pontos: degraus(pontos), provas: provasDoRegisto(res), voltas: pontos.length };
}

/* ── correr à mão ──────────────────────────────────────────────────────── */
if (import.meta.url === `file://${process.argv[1]}`) {
  const { writeFile } = await import('node:fs/promises');
  const SECO = process.argv.includes('--seco');
  const d = await buscarRegisto();

  const a = d.pontos[0];
  const z = d.pontos[d.pontos.length - 1];
  console.log(`${d.voltas} voltas · ${d.pontos.length} mudanças de índice · ${d.provas.length} provas`);
  console.log(`handicap: ${a.hcp} em ${a.data} → ${z.hcp} em ${z.data}`);

  const provas = porProva(d.provas);
  const anos = porAno(provas);
  console.log(`${provas.length} provas · ${Object.entries(anos).map(([a, n]) => `${a}:${n}`).join(' ')}`);

  if (SECO) console.log(d.pontos.slice(-6).map((p) => `  ${p.data}  ${p.hcp}`).join('\n'));
  else {
    const hoje = new Date().toISOString().slice(0, 10);
    await writeFile(new URL('../data/handicap-historico.json', import.meta.url),
      `${JSON.stringify({ atualizado: hoje, pontos: d.pontos }, null, 2)}\n`);
    console.log('data/handicap-historico.json escrito');

    /* Contagens, e não a lista. As 425 voltas com campo, par e resultado bruto
       continuam a não sair daqui — publicar isso era o extrato de conta que já
       ficou decidido não publicar. O que sai é quantas provas, e em que ano:
       o número que faltava à página das épocas para não parecer que ela joga
       meia dúzia de torneios por época. */
    await writeFile(new URL('../data/provas-fpg.json', import.meta.url),
      `${JSON.stringify({
        atualizado: hoje, fonte: 'my.fpg.pt', total: provas.length, voltas: d.provas.length, anos,
      }, null, 2)}\n`);
    console.log('data/provas-fpg.json escrito');
  }
}
