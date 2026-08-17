/* Fotografias e vídeos.

   Os vídeos são do YouTube, mas não se carrega nada do YouTube até alguém
   carregar no botão. A capa é a imagem verdadeira do vídeo — copiada uma vez
   para img/videos/ pelo scripts/capas.mjs e servida daqui. Pedi-la a
   i.ytimg.com quando a página abre seria mandar o endereço de quem lê para um
   servidor da Google por causa de um vídeo que talvez nunca veja; assim
   mostra-se a mesma imagem sem esse pedido.

*/

import { icone } from './icones.js';

const tx = (v, l) => (typeof v === 'string' ? v : v?.[l] || v?.pt || '');

async function ler(nome) {
  try { return await (await fetch(`/data/${nome}.json`, { cache: 'no-cache' })).json(); }
  catch (e) { console.warn(`${nome}:`, e.message); return {}; }
}

/* ── galeria ──────────────────────────────────────────────── */
export async function galeria(cx, lingua = 'pt', quantas = 99) {
  if (!cx) return;
  const { fotos = [] } = await ler('galeria');
  if (!fotos.length) { cx.innerHTML = ''; return; }

  cx.className = 'galeria faixa';
  cx.innerHTML = fotos.slice(0, quantas).map((p) => `
    <figure class="gal ${p.formato === 'largo' ? 'gal--largo' : 'gal--alto'} sobe-i">
      <img src="/img/${p.f}" alt="${tx(p.alt, lingua).replace(/"/g, '&quot;')}"
           loading="lazy" decoding="async" />
      <figcaption class="gal__l"><span class="gal__a num">${p.ano}</span> ${tx(p.l, lingua)}</figcaption>
    </figure>`).join('');
}

/* ── vídeos ───────────────────────────────────────────────── */
/* `lista` serve quem já tem os vídeos em mão — o coach's corner lê os dele de
   data/swing.json. Sem lista, vai buscar os do arquivo, como sempre. */
