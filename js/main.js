/* Página inicial. */

import { iniciar, carga } from './base.js';
import { iniciarCampo } from './campo.js';
import { reduzido } from './movimento.js';
import { ultimas, palmares, ultimo, proxima } from './resultados.js';
import { numeros, citacoes, saiuEm } from './conteudo.js';
import { galeria, apoios } from './media.js';
import { instagram, perfilIg } from './instagram.js';
import { rankings } from './rankings.js';

const $ = (id) => document.getElementById(id);

/* A tira do hero olha primeiro para a frente: se houver prova marcada, é essa
   que aparece — é a pergunta que quem chega faz primeiro. Sem prova marcada,
   mostra o último resultado, como antes. */
async function proximo(lingua) {
  const cx = $('proxQ');
  const rot = $('proxR');
  if (!cx) return;
  const en = lingua === 'en';

  const p = await proxima(lingua);
  if (p) {
    if (rot) rot.textContent = en ? 'Next event' : 'Próxima prova';
    cx.textContent = p.texto;
    return;
  }

  if (rot) rot.textContent = en ? 'Latest result' : 'Último resultado';
  const u = await ultimo(lingua);
  cx.textContent = u
    ? u.texto
    : (en ? 'Results coming soon' : 'Resultados em breve');
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
    rankings($('rankings'), l),
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
  const pintarIg = (l) => { perfilIg($('igPerfil'), l); instagram($('ig'), l, 4, false); };
  pintarIg(i18n.lingua());
  document.addEventListener('fs:lingua', (e) => pintarIg(e.detail));
});
