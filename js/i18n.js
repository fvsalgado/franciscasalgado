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
   «/» e «/en/» não têm nome de ficheiro para preservar. */
export function outroCaminho(caminho = location.pathname) {
  const c = caminho.replace(/\/index\.html$/, '/');
  if (c === '/en' || c === '/en/') return '/';
  if (c.startsWith('/en/')) return c.slice(3);
  if (c === '/' || c === '') return '/en';
  return `/en${c}`;
}

/** Endereço da mesma página na outra língua, com âncora e parâmetros. */
export function outraLingua() {
  return outroCaminho() + location.search + location.hash;
}

/* Quem chega com o browser em inglês era, antes, atirado para o inglês sem
   dar por isso. Deixou de ser, e de propósito: reencaminhar por idioma do
   browser esconde metade do sítio a quem o vem indexar, que chega quase sempre
   sem preferência nenhuma declarada — e prende quem quer mesmo ler o original.
   Fica um convite, que se fecha e não volta. É o que a documentação do Google
   pede em vez do reencaminhamento. */
export function convidarLingua() {
  if (lingua() !== 'pt') return;
  const querIngles = !(navigator.languages || [navigator.language || 'pt'])
    .some((l) => String(l).toLowerCase().startsWith('pt'));
  if (!querIngles) return;
  try { if (localStorage.getItem('fs-lingua-convite') === 'nao') return; } catch { /* modo privado */ }

  const mostrar = () => {
    const cx = document.createElement('div');
    cx.className = 'convite-l';
    cx.innerHTML = `
      <p>This page is also available in English.</p>
      <a class="cap cap--cheio" href="${outraLingua()}" hreflang="en" data-sem-seta>Read in English</a>
      <button class="convite-l__x" type="button" aria-label="Dismiss">&times;</button>`;
    cx.querySelector('.convite-l__x').addEventListener('click', () => {
      cx.remove();
      try { localStorage.setItem('fs-lingua-convite', 'nao'); } catch { /* modo privado */ }
    });
    document.body.append(cx);
  };

  /* Espera pelo banner dos cookies. Os dois vivem no rodapé do ecrã e, num
     telemóvel, ocupariam a mesma faixa; e há uma ordem entre eles — primeiro
     decide-se o que se autoriza, e só depois se oferece outra coisa. */
  const banner = document.getElementById('ck');
  if (!banner) { mostrar(); return; }
  const olho = new MutationObserver(() => {
    if (document.getElementById('ck')) return;
    olho.disconnect();
    mostrar();
  });
  olho.observe(document.body, { childList: true });
}
