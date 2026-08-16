/* A página para treinadores universitários.
 *
 * O que um treinador americano procura, e por que ordem: handicap, ano de
 * conclusão do secundário, ranking mundial, calendário, resultados, contacto.
 * Nada disto é novo no sítio — o que é novo é estar tudo junto, numa página, na
 * ordem em que ele pergunta.
 *
 * O que não existe não aparece. Não há média de voltas nem velocidade de
 * driver medidas com rigor, por isso não há campo nenhum a dizer «—»: um campo
 * vazio numa ficha de recrutamento lê-se como uma resposta má, e a ausência
 * lê-se como o que é.
 */

import { buscar } from './rankings.js';
import { proxima } from './resultados.js';

const tx = (v, l) => (typeof v === 'string' ? v : v?.[l] || v?.pt || '');

const T = {
  pt: {
    hcp: 'Handicap', hcpS: 'Índice WHS · Federação Portuguesa de Golfe',
    wagr: 'WAGR', wagrS: 'Ranking mundial amador',
    egr: 'EGR Sub-18', egrS: 'Ranking europeu feminino, escalão',
    ano: 'Conclusão do secundário', anoS: 'Turma de',
    vivo: 'Em direto', guardado: 'Confirmado a', desde: 'Última alteração a',
    curva: 'Evolução', curvaS: 'Quanto mais alto, melhor a posição',
    hcp2: 'Índice de handicap', hcpEixo: 'Quanto mais alto, mais baixo o índice',
    prox: 'Próxima prova',
  },
  en: {
    hcp: 'Handicap', hcpS: 'WHS index · Portuguese Golf Federation',
    wagr: 'WAGR', wagrS: 'World amateur ranking',
    egr: 'EGR U18', egrS: 'European women\'s ranking, age category',
    ano: 'High school graduation', anoS: 'Class of',
    vivo: 'Live', guardado: 'Confirmed on', desde: 'Last changed',
    curva: 'Progression', curvaS: 'Higher is a better position',
    hcp2: 'Handicap index', hcpEixo: 'Higher means a lower index',
    prox: 'Next event',
  },
};

/* A secção que depende deste contentor — a mesma que o scripts/estatico.mjs
   marca com `data-se-vazio`. Aqui e lá, o critério é um só: há conteúdo? */
const mostrar = (cx, sim) => cx.closest('section[data-se-vazio]')?.toggleAttribute('hidden', !sim);

const ord = (n, l) => (l === 'en'
  ? `${n}${['th', 'st', 'nd', 'rd'][n % 100 >= 11 && n % 100 <= 13 ? 0 : n % 10] || 'th'}`
  : `${n}.ª`);

/* ── os quatro números da cabeça ──────────────────────────── */
export async function fichaRecruiting(cx, lingua = 'pt') {
  if (!cx) return;
  const t = T[lingua] || T.pt;

  const [h, m, e, perfil] = await Promise.all([
    buscar('/api/handicap', '/data/handicap.json', (d) => d?.handicap != null),
    buscar('/api/wagr', '/data/wagr.json'),
    buscar('/api/egr', '/data/egr.json'),
    fetch('/data/perfil.json', { cache: 'no-cache' }).then((r) => r.json()).catch(() => ({})),
  ]);

  /* Desde quando o handicap não mexe. Não vem da API — em direto lê-se um
     número, não a história dele —, por isso vem sempre do instantâneo, que é o
     que o vigia mantém. É o mesmo ficheiro que já serve de recurso ali em
     cima, e por isso já está em cache.
   *
   * Só se mostra quando já diz alguma coisa. No primeiro dia as duas datas são
   * a mesma — fomos lá ver hoje e não temos leitura anterior —, e uma «última
   * alteração» com a data de hoje lê-se como «mudou hoje», que é o contrário do
   * que se passa. Enquanto forem iguais, fica a nota antiga. */
  const desde = await fetch('/data/handicap.json', { cache: 'no-cache' })
    .then((r) => r.json())
    .then((d) => (d.desde && d.desde !== d.atualizado ? d.desde : null))
    .catch(() => null);

  const cartao = ({ v, sup, r, s, nota }) => `
    <article class="rec">
      <span class="rec__v num">${v}${sup ? `<sup>${sup}</sup>` : ''}</span>
      <span class="rec__r">${r}</span>
      <p class="rec__s">${s}</p>
      ${nota ? `<p class="rec__n">${nota}</p>` : ''}
    </article>`;

  const cartoes = [];

  if (h) {
    const n = Number(h.d.handicap);
    cartoes.push(cartao({
      v: lingua === 'en' ? n.toFixed(1) : n.toFixed(1).replace('.', ','),
      r: t.hcp, s: t.hcpS,
      /* «Confirmado a hoje» é verdade e não diz nada — a data em que fomos lá
         ver renova-se sozinha. A que informa é aquela em que o número mexeu
         pela última vez. Enquanto não houver duas leituras diferentes para a
         saber, fica a antiga. */
      nota: desde ? `${t.desde} ${desde}` : (h.vivo ? t.vivo : `${t.guardado} ${h.d.atualizado}`),
    }));
  }
  if (m) cartoes.push(cartao({ v: m.d.posicao, sup: ord(m.d.posicao, lingua).replace(String(m.d.posicao), ''), r: t.wagr, s: t.wagrS }));
  if (e && e.d.posicaoEscalao) {
    cartoes.push(cartao({
      v: e.d.posicaoEscalao, sup: ord(e.d.posicaoEscalao, lingua).replace(String(e.d.posicaoEscalao), ''),
      r: t.egr, s: `${t.egrS} ${e.d.escalao}`,
    }));
  }
  if (perfil.secundario?.ano) {
    cartoes.push(cartao({ v: perfil.secundario.ano, r: t.ano, s: `${t.anoS} ${perfil.secundario.ano}` }));
  }

  /* A próxima prova em cartão, e não o calendário inteiro: esse está na página
     das épocas, e repeti-lo aqui era a mesma lista duas vezes. */
  const prox = await proxima(lingua);
  if (prox) {
    const [quando, nome] = prox.texto.split(' · ');
    cartoes.push(cartao({ v: quando, r: t.prox, s: nome || '' }));
  }

  cx.className = 'recs';
  cx.innerHTML = cartoes.join('');
}

