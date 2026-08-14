/* Tudo o que vem dos ficheiros JSON e não são resultados: os números, os
   factos, a linha do tempo, a imprensa e as ligações. Cada função pinta um
   contentor e volta a ser chamada quando se muda de língua. */

import { icone } from './icones.js';
import { buscar } from './rankings.js';

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
    buscar('/api/wagr', 'data/wagr.json'),
    buscar('/api/egr', 'data/egr.json'),
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
      <a class="degrau__b" href="#contacto" data-mag>${en ? 'Talk about this' : 'Falar sobre isto'}</a>
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
