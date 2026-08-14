/* Instagram.
   O embed de PERFIL (instagram.com/conta/embed) está descontinuado: devolve
   200 com o corpo vazio, e a API pública de perfil responde 401. O que a Meta
   mantém é o embed de cada PUBLICAÇÃO, que renderiza sem sessão iniciada.
   Por isso quem manda aqui é a lista de códigos em data/instagram.json: com
   códigos, entram as publicações; sem eles, entra o convite — e nunca uma
   caixa vazia, que é pior do que não ter secção nenhuma. */

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

async function dosCodigos() {
  try {
    const d = await (await fetch('data/instagram.json', { cache: 'no-cache' })).json();
    return (d.publicacoes || [])
      .map((p) => (typeof p === 'string' ? { codigo: p } : p))
      .filter((p) => p?.codigo)
      .map((p) => ({ codigo: p.codigo, tipo: p.tipo === 'reel' ? 'reel' : 'p', conta: p.conta || CONTA }));
  } catch (e) { console.warn('instagram:', e.message); return []; }
}

export async function instagram(cx, lingua = 'pt') {
  if (!cx) return;

  const posts = await dosCodigos();
  if (!posts.length) { cx.innerHTML = convite(lingua); return; }

  // a legenda por baixo faz dois trabalhos: credita a conta que publicou —
  // nem todas são dela — e deixa um link que continua a servir se o Instagram
  // decidir não desenhar o iframe
  cx.innerHTML = `
    <div class="ig__g">${posts.slice(0, 3).map((p) => {
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
