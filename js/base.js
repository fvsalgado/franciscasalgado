/* Arranque partilhado por todas as páginas.
   Pela ordem que importa: tema (para não piscar), consentimento, língua,
   casca, movimento — e só depois o que cada página tem de seu. */

import { nav, rodape, tema } from './casca.js';
import { creditos } from './creditos.js';
import { cursor, partirTitulos, rolagem, observar, reduzido } from './movimento.js';
import { lingua, convidarLingua } from './i18n.js';
import { cookies } from './cookies.js';
import { canais } from './conteudo.js';

/* A marca que liga as animações de revelação. Está aqui, no topo do módulo,
   para correr no instante em que o JavaScript arranca: as regras que escondem
   texto para o revelar a seguir vivem todas debaixo de `html.js`, e sem esta
   linha nunca chegam a aplicar-se. Sem JavaScript, o texto fica visível. */
document.documentElement.classList.add('js');

/* ── o ecrã de carga foi-se, e a razão fica escrita ─────────
 *
 * Havia uma cortina na página inicial: o nome dela a subir letra a letra e uma
 * contagem de 000 a 100. Era honesta enquanto a página nascia vazia e o
 * JavaScript a enchia.
 *
 * Deixou de ser quando o scripts/estatico.mjs passou a gravar o conteúdo já
 * desenhado no HTML. A partir daí a página aparecia inteira no primeiro
 * desenho, e só depois — quando o módulo corria e punha a classe `js`, que era
 * o que deixava a cortina aparecer — é que a cortina caía por cima de uma
 * página que já se via, contava até cem e saía. Abria, tapava, abria outra vez.
 *
 * Não era corrigível sem ser ao contrário: para não haver o primeiro
 * relâmpago, a cortina teria de estar lá desde o princípio, e isso é esconder
 * de propósito, durante quase dois segundos, uma página que já está pronta. Num
 * sítio que existe para um treinador abrir uma ligação e ver, é caro.
 *
 * A contagem também não media nada — subia por saltos aleatórios até cem. E o
 * momento de marca não se perdeu: o nome no hero já sobe letra a letra
 * sozinho, e agora sobe à chegada, em vez de depois de uma cortina. */

/**
 * Liga a casca e desenha a página.
 * @param {(lingua:string)=>void|Promise<void>} pintar
 *        Desenha o conteúdo próprio da página, na língua em que ela está.
 *
 * A língua já não muda a meio: cada página nasce escrita na sua, e o botão do
 * cabeçalho leva à mesma página na outra. Foi isto que fez desaparecer o
 * repintar-tudo-outra-vez, e com ele os títulos que perdiam a máscara e o
 * conteúdo que ficava invisível por não ter voltado ao observador.
 */
export function iniciar(pintar) {
  tema();
  const l = lingua();
  /* A ordem destes dois importa e já esteve trocada: o convite de língua
     primeiro, o pedido de consentimento a seguir. Ver o comentário em
     js/i18n.js — quem chega em inglês escolhia a língua depois de já lhe
     terem pedido a decisão mais séria da página em português. */
  convidarLingua();
  cookies(l);

  const repintar = async (l) => {
    nav(l);
    partirTitulos();
    /* Só os canais de contacto. As fichas oficiais — FPG, EGR, WAGR — vivem na
       página de imprensa; no rodapé, debaixo de «onde seguir», estavam a
       repetir-se em todas as páginas e nem sequer eram sítios que se sigam. */
    const lista = (await canais(l)).filter((c) => c.tipo === 'contacto');
    rodape(l, lista);
    await pintar?.(l);
    // o que acabou de nascer entra no observador; sem isto ficava a zero de
    // opacidade para sempre
    observar();
    creditos(l);
  };

  partirTitulos();
  document.querySelectorAll('.nome__l').forEach((el, i) => el.style.setProperty('--i', i));
  /* Era o ecrã de carga que punha esta classe, e é ela que solta a animação do
     nome no hero. Agora entra à chegada. */
  document.body.classList.add('pronto');

  // a casca entra já, para a página não nascer sem cabeçalho
  nav(l);
  rodape(l, []);
  cursor();
  rolagem();

  repintar(l);

  /* Devolve-se `i18n` com a mesma forma de antes — quem chama só lhe pergunta
     a língua, e não tem de saber que ela deixou de mudar sem recarregar. */
  const i18n = { lingua: () => l };
  return { i18n, repintar };
}
