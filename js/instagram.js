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

export const CONTA = 'francisca_salgado_';

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
    const d = await (await fetch('data/instagram.json', { cache: 'no-cache' })).json();
    return (d.publicacoes || [])
      .map((p) => (typeof p === 'string' ? { codigo: p } : p))
      .filter((p) => p?.codigo)
      .map((p) => ({ codigo: p.codigo, tipo: p.tipo === 'reel' ? 'reel' : 'p', conta: p.conta || CONTA }));
  } catch (e) { console.warn('instagram:', e.message); return []; }
}

export async function instagram(cx, lingua = 'pt', quantas = 3) {
  if (!cx) return;

  const pubs = await daApi();
  if (pubs.length) {
    cx.innerHTML = `
      <div class="ig__g ig__g--fotos">${pubs.slice(0, quantas).map((p) => `
        <a class="ig__foto" href="${p.url}" target="_blank" rel="noopener" data-mag>
          <img src="${p.imagem}" alt="${(p.legenda || '').replace(/"/g, '&quot;')}"
               loading="lazy" decoding="async" data-credito-feito="1" />
          ${p.legenda ? `<span class="ig__cap">${p.legenda}</span>` : ''}
        </a>`).join('')}</div>
      ${convite(lingua)}`;
    return;
  }

  const posts = await dosCodigos();
  if (!posts.length) { cx.innerHTML = convite(lingua); return; }

  // a legenda por baixo credita a conta que publicou — nem todas são dela — e
  // deixa uma ligação que continua a servir se o Instagram não desenhar o iframe
  cx.innerHTML = `
    <div class="ig__g">${posts.slice(0, quantas).map((p) => {
      const url = `https://www.instagram.com/${p.conta}/${p.tipo}/${p.codigo}/`;
      return `
      <figure class="ig__c">
        <iframe class="ig__p" title="Instagram · @${p.conta}" loading="lazy" scrolling="no"
          src="https://www.instagram.com/${p.tipo}/${encodeURIComponent(p.codigo)}/embed/captioned/"
          frameborder="0" allow="encrypted-media"></iframe>
        <figcaption class="ig__l"><a href="${url}" target="_blank" rel="noopener" data-mag>@${p.conta}</a></figcaption>
      </figure>`;
    }).join('')}</div>
    ${convite(lingua)}`;
}
