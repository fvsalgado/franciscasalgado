/* Vigia: procura sozinho o que há de novo sobre a Francisca e escreve-o nos
 * ficheiros de dados.
 *
 *   node scripts/vigia.mjs            # escreve
 *   node scripts/vigia.mjs --seco     # só diz o que faria
 *
 * Corre todos os dias pelo GitHub Actions (.github/workflows/vigia.yml). O que
 * escreve entra no repositório, e a Vercel publica sozinha a seguir.
 *
 * ── A regra que manda em tudo ────────────────────────────────────────────
 * Só é escrito automaticamente aquilo que vem em estrutura: uma tabela com
 * colunas, uma resposta de API com campos. Isso lê-se sempre da mesma maneira
 * e ou está lá ou não está.
 *
 * O que vem em prosa — «em setembro marcará presença no…», «terminou no top
 * 10» — não é escrito por ninguém a não ser uma pessoa. O vigia deteta,
 * levanta a mão em VIGIA-ATENCAO.md, e fica à espera. Já houve duas datas
 * erradas e duas fotografias de outra atleta publicadas neste sítio por se ter
 * confiado em prosa; não se repete de forma automática.
 *
 * ── Fontes ───────────────────────────────────────────────────────────────
 * 1. European Golf Rankings — tabela de provas contadas, com posição, voltas e
 *    pontos. Estruturado: entra sozinho.
 * 2. WAGR — API oficial. Estruturado: refresca o instantâneo sozinho.
 * 3. Federação Portuguesa de Golfe — o portal é WordPress e tem API REST
 *    aberta. Título, data e endereço são estruturados: as peças de imprensa
 *    entram sozinhas. O corpo do artigo é prosa: fica para leitura humana.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { buscarEgr } from '../api/_egr.js';
import { buscarHandicap } from '../api/_handicap.js';
import { buscarRegisto, porProva } from './myfpg.mjs';

const RAIZ = new URL('../', import.meta.url);
const SECO = process.argv.includes('--seco');
const hoje = new Date().toISOString().slice(0, 10);

const ler = async (p) => JSON.parse(await readFile(new URL(p, RAIZ), 'utf8'));
const gravar = async (p, d) => {
  if (SECO) return;
  await writeFile(new URL(p, RAIZ), `${JSON.stringify(d, null, 2)}\n`);
};

/* Comparar provas entre fontes diferentes: o EGR escreve «Portuguese
   International Ladies' Amateur 2026» e nós escrevemos «96.º Campeonato
   Internacional Amador de Portugal Feminino». Por texto não casam nunca.
   Casam pela data — uma jogadora não está em dois sítios no mesmo fim de
   semana — com margem larga, porque o EGR data pelo primeiro dia e nós às
   vezes datámos pelo último. E casam também por palavras em comum, para o
   caso de as datas estarem ambas erradas. */
const CHOQUE_DIAS = 10;
const dist = (a, b) => Math.abs((new Date(a) - new Date(b)) / 86400000);

const VAZIAS = new Set(['de', 'da', 'do', 'the', 'of', 'and', 'e', 'a', 'o', 'no', 'na',
  'championship', 'campeonato', 'torneio', 'tournament', 'open', 'cup', 'taca', 'taça']);
const fichas = (s) => new Set(String(s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9 ]/g, ' ')
  .split(/\s+/)
  .filter((w) => w.length > 2 && !VAZIAS.has(w) && !/^\d{4}$/.test(w)));

function mesmaProva(nossa, dela) {
  if (nossa.data && dela.data && dist(nossa.data, dela.data) <= CHOQUE_DIAS) return true;
  if (nossa.ano !== Number(String(dela.data || '').slice(0, 4))) return false;
  const a = fichas(nossa.torneio?.pt);
  const b = fichas(dela.evento);
  let comuns = 0;
  for (const w of b) if (a.has(w)) comuns += 1;
  return comuns >= 2;
}

const novidades = [];
const atencao = [];
const falhas = [];

/* ── 0. o histórico dos rankings ───────────────────────────────────────────
 *
 * Uma posição de hoje diz pouco; a linha que ela desenha ao longo de dois anos
 * diz tudo — e é o que um treinador universitário quer ver. Como ninguém
 * guardava isto, começa-se a guardar agora: um ponto por dia em que o número
 * mude. Dias iguais não deixam rasto, para o ficheiro não crescer com ruído. */
