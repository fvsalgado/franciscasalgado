/* Página inicial. */

import { iniciar, carga } from './base.js';
import { iniciarCampo } from './campo.js';
import { reduzido } from './movimento.js';
import { ultimas, palmares, ultimo } from './resultados.js';
import { numeros, citacoes, saiuEm } from './conteudo.js';
import { galeria, apoios } from './media.js';
import { instagram } from './instagram.js';
import { wagr } from './wagr.js';

const $ = (id) => document.getElementById(id);

async function proximo(lingua) {
  const cx = $('proxQ');
  if (!cx) return;
  const u = await ultimo(lingua);
  cx.textContent = u
    ? u.texto
    : (lingua === 'en' ? 'Results coming soon' : 'Resultados em breve');
}

const { i18n } = iniciar(async (l) => {
  await Promise.all([
    numeros($('nums'), l),
    ultimas($('ultimas'), l, 5),
    palmares($('palm'), l),
    citacoes($('citacoes'), l, 2),
    saiuEm($('saiuEm')),
    galeria($('gal'), l, 6),
    apoios($('apoios'), l),
    wagr($('wagr'), l),
    proximo(l),
  ]);
});

/* O campo em WebGL fica de fora do ciclo da língua: não tem texto nenhum,
   e recriá-lo a cada troca era deitar fora o contexto por nada. */
const campo = iniciarCampo($('campo'), { reduzido });
document.addEventListener('fs:tema', () => campo.tema?.());

carga().then(() => {
  // o Instagram entra depois da cortina: são iframes de terceiros, e nada
  // disto deve atrasar o primeiro desenho da página
  instagram($('ig'), i18n.lingua());
  document.addEventListener('fs:lingua', (e) => instagram($('ig'), e.detail));
});
