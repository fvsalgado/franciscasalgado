/* Tudo o que vem dos ficheiros JSON e não são resultados: os números, os
   factos, a linha do tempo, a imprensa e as ligações. Cada função pinta um
   contentor e volta a ser chamada quando se muda de língua. */

import { icone } from './icones.js';

const cache = {};
async function ler(nome) {
  if (cache[nome]) return cache[nome];
  try {
    cache[nome] = await (await fetch(`data/${nome}.json`, { cache: 'no-cache' })).json();
  } catch (e) {
    console.warn(`${nome}:`, e.message);
    cache[nome] = {};
  }
  return cache[nome];
}

const tx = (v, lingua) => (typeof v === 'string' ? v : v?.[lingua] || v?.pt || '');

/* ── números ──────────────────────────────────────────────── */
export async function numeros(cx, lingua = 'pt') {
  if (!cx) return;
  const { numeros: ns = [] } = await ler('perfil');
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
export async function factos(cx, lingua = 'pt') {
  if (!cx) return;
  const { factos: fs = [] } = await ler('perfil');
  cx.className = 'factos';
  cx.innerHTML = fs.map((f) => `
    <div><dt>${tx(f.dt, lingua)}</dt><dd>${tx(f.dd, lingua)}</dd></div>`).join('');
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
export async function escadas(cx, lingua = 'pt') {
  if (!cx) return;
  const { escadas: es = [] } = await ler('perfil');
  cx.className = 'escadas';
  cx.innerHTML = es.map((e) => `
    <div class="degrau">
      <div class="degrau__t">
        <h3 class="degrau__n">${tx(e.n, lingua)}</h3>
        <span class="degrau__e">${tx(e.e, lingua)}</span>
      </div>
      <p class="degrau__x">${tx(e.x, lingua)}</p>
    </div>`).join('');
}

/* ── apoios já existentes ─────────────────────────────────── */
export async function apoios(cx, lingua = 'pt') {
  if (!cx) return;
  const { apoios: as = [] } = await ler('perfil');
  cx.className = 'marcas';
  cx.innerHTML = as.map((a) => (a.url
    ? `<li><a href="${a.url}" target="_blank" rel="noopener" data-mag>${a.nome}</a></li>`
    : `<li>${a.nome}</li>`)).join('');
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
    <a class="plat" href="${c.url}" target="_blank" rel="noopener" data-mag>
      <span class="plat__i">${icone(c.chave, 'ic')}</span>
      <span class="plat__q">
        <span class="plat__n">${c.nome}</span>
        <span class="plat__s">${c.sub}</span>
      </span>
      <span class="plat__a">${icone('seta', 'ic ic--pe')}</span>
    </a>`).join('');
}

/* ── imprensa ─────────────────────────────────────────────── */
export async function citacoes(cx, lingua = 'pt', quantas = 99) {
  if (!cx) return;
  const { citacoes: cs = [] } = await ler('imprensa');
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
  const { pecas: ps = [] } = await ler('imprensa');
  cx.className = 'pecas';
  cx.innerHTML = ps.map((p) => `
    <li class="peca">
      <a href="${p.url}" target="_blank" rel="noopener" data-mag>
        <span class="peca__o">${p.o}</span>
        <span class="peca__t">${tx(p.t, lingua)}</span>
        <span class="peca__a num">${p.data}</span>
      </a>
    </li>`).join('');
}

export async function saiuEm(cx) {
  if (!cx) return;
  const { saiuEm: ss = [] } = await ler('imprensa');
  cx.className = 'saiu__l';
  cx.innerHTML = ss.map((s) => `<li>${s}</li>`).join('');
}