async function historico() {
  const [w, e, h] = await Promise.all([
    ler('data/wagr.json').catch(() => ({})),
    ler('data/egr.json').catch(() => ({})),
    ler('data/rankings-historico.json').catch(() => ({ pontos: [] })),
  ]);
  if (!w.posicao && !e.posicao) return;

  const ponto = {
    data: w.atualizado || e.atualizado,
    wagr: w.posicao ?? null,
    egr: e.posicao ?? null,
    egrEscalao: e.posicaoEscalao ?? null,
    escalao: e.escalao ?? null,
  };
  const pontos = h.pontos || [];
  const ultimo = pontos[pontos.length - 1];
  const igual = ultimo && ['wagr', 'egr', 'egrEscalao'].every((k) => ultimo[k] === ponto[k]);
  if (igual) { if (ultimo.data !== ponto.data) ultimo.data = ponto.data; }
  else pontos.push(ponto);

  await gravar('data/rankings-historico.json', { pontos });
}

/* ── 0b. o handicap ───────────────────────────────────────────────────────
 *
 * O único indicador de nível que muda sozinho ao longo da época, e o primeiro
 * que um treinador procura. Vem da lista de federados da FPG. Se não vier —
 * e pode não vir, ver api/_handicap.js —, fica o que lá está e o vigia avisa
 * quando esse valor fizer mais de um mês. */
async function handicap() {
  const atual = await ler('data/handicap.json').catch(() => ({}));
  try {
    const d = await buscarHandicap();
    const mudou = atual.handicap != null && d.handicap !== atual.handicap;
    if (mudou) novidades.push(`Handicap: ${atual.handicap} → ${d.handicap}`);

    /* Duas datas, porque são duas perguntas diferentes.
     *
     * `atualizado` é quando fomos lá ver, e avança todos os dias em que a
     * federação responde. Serve para saber se isto ainda funciona — e só isso:
     * dizer «confirmado hoje» de um número que não mexe desde a primavera é
     * verdade e não informa nada.
     *
     * `desde` é quando o valor mudou pela última vez, que é o que diz alguma
     * coisa sobre a jogadora. Um handicap parado há meses lê-se de outra
     * maneira do que um que baixou na semana passada.
     *
     * Da primeira vez não se sabe desde quando é: o mais antigo que se pode
     * provar é o dia em que o valor já cá estava. Se nem isso houver, o campo
     * fica de fora — inventar «desde hoje» era dizer que mudou hoje, que é
     * precisamente a informação errada. */
    if (mudou) d.desde = hoje;
    else if (atual.desde) d.desde = atual.desde;
    else if (atual.handicap === d.handicap && atual.atualizado) d.desde = atual.atualizado;
    await gravar('data/handicap.json', d);
  } catch (err) {
    falhas.push(`handicap: ${err.message}`);
    const dias = atual.atualizado
      ? Math.round((Date.now() - Date.parse(atual.atualizado)) / 86400000) : 999;
    if (dias > 30) {
      atencao.push(`**Handicap com ${dias} dias** — ${atual.handicap ?? '—'}, confirmado a ${atual.atualizado ?? '?'}. `
        + 'Confirmar em https://portal.fpg.pt/handicaps-course-rating/pesquisa-de-handicaps/ e escrever em data/handicap.json.');
    }
  }
}

