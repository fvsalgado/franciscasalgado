/* Tudo o que vem dos ficheiros JSON e não são resultados: os números, os
   factos, a linha do tempo, a imprensa e as ligações. Cada função pinta um
   contentor e volta a ser chamada quando se muda de língua. */

import { icone } from './icones.js';
import { buscar } from './rankings.js';

const cache = {};
async function ler(nome) {
  if (cache[nome]) return cache[nome];
  try {
    cache[nome] = await (await fetch(`/data/${nome}.json`, { cache: 'no-cache' })).json();
  } catch (e) {
    console.warn(`${nome}:`, e.message);
    cache[nome] = {};
  }
  return cache[nome];
}

const tx = (v, lingua) => (typeof v === 'string' ? v : v?.[lingua] || v?.pt || '');

/* ── números ──────────────────────────────────────────────── */
export async function numeros(cx, lingua = 'pt', chave = 'numeros') {
  if (!cx) return;
  const perfil = await ler('perfil');
  const ns = perfil[chave] || [];
  cx.className = 'nums';
  cx.innerHTML = ns.map((n) => {
    // a vírgula decimal é portuguesa; em inglês o ponto
    const v = lingua === 'en' && n.vEn ? n.vEn : n.v;
    return `
      <div class="numo sobe-i">
        <span class="numo__v num">${v}${n.sup ? `<sup>${n.sup}</sup>` : ''}</span>
        <span class="numo__r">${tx(n.r, lingua)}</span>
        <p class="numo__n">${tx(n.n, lingua)}</p>
      </div>`;
  }).join('');
}

/* ── factos (a ficha, em duas colunas) ────────────────────── */
/* A linha das classificações trazia dois números escritos à mão, que estavam
   certos no dia em que se escreveram e passavam a estar errados na semana
   seguinte. Marcada com `vivo: "rankings"`, passa a vir das mesmas fontes que
   alimentam os cartões — e se elas não responderem, fica o que está no
   ficheiro, que é o pior caso e não uma página partida. */
export async function factos(cx, lingua = 'pt') {
  if (!cx) return;
  const { factos: fs = [] } = await ler('perfil');
  cx.className = 'factos';
  cx.innerHTML = fs.map((f, i) => `
    <div${f.vivo ? ` data-vivo="${f.vivo}" data-i="${i}"` : ''}>
      <dt>${tx(f.dt, lingua)}</dt><dd>${tx(f.dd, lingua)}</dd></div>`).join('');

  const alvo = cx.querySelector('[data-vivo="rankings"] dd');
  if (!alvo) return;
  const l = await linhaRankings(lingua);
  if (l) alvo.textContent = l;
}

/* As duas posições numa linha só, lidas na hora. Devolve nulo quando nenhuma
   das fontes responde — quem chama fica com o que já lá estava. */
export async function linhaRankings(lingua = 'pt') {
  const [m, e] = await Promise.all([
    buscar('/api/wagr', '/data/wagr.json'),
    buscar('/api/egr', '/data/egr.json'),
  ]);
  const en = lingua === 'en';
  const ord = (n) => (en
    ? `${n}${['th', 'st', 'nd', 'rd'][n % 100 >= 11 && n % 100 <= 13 ? 0 : n % 10] || 'th'}`
    : `${n}.ª`);
  const partes = [];
  if (m?.d?.posicao) partes.push(`${ord(m.d.posicao)}${en ? ' on the WAGR' : ' no WAGR'}`);
  if (e?.d?.posicao) partes.push(`${ord(e.d.posicao)}${en ? ' on the European Golf Rankings' : ' no European Golf Rankings'}`);
  return partes.length ? partes.join(' · ') : null;
}

/* A resposta às perguntas frequentes ganha à frente as duas posições do dia.
   Assim, um assistente que cite esta página cita um número certo hoje, e não
   um número que era certo no dia em que a página foi escrita. */
