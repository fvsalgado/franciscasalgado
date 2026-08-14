/* Fotografias e vídeos.

   Os vídeos são do YouTube, mas não se carrega nada do YouTube até alguém
   carregar no botão: até lá é uma capa desenhada aqui, e nem sequer a
   miniatura vem de lá. Assim quem passa pela página não é seguido por causa
   de um vídeo que não chegou a ver — e a página não fica presa a três
   iframes de terceiros que nunca ninguém abre. */

import { icone } from './icones.js';

const tx = (v, l) => (typeof v === 'string' ? v : v?.[l] || v?.pt || '');

async function ler(nome) {
  try { return await (await fetch(`data/${nome}.json`, { cache: 'no-cache' })).json(); }
  catch (e) { console.warn(`${nome}:`, e.message); return {}; }
}

/* ── galeria ──────────────────────────────────────────────── */
export async function galeria(cx, lingua = 'pt', quantas = 99) {
  if (!cx) return;
  const { fotos = [] } = await ler('galeria');
  if (!fotos.length) { cx.innerHTML = ''; return; }

  cx.className = 'galeria';
  cx.innerHTML = fotos.slice(0, quantas).map((p) => `
    <figure class="gal ${p.formato === 'largo' ? 'gal--largo' : 'gal--alto'} sobe-i">
      <img src="img/${p.f}" alt="${tx(p.alt, lingua).replace(/"/g, '&quot;')}"
           loading="lazy" decoding="async" />
      <figcaption class="gal__l"><span class="gal__a num">${p.ano}</span> ${tx(p.l, lingua)}</figcaption>
    </figure>`).join('');
}

/* ── vídeos ───────────────────────────────────────────────── */
export async function videos(cx, lingua = 'pt') {
  if (!cx) return;
  const { videos: vs = [] } = await ler('videos');
  if (!vs.length) { cx.innerHTML = ''; return; }

  const ver = lingua === 'en' ? 'Play' : 'Ver';
  cx.className = 'videos';
  cx.innerHTML = vs.map((v) => `
    <figure class="vid sobe-i" data-id="${v.id}">
      <button class="vid__bt" type="button"
              aria-label="${ver}: ${tx(v.titulo, lingua).replace(/"/g, '&quot;')}">
        <span class="vid__capa" aria-hidden="true">
          <span class="vid__ano num">${v.ano}</span>
          <span class="vid__seta">${icone('seta', 'ic')}</span>
        </span>
      </button>
      <figcaption class="vid__q">
        <h3 class="vid__t">${tx(v.titulo, lingua)}</h3>
        <p class="vid__x">${tx(v.nota, lingua)}</p>
        <p class="vid__c">${v.canal} · YouTube</p>
      </figcaption>
    </figure>`).join('');

  cx.addEventListener('click', (e) => {
    const bt = e.target.closest('.vid__bt');
    if (!bt) return;
    const fig = bt.closest('.vid');
    const id = fig.dataset.id;
    // youtube-nocookie: sem cookies de publicidade antes de o vídeo correr
    bt.outerHTML = `
      <div class="vid__cx">
        <iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0"
                title="${fig.querySelector('.vid__t').textContent}"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      </div>`;
  });
}

/* ── parede de apoios ─────────────────────────────────────── */
export async function apoios(cx, lingua = 'pt') {
  if (!cx) return;
  const { grupos = [] } = await ler('apoios');
  if (!grupos.length) { cx.innerHTML = ''; return; }

  /* Cada item é um cartão branco do mesmo tamanho. Os que têm logótipo
     mostram-no; os que não têm mostram o nome na tipografia da casa. Como o
     cartão é igual nos dois casos, a parede lê-se como uma só coisa em vez
     de uma manta de retalhos — e um logótipo que chegue amanhã entra sem
     mexer em mais nada. */
  const cartao = (i) => {
    const dentro = i.logo
      ? `<img src="img/logos/${i.logo}" alt="${i.nome}" loading="lazy" decoding="async" data-credito-feito="1" />`
      : `<span class="apoio__n">${i.nome}</span>`;
    const corpo = `
      <span class="apoio__cx">${dentro}</span>
      <span class="apoio__x">${tx(i.x, lingua)}</span>`;
    return i.url
      ? `<a class="apoio" href="${i.url}" target="_blank" rel="noopener" data-mag>${corpo}</a>`
      : `<div class="apoio">${corpo}</div>`;
  };

  cx.className = 'apoios';
  cx.innerHTML = grupos.map((g) => `
    <section class="apoios__g${g.destaque ? ' apoios__g--destaque' : ''}">
      <div class="apoios__cab">
        <p class="rot rot--so">${tx(g.t, lingua)}</p>
        <p class="apoios__x">${tx(g.x, lingua)}</p>
      </div>
      <div class="apoios__l">${g.itens.map(cartao).join('')}</div>
    </section>`).join('');
}
