/* A língua da página.
 *
 * Já foi um dicionário inteiro e um botão que trocava o texto ao vivo. Agora o
 * inglês tem endereço próprio — /en/ — e as páginas nascem escritas na língua
 * certa, por scripts/traduzir.mjs. Deste lado ficou só o que o browser precisa
 * de saber: em que língua está, e onde fica a mesma página na outra.
 *
 * A troca ficou a valer mais: uma página inglesa passou a ser uma página que
 * se pode indexar, marcar nos favoritos, partilhar e citar, em vez de um
 * estado de JavaScript que só existia naquele separador. E quem lê em
 * português deixou de carregar o inglês todo sem o usar.
 */

/** 'pt' ou 'en', lido do <html lang> que a própria página traz escrito. */
export function lingua() {
  return String(document.documentElement.lang || 'pt').toLowerCase().startsWith('en') ? 'en' : 'pt';
}

/* As páginas inglesas vivem em /en/ com o mesmo nome de ficheiro. A conversão
   é só pôr ou tirar esse pedaço do caminho — e a raiz é caso à parte, porque
   «/» e «/en» não têm nome de ficheiro para preservar.

   A raiz inglesa é «/en», sem barra: o `trailingSlash: false` do vercel.json
   faz «/en/» responder 308 para «/en», e é «/en» que o canonical declara.
   Mandar o botão de língua para a barra era um salto a mais e uma segunda
   forma do mesmo endereço à solta pelo sítio. */
export function outroCaminho(caminho = location.pathname) {
  const c = caminho.replace(/\/index\.html$/, '/');
  if (c === '/en' || c === '/en/') return '/';
  if (c.startsWith('/en/')) return c.slice(3);
  if (c === '/' || c === '') return '/en';
  return `/en${c}`;
}

/* Se quem chega lê português, segundo o browser.
 *
 * Serve duas coisas que pareciam separadas e não são: a quem oferecer o
 * inglês, e em que língua pedir o consentimento dos cookies. Um aviso de
 * privacidade que a pessoa não percebe não é consentimento informado — é um
 * botão que ela carrega para o muro desaparecer. */
export function lePortugues() {
  return (navigator.languages || [navigator.language || 'pt'])
    .some((l) => String(l).toLowerCase().startsWith('pt'));
}

/** Endereço da mesma página na outra língua, com âncora e parâmetros. */
export function outraLingua() {
  return outroCaminho() + location.search + location.hash;
}

/* O inglês é a língua por omissão para quem não lê português — decisão do
   tutor: o público que interessa (treinadores, marcas, federações) chega de
   fora. Já foi um convite discreto; passou a reencaminhamento na primeira
   visita, com duas rédeas que o mantêm honesto:

   - só dispara sem escolha guardada, e qualquer toque no botão da língua
     grava uma (`fs-lingua`, escrito pela casca) — quem voltar ao português
     fica no português;
   - o `hreflang` das páginas continua a declarar o par completo, e as
     ligações internas de cada versão apontam à própria versão — um motor que
     execute o JavaScript continua a ver as duas casas inteiras.

   `location.replace`, e não `href`: a página portuguesa não entra no
   histórico, e o botão de voltar não devolve o visitante ao sítio de onde o
   tirámos. O pré-renderizador (`__estatico`) fica de fora, senão gravava as
   páginas portuguesas já a fugir para as inglesas. */
export function convidarLingua() {
  if (window.__estatico) return;
  if (lingua() !== 'pt') return;
  if (lePortugues()) return;
  try { if (localStorage.getItem('fs-lingua')) return; } catch { /* modo privado */ }
  try { localStorage.setItem('fs-lingua', 'en'); } catch { /* modo privado */ }
  location.replace(outraLingua());
}
