/* Tudo o que vem dos ficheiros JSON e não são resultados: os números, os
   factos, as citações e as ligações. Cada função pinta um
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

/* Uma secção sem conteúdo esconde-se em vez de ficar com um cabeçalho a
   apontar para nada. É a mesma regra do js/recruiting.js. */
const mostrar = (cx, sim) => cx.closest('section[data-se-vazio]')?.toggleAttribute('hidden', !sim);

/* ── números ──────────────────────────────────────────────── */
/* Um número que tenha `ir` deixa de ser só um número: se as 42 peças de
   imprensa estão a uma página de distância, o cartão é o caminho mais curto
   para lá — e ninguém adivinha que se pode carregar num número que não parece
   uma ligação. Em inglês o destino é o mesmo caminho debaixo de /en/. */
export async function numeros(cx, lingua = 'pt', chave = 'numeros') {
  if (!cx) return;
  const perfil = await ler('perfil');
  const ns = perfil[chave] || [];
  cx.className = 'nums';
  cx.innerHTML = ns.map((n) => {
    // a vírgula decimal é portuguesa; em inglês o ponto
    const v = lingua === 'en' && n.vEn ? n.vEn : n.v;
    const dentro = `
        <span class="numo__v num">${v}${n.sup ? `<sup>${n.sup}</sup>` : ''}</span>
        <span class="numo__r">${tx(n.r, lingua)}</span>
        <p class="numo__n">${tx(n.n, lingua)}</p>`;
    return n.ir
      ? `<a class="numo numo--ir sobe-i" href="${lingua === 'en' ? `/en${n.ir}` : n.ir}">${dentro}</a>`
      : `<div class="numo sobe-i">${dentro}</div>`;
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
  /* O lugar no escalão quando existe, e o rótulo a dizer qual é. Sem ele, o
     lugar geral e o rótulo do geral — o que não pode acontecer é o número de
     uma coisa com o nome da outra. */
  if (e?.d?.posicaoEscalao && e?.d?.escalao) {
    const esc = en ? e.d.escalao : String(e.d.escalao).replace(/^U(\d+)$/, 'Sub-$1');
    partes.push(`${ord(e.d.posicaoEscalao)}${en ? ` on the European Golf Rankings ${esc}` : ` no European Golf Rankings ${esc}`}`);
  } else if (e?.d?.posicao) {
    partes.push(`${ord(e.d.posicao)}${en ? ' on the European Golf Rankings' : ' no European Golf Rankings'}`);
  }
  return partes.length ? partes.join(' · ') : null;
}

/* A resposta às perguntas frequentes ganha à frente as duas posições do dia.
   Assim, um assistente que cite esta página cita um número certo hoje, e não
   um número que era certo no dia em que a página foi escrita. */
export async function rankingsNaPergunta(lingua = 'pt') {
  const dd = document.querySelector('[data-vivo="rankings-fq"] .fq__r');
  if (!dd) return;
  const l = await linhaRankings(lingua);
  if (!l) return;
  const forte = document.createElement('strong');
  forte.textContent = lingua === 'en' ? `Currently ${l}. ` : `Neste momento, ${l}. `;
  dd.prepend(forte);
}

/* ── escalões de apoio ────────────────────────────────────── */
/* Três cartões lado a lado, e não três barras empilhadas: são alternativas
   entre si, não passos de uma escada, e ler-se em coluna fazia-as parecer
   níveis de preço por ordem crescente — que é exatamente o que não são. */
export async function escadas(cx, lingua = 'pt') {
  if (!cx) return;
  const { escadas: es = [] } = await ler('perfil');
  const en = lingua === 'en';
  cx.className = 'escadas faixa';
  cx.innerHTML = es.map((e, i) => `
    <article class="degrau">
      <span class="degrau__i num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      <span class="degrau__e">${tx(e.e, lingua)}</span>
      <h3 class="degrau__n">${tx(e.n, lingua)}</h3>
      <p class="degrau__x">${tx(e.x, lingua)}</p>
      ${e.inclui?.length ? `<ul class="degrau__u">${e.inclui
        .map((u) => `<li>${tx(u, lingua)}</li>`).join('')}</ul>` : ''}
      <a class="degrau__b" href="${en ? '/en/' : '/'}parcerias.html#contacto" data-mag>${en ? 'Ask for a proposal' : 'Pedir uma proposta'}</a>
    </article>`).join('');
}

/* ── canais e ligações ────────────────────────────────────── */
export async function canais(lingua = 'pt') {
  const { canais: cs = [] } = await ler('canais');
  return cs.map((c) => ({ ...c, sub: tx(c.sub, lingua) }));
}

/* `tipo` separa as duas coisas que esta lista tinha à mistura: os sítios onde
   se fala com ela (email, Instagram) e as fichas oficiais onde se confirmam os
   resultados (FPG, EGR, WAGR). Sem essa separação a lista inteira aparecia na
   página de contacto e outra vez na de imprensa, igual das duas vezes. */
export async function ligacoes(cx, lingua = 'pt', tipo = null) {
  if (!cx) return;
  const cs = (await canais(lingua)).filter((c) => !tipo || c.tipo === tipo);
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


/* ── a equipa técnica ─────────────────────────────────────────
 *
 * Vivia nas parcerias, ao lado dos patrocinadores, em placas do tamanho das
 * dos logótipos. Duas coisas estavam mal nisso: uma pessoa não é um
 * patrocinador, e uma placa creme com um nome ao meio é uma placa a fingir que
 * é uma marca. Passa para a página dos treinadores, que é onde faz falta — é
 * a quem um treinador universitário liga a seguir —, e passa a lista: nome,
 * função, e mais nada. */
export async function equipa(cx, lingua = 'pt') {
  if (!cx) return;
  const { equipa: pessoas = [] } = await ler('perfil');
  if (!pessoas.length) { cx.innerHTML = ''; mostrar(cx, false); return; }
  mostrar(cx, true);

  cx.innerHTML = `<ul class="marcas">${pessoas.map((p) => `
    <li>${p.url
    ? `<a class="marca-l" href="${p.url}" target="_blank" rel="noopener" data-sem-seta data-mag>`
    : '<span class="marca-l">'}
      <span class="marcas__n">${p.nome}</span>
      <span class="marcas__x">${tx(p.x, lingua)}</span>
      ${p.url ? '<span class="marcas__s" aria-hidden="true">↗</span>' : ''}
    ${p.url ? '</a>' : '</span>'}</li>`).join('')}</ul>`;
}
