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

  const de = mesAno(pontos[0].data, lingua);
  const a = mesAno(pontos[pontos.length - 1].data, lingua);

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

  cx.innerHTML = `
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
    </figure>`;
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
    ...(d.tacos || []).map((t) => ({ r: tx(t.t, lingua), m: t.m, n: tx(t.n, lingua), img: t.img })),
    ...(d.bola ? [{ r: en ? 'Ball' : 'Bola', m: nome(d.bola), img: foto(d.bola) }] : []),
    ...(d.luva ? [{ r: en ? 'Glove' : 'Luva', m: nome(d.luva), img: foto(d.luva) }] : []),
    ...(d.saco ? [{ r: en ? 'Bag' : 'Saco', m: nome(d.saco), img: foto(d.saco) }] : []),
    ...(d.extras || []).map((t) => ({ r: tx(t.t, lingua), m: t.m, n: tx(t.n, lingua) })),
  ].filter((l) => l.m).map((l, i) => ({ ...l, i }));

  if (!linhas.length) { cx.innerHTML = ''; mostrar(cx, false); return; }
  mostrar(cx, true);

  /* Uma fila com o que tem fotografia, e por baixo a ficha inteira.
   *
   * E não uma grelha de cartões, um por taco: nem tudo o que está no saco tem
   * imagem, e cartões meio vazios pelo meio fariam parecer que falta o taco
   * quando o que falta é a fotografia. Assim a fila é o retrato do saco e a
   * lista é a ficha; nenhuma promete o que a outra tem.
   *
   * Alinhados pela base, com a mesma altura de imagem: é como estão encostados
   * a um saco, e é o que faz a fila ler-se como um conjunto e não como sete
   * recortes soltos. A bola entra ao fim, e entra pequena — a escala de cada
   * uma vem da tela em que foi montada, não do CSS. */
  const naFila = linhas.filter((x) => x.img);

  /* Cada taco é um botão, e não só uma fotografia. Serve para ser escolhido:
   * ao ser escolhido acende a linha dele na ficha, que é onde estão o loft e o
   * shaft. Num rato isso acontece ao passar por cima, num teclado ao chegar
   * com o tabulador, e num telemóvel ao tocar — e é por causa do telemóvel que
   * tem de ser um botão, porque num ecrã de toque não existe passar por cima.
   *
   * O nome vive no botão, e a fotografia fica com alt vazio: quem lê com os
   * ouvidos ouviria «Driver: Cobra OPTM X» duas vezes seguidas.
   *
   * Os créditos vão todos para a mesma linha, por baixo da fila — ver o
   * js/creditos.js, que é quem sabe de que marca é cada ficheiro. */
  const fila = naFila.length ? `
    <div class="witb__fila">${naFila.map((x, k) => `
      <button class="witb__t" type="button" data-i="${x.i}" style="--i:${k}"
              aria-pressed="false" aria-label="${x.r}: ${x.m}">
        <span class="witb__e"><img src="/img/witb/${x.img}" alt="" loading="lazy"
              decoding="async" data-credito-em="witbCred" /></span>
        <span class="witb__n" aria-hidden="true">${x.r}</span>
      </button>`).join('')}</div>
    <p class="witb__c" id="witbCred" data-credito-base="${en ? 'Images:' : 'Imagens:'}"></p>` : '';

  cx.className = 'witb';
  cx.innerHTML = `${fila}
    <dl class="factos witb__f">${linhas.map((l) => `
      <div data-i="${l.i}"><dt>${l.r}</dt><dd>${l.m}${l.n ? ` <span class="dest__o">${l.n}</span>` : ''}</dd></div>`).join('')}</dl>`;

  ligarSaco(cx);
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
 * saía, que é o mesmo que não acender. */
function ligarSaco(cx) {
  let preso = null;

  const marcar = (el, sim) => {
    const i = el?.dataset.i;
    if (i == null) return;
    cx.querySelectorAll(`[data-i="${i}"]`).forEach((n) => {
      n.classList.toggle(n.matches('.witb__t') ? 'witb__t--on' : 'witb__f--on', sim);
    });
  };

  cx.querySelectorAll('.witb__t, .witb__f > div').forEach((el) => {
    el.addEventListener('pointerenter', () => { if (el !== preso) marcar(el, true); });
    el.addEventListener('pointerleave', () => { if (el !== preso) marcar(el, false); });
    if (!el.matches('.witb__t')) return;

    el.addEventListener('focus', () => marcar(el, true));
    el.addEventListener('blur', () => { if (el !== preso) marcar(el, false); });
    el.addEventListener('click', () => {
      if (preso && preso !== el) {
        marcar(preso, false);
        preso.setAttribute('aria-pressed', 'false');
      }
      const liga = preso !== el;
      preso = liga ? el : null;
      marcar(el, liga);
      el.setAttribute('aria-pressed', String(liga));
    });
  });
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
