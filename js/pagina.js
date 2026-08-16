/* Páginas interiores. Um ficheiro só, que olha para o data-pagina do <script>
   e pinta o que essa página precisa. Assim há um ponto de entrada por página
   sem haver um ficheiro de arranque por página. */

import { iniciar } from './base.js';
import { iniciarCampo } from './campo.js';
import { reduzido } from './movimento.js';
import { porEpoca, contagens, carregar, proximas } from './resultados.js';
import { factos, citacoes, escadas, ligacoes, numeros } from './conteudo.js';
import { fichaRecruiting, curvaRankings, curvaHandicap, witb, swing } from './recruiting.js';
import { galeria, videos, apoios } from './media.js';
import { reels } from './instagram.js';
import { rankings } from './rankings.js';

const $ = (id) => document.getElementById(id);
const qual = document.currentScript?.dataset.pagina
  || document.querySelector('script[data-pagina]')?.dataset.pagina
  || '';

/* ── o que cada página pinta ──────────────────────────────── */
const PINTAR = {
  async resultados(l) {
    await Promise.all([porEpoca($('epocas'), $('filtros'), l), contagens($('contagens'), l),
                       rankings($('rankings'), l),
                       proximas($('proximas'), l), videos($('videos'), l)]);
    const d = await carregar();
    const nota = $('notaFonte');
    if (nota && d.nota) nota.textContent = d.nota[l] || d.nota.pt;
  },

  async imprensa(l) {
    await Promise.all([
      factos($('factos'), l),
      citacoes($('citacoes'), l),
      ligacoes($('plats'), l, 'ficha'),
      galeria($('gal'), l),
    ]);
  },

  async parcerias(l) {
    await Promise.all([escadas($('escadas'), l), apoios($('apoios'), l),
                       numeros($('numsApoio'), l, 'apoioNumeros'),
                       reels($('reels'), l)]);
  },

  async recruiting(l) {
    await Promise.all([fichaRecruiting($('recNums'), l), curvaRankings($('curva'), l),
                       curvaHandicap($('curvaH'), l), witb($('witbL'), l), swing($('swingV'), l)]);
  },

  async legal() { /* as páginas legais são só texto */ },
};

iniciar(async (l) => { await PINTAR[qual]?.(l); });

/* O mapa de curvas, onde a página o tiver. Fica fora do ciclo da língua: não
   tem texto nenhum, e recriá-lo seria deitar fora o contexto de WebGL por
   nada. */
const campos = [$('campo'), $('campo2')].filter(Boolean).map((c) => iniciarCampo(c, { reduzido }));
document.addEventListener('fs:tema', () => campos.forEach((c) => c?.tema?.()));