export async function rankingsNaPergunta(lingua = 'pt') {
  const dd = document.querySelector('[data-vivo="rankings-fq"] dd');
  if (!dd) return;
  const l = await linhaRankings(lingua);
  if (!l) return;
  const forte = document.createElement('strong');
  forte.textContent = lingua === 'en' ? `Currently ${l}. ` : `Neste momento, ${l}. `;
  dd.prepend(forte);
}

/* ── linha do tempo ───────────────────────────────────────── */
export async function percurso(cx, lingua = 'pt') {
  if (!cx) return;
  const { percurso: ps = [] } = await ler('perfil');
  cx.className = 'linha-t';
  cx.innerHTML = ps.map((p) => `
    <li${p.marco ? ' data-marco="1"' : ''}>
      <span class="linha-t__a">${p.ano}</span>
      <h3 class="linha-t__t">${tx(p.t, lingua)}</h3>
      <p class="linha-t__x">${tx(p.x, lingua)}</p>
    </li>`).join('');
}

/* ── escalões de apoio ────────────────────────────────────── */
/* Três cartões lado a lado, e não três barras empilhadas: são alternativas
   entre si, não passos de uma escada, e ler-se em coluna fazia-as parecer
   níveis de preço por ordem crescente — que é exatamente o que não são. */
export async function escadas(cx, lingua = 'pt') {
  if (!cx) return;
  const { escadas: es = [] } = await ler('perfil');
  const en = lingua === 'en';
  cx.className = 'escadas';
  cx.innerHTML = es.map((e, i) => `
    <article class="degrau">
      <span class="degrau__i num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      <span class="degrau__e">${tx(e.e, lingua)}</span>
      <h3 class="degrau__n">${tx(e.n, lingua)}</h3>
      <p class="degrau__x">${tx(e.x, lingua)}</p>
      ${e.inclui?.length ? `<ul class="degrau__u">${e.inclui
        .map((u) => `<li>${tx(u, lingua)}</li>`).join('')}</ul>` : ''}
      <a class="degrau__b" href="contacto.html" data-mag>${en ? 'Ask for a proposal' : 'Pedir uma proposta'}</a>
    </article>`).join('');
}

/* ── canais e ligações ────────────────────────────────────── */
export async function canais(lingua = 'pt') {
  const { canais: cs = [] } = await ler('canais');
  return cs.map((c) => ({ ...c, sub: tx(c.sub, lingua) }));
}

export async function ligacoes(cx, lingua = 'pt') {
  if (!cx) return;
  const cs = await canais(lingua);
  cx.innerHTML = cs.map((c) => `
    <a class="plat" href="${c.url}" target="_blank" rel="noopener" data-sem-seta data-mag>
      <span class="plat__i">${icone(c.chave, 'ic')}</span>
      <span class="plat__q">
        <span class="plat__n">${c.nome}</span>
        <span class="plat__s">${c.sub}</span>
      </span>
      <span class="plat__a">${icone('seta', 'ic ic--pe')}</span>
    </a>`).join('');
}

/* ── imprensa ─────────────────────────────────────────────── */
/* `grande` serve a página inicial, onde entra uma citação só: aí a frase é o
   elemento da secção, e não um item de uma lista. Cresce, centra-se e ocupa a
   largura toda — a mesma peça que está na página de parcerias. */
export async function citacoes(cx, lingua = 'pt', quantas = 99, { grande = false } = {}) {
  if (!cx) return;
  const { citacoes: cs = [] } = await ler('imprensa');

  if (grande) {
    const c = cs[0];
    if (!c) { cx.innerHTML = ''; return; }
    cx.className = '';
    cx.innerHTML = `
      <figure class="cita">
        <blockquote class="cita__t">${tx(c.t, lingua)}</blockquote>
        <figcaption class="cita__f">${c.url
          ? `<a href="${c.url}" target="_blank" rel="noopener" data-mag>${tx(c.f, lingua)}</a>`
          : tx(c.f, lingua)}</figcaption>
      </figure>`;
    return;
  }

  cx.className = 'citacoes';
  cx.innerHTML = cs.slice(0, quantas).map((c) => `
    <figure class="cit sobe-i">
      <blockquote class="cit__t">“${tx(c.t, lingua)}”</blockquote>
      <figcaption class="cit__f">${c.url
        ? `<a href="${c.url}" target="_blank" rel="noopener" data-mag>${tx(c.f, lingua)}</a>`
        : tx(c.f, lingua)}</figcaption>
    </figure>`).join('');
}