/* ── 1. European Golf Rankings ─────────────────────────────────────────── */
async function egr() {
  const anterior = await ler('data/egr.json').catch(() => ({}));
  const d = await buscarEgr();

  /* A posição no escalão é o número que abre a página de recruiting, e mexia
     em silêncio: só o WAGR era comparado, e o europeu entrava no ficheiro sem
     dizer nada a ninguém. Sobe é boa notícia, desce também é notícia. */
  if (anterior.posicaoEscalao && d.posicaoEscalao && d.posicaoEscalao !== anterior.posicaoEscalao) {
    novidades.push(`EGR Sub-18: ${anterior.posicaoEscalao}.º → ${d.posicaoEscalao}.º`);
  }
  if (anterior.posicao && d.posicao && d.posicao !== anterior.posicao) {
    novidades.push(`EGR (todas): ${anterior.posicao}.º → ${d.posicao}.º`);
  }

  await gravar('data/egr.json', {
    ...d,
  });

  const res = await ler('data/resultados.json');
  const conhecidas = res.provas.filter((p) => p.data);
  const porEntrar = [];

  for (const p of d.provas || []) {
    if (!p.data) continue;
    const ja = conhecidas.find((q) => mesmaProva(q, p));
    if (ja) {
      // já cá está; só se aproveita para corrigir a posição, se faltava
      if (ja.pos == null && p.pos != null) {
        ja.pos = p.pos;
        ja.fonte = ja.fonte || { nome: 'European Golf Rankings', url: d.ficha };
        novidades.push(`posição preenchida: ${ja.torneio?.pt || ja.id} → ${p.pos}.º (EGR)`);
      }
      continue;
    }
    porEntrar.push({
      id: `egr-${p.data}`,
      ano: Number(p.data.slice(0, 4)),
      data: p.data,
      torneio: { pt: p.evento, en: p.evento },
      campo: p.campo || '',
      local: { pt: p.pais || '', en: p.pais || '' },
      pos: p.pos ?? null,
      voltas: p.voltas || [],
      total: p.total ?? null,
      par: null,
      escalao: { pt: d.escalao || '', en: d.escalao || '' },
      selos: ['wagr'],
      nota: {
        pt: 'Entrada automática a partir da ficha no European Golf Rankings. Falta confirmar o nome em português, o par e a nota de prova.',
        en: 'Added automatically from the European Golf Rankings profile. The Portuguese name, the score to par and the event note are still to be confirmed.',
      },
      porRever: true,
      fonte: { nome: 'European Golf Rankings', url: d.ficha },
    });
  }

  if (porEntrar.length) {
    res.provas = [...porEntrar, ...res.provas].sort((a, b) => (b.data || '').localeCompare(a.data || ''));
    res.atualizado = hoje.slice(0, 7);
    await gravar('data/resultados.json', res);
    for (const p of porEntrar) {
      novidades.push(`prova nova: ${p.data} · ${p.torneio.pt} · ${p.pos ?? 's/ posição'}`);
      atencao.push(`**Prova nova (entrou já no sítio, marcada \`porRever\`)** — ${p.data} · ${p.torneio.pt}, ${p.campo}. Falta o nome em português, o par e a nota. Fonte: ${d.ficha}`);
    }
  } else if (porEntrar.length === 0) {
    // mesmo sem provas novas, a posição pode ter mudado — o ficheiro já foi gravado
  }

  return d;
}

/* ── 2. WAGR ───────────────────────────────────────────────────────────── */
const WAGR_ID = 43158;
const WAGR_API = 'https://worldgolfranking2021api.wagr.com/api/wagr/playerprofile/getPlayerById';

