/* Ícones, desenhados à mão em SVG.
   Ficam aqui, e não num sprite dentro de cada HTML, porque as páginas todas
   partilham este ficheiro — assim um ícone novo entra num sítio só. Todos
   assentam numa grelha de 24 e usam currentColor, para herdarem a cor do
   texto onde quer que sejam postos. */

const P = {
  /* ── golfe ─────────────────────────────────────────────── */
  bandeira:
    '<path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M8 20.2V3.6l9.2 3.3L8 10.2"/><ellipse cx="12" cy="20.4" rx="6.8" ry="1.7" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  bola:
    '<circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="9.5" cy="9.9" r=".85"/><circle cx="12.6" cy="8.5" r=".85"/><circle cx="14.8" cy="11.4" r=".85"/><circle cx="10.9" cy="13.2" r=".85"/><circle cx="13.8" cy="14.9" r=".85"/><circle cx="9.1" cy="16.1" r=".85"/>',
  taca:
    '<path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" d="M7.2 3.6h9.6v5.1a4.8 4.8 0 0 1-9.6 0V3.6Z"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M7.2 5.3H4.4v1.5a3.2 3.2 0 0 0 3.2 3.2M16.8 5.3h2.8v1.5a3.2 3.2 0 0 1-3.2 3.2"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 13.6v3.2M8.9 20.4h6.2l-.9-3.6H9.8l-.9 3.6Z"/>',
  ranking:
    '<path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M3.8 20.2h16.4M7.4 20.2v-4.8M12 20.2V8.4M16.6 20.2v-8.2"/>',
  calendario:
    '<rect x="3.4" y="5.4" width="17.2" height="15.2" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M8 3.4v3.9M16 3.4v3.9M3.4 10.3h17.2"/>',
  /* Triângulo de leitura, para as capas de vídeo. Estava lá uma seta, que é
     o que se usa para «ir para» e não para «ver». */
  play:
    '<path d="M9.2 6.6a.9.9 0 0 1 1.36-.77l8.1 5.4a.9.9 0 0 1 0 1.54l-8.1 5.4A.9.9 0 0 1 9.2 17.4V6.6Z"/>',
  /* Uma folha de jornal dobrada, para a página de imprensa. */
  jornal:
    '<path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" d="M6.2 4.4h11.4v15.2H4.8a1.6 1.6 0 0 1-1.6-1.6V8.2h3V4.4Z"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M17.6 8.2h3v9.8a1.6 1.6 0 0 1-1.6 1.6M9 8.4h5.6M9 11.6h5.6M9 14.8h3.4"/>',
  /* Dois apertos de mão, para as parcerias. */
  aperto:
    '<path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="m8.6 12.6 2.4-2.4a1.8 1.8 0 0 1 2.5 0l4.1 4.1M3.4 8.6 7 5h3.2M20.6 8.6 17 5h-3.2"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="m10.4 17.6 1.6 1.6a1.7 1.7 0 0 0 2.4-2.4M13.4 15.2l1.9 1.9a1.7 1.7 0 0 0 2.4-2.4M6.6 10.6l-3 3a1.7 1.7 0 0 0 2.4 2.4l1.4-1.4a1.7 1.7 0 0 1 2.4 2.4"/>',
  /* Saco de golfe com dois tacos à mostra, para o atalho do «what's in the
     bag» no cabeçalho. */
  saco:
    '<path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" d="M7.6 9.2h8.8v9.6a1.9 1.9 0 0 1-1.9 1.9H9.5a1.9 1.9 0 0 1-1.9-1.9V9.2Z"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M7.6 12.4h8.8M10.2 9V5.6M13.8 9V4.4M10.2 5.6l-1.5-1M13.8 4.4l1.6-.9"/>',
  /* Cabeça e ombros, para a ficha da jogadora. */
  pessoa:
    '<circle cx="12" cy="8.2" r="3.6" fill="none" stroke="currentColor" stroke-width="1.7"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0"/>',
  mapa:
    '<path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" d="M9 4.2 3.6 6.4v13.4L9 17.6l6 2.2 5.4-2.2V4.2L15 6.4 9 4.2Z"/><path fill="none" stroke="currentColor" stroke-width="1.7" d="M9 4.2v13.4M15 6.4v13.4"/>',
  seta:
    '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M7 17 17 7M9.2 7H17v7.8"/>',

  /* ── redes e ligações ──────────────────────────────────── */
  instagram:
    '<path fill="none" stroke="currentColor" stroke-width="1.7" d="M7.5 3.5h9a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4h-9a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4Z"/><circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17.1" cy="6.9" r="1.1"/>',
  youtube:
    '<path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3-5.2 3Z"/>',
  linkedin:
    '<path d="M20.45 3H3.55A.55.55 0 0 0 3 3.55v16.9c0 .3.25.55.55.55h16.9c.3 0 .55-.25.55-.55V3.55A.55.55 0 0 0 20.45 3ZM8.34 18.34H5.4V9.9h2.94v8.44ZM6.87 8.62a1.7 1.7 0 1 1 0-3.41 1.7 1.7 0 0 1 0 3.41Zm11.47 9.72h-2.93v-4.1c0-.98-.02-2.24-1.37-2.24-1.37 0-1.58 1.07-1.58 2.17v4.17H9.53V9.9h2.81v1.15h.04c.39-.74 1.35-1.52 2.77-1.52 2.97 0 3.52 1.95 3.52 4.49v4.32Z"/>',
  email:
    '<path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" d="M4.4 5.6h15.2a1.2 1.2 0 0 1 1.2 1.2v10.4a1.2 1.2 0 0 1-1.2 1.2H4.4a1.2 1.2 0 0 1-1.2-1.2V6.8a1.2 1.2 0 0 1 1.2-1.2Z"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="m3.9 6.6 8.1 5.9 8.1-5.9"/>',
  sitio:
    '<circle cx="12" cy="12" r="8.8" fill="none" stroke="currentColor" stroke-width="1.7"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" d="M3.4 12h17.2M12 3.2c2.2 2.4 3.3 5.4 3.3 8.8s-1.1 6.4-3.3 8.8c-2.2-2.4-3.3-5.4-3.3-8.8S9.8 5.6 12 3.2Z"/>',

  /* ── tema ──────────────────────────────────────────────── */
  lua:
    '<path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  sol:
    '<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/></g>',
};

/** Devolve o SVG do ícone, ou nada — sem ícone é melhor do que um ícone errado. */
export function icone(chave, classe = 'ic') {
  const d = P[chave];
  if (!d) return '';
  return `<svg class="${classe}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>`;
}

export const temIcone = (chave) => Boolean(P[chave]);
