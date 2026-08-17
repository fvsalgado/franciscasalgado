/* Instagram.

   Três caminhos, por esta ordem:
   1. /api/instagram — a Graph API da Meta, se houver token guardado. Traz a
      fotografia, a legenda e a ligação de cada publicação, e mantém-se
      sozinha. É o caminho bom.
   2. data/instagram.json — códigos de publicações escritos à mão, embutidos
      pelo embed oficial de publicação, que é o que a Meta ainda serve sem
      sessão iniciada.
   3. O convite a seguir a conta.

   O que não existe é ler o perfil sem sessão: a conta ser pública não muda
   nada: a página devolve JavaScript sem publicações lá dentro, e a API de
   perfil responde `require_login` a pedidos vindos de servidores. */

import { icone } from './icones.js';

export const CONTA = 'francisca_salgado_';

const tx = (v, l) => (typeof v === 'string' ? v : v?.[l] || v?.pt || '');

async function ficheiro() {
  try { return await (await fetch('/data/instagram.json', { cache: 'no-cache' })).json(); }
  catch (e) { console.warn('instagram:', e.message); return {}; }
}

/* Números como o Instagram os escreve: 12,4 mil em vez de 12 400. */
function curto(n, lingua) {
  if (n == null || !Number.isFinite(Number(n))) return null;
  const v = Number(n);
  if (v < 1000) return String(v);
  const mil = (v / 1000).toFixed(v < 10000 ? 1 : 0).replace(/\.0$/, '');
  return lingua === 'en' ? `${mil.replace(',', '.')}K` : `${mil.replace('.', ',')} mil`;
}

function convite(lingua) {
  const en = lingua === 'en';
  return `
    <div class="ig__convite">
      <p class="ig__arroba">@${CONTA}</p>
      <p class="txt">${en
        ? 'Practice, travel and everything that happens between tournaments, first hand.'
        : 'Treinos, viagens e o que acontece entre provas, em primeira mão.'}</p>
      <a class="cap cap--cheio" href="https://www.instagram.com/${CONTA}/" target="_blank" rel="noopener" data-mag>${
        en ? 'Follow on Instagram' : 'Seguir no Instagram'}</a>
    </div>`;
}

/* 1 — a Graph API, pela função */
async function daApi() {
  try {
    const r = await fetch('/api/instagram', { cache: 'no-cache' });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.publicacoes || []).filter((p) => p?.imagem && p?.url);
  } catch { return []; }
}

/* 2 — códigos escritos à mão */
async function dosCodigos() {
  try {
    const d = await ficheiro();
    return (d.publicacoes || [])
      .map((p) => (typeof p === 'string' ? { codigo: p } : p))
      .filter((p) => p?.codigo)
      .map((p) => ({ codigo: p.codigo, tipo: p.tipo === 'reel' ? 'reel' : 'p', conta: p.conta || CONTA }));
  } catch { return []; }
}

/* ── cartão de perfil ─────────────────────────────────────── */
/* Uma réplica sóbria do cabeçalho do Instagram, na tipografia da casa. Os
   números só aparecem quando se sabem: com token vêm da Graph API, sem token
   vêm do bloco `perfil` de data/instagram.json, e se não estiverem em lado
   nenhum o cartão mostra-se na mesma — só sem contas. Um número de
   seguidores inventado seria pior do que número nenhum. */
export async function perfilIg(cx, lingua = 'pt') {
  if (!cx) return;
  const en = lingua === 'en';
  const { perfil: p = {} } = await ficheiro();

  let n = { seguidores: p.seguidores, aSeguir: p.aSeguir, publicacoes: p.publicacoes };
  let vivo = false;
  try {
    const r = await fetch('/api/instagram', { cache: 'no-cache' });
    if (r.ok) {
      const d = await r.json();
      if (d?.perfil?.seguidores != null) { n = d.perfil; vivo = true; }
    }
  } catch { /* sem função — ficam os números do ficheiro */ }

  const contas = [
    { v: curto(n.publicacoes, lingua), r: en ? 'posts' : 'publicações' },
    { v: curto(n.seguidores, lingua), r: en ? 'followers' : 'seguidores' },
    { v: curto(n.aSeguir, lingua), r: en ? 'following' : 'a seguir' },
  ].filter((c) => c.v);

  cx.className = 'igp';
  cx.innerHTML = `
    <div class="igp__cab">
      <img class="igp__f" src="/img/cara.webp" alt="${p.nome || 'Francisca Salgado'}"
           width="280" height="280" loading="lazy" decoding="async" data-credito-feito="1" />
      <div class="igp__id">
        <p class="igp__a">@${p.arroba || CONTA}</p>
        <p class="igp__n">${p.nome || 'Francisca Salgado'}</p>
      </div>
    </div>
    ${contas.length ? `<dl class="igp__c">${contas.map((c) => `
      <div><dd class="num">${c.v}</dd><dt>${c.r}</dt></div>`).join('')}</dl>` : ''}
    <p class="igp__b">${tx(p.bio, lingua)}</p>
    <a class="cap cap--cheio igp__bt" href="https://www.instagram.com/${p.arroba || CONTA}/"
       target="_blank" rel="noopener" data-mag>${en ? 'Follow' : 'Seguir'}</a>
    ${vivo ? `<span class="igp__vivo">${en ? 'Live' : 'Em direto'}</span>` : ''}`;
}