export async function videos(cx, lingua = 'pt', lista = null) {
  if (!cx) return;
  const vs = lista || (await ler('videos')).videos || [];
  if (!vs.length) { cx.innerHTML = ''; return; }

  const ver = lingua === 'en' ? 'Play' : 'Ver';
  cx.className = 'videos';
  cx.innerHTML = vs.map((v) => `
    <figure class="vid sobe-i" data-id="${v.id}">
      <button class="vid__bt" type="button"
              aria-label="${ver}: ${tx(v.titulo, lingua).replace(/"/g, '&quot;')}">
        <span class="vid__capa" aria-hidden="true">
          <img src="/img/videos/${v.id}.webp" alt="" loading="lazy" decoding="async"
               data-credito-feito="1" />
          ${v.ano ? `<span class="vid__ano num">${v.ano}</span>` : ''}
          <span class="vid__play">${icone('play', 'ic')}</span>
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

  /* Um campo de golfe não é uma marca: o logótipo do clube não diz nada a quem
     nunca lá jogou, e a fotografia diz tudo. Um item com `foto` troca a placa
     do logótipo por uma imagem do sítio, com o nome por baixo. O `alt` é
     descritivo e não decorativo — é a única forma de quem não vê a imagem
     ficar a saber que campo é. */
  const cartaoFoto = (i) => {
    const corpo = `
      <figure class="campo__f">
        <img src="/img/campos/${i.foto}" alt="${tx(i.alt, lingua) || `${lingua === 'en' ? 'Golf course' : 'Campo de golfe'} ${i.nome}`}"
             loading="lazy" decoding="async" />
      </figure>
      <span class="campo__n">${i.nome}</span>
      <span class="apoio__x">${tx(i.x, lingua)}</span>`;
    return i.url
      ? `<a class="campo" href="${i.url}" target="_blank" rel="noopener" data-sem-seta data-mag>${corpo}</a>`
      : `<div class="campo">${corpo}</div>`;
  };

  /* Os restantes são cartões brancos do mesmo tamanho. Os que têm logótipo
     mostram-no; os que não têm mostram o nome na tipografia da casa. Como o
     cartão é igual nos dois casos, a parede lê-se como uma só coisa em vez de
     uma manta de retalhos — e um logótipo que chegue amanhã entra sem mexer
     em mais nada. */
  const cartao = (i) => {
    if (i.foto) return cartaoFoto(i);
    const dentro = i.logo
      ? `<img src="/img/logos/${i.logo}" alt="${i.nome}" loading="lazy" decoding="async" data-credito-feito="1" />`
      : `<span class="apoio__n">${i.nome}</span>`;
    /* A placa adapta-se ao logótipo, e não o contrário. `fundo` pode ser
       «escuro», para marcas desenhadas a branco, ou uma cor da casa — assim não
       se vê emenda entre a placa e o logótipo. */
    const cor = i.fundo && i.fundo !== 'escuro' ? ` style="background:${i.fundo};border-color:${i.fundo}"` : '';
    const placa = i.fundo === 'escuro' ? ' apoio__cx--escuro' : '';
    const corpo = `
      <span class="apoio__cx${placa}"${cor}>${dentro}</span>
      <span class="apoio__x">${tx(i.x, lingua)}</span>`;
    return i.url
      ? `<a class="apoio" href="${i.url}" target="_blank" rel="noopener" data-sem-seta data-mag>${corpo}</a>`
      : `<div class="apoio">${corpo}</div>`;
  };

  cx.className = 'apoios';
  cx.innerHTML = grupos.map((g) => {
    /* Um grupo de fotografias respira de outra maneira: cartões maiores, menos
       por linha. Basta um item com fotografia para o grupo mudar de forma. */
    const comFoto = g.itens.some((i) => i.foto) ? ' apoios__l--campos' : '';

    /* Um grupo pode pedir a forma de lista em vez da parede de placas.
     *
     * Uma placa existe para segurar um logótipo — é isso que ela é. Sem
     * logótipo, uma placa é uma caixa creme com um nome ao meio, e cinco delas
     * seguidas são cinco caixas a fingir que são marcas. Em lista, o nome é o
     * nome, a seta diz que se pode ir lá ver, e cinco cabem no espaço de uma.
     * `forma: "linhas"` no data/apoios.json escolhe. */
    if (g.forma === 'linhas') {
      /* Com logótipo, o logótipo É o nome: as cinco marcas escrevem o próprio
         nome no logótipo, e pô-lo ao lado do nome em texto era ler «WellPutt
         WellPutt». O nome verdadeiro fica no `alt`, que é onde um leitor de
         ecrã o procura. Os ficheiros são monocromáticos, pintados na tinta da
         casa — cinco identidades gráficas em cinco linhas seguidas eram um
         mercado; na mesma cor, são uma lista. */
      const linha = (i) => {
        const corpo = `${i.logo
          ? `<img class="marcas__m" src="/img/logos/${i.logo}" alt="${i.nome}" loading="lazy" decoding="async" data-credito-feito="1" />`
          : `<span class="marcas__n">${i.nome}</span>`}
          ${tx(i.x, lingua) ? `<span class="marcas__x">${tx(i.x, lingua)}</span>` : ''}
          ${i.url ? '<span class="marcas__s" aria-hidden="true">↗</span>' : ''}`;
        return i.url
          ? `<li><a class="marca-l" href="${i.url}" target="_blank" rel="noopener" data-sem-seta data-mag>${corpo}</a></li>`
          : `<li><span class="marca-l">${corpo}</span></li>`;
      };
      return `
    <section class="apoios__g">
      <div class="apoios__cab">
        <p class="rot rot--so">${tx(g.t, lingua)}</p>
        ${tx(g.x, lingua) ? `<p class="apoios__x">${tx(g.x, lingua)}</p>` : ''}
      </div>
      <ul class="marcas">${g.itens.map(linha).join('')}</ul>
    </section>`;
    }

    return `
    <section class="apoios__g${g.destaque ? ' apoios__g--destaque' : ''}">
      <div class="apoios__cab">
        <p class="rot rot--so">${tx(g.t, lingua)}</p>
        ${tx(g.x, lingua) ? `<p class="apoios__x">${tx(g.x, lingua)}</p>` : ''}
      </div>
      <div class="apoios__l faixa${comFoto}">${g.itens.map(cartao).join('')}</div>
    </section>`;
  }).join('');

  /* Uma fotografia que ainda não existe não deixa um ícone partido no lugar: o
     cartão fica com o nome e a localidade, que é o que já lá estava antes de
     haver fotografias. Assim o `foto` pode ser escrito no data/apoios.json
     antes de o ficheiro chegar, e no dia em que chegar aparece sozinho — sem
     ninguém ter de se lembrar de voltar aqui. */
  cx.querySelectorAll('.campo__f img').forEach((img) => {
    const falhou = () => img.closest('.campo')?.querySelector('.campo__f')?.remove();
    img.addEventListener('error', falhou, { once: true });
    if (img.complete && !img.naturalWidth) falhou();
  });
}
