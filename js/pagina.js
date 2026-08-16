/* Páginas interiores. Um ficheiro só, que olha para o data-pagina do <script>
   e pinta o que essa página precisa. Assim há um ponto de entrada por página
   sem haver um ficheiro de arranque por página. */

import { iniciar } from './base.js';
import { iniciarCampo } from './campo.js';
import { reduzido } from './movimento.js';
import { porEpoca, contagens, carregar } from './resultados.js';
import { factos, citacoes, escadas, ligacoes, numeros, equipa } from './conteudo.js';
import { fichaRecruiting, curvaRankings, witb, swing } from './recruiting.js';
import { galeria, videos, apoios } from './media.js';
import { reels } from './instagram.js';

const $ = (id) => document.getElementById(id);
const qual = document.currentScript?.dataset.pagina
  || document.querySelector('script[data-pagina]')?.dataset.pagina
  || '';

/* ── o que cada página pinta ──────────────────────────────── */
const PINTAR = {
  async resultados(l) {
    await Promise.all([porEpoca($('epocas'), $('filtros'), l), contagens($('contagens'), l),
                       videos($('videos'), l)]);
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

  async jogadora(l) {
    await Promise.all([fichaRecruiting($('recNums'), l), curvaRankings($('curva'), l),
                       witb($('witbL'), l), equipa($('equipaL'), l), swing($('swingV'), l)]);
  },

  /* A mesma secção do recruiting, sozinha numa página. Existe para ser
     partilhada: um endereço curto, uma imagem de partilha própria, e um
     assunto que se explica sem o resto do sítio à volta. */
  async witb(l) { await witb($('witbL'), l); },

  async legal() { /* as páginas legais são só texto */ },
};

iniciar(async (l) => { await PINTAR[qual]?.(l); });

/* O mapa de curvas, onde a página o tiver. Fica fora do ciclo da língua: não
   tem texto nenhum, e recriá-lo seria deitar fora o contexto de WebGL por
   nada. */
const campos = [$('campo'), $('campo2')].filter(Boolean).map((c) => iniciarCampo(c, { reduzido }));
document.addEventListener('fs:tema', () => campos.forEach((c) => c?.tema?.()));