/* ── parcerias em vídeo ───────────────────────────────────── */
/* Os reels de marca: mostram o trabalho de patrocínio a acontecer, que é o
   argumento mais forte para quem está a pensar entrar.

   A legenda diz o nome da marca uma vez e, a seguir, o que a parceria cobre.

   Por trás do iframe fica uma ligação: se o Instagram não desenhar — bloqueador
   de conteúdos, rede fechada, embed retirado — o cartão continua a levar ao
   vídeo em vez de ficar um retângulo vazio. */
export async function reels(cx, lingua = 'pt') {
  if (!cx) return;
  const { parcerias: ps = [] } = await ficheiro();
  if (!ps.length) { cx.innerHTML = ''; return; }
  const en = lingua === 'en';

  cx.className = 'reels';
  cx.innerHTML = `
    <div class="reels__c" data-carril>${ps.map((p) => {
      const url = `https://www.instagram.com/reel/${p.codigo}/`;
      return `
      <figure class="reel sobe-i">
        <div class="reel__f">
          <a class="reel__fb" href="${url}" target="_blank" rel="noopener" data-sem-seta>
            <span>${en ? 'Watch on Instagram' : 'Ver no Instagram'}</span>
          </a>
          <iframe title="Instagram · ${p.marca}" loading="lazy" scrolling="no"
            src="https://www.instagram.com/reel/${encodeURIComponent(p.codigo)}/embed/"
            frameborder="0" allow="encrypted-media"></iframe>
        </div>
        <figcaption class="reel__l">
          <a class="reel__m" href="${url}" target="_blank" rel="noopener" data-sem-seta data-mag>${p.marca}</a>
          <span class="reel__x">${tx(p.x, lingua)}</span>
        </figcaption>
      </figure>`;
    }).join('')}</div>
    <div class="reels__n">
      <button class="reels__b" type="button" data-ir="-1"
              aria-label="${en ? 'Previous' : 'Anterior'}">${icone('seta', 'ic')}</button>
      <button class="reels__b" type="button" data-ir="1"
              aria-label="${en ? 'Next' : 'Seguinte'}">${icone('seta', 'ic')}</button>
    </div>`;

  const carril = cx.querySelector('[data-carril]');
  cx.querySelector('.reels__n').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ir]');
    if (!b) return;
    const passo = carril.querySelector('.reel')?.getBoundingClientRect().width || 280;
    carril.scrollBy({ left: Number(b.dataset.ir) * (passo + 20), behavior: 'smooth' });
  });

  /* As setas desligam-se nas pontas: um botão que não faz nada é pior do que
     um botão que se vê que não dá. */
  const pontas = () => {
    const [ant, seg] = cx.querySelectorAll('[data-ir]');
    const fim = carril.scrollWidth - carril.clientWidth - 4;
    ant.disabled = carril.scrollLeft <= 4;
    seg.disabled = carril.scrollLeft >= fim;
  };
  carril.addEventListener('scroll', pontas, { passive: true });
  addEventListener('resize', pontas);
  pontas();
}

/* `comConvite` fica falso quando o cartão de perfil já está ao lado: dois
   blocos a dizer «@francisca_salgado_ · Seguir» na mesma secção é repetição. */
export async function instagram(cx, lingua = 'pt', quantas = 3, comConvite = true) {
  if (!cx) return;
  const rodape = () => (comConvite ? convite(lingua) : '');

  const pubs = await daApi();
  if (pubs.length) {
    cx.innerHTML = `
      <div class="ig__g ig__g--fotos">${pubs.slice(0, quantas).map((p) => `
        <a class="ig__foto" href="${p.url}" target="_blank" rel="noopener" data-sem-seta data-mag>
          <img src="${p.imagem}" alt="${(p.legenda || '').replace(/"/g, '&quot;')}"
               loading="lazy" decoding="async" data-credito-feito="1" />
          ${p.legenda ? `<span class="ig__cap">${p.legenda}</span>` : ''}
        </a>`).join('')}</div>
      ${rodape()}`;
    return;
  }

  const posts = await dosCodigos();
  if (!posts.length) { cx.innerHTML = convite(lingua); return; }

  // a legenda por baixo credita a conta que publicou — nem todas são dela — e
  // deixa uma ligação que continua a servir se o Instagram não desenhar o iframe
  cx.innerHTML = `
    <div class="ig__g faixa">${posts.slice(0, quantas).map((p) => {
      const url = `https://www.instagram.com/${p.conta}/${p.tipo}/${p.codigo}/`;
      return `
      <figure class="ig__c">
        <iframe class="ig__p" title="Instagram · @${p.conta}" loading="lazy" scrolling="no"
          src="https://www.instagram.com/${p.tipo}/${encodeURIComponent(p.codigo)}/embed/captioned/"
          frameborder="0" allow="encrypted-media"></iframe>
        <figcaption class="ig__l"><a href="${url}" target="_blank" rel="noopener" data-mag>@${p.conta}</a></figcaption>
      </figure>`;
    }).join('')}</div>
    ${rodape()}`;
}