export async function pecas(cx, lingua = 'pt') {
  if (!cx) return;
  const { pecas: ps = [], saiuEm: casas = [] } = await ler('imprensa');
  /* O símbolo de cada casa, indexado pelo nome, para cada peça o mostrar ao
     lado do título. Numa lista de quarenta linhas, o desenho é o que deixa
     encontrar o Record no meio das notícias da federação sem ler tudo. */
  const simbolo = new Map(casas.filter((c) => c && c.logo).map((c) => [c.nome, c.logo]));

  cx.className = 'pecas';
  cx.innerHTML = ps.map((p) => {
    const logo = simbolo.get(p.o);
    return `
    <li class="peca">
      <a href="${p.url}" target="_blank" rel="noopener" data-sem-seta data-mag>
        <span class="peca__f">${p.capa
          ? `<img src="/img/imprensa/pecas/${p.capa}" alt="" loading="lazy" decoding="async" data-credito-feito="1" />`
          : ''}</span>
        <span class="peca__o">${logo
          ? `<img src="/img/imprensa/${logo}" alt="" loading="lazy" decoding="async" data-credito-feito="1" />`
          : ''}<span>${p.o}</span></span>
        <span class="peca__t">${tx(p.t, lingua)}</span>
        <span class="peca__a num">${p.data}<i class="peca__s" aria-hidden="true">↗</i></span>
      </a>
    </li>`;
  }).join('');
}

/* Cada casa que já escreveu sobre ela, com o símbolo e a ligação para o sítio.
   Era uma fila de nomes em texto: dizia o mesmo e não se via nada. Os símbolos
   estão em img/imprensa/, copiados uma vez pelo scripts/logos-imprensa.mjs —
   pedi-los a oito servidores diferentes de cada vez que a página abre seria
   entregar o endereço de quem lê a oito casas que não têm nada a ver com
   isto. */
export async function saiuEm(cx, lingua = 'pt') {
  if (!cx) return;
  const { saiuEm: ss = [] } = await ler('imprensa');
  const en = lingua === 'en';
  cx.className = 'saiu__l';
  cx.innerHTML = ss.map((s) => {
    const nome = typeof s === 'string' ? s : s.nome;
    const logo = typeof s === 'string' ? '' : s.logo;
    const url = typeof s === 'string' ? '' : s.url;
    const dentro = `${logo
      ? `<img src="/img/imprensa/${logo}" alt="" loading="lazy" decoding="async" data-credito-feito="1" />`
      : ''}<span>${nome}</span>`;
    return `<li>${url
      ? `<a href="${url}" target="_blank" rel="noopener" data-sem-seta data-mag
            title="${en ? `Open ${nome} in a new window` : `Abrir ${nome} numa janela nova`}">${dentro}</a>`
      : dentro}</li>`;
  }).join('');
}

/* ── as portas para as outras páginas ─────────────────────── */
/* A página inicial tinha, inteiras, secções que já existiam noutras páginas: o
   palmarès, a galeria, a parede de apoios, o dossier de imprensa. Quem descia
   a página lia tudo duas vezes e não chegava a ter razão nenhuma para clicar
   em nada.

   Ficam quatro portas. Cada uma diz o que há lá dentro e traz um número que o
   prova — e o número é contado aqui, dos ficheiros, para não haver mais um
   sítio no sítio onde alguém tenha de se lembrar de mudar um algarismo. */
