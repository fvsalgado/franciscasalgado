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
import { proxima, mesAno } from './resultados.js';
import { reduzido } from './movimento.js';

const tx = (v, l) => (typeof v === 'string' ? v : v?.[l] || v?.pt || '');

const T = {
  pt: {
    hcp: 'Handicap', hcpS: 'Índice WHS · Federação Portuguesa de Golfe',
    wagr: 'WAGR', wagrS: 'Ranking mundial amador',
    egr: 'EGR Sub-18', egrS: 'Ranking europeu feminino, escalão',
    ano: 'Conclusão do secundário', anoS: 'Turma de',
    vivo: 'Em direto', guardado: 'Confirmado a', desde: 'Desde',
    curva: 'Evolução', curvaS: 'Quanto mais alto, melhor a posição',
    hcp2: 'Índice de handicap', hcpEixo: 'Quanto mais alto, mais baixo o índice',
    hcpX: 'No golfe, quanto mais baixo o índice, melhor o jogador. A linha sobe porque o número desceu.',
    rkX: 'O WAGR é o ranking mundial amador; o EGR, o europeu por escalão. Como no handicap, a linha sobe quando o número desce.',
    prox: 'Próxima prova',
  },
  en: {
    hcp: 'Handicap', hcpS: 'WHS index · Portuguese Golf Federation',
    wagr: 'WAGR', wagrS: 'World amateur ranking',
    egr: 'EGR U18', egrS: 'European women\'s ranking, age category',
    ano: 'High school graduation', anoS: 'Class of',
    vivo: 'Live', guardado: 'Confirmed', desde: 'Since',
    curva: 'Progression', curvaS: 'Higher is a better position',
    hcp2: 'Handicap index', hcpEixo: 'Higher means a lower index',
    hcpX: 'In golf, the lower the index the better the player. The line rises because the number fell.',
    rkX: 'The WAGR is the world amateur ranking; the EGR, the European one by age category. As with the handicap, the line rises when the number falls.',
    prox: 'Next event',
  },
};

/* A secção que depende deste contentor — a mesma que o scripts/estatico.mjs
   marca com `data-se-vazio`. Aqui e lá, o critério é um só: há conteúdo? */
const mostrar = (cx, sim) => cx.closest('section[data-se-vazio]')?.toggleAttribute('hidden', !sim);

const ord = (n, l) => (l === 'en'
  ? `${n}${['th', 'st', 'nd', 'rd'][n % 100 >= 11 && n % 100 <= 13 ? 0 : n % 10] || 'th'}`
  : `${n}.ª`);

/* «2026-08-15» é como a máquina guarda a data, não como uma pessoa a lê — e
   estava escrito assim, ao alto, num cartão virado para fora. Curta porque o
   cartão é pequeno e a nota é a linha mais discreta dele. */