async function wagr() {
  const atual = await ler('data/wagr.json').catch(() => ({}));
  const r = await fetch(`${WAGR_API}?profileId=${WAGR_ID}`, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  const s = j.playerStatisticsInfo || {};
  const d = {
    atualizado: hoje,
    playerId: j.playerId,
    perfil: `https://www.wagr.com/playerprofile/${j.playerProfileLink || ''}`,
    nome: j.name,
    pais: j.countryName,
    posicao: j.position,
    mediaPontos: j.pointsAverage,
    divisor: j.divisor,
    melhorPosicao: s.bestRanking,
    vitorias: s.wins,
    top10: s.top10Finishes,
    provasContadas: s.countingEvents,
    imagem: j.imageUrl,
  };
  if (!d.posicao) throw new Error('ficha lida mas sem classificação — o WAGR mudou de formato?');
  if (atual.posicao && d.posicao !== atual.posicao) {
    novidades.push(`WAGR: ${atual.posicao}.º → ${d.posicao}.º`);
  }
  await gravar('data/wagr.json', d);
  return d;
}

/* ── 3. Federação Portuguesa de Golfe ──────────────────────────────────── */
/* O portal é WordPress, e a API REST responde sem chave. A pesquisa do
   WordPress é generosa — devolve tudo o que tenha «Francisca» ou «Salgado» —
   por isso filtra-se aqui pelo nome inteiro. */
const NOME = /francisca\s+salgado/i;

/* Frases que só aparecem quando se está a anunciar prova que ainda não houve.
   Não servem para escrever nada: servem para o vigia levantar a mão. */
/* Só intenção declarada. Uma versão anterior também aceitava «em setembro» e
   afins, e passou a assinalar todos os artigos que tinham um mês escrito —
   que são todos. */
const FUTURO = /(marcar[áa] presen[çc]a|vai disputar|ir[áa] disputar|regressa[ráa]* [àa] competi|vai competir|ir[áa] competir|est[áa] convocad|foi convocad|pr[óo]xim[ao] (prova|torneio|compromisso|desafio)|segue para|parte para)/i;

const ENTIDADES = { 8216: '‘', 8217: '’', 8220: '“', 8221: '”', 8211: '–', 8212: '—',
                    38: '&', 39: "'", 34: '"', 60: '<', 62: '>', 160: ' ' };
const semTags = (s) => (s || '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => ENTIDADES[n] || ' ')
  .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, ' ')
  .replace(/\s+/g, ' ').trim();

/* Ela aparece em dezenas de artigos da FPG que não são sobre ela: listas de
   convocados, tabelas de resultados de provas ganhas por outras pessoas. Pôr
   tudo isso na página de imprensa era transformá-la num arquivo da federação.
   Por isso a régua é o título: se o nome está no título, a peça é sobre ela e
   entra sozinha. Se está só no corpo, o vigia aponta e uma pessoa decide. */
async function fpg() {
  const imprensa = await ler('data/imprensa.json');
  const jaTemos = new Set(imprensa.pecas.map((p) => p.url.replace(/\/$/, '')));

  const achados = [];
  for (let pagina = 1; pagina <= 5; pagina += 1) {
    const u = new URL('https://portal.fpg.pt/wp-json/wp/v2/posts');
    u.searchParams.set('search', 'Francisca Salgado');
    u.searchParams.set('per_page', '100');
    u.searchParams.set('page', String(pagina));
    u.searchParams.set('_fields', 'id,date,link,title,content');
    u.searchParams.set('orderby', 'date');
    const r = await fetch(u, { headers: { 'User-Agent': 'franciscasalgado.golf' } });
    if (r.status === 400) break; // passou da última página
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const lote = await r.json();
    if (!Array.isArray(lote) || !lote.length) break;
    achados.push(...lote);
    if (lote.length < 100) break;
  }

  const novas = [];
  const soNoCorpo = [];
  for (const p of achados) {
    const titulo = semTags(p.title?.rendered);
    const corpo = semTags(p.content?.rendered);
    const url = (p.link || '').replace(/\/$/, '');
    if (!url || jaTemos.has(url)) continue;

    if (NOME.test(titulo)) {
      novas.push({ o: 'FPG', data: (p.date || '').slice(0, 7), t: { pt: titulo, en: titulo }, url: `${url}/` });
    } else if (NOME.test(corpo)) {
      soNoCorpo.push({ titulo, url, data: (p.date || '').slice(0, 10), futuro: FUTURO.test(corpo) });
      continue;                                    // não entra sozinho no sítio
    } else {
      continue;                                    // nem sequer a menciona
    }

    if (FUTURO.test(corpo)) {
      atencao.push(`**Pode anunciar prova futura** — [${titulo}](${url}/), ${(p.date || '').slice(0, 10)}. O vigia não escreve calendário a partir de prosa: se confirmar, acrescente à lista \`proximas\` em \`data/resultados.json\`.`);
    }
  }

  if (novas.length) {
    imprensa.pecas = [...novas, ...imprensa.pecas]
      .sort((a, b) => (b.data || '').localeCompare(a.data || ''));
    await gravar('data/imprensa.json', imprensa);
    for (const n of novas) novidades.push(`imprensa: ${n.data} · ${n.t.pt}`);
  }

  /* As menções de passagem ficam listadas, e nunca mais são listadas outra
     vez: o ficheiro guarda o que já foi mostrado, para o aviso não repetir
     todos os dias o mesmo artigo de 2024. */
  if (soNoCorpo.length) {
    const vistas = await ler('data/vigia-vistas.json').catch(() => ({ urls: [] }));
    const jaMostradas = new Set(vistas.urls || []);
    const frescas = soNoCorpo.filter((m) => !jaMostradas.has(m.url))
      .sort((a, b) => b.data.localeCompare(a.data));
    if (frescas.length) {
      atencao.push(`**${frescas.length} peça(s) que a mencionam sem ser no título** — cobertura de prova, listas de convocadas, tabelas de resultados. Entram só se alguém decidir que valem:\n${
        frescas.slice(0, 25).map((m) => `  - ${m.data} · [${m.titulo}](${m.url}/)${m.futuro ? ' · *pode anunciar prova futura*' : ''}`).join('\n')}${
        frescas.length > 25 ? `\n  - …e mais ${frescas.length - 25}.` : ''}`);
      await gravar('data/vigia-vistas.json', {
        '_leia-me': 'Endereços de peças que o vigia já mostrou em VIGIA-ATENCAO.md e não deve voltar a mostrar. Apagar uma linha faz a peça reaparecer no próximo aviso.',
        urls: [...jaMostradas, ...frescas.map((m) => m.url)].sort(),
      });
    }
  }

  return novas.length;
}

/* ── correr ────────────────────────────────────────────────────────────── */
let tentados = 0;
const passo = async (nome, fn) => {
  tentados += 1;
  try { return await fn(); }
  catch (e) { falhas.push(`${nome}: ${e.message}`); return null; }
};

await passo('EGR', egr);
await passo('WAGR', wagr);
await passo('histórico', historico);
await passo('handicap', handicap);
await passo('FPG', fpg);

/* ── 5. registo de federada na FPG ─────────────────────────────────────── */
/* Sem credenciais: os métodos que a tabela deles usa respondem a quem
   perguntar. Ver scripts/myfpg.mjs.
 *
 * Daqui sai o histórico do índice de handicap. As provas que a federação
 * conhece e o data/resultados.json não vão para o VIGIA-ATENCAO — como tudo o
 * resto que precisa de nome em português e de contexto. */
await passo('myFPG', async () => {
    const d = await buscarRegisto();
    const antes = await ler('data/handicap-historico.json').catch(() => ({ pontos: [] }));

    /* Juntar, nunca substituir.
     *
     * A área reservada mostra as últimas cem voltas, e só essas. Substituir o
     * ficheiro por cada leitura apagava tudo o que ficou para trás dessa
     * janela: o histórico encolheria sozinho com o tempo, e a curva perderia
     * o princípio — que é justamente a parte que mostra a evolução. A data é
     * chave; quando a mesma data vier outra vez, vale a leitura de hoje. */
    const porData = new Map((antes.pontos || []).map((p) => [p.data, p]));
    for (const p of d.pontos) porData.set(p.data, p);
    const juntos = [...porData.values()].sort((a, b) => a.data.localeCompare(b.data));

    /* Os degraus contam-se outra vez sobre o conjunto: duas janelas coladas
       podem ter o mesmo valor de um lado e do outro da emenda. */
    const pontos = juntos.filter((p, i) => i === 0 || juntos[i - 1].hcp !== p.hcp);

    if (pontos.length > (antes.pontos || []).length) {
      const novos = pontos.length - (antes.pontos || []).length;
      novidades.push(`histórico de handicap: +${novos} degrau(s), ${pontos.length} no total`);
    }
    await gravar('data/handicap-historico.json', { atualizado: hoje, pontos });

    /* Que provas do registo federado ainda não têm cartão no sítio.
     *
     * Este aviso já foi outra coisa, e enganava-se de duas maneiras.
     *
     * A primeira: comparava voltas com provas. Agora agrupa-se primeiro — um
     * campeonato de quatro dias é uma prova, não quatro (`porProva`).
     *
     * A segunda, pior: comparava datas exactas e os primeiros dezoito
     * caracteres do nome. A FPG escreve «96th Portuguese International Ladies
     * Amateur Champ» e nós escrevemos «96.º Campeonato Internacional Amador de
     * Portugal Feminino»; a FPG data a primeira volta e nós às vezes o último
     * dia. Nenhuma das duas coisas casava, e o aviso dava como «em falta»
     * provas que estavam no sítio há meses — incluindo o Europeu por Equipas.
     * Casa-se pelo arco da prova, com cinco dias de folga de cada lado, que é
     * o sinal fiável quando os nomes estão em línguas diferentes.
     *
     * E o que sobra passa por um crivo. O registo federado tem duzentas e
     * tal provas, e a maior parte são voltas de clube — roll-ups, ordens de
     * mérito, taças da casa. Não são cartão de nenhum sítio, e listá-las todas
     * os dias era garantir que ninguém lia o aviso. Fica o que tem nome de
     * campeonato ou de prova internacional: uma lista que uma pessoa consegue
     * mesmo percorrer.
     *
     * Nota importante desde agosto de 2026: **o número de provas do sítio já
     * vem daqui**. Uma prova sem cartão não é um buraco na contagem — é só uma
     * prova de que não se sabe a classificação. Ver docs/dados.md. */
    const CLUBE_OU_SOCIAL = /nacional|national|internacional|international|european|europe|masters|espa[ñn]a|espanha|andaluc|galicia|madrid|world|juvenil|absoluto|infantil|interterritorial|fexgolf/i;
    const dia = 86400000;
    const mesmoArco = (nossa, dela) => {
      const ini = new Date(dela.data).getTime() - 5 * dia;
      const fim = new Date(dela.fim || dela.data).getTime() + 5 * dia;
      const q = new Date(nossa.data).getTime();
      return q >= ini && q <= fim;
    };

    const res = await ler('data/resultados.json');
    const conhecidas = res.provas.filter((p) => p.data);
    const faltam = porProva(d.provas)
      .filter((p) => !conhecidas.some((q) => mesmoArco(q, p)))
      .filter((p) => CLUBE_OU_SOCIAL.test(p.torneio));

    if (faltam.length) {
      /* Uma volta contada para handicap não é uma prova para o sítio: o
         campeonato do clube e a volta de sábado entram na mesma tabela. Por
         isso listam-se, e é uma pessoa que escolhe. */
      /* Uma vez cada, e nunca mais — a mesma regra das peças de imprensa.
         São quase trezentas: sem memória, a issue de amanhã seria igual à de
         hoje, e uma issue que se repete todos os dias deixa de se ler. O que
         já foi mostrado fica no caderno do vigia, fora do que é publicado. */
      const vistas = await ler('data/vigia-vistas.json').catch(() => ({}));
      const jaVistas = new Set(vistas.provas || []);
      const porNome = new Map();
      for (const p of faltam) {
        const chave = `${p.data}|${p.torneio}`;
        if (jaVistas.has(chave) || porNome.has(p.torneio)) continue;
        porNome.set(p.torneio, { ...p, chave });
      }

      if (porNome.size) {
        const lista = [...porNome.values()].sort((a, b) => b.data.localeCompare(a.data));
        atencao.push(`**${lista.length} campeonato(s) do registo da FPG sem cartão no sítio** — a contagem de provas da página das épocas já vem do registo federado, por isso isto não é um buraco nos números: são provas de que não se sabe a classificação. Entram se alguém a apurar e escrever. Cada uma é listada uma vez só:\n${
          lista.slice(0, 40).map((p) => `  - ${p.data} · ${p.torneio}${p.campo ? ` · ${p.campo}` : ''}${p.bruto ? ` · ${p.bruto}${p.par ? ` (par ${p.par})` : ''}` : ''}`).join('\n')}${
          lista.length > 40 ? `\n  - …e mais ${lista.length - 40}, no próximo aviso.` : ''}`);

        /* Só as que foram mesmo mostradas entram no caderno; as que ficaram de
           fora do corte voltam amanhã, que é o que se quer. */
        await gravar('data/vigia-vistas.json', {
          ...vistas,
          provas: [...jaVistas, ...lista.slice(0, 40).map((p) => p.chave)].sort(),
        });
      }
    }
});

/* Contagens que se derivam dos dados e estavam escritas à mão. */
await passo('contagens', async () => {
  const [res, imp, perfil] = await Promise.all([
    ler('data/resultados.json'), ler('data/imprensa.json'), ler('data/perfil.json'),
  ]);
  const vitorias = res.provas.filter((p) => p.pos === 1).length;
  /* Amplitude, e não contagem de anos distintos: o rótulo diz «do primeiro
     pódio até à época que está a correr», e há anos pelo meio de que não há
     registo — 2020, por exemplo. Contar anos distintos dava 8 e dizia, sem
     querer, que ela esteve um ano parada. */
  const anos = res.provas.map((p) => p.ano).filter(Boolean);
  const epocas = anos.length ? Math.max(...anos) - Math.min(...anos) + 1 : 0;
  const mexeu = [];
  const pôr = (lista, rotulo, valor) => {
    const n = lista?.find((x) => x.r?.pt === rotulo);
    if (n && n.v !== String(valor)) { mexeu.push(`${rotulo}: ${n.v} → ${valor}`); n.v = String(valor); }
  };
  pôr(perfil.numeros, 'Vitórias', vitorias);
  pôr(perfil.apoioNumeros, 'Peças de imprensa', imp.pecas.length);
  pôr(perfil.apoioNumeros, 'Épocas em prova', epocas);

  /* As idas a Espanha vivem contadas por ano, e o cartão mostra a soma. Assim
     acrescenta-se uma viagem onde ela aconteceu e o número acerta-se sozinho —
     em vez de haver um total escrito à mão a envelhecer ao lado da lista que o
     contradiz. */
  const espanha = Object.values(perfil.espanha?.porAno || {}).reduce((s, n) => s + n, 0);
  if (espanha) pôr(perfil.apoioNumeros, 'Idas a Espanha', espanha);

  /* A linha das classificações na ficha é o recurso para quando as APIs não
     respondem — e estava escrita à mão, portanto envelhecia calada. Ficou uma
     semana a dizer 197.ª quando já era 198.ª, e é dela que sai o llms.txt, que
     é precisamente o que um assistente vai ler. Passa a ser reescrita aqui, com
     os números que este mesmo ciclo acabou de ir buscar. */
  const [w, e] = await Promise.all([
    ler('data/wagr.json').catch(() => ({})), ler('data/egr.json').catch(() => ({})),
  ]);
  const linha = perfil.factos?.find((f) => f.vivo === 'rankings');
  if (linha && w.posicao && e.posicaoEscalao) {
    const pt = `${w.posicao}.ª no WAGR · ${e.posicaoEscalao}.ª no European Golf Rankings Sub-18`;
    const en = `${w.posicao}th on the WAGR · ${e.posicaoEscalao}th on the European Golf Rankings U18`;
    if (linha.dd.pt !== pt) { mexeu.push(`ficha dos rankings: ${linha.dd.pt} → ${pt}`); linha.dd.pt = pt; linha.dd.en = en; }
  }

  if (mexeu.length) { await gravar('data/perfil.json', perfil); novidades.push(...mexeu.map((m) => `número: ${m}`)); }
});

/* ── o que ficou ───────────────────────────────────────────────────────── */
const resumo = [
  `# Vigia — ${hoje}`,
  '',
  novidades.length ? `## ${novidades.length} novidade(s)\n\n${novidades.map((n) => `- ${n}`).join('\n')}` : '## Sem novidades',
  falhas.length ? `\n## Fontes que não responderam\n\n${falhas.map((f) => `- ${f}`).join('\n')}` : '',
].filter(Boolean).join('\n');

const paraOlhar = atencao.length
  ? [`# Precisa de olhos — ${hoje}`, '', ...atencao.map((a) => `- ${a}`), '',
     'Isto não é escrito automaticamente porque vem em prosa, e prosa lida por uma máquina já pôs datas erradas neste sítio.'].join('\n')
  : '';

if (!SECO) {
  await writeFile(new URL('VIGIA.md', RAIZ), `${resumo}\n`);
  await writeFile(new URL('VIGIA-ATENCAO.md', RAIZ), paraOlhar ? `${paraOlhar}\n` : '');
}

console.log(resumo);
if (paraOlhar) console.log(`\n${paraOlhar}`);

/* A ronda falha quando o vigia não conseguiu fazer o trabalho — não quando um
   sítio de terceiros esteve em baixo.
 *
 * A regra era falhar sempre que houvesse uma fonte sem resposta e nenhuma
 * novidade. Num dia calmo com o servidor da federação a dar erro — que é o que
 * ele anda a dar — isso é uma cruz vermelha todos os dias, e uma cruz vermelha
 * todos os dias é uma cruz que ninguém lê. No dia em que falhar alguma coisa a
 * sério, ninguém repara.
 *
 * Uma fonte em baixo é notícia para o relatório, e está lá escrita. Se falharem
 * todas, então o que está partido é a rede ou o próprio vigia, e aí sim vale a
 * pena acordar alguém. E uma fonte que fique em baixo tempo a mais acaba por
 * aparecer no VIGIA-ATENCAO.md pelo aviso do valor com dias a mais — que é o
 * canal certo, porque precisa de uma pessoa e não de uma nova tentativa. */
if (falhas.length >= tentados) process.exitCode = 1;