export async function portas(cx, lingua = 'pt') {
  if (!cx) return;
  const en = lingua === 'en';
  const [res, imp, apo] = await Promise.all([ler('resultados'), ler('imprensa'), ler('apoios')]);

  const provas = res.provas || [];
  const anos = provas.map((p) => p.ano).filter(Boolean);
  const epocas = anos.length ? Math.max(...anos) - Math.min(...anos) + 1 : 0;
  const apoiantes = (apo.grupos || []).reduce((n, g) => n + (g.itens?.length || 0), 0);

  const PORTAS = [
    {
      href: 'resultados.html', img: 'swing.webp', ic: 'taca',
      n: provas.length,
      r: { pt: 'Resultados', en: 'Results' },
      t: { pt: 'Prova a prova, desde 2018', en: 'Event by event, since 2018' },
      x: { pt: 'As voltas, o total e o resultado face ao par. Cada prova diz de onde veio.',
           en: 'The rounds, the total and the score to par. Every event names its source.' },
      u: { pt: 'provas', en: 'events' },
    },
    {
      href: 'percurso.html', img: 'aquapor.webp', ic: 'mapa',
      n: epocas,
      r: { pt: 'Percurso', en: 'Her story' },
      t: { pt: 'De campeã de Sub-10 a campeã de Sub-18', en: 'From U10 champion to U18 champion' },
      x: { pt: 'A história ano a ano, os vídeos mais antigos que há dela, e as perguntas do costume.',
           en: 'The story year by year, the oldest footage there is of her, and the usual questions.' },
      u: { pt: 'épocas', en: 'seasons' },
    },
    {
      href: 'imprensa.html', img: 'trofeu.webp', ic: 'jornal',
      n: (imp.pecas || []).length,
      r: { pt: 'Imprensa', en: 'Press' },
      t: { pt: 'Para quem escreve sobre golfe', en: 'For people who write about golf' },
      x: { pt: 'Biografia curta, factos que se confirmam, citações com fonte e fotografias em alta resolução.',
           en: 'Short biography, checkable facts, sourced quotes and high-resolution photographs.' },
      u: { pt: 'peças publicadas', en: 'published pieces' },
    },
    {
      href: 'parcerias.html', img: 'english.webp', ic: 'aperto',
      n: apoiantes,
      r: { pt: 'Parcerias', en: 'Partnerships' },
      t: { pt: 'Levar Portugal mais longe', en: 'Taking Portugal further' },
      x: { pt: 'Quem já apoia, o que cada forma de entrar cobre, e o contacto direto.',
           en: 'Who already backs her, what each way in covers, and how to get in touch.' },
      u: { pt: 'já a apoiar', en: 'already on board' },
    },
  ];

  /* Linhas, e não cartões com fotografia grande. Em cartões isto lia-se como
     uma galeria e ninguém percebia que eram caminhos; em linha, com o número
     de ordem à esquerda, o nome da página em maiúsculas e a seta à direita,
     é um índice — e um índice ninguém confunde com outra coisa. */
  cx.className = 'portas';
  cx.innerHTML = PORTAS.map((p, i) => `
    <a class="porta" href="${p.href}" data-mag>
      <span class="porta__i" aria-hidden="true">
        ${icone(p.ic, 'ic')}<b class="num">${String(i + 1).padStart(2, '0')}</b>
      </span>
      <span class="porta__q">
        <span class="porta__r">${tx(p.r, lingua)}</span>
        <span class="porta__t">${tx(p.t, lingua)}</span>
        <span class="porta__x">${tx(p.x, lingua)}</span>
      </span>
      <span class="porta__n"><b class="num">${p.n}</b> ${tx(p.u, lingua)}</span>
      <span class="porta__f" aria-hidden="true">
        <img src="/img/${p.img}" alt="" loading="lazy" decoding="async" data-credito-feito="1" />
      </span>
      <span class="porta__s" aria-hidden="true">→</span>
    </a>`).join('');
}
