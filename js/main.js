/* Página inicial. */

import { iniciar, carga } from './base.js';
import { iniciarCampo } from './campo.js';
import { reduzido } from './movimento.js';
import { ultimas, ultimo, proxima } from './resultados.js';
import { numeros, citacoes, saiuEm, portas } from './conteudo.js';
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
    ultimas($('ultimas'), l, 4),
    citacoes($('citacoes'), l, 1, { grande: true }),
    saiuEm($('saiuEm'), l),
    portas($('portas'), l),
    rankings($('rankings'), l, { curto: true }),
    proximo(l),
  ]);
});

/* O campo em WebGL fica de fora do ciclo da língua: não tem texto nenhum,
   e recriá-lo a cada troca era deitar fora o contexto por nada. */
/* Na inicial o mapa vive na faixa escura dos rankings: leva a paleta escura à
   força, para poder correr a toda a opacidade e voltar a ver-se a mexer. */
const campo = iniciarCampo($('campo'), { reduzido, escuro: true });
document.addEventListener('fs:tema', () => campo.tema?.());

carga().then(() => {
  // o Instagram entra depois da cortina: são iframes de terceiros, e nada
  // disto deve atrasar o primeiro desenho da página
  const pintarIg = (l) => { perfilIg($('igPerfil'), l); instagram($('ig'), l, 3, false); };
  pintarIg(i18n.lingua());
});
