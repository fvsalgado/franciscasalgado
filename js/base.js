/* Arranque partilhado por todas as páginas.
   Pela ordem que importa: tema (para não piscar), consentimento, língua,
   casca, movimento — e só depois o que cada página tem de seu. */

import { nav, rodape, tema } from './casca.js';
import { creditos } from './creditos.js';
import { cursor, partirTitulos, rolagem, observar, reduzido } from './movimento.js';
import { criarLingua, linguaEscolhida } from './i18n.js';
import { cookies } from './cookies.js';
import { canais } from './conteudo.js';

/* ── ecrã de carga ────────────────────────────────────────── */
/* Só a página inicial o usa. Nas interiores seria um imposto cobrado a quem
   já está dentro do sítio. */
export function carga() {
  const cx = document.getElementById('carga');
  if (!cx) return Promise.resolve();

  const cont = document.getElementById('cargaCont');
  const barra = document.getElementById('cargaBarra');
  const nome = document.getElementById('cargaNome');

  if (nome && !reduzido) {
    nome.innerHTML = [...nome.textContent]
      .map((c, i) => `<i style="animation-delay:${i * 38}ms">${c === ' ' ? '&nbsp;' : c}</i>`)
      .join('');
  }

  return new Promise((resolve) => {
    let n = 0;
    const fim = () => {
      cx.classList.add('fora');
      document.documentElement.classList.remove('sem-rolar');
      document.body.classList.add('pronto');
      setTimeout(() => cx.remove(), 800);
      resolve();
    };

    document.documentElement.classList.add('sem-rolar');
    const passo = setInterval(() => {
      n = Math.min(100, n + Math.random() * 9 + 3);
      if (cont) cont.textContent = String(Math.round(n)).padStart(3, '0');
      if (barra) barra.style.width = `${n}%`;
      if (n >= 100) {
        clearInterval(passo);
        setTimeout(fim, reduzido ? 0 : 380);
      }
    }, reduzido ? 10 : 90);

    // rede de segurança: nunca deixar o ecrã de carga preso
    setTimeout(() => { clearInterval(passo); if (!cx.classList.contains('fora')) fim(); }, 4500);
  });
}

/**
 * Liga a casca e devolve o controlo da língua.
 * @param {(lingua:string)=>void|Promise<void>} pintar
 *        Desenha o conteúdo próprio da página. É chamado no arranque e outra
 *        vez sempre que se troca de língua.
 */
export function iniciar(pintar) {
  tema();
  cookies(linguaEscolhida());

  const repintar = async (l) => {
    nav(l);
    // os títulos voltam a ser partidos: o i18n reescreveu o innerHTML deles e
    // levou a máscara à frente
    partirTitulos();
    const lista = await canais(l);
    rodape(l, lista);
    await pintar?.(l);
    // o que acabou de nascer entra no observador; sem isto ficava a zero de
    // opacidade para sempre
    observar();
    creditos(l);
  };

  /* O criarLingua tem de vir antes do partirTitulos: é ele que guarda o
     português tal como está escrito no HTML, e se a máscara já lá estivesse
     era a máscara que ficava guardada como se fosse texto.
     No arranque aplica o dicionário sem disparar o aviso de mudança — quem
     pinta a primeira vez é a chamada explícita mais abaixo. */
  const i18n = criarLingua((l) => { repintar(l); });

  partirTitulos();
  document.querySelectorAll('.nome__l').forEach((el, i) => el.style.setProperty('--i', i));

  // a casca entra já, para a página não nascer sem cabeçalho
  nav(i18n.lingua());
  rodape(i18n.lingua(), []);
  cursor();
  rolagem();

  repintar(i18n.lingua());

  return { i18n, repintar };
}