/* ── a curva dos rankings ─────────────────────────────────────
 *
 * Desenhada à mão em SVG, sem biblioteca: são duas linhas e uns eixos, e uma
 * biblioteca de gráficos pesaria mais do que a página inteira.
 *
 * O eixo está ao contrário de propósito — no golfe, descer no número é subir
 * na carreira, e uma linha que descesse a cada boa notícia lia-se ao contrário
 * do que diz. Com menos de três pontos não se desenha nada: uma linha entre
 * dois pontos não é uma tendência, é um traço. */
export async function curvaRankings(cx, lingua = 'pt') {
  if (!cx) return;
  const t = T[lingua] || T.pt;

  /* Limpar antes de desistir, e não só ao desenhar.
   *
   * O que está no ficheiro foi lá escrito pelo scripts/estatico.mjs a partir de
   * uma corrida anterior. Se hoje não há dados e isto sair sem limpar, o
   * desenho de ontem continua no DOM — e o pré-renderizador volta a guardá-lo,
   * para sempre. Uma curva que já não tem dados nenhuns ficaria eternamente na
   * página, sem ninguém dar por isso. */
  let pontos = [];
  try { ({ pontos = [] } = await (await fetch('/data/rankings-historico.json', { cache: 'no-cache' })).json()); }
  catch { cx.innerHTML = ''; mostrar(cx, false); return; }
  /* Sem linha para desenhar, a secção fica escondida — um cabeçalho com nada
     por baixo lê-se como uma coisa que se partiu. Escondida, e não removida:
     é a mesma secção que volta sozinha no dia em que houver terceiro ponto. */
  if (pontos.length < 3) { cx.innerHTML = ''; mostrar(cx, false); return; }
  mostrar(cx, true);

  const L = 720;
  const A = 220;
  const pad = { e: 6, d: 6, c: 18, b: 26 };

  const linha = (chave, cor) => {
    const vs = pontos.map((p) => p[chave]).filter((v) => v != null);
    if (vs.length < 3) return '';
    const min = Math.min(...vs);
    const max = Math.max(...vs);
    const faixa = max - min || 1;
    const d = pontos.map((p, i) => {
      if (p[chave] == null) return null;
      const x = pad.e + (i / (pontos.length - 1)) * (L - pad.e - pad.d);
      /* invertido: número mais baixo, ponto mais alto */
      const y = pad.c + ((p[chave] - min) / faixa) * (A - pad.c - pad.b);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).filter(Boolean);
    return `<polyline points="${d.join(' ')}" fill="none" stroke="${cor}"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="${d[d.length - 1].split(',')[0]}" cy="${d[d.length - 1].split(',')[1]}" r="3.5" fill="${cor}" />`;
  };

  const de = pontos[0].data;
  const a = pontos[pontos.length - 1].data;

  cx.innerHTML = `
    <figure class="curva">
      <svg viewBox="0 0 ${L} ${A}" role="img" preserveAspectRatio="none"
           aria-label="${t.curva}: ${t.curvaS}">
        ${linha('wagr', 'var(--relva)')}
        ${linha('egrEscalao', 'var(--ouro)')}
      </svg>
      <figcaption class="curva__l">
        <span><i style="background:var(--relva)"></i>${t.wagr}</span>
        <span><i style="background:var(--ouro)"></i>${t.egr}</span>
        <span class="curva__d num">${de} → ${a}</span>
      </figcaption>
    </figure>`;
}

/* ── what's in the bag ────────────────────────────────────────
 *
 * Os tacos, a bola, a luva e o saco. É a página que os jogadores de golfe
 * abrem primeiro em qualquer sítio de atleta, e para um treinador diz coisas
 * que um resultado não diz — que shaft aguenta, que ferros joga.
 *
 * Enquanto o data/witb.json estiver vazio, isto não desenha nada e a secção
 * sai da página. Meio WITB diz menos do que nenhum. */
/* ── a curva do handicap ──────────────────────────────────────
 *
 * A mesma ideia da curva dos rankings, e por isso o mesmo eixo invertido: no
 * handicap, como na classificação, descer no número é subir na carreira.
 *
 * A diferença é a quantidade. O registo da federação tem centenas de voltas,
 * mas só algumas dezenas mudaram o índice — e são essas que o scripts/myfpg.mjs
 * guarda. Entre duas voltas que não mexeram no número não houve evolução
 * nenhuma para desenhar. */
export async function curvaHandicap(cx, lingua = 'pt') {
  if (!cx) return;
  const t = T[lingua] || T.pt;

  let pontos = [];
  try { ({ pontos = [] } = await (await fetch('/data/handicap-historico.json', { cache: 'no-cache' })).json()); }
  catch { cx.innerHTML = ''; mostrar(cx, false); return; }
  if (pontos.length < 3) { cx.innerHTML = ''; mostrar(cx, false); return; }
  mostrar(cx, true);

  const L = 720;
  const A = 220;
  const pad = { e: 6, d: 6, c: 18, b: 26 };

  const vs = pontos.map((p) => p.hcp);
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  const faixa = max - min || 1;

  /* O eixo do tempo é o tempo, e não a ordem dos pontos: um índice parado dois
     anos e depois a cair em três meses tem de se ver como isso mesmo. Espaçar
     por índice esticava a pausa e encolhia a queda. */
  const t0 = Date.parse(pontos[0].data);
  const t1 = Date.parse(pontos[pontos.length - 1].data);
  const vao = t1 - t0 || 1;

  const xy = pontos.map((p) => {
    const x = pad.e + ((Date.parse(p.data) - t0) / vao) * (L - pad.e - pad.d);
    const y = pad.c + ((p.hcp - min) / faixa) * (A - pad.c - pad.b);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const fim = xy[xy.length - 1].split(',');
  const num = (n) => (lingua === 'en' ? n.toFixed(1) : n.toFixed(1).replace('.', ','));

  cx.innerHTML = `
    <figure class="curva">
      <svg viewBox="0 0 ${L} ${A}" role="img" preserveAspectRatio="none"
           aria-label="${t.hcp2}: ${t.hcpEixo}">
        <polyline points="${xy.join(' ')}" fill="none" stroke="var(--relva)"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="${fim[0]}" cy="${fim[1]}" r="3.5" fill="var(--relva)" />
      </svg>
      <figcaption class="curva__l">
        <span><i style="background:var(--relva)"></i>${t.hcp2}</span>
        <span class="curva__d num">${num(max)} → ${num(min)}</span>
        <span class="curva__d num">${pontos[0].data} → ${pontos[pontos.length - 1].data}</span>
      </figcaption>
    </figure>`;
}

export async function witb(cx, lingua = 'pt') {
  if (!cx) return;
  let d = {};
  try { d = await (await fetch('/data/witb.json', { cache: 'no-cache' })).json(); } catch { return; }

  const en = lingua === 'en';
  const linhas = [
    ...(d.tacos || []).map((t) => ({ r: tx(t.t, lingua), m: t.m, n: tx(t.n, lingua) })),
    ...(d.bola ? [{ r: en ? 'Ball' : 'Bola', m: d.bola }] : []),
    ...(d.luva ? [{ r: en ? 'Glove' : 'Luva', m: d.luva }] : []),
    ...(d.saco ? [{ r: en ? 'Bag' : 'Saco', m: d.saco }] : []),
    ...(d.extras || []).map((t) => ({ r: tx(t.t, lingua), m: t.m, n: tx(t.n, lingua) })),
  ].filter((l) => l.m);

  if (!linhas.length) { cx.innerHTML = ''; mostrar(cx, false); return; }
  mostrar(cx, true);

  cx.className = 'factos';
  cx.innerHTML = linhas.map((l) => `
    <div><dt>${l.r}</dt><dd>${l.m}${l.n ? ` <span class="dest__o">${l.n}</span>` : ''}</dd></div>`).join('');
}

/* ── o swing, para quem avalia ────────────────────────────────
 *
 * Vídeos de swing por vista — face-on, down-the-line, jogo curto, putting.
 * Não carregam nada do YouTube antes de alguém carregar no botão, como o resto
 * do sítio. Sem vídeos, a secção sai da página. */
export async function swing(cx, lingua = 'pt') {
  if (!cx) return;
  let videos = [];
  try { ({ videos = [] } = await (await fetch('/data/swing.json', { cache: 'no-cache' })).json()); }
  catch { return; }
  if (!videos.length) { cx.innerHTML = ''; mostrar(cx, false); return; }
  mostrar(cx, true);

  const { videos: pintar } = await import('./media.js');
  await pintar(cx, lingua, videos);
}