const MESES_C = {
  pt: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
const dataCurta = (iso, l) => {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso);
  const m = MESES_C[l === 'en' ? 'en' : 'pt'][d.getMonth()];
  return l === 'en'
    ? `${m} ${d.getDate()}, ${d.getFullYear()}`
    : `${d.getDate()} ${m} ${d.getFullYear()}`;
};

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

  /* Os quatro primeiros cartões são números curtos — 0,3 · 1944.ª · 198.ª ·
     2027 — e por isso o valor é tipografia de display, grande. O quinto é uma
     data por extenso, e à mesma medida «3–5 SETEMBRO 2026» saía do cartão e do
     ecrã: ficava cortado a meio da palavra, escondido pelo overflow do corpo.
     Uma data não é um algarismo e não se lê à altura de um. */
  const cartao = ({ v, sup, r, s, nota, texto }) => `
    <article class="rec">
      <span class="rec__v num${texto ? ' rec__v--t' : ''}">${v}${sup ? `<sup>${sup}</sup>` : ''}</span>
      <span class="rec__r">${r}</span>
      ${s ? `<p class="rec__s">${s}</p>` : ''}
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
      nota: desde
        ? `${t.desde} ${dataCurta(desde, lingua)}`
        : (h.vivo ? t.vivo : `${t.guardado} ${dataCurta(h.d.atualizado, lingua)}`),
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
    /* Sem subtítulo: «Turma de 2027» por baixo de «2027» era dizer o ano duas
       vezes — e o próprio título da página já o diz. */
    cartoes.push(cartao({ v: perfil.secundario.ano, r: t.ano, s: '' }));
  }

  /* A próxima prova em cartão, e não o calendário inteiro: esse está na página
     das épocas, e repeti-lo aqui era a mesma lista duas vezes. */
  const prox = await proxima(lingua);
  if (prox) {
    const [quando, nome] = prox.texto.split(' · ');
    cartoes.push(cartao({ v: quando, r: t.prox, s: nome || '', texto: true }));
  }

  /* add, e não `className =`: no cabeçalho-ficha o contentor traz
     `recs--ficha` escrito na marcação, e reescrever a classe apagava-o no
     primeiro render ao vivo. */
  cx.classList.add('recs');
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
async function figuraRankings(lingua = 'pt') {
  const t = T[lingua] || T.pt;

  let pontos = [];
  try { ({ pontos = [] } = await (await fetch('/data/rankings-historico.json', { cache: 'no-cache' })).json()); }
  catch { return ''; }
  if (pontos.length < 3) return '';

  /* Três pontos não chegam se forem os três da mesma semana.
   *
   * O histórico dos rankings começou a ser guardado a 16 de agosto de 2026 —
   * ninguém o guardava antes. Sete dias depois havia três pontos, o mínimo
   * que esta função exigia, e a página desenhou-os: duas linhas a atravessar o
   * ecrã com «AGO 2026 → AGO 2026» por baixo. Não se percebia nada, e não era
   * por falha do desenho: um gráfico de evolução com uma semana de dados não
   * tem evolução nenhuma para mostrar.
   *
   * Quatro meses é o mínimo para a linha dizer alguma coisa — é mais ou menos
   * o tempo de meia época de provas contadas. Até lá não se desenha, e não é
   * preciso mexer em nada no dia em que houver: isto passa a ser verdade
   * sozinho. */
  const MESES_MINIMOS = 4;
  const vao = Date.parse(pontos[pontos.length - 1].data) - Date.parse(pontos[0].data);
  if (vao < MESES_MINIMOS * 30 * 86400000) return '';

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

  const de = mesAno(pontos[0].data, lingua);
  const a = mesAno(pontos[pontos.length - 1].data, lingua);

  /* A explicação das siglas vive aqui dentro, e não no cabeçalho da secção.
     Enquanto esta curva não existir, dizer «o WAGR é o ranking mundial» era
     explicar uma coisa que não está na página. */
  return `
    <div class="curva-b">
    <p class="curva__x">${t.rkX}</p>
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
    </figure></div>`;
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
async function figuraHandicap(lingua = 'pt') {
  const t = T[lingua] || T.pt;

  let pontos = [];
  try { ({ pontos = [] } = await (await fetch('/data/handicap-historico.json', { cache: 'no-cache' })).json()); }
  catch { return ''; }
  if (pontos.length < 3) return '';

  const L = 720;
  const A = 220;
  const pad = { e: 6, d: 6, c: 18, b: 26 };

  const vs = pontos.map((p) => p.hcp);
  const min = Math.min(...vs);
  const max = Math.max(...vs);

  /* Escala logarítmica, e não linear.
   *
   * O registo vai de 54 — o handicap de quem começa — até 0,3. Numa escala
   * linear, a queda dos primeiros meses come 82% da altura e os últimos três
   * anos ficam esmagados numa linha rente ao fundo: 9% do gráfico para o
   * período que interessa a quem recruta.
   *
   * E linear também mente sobre o esforço. No golfe, descer de 5 para 2 é
   * incomparavelmente mais difícil do que de 54 para 50; em escala linear as
   * duas descidas ocupam quase o mesmo. Em log, cada divisão por dois vale o
   * mesmo pedaço de altura — que é muito mais perto da verdade. Os últimos três
   * anos passam a valer 43% do desenho.
   *
   * `hcp + 1` e não `hcp`: um índice pode chegar a zero, e um dia a negativo —
   * um handicap «plus» — e o logaritmo de zero não existe. */
  const esc = (h) => Math.log10(Math.max(h, -0.9) + 1);
  const escMin = esc(min);
  const faixa = esc(max) - escMin || 1;

  /* O eixo do tempo é o tempo, e não a ordem dos pontos: um índice parado dois
     anos e depois a cair em três meses tem de se ver como isso mesmo. Espaçar
     por índice esticava a pausa e encolhia a queda. */
  const t0 = Date.parse(pontos[0].data);
  const t1 = Date.parse(pontos[pontos.length - 1].data);
  const vao = t1 - t0 || 1;

  const xy = pontos.map((p) => {
    const x = pad.e + ((Date.parse(p.data) - t0) / vao) * (L - pad.e - pad.d);
    const y = pad.c + ((esc(p.hcp) - escMin) / faixa) * (A - pad.c - pad.b);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const fim = xy[xy.length - 1].split(',');
  const num = (n) => (lingua === 'en' ? n.toFixed(1) : n.toFixed(1).replace('.', ','));

  /* Sem marcas, uma escala logarítmica é um desenho bonito e ilegível: não se
     sabe onde fica o 9 nem o 1. Entram as que caem dentro do que aconteceu.
   *
   * As linhas vão no SVG e os números vão em HTML por cima. O SVG estica-se
   * com `preserveAspectRatio="none"` para a curva ocupar a largura toda, e num
   * ecrã largo isso multiplica a horizontal por uma vez e meia — uma linha não
   * dá por isso, um algarismo sai deformado. Posicionados em percentagem, os
   * números ficam onde devem sem serem esticados. */
  const refs = [36, 18, 9, 3, 1]
    .filter((v) => v < max && v > min)
    .map((v) => ({ v, y: pad.c + ((esc(v) - escMin) / faixa) * (A - pad.c - pad.b) }));

  const linhasRef = refs.map(({ y }) => `<line x1="0" x2="${L}" y1="${y.toFixed(1)}"
      y2="${y.toFixed(1)}" stroke="var(--linha)" stroke-width="1" />`).join('');
  const rotulosRef = refs.map(({ v, y }) => `<span class="curva__m"
      style="top:${((y / A) * 100).toFixed(2)}%">${lingua === 'en' ? v : String(v).replace('.', ',')}</span>`).join('');

  /* O primeiro e o último ponto, e não o pior e o melhor.
   *
   * Estavam aqui o máximo e o mínimo, e isso dava «54,0 → 0,1»: o 0,1 foi
   * tocado em dezembro de 2024 e depois perdido. Lido como o fim de um
   * percurso, anunciava um índice que ela não tem — e a ficha no topo da mesma
   * página dizia outro número. A linha mostra o melhor de sempre; a legenda diz
   * onde começou e onde está. */
  const p0 = pontos[0];
  const pf = pontos[pontos.length - 1];

  return `
    <div class="curva-b">
    <p class="curva__x">${t.hcpX}</p>
    <figure class="curva">
      <svg viewBox="0 0 ${L} ${A}" role="img" preserveAspectRatio="none"
           aria-label="${t.hcp2}: ${t.hcpEixo}">
        ${linhasRef}
        <polyline points="${xy.join(' ')}" fill="none" stroke="var(--relva)"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="${fim[0]}" cy="${fim[1]}" r="3.5" fill="var(--relva)" />
      </svg>
      <div class="curva__e">${rotulosRef}</div>
      <figcaption class="curva__l">
        <span><i style="background:var(--relva)"></i>${t.hcp2}</span>
        <span class="curva__d num">${num(p0.hcp)} · ${mesAno(p0.data, lingua)}
          → ${num(pf.hcp)} · ${mesAno(pf.data, lingua)}</span>
      </figcaption>
    </figure></div>`;
}

/* ── as curvas da evolução, no mesmo sítio ────────────────────
 *
 * Duas medidas com nove anos de diferença entre elas. O índice de handicap é
 * lido desde dezembro de 2017 — duzentos e oito degraus, de 54 a 0,3 — porque
 * a federação guarda esse registo desde sempre. Os rankings mundiais e
 * europeus só começaram a ser guardados em agosto de 2026, quando o vigia
 * passou a apontá-los: ninguém tinha a série antes disso, e não há maneira de
 * a recuperar.
 *
 * Por isso a secção mostra o que tem: a curva do handicap, sempre; a dos
 * rankings, quando tiver estrada que chegue. Escalas separadas e figuras
 * separadas — um índice de handicap e um lugar no ranking não partilham eixo.
 *
 * Se nenhuma tiver dados, a secção esconde-se: um cabeçalho com nada por baixo
 * lê-se como uma coisa que se partiu. */
export async function curvas(cx, lingua = 'pt') {
  if (!cx) return;
  const [hcp, rk] = await Promise.all([figuraHandicap(lingua), figuraRankings(lingua)]);
  cx.innerHTML = hcp + rk;
  mostrar(cx, Boolean(hcp || rk));
}

export async function witb(cx, lingua = 'pt') {
  if (!cx) return;
  let d = {};
  try { d = await (await fetch('/data/witb.json', { cache: 'no-cache' })).json(); } catch { return; }

  const en = lingua === 'en';
  /* A bola, a luva e o saco tanto podem ser uma linha de texto como um objecto
     com fotografia. Quem escreve o data/witb.json não tem de saber qual das
     duas formas o desenho precisa — escreve o nome, e acrescenta a imagem se e
     quando ela existir. */
  const nome = (v) => (typeof v === 'string' ? v : v?.m || '');
  const foto = (v) => (typeof v === 'string' ? undefined : v?.img);
  /* Uma lista só, e duas vistas dela. A fila e a ficha têm de saber uma da
     outra — passar o rato por um taco acende a linha dele — e para isso a
     ligação tem de ser um número que as duas partilhem, não a ordem em que
     calharam ficar. */
  const linhas = [
    ...(d.tacos || []).map((t) => ({ r: tx(t.t, lingua), m: t.m, n: tx(t.n, lingua), img: t.img, u: t.u, url: t.url })),
    ...(d.bola ? [{ r: en ? 'Ball' : 'Bola', m: nome(d.bola), img: foto(d.bola), url: d.bola?.url }] : []),
    ...(d.luva ? [{ r: en ? 'Glove' : 'Luva', m: nome(d.luva), img: foto(d.luva), url: d.luva?.url }] : []),
    ...(d.extras || []).map((t) => ({ r: tx(t.t, lingua), m: t.m, n: tx(t.n, lingua), img: t.img, url: t.url })),
  ].filter((l) => l.m).map((l, i) => ({ ...l, i }));

  if (!linhas.length) { cx.innerHTML = ''; mostrar(cx, false); return; }
  mostrar(cx, true);

  /* Um cartão por coisa que ela leva, e tudo o que se sabe dessa coisa dentro
   * do mesmo cartão.
   *
   * Antes eram duas vistas da mesma lista: uma fila de fotografias em cima e
   * uma ficha de texto em baixo, ligadas por um realce. Num ecrã largo lê-se
   * bem — a fila e a ficha cabem as duas no mesmo olhar. Num telemóvel não:
   * a fila ocupava um ecrã, a ficha outro, e tocar num taco acendia uma linha
   * que estava a oitocentos pixéis de distância. O gesto acontecia e não se
   * via nada acontecer, que é a pior coisa que uma interface pode fazer.
   *
   * Juntos num cartão, a fotografia e o loft deixam de precisar de ligação
   * nenhuma: já estão no mesmo sítio. Deixa de haver realce a manter, deixa de
   * haver painel de detalhe a abrir, e deixa de haver a mesma informação
   * escrita duas vezes no HTML.
   *
   * No telemóvel os cartões são um carrossel que encaixa — passa-se com o
   * polegar, que é o gesto que ali é natural, e vê-se um taco de cada vez em
   * tamanho a sério em vez de oito do tamanho de uma unha. Em ecrã largo são
   * uma grelha, e as fotografias continuam pousadas na mesma linha de chão. */
  /* A fotografia leva ao mesmo sítio que o nome — o alvo de toque óbvio de um
     cartão é a imagem, e era o único pedaço dele que não ia a lado nenhum.
     `tabindex="-1"` e `aria-hidden`: para o teclado e para quem ouve a página,
     a ligação continua a ser uma só, a do nome, com o modelo escrito por
     extenso. Duas paragens seguidas para o mesmo endereço é ruído. */
  const retratoTaco = (l) => {
    const img = `<img src="/img/witb/${l.img}" alt="" loading="lazy"
            decoding="async" data-credito-em="witbCred" />`;
    return `<span class="saco__ki">${l.url
      ? `<a class="saco__kf" href="${l.url}" target="_blank" rel="noopener"
             tabindex="-1" aria-hidden="true" data-sem-seta>${img}</a>`
      : img}</span>`;
  };

  const cartao = (l) => `
    <li class="saco__k${l.img ? '' : ' saco__k--so'}" data-i="${l.i}" style="--i:${l.i}">
      ${l.img ? retratoTaco(l) : ''}
      <p class="saco__kr">${l.r}</p>
      <p class="saco__km">${l.url
    ? `<a class="saco__kl" href="${l.url}" target="_blank" rel="noopener" data-sem-seta>${l.m}<span aria-hidden="true"> ↗</span></a>`
    : l.m}</p>
      ${l.n ? `<p class="saco__kn">${l.n}</p>` : ''}
    </li>`;

  /* O saco tem `foto` e não `img`, e continua fora dos cartões.
   *
   * Os outros são recortes de estúdio à mesma altura; este é uma fotografia
   * dele no campo, com o nome dela nas costas. Metido num cartão ao lado de uma
   * cabeça de driver, a escala mentia — e é a única imagem da secção que quer
   * ser vista grande. Fica no fim, à largura toda. */
  const retrato = d.saco?.foto ? `
    <figure class="saco__s">
      <img src="/img/witb/${d.saco.foto}" alt="${en ? 'Bag' : 'Saco'}: ${nome(d.saco)}"
           width="760" height="1644" loading="lazy" decoding="async" />
      <figcaption class="saco__sl">
        <span class="saco__kr">${en ? 'Bag' : 'Saco'}</span>
        <span class="saco__km">${nome(d.saco)}</span>
      </figcaption>
    </figure>` : '';

  cx.className = 'witb';
  cx.innerHTML = `
    <ul class="saco__g" role="list">${linhas.map(cartao).join('')}</ul>
    <p class="witb__c" id="witbCred" data-credito-base="${en ? 'Images:' : 'Imagens:'}"></p>
    ${citacao(d, linhas, lingua)}${retrato}`;
}

/* ── a frase dela ─────────────────────────────────────────────
 *
 * Uma linha dela sobre um taco. Enquanto não existir, não desenha nada — e é
 * essa a diferença entre uma secção que é um catálogo e uma que é dela. */
function citacao(d, linhas, lingua) {
  const t = tx(d.frase?.t, lingua);
  if (!t) return '';
  const dono = linhas.find((l) => l.r === d.frase.taco || l.m === d.frase.taco);
  return `
    <figure class="witb__q"${dono ? ` data-i="${dono.i}"` : ''}>
      <blockquote>${t}</blockquote>
      ${d.frase.taco ? `<figcaption>${d.frase.taco}</figcaption>` : ''}
    </figure>`;
}

/* A fila e a ficha, ligadas nos dois sentidos.
 *
 * Escolher um taco acende a linha dele; passar por uma linha levanta o taco. É
 * a mesma informação vista de dois lados, e é o que permite manter a fila
 * limpa — sem uma legenda debaixo de cada fotografia a repetir o que a ficha já
 * diz melhor.
 *
 * `preso` é o que ficou escolhido por clique ou toque. Sem ele, num telemóvel o
 * taco acendia-se com o dedo em cima e apagava-se no instante em que o dedo
 * saía, que é o mesmo que não acender.
 *
 * E `preso` guarda o índice, não o elemento. Cada taco tem duas caras — o botão
 * na fila e a linha na ficha — e guardar uma delas fazia a outra apagar o que a
 * primeira tinha escolhido: escolher um taco, passar o rato pela linha dele e
 * sair apagava-o na mesma, embora continuasse marcado como escolhido; o clique
 * seguinte era gasto a desescolher uma coisa que já estava apagada, e lia-se
 * como um clique que não fez nada. */


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
