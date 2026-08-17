/* Cabeçalho, rodapé e tema, num sítio só. Com sete páginas e sem passo de
   compilação, repetir isto em cada ficheiro era garantir que um dia ficavam
   diferentes. */

import { icone } from './icones.js';
import { outraLingua } from './i18n.js';

/* Quatro páginas, e não seis. O percurso, as provas e o clipping eram três
   registos cronológicos da mesma carreira, e liam-se melhor juntos, época a
   época; o contacto era uma página inteira para um formulário, e voltou para
   onde é preciso — o fim das parcerias, e o rodapé de todas as páginas. */
/* `pe: true` mete a página no rodapé mas deixa-a fora do menu de cima.
 *
 * Serve a página do saco. Ela existe para ser partilhada por fora — um endereço
 * curto num WhatsApp —, não para ser a sexta escolha de quem chega ao sítio; no
 * menu, ao lado de «Época a época» e «Recruiting», prometia um assunto do
 * tamanho dos outros e não é. Mas tem de estar ligada de algum lado: uma página
 * a que só se chega pelo sitemap é uma página que o Google encontra e não
 * percebe onde encaixa. */
/* `ico` e `tab` servem a barra de separadores do telemóvel: o ícone, e um
   nome curto quando o inteiro não cabe num quinto de ecrã. */
export const PAGINAS = [
  { href: 'index.html', pt: 'Francisca', en: 'Francisca', ico: 'bandeira' },
  { href: 'resultados.html', pt: 'Época a época', en: 'Season by season', ico: 'calendario', tab: { pt: 'Épocas', en: 'Seasons' } },
  { href: 'jogadora.html', pt: 'A jogadora', en: 'The player', ico: 'pessoa', tab: { pt: 'Jogadora', en: 'Player' } },
  { href: 'parcerias.html', pt: 'Parcerias', en: 'Partnerships', ico: 'aperto' },
  { href: 'imprensa.html', pt: 'Imprensa', en: 'Press', ico: 'jornal' },
  { href: 'witb.html', pt: 'O que leva no saco', en: "What's in the bag", pe: true },
];

const aqui = () => {
  const f = location.pathname.split('/').pop() || 'index.html';
  return f === '' ? 'index.html' : f;
};

/* As ligações internas são absolutas, e não relativas.
 *
 * Relativas, o inglês depende de o endereço acabar em barra: em `/en/` o
 * `resultados.html` resolve para `/en/resultados.html`, mas em `/en` — sem
 * barra — resolve para a raiz e devolve a página portuguesa. Quem estivesse a
 * ler em inglês caía no português ao mudar de página, e a culpa era de um
 * carácter.
 *
 * Tentou-se corrigir redirecionando `/en` para `/en/`; o Vercel trata os dois
 * como a mesma origem e o resultado foi um ciclo de redireções que deitou o
 * sítio inglês abaixo. A correção que não depende de configuração nenhuma é
 * esta: escrever o caminho inteiro. */
const RAIZ_LINGUA = (lingua) => (lingua === 'en' ? '/en/' : '/');
/* A raiz inglesa escreve-se sem barra: `/en/` responde 308 para `/en`, e uma
   ligação interna a um redireccionamento é um salto que não é preciso dar —
   além de ser o endereço que o canonical declara. As páginas com nome mantêm a
   barra, que é o que faz `/en/resultados.html` existir. */
const INICIO = (lingua) => (lingua === 'en' ? '/en' : '/');
const caminho = (ficheiro, lingua) => (ficheiro === 'index.html'
  ? INICIO(lingua)
  : `${RAIZ_LINGUA(lingua)}${ficheiro}`);

/* A marca: o nome ao lado da bandeira do buraco. Uma coisa e outra, e não um
   logótipo por desenhar — a bandeira já diz de que desporto se trata. */
const marca = (lingua = 'pt') => `
  <a class="marca" href="${INICIO(lingua)}" data-mag aria-label="Francisca Salgado">
    ${icone('bandeira', 'marca__b')}
    <span class="marca__t">Francisca&nbsp;Salgado</span>
  </a>`;

/* Menu do telemóvel. Abaixo de 1020px os links do cabeçalho não cabem.
   Fecha ao escolher uma página, no Escape, e quando a janela volta a ser
   larga; enquanto aberto, tranca a rolagem por baixo. */
let escapeLigado = false;

function menuMovel(alvo) {
  const bt = alvo.querySelector('#btMenu');
  const menu = alvo.querySelector('#menu');
  if (!bt || !menu) return;

  const fechar = () => {
    if (menu.hidden) return;
    menu.hidden = true;
    bt.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('sem-rolar');
    alvo.classList.remove('nav--aberto');
  };
  const abrir = () => {
    menu.hidden = false;
    bt.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('sem-rolar');
    alvo.classList.add('nav--aberto');
    menu.querySelector('a')?.focus();
  };

  bt.addEventListener('click', () => (menu.hidden ? abrir() : fechar()));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) fechar(); });
  matchMedia('(min-width:1021px)').addEventListener('change', (m) => { if (m.matches) fechar(); });

  /* A barra é redesenhada a cada troca de língua. Estes dois ouvintes vivem no
     documento, que não é substituído — por isso ligam-se uma vez só, e vão
     buscar o menu do momento em vez de fechar sobre o que já foi deitado
     fora. Sem isto, acumulava-se um par de ouvintes por cada troca. */
  if (escapeLigado) return;
  escapeLigado = true;
  const fecharAtual = () => {
    const m = document.getElementById('menu');
    const b = document.getElementById('btMenu');
    if (!m || m.hidden) return;
    m.hidden = true;
    b?.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('sem-rolar');
    document.getElementById('nav')?.classList.remove('nav--aberto');
  };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharAtual(); });
}

export function nav(lingua = 'pt') {
  const alvo = document.getElementById('nav');
  if (!alvo) return;
  const atual = aqui();
  const en = lingua === 'en';

  const links = (classe) => PAGINAS.filter((p) => !p.pe || p.href === atual).map((p) => {
    const ativa = p.href === atual;
    return `<a href="${caminho(p.href, lingua)}"${ativa ? ' aria-current="page"' : ''}${classe ? ' data-mag' : ''}>${p[lingua]}</a>`;
  }).join('');

  alvo.className = 'nav';
  alvo.innerHTML = `
    <div class="nav__in">
      ${marca(lingua)}
      <nav class="nav__links" aria-label="${en ? 'Main' : 'Principal'}">${links(true)}</nav>
      <div class="nav__fer">
        <div class="fer" role="group" aria-label="${en ? 'Site tools' : 'Ferramentas'}">
          <a class="fer__b fer__b--txt${atual === 'witb.html' ? ' fer__b--on' : ''}" href="${caminho('witb.html', lingua)}"
             data-sem-seta aria-label="${en ? "What's in the bag" : 'O que leva no saco'}"
             ${atual === 'witb.html' ? 'aria-current="page"' : ''}>WITB</a>
          <button class="fer__b" id="btTema" type="button"
                  aria-label="${en ? 'Switch theme' : 'Alternar tema'}" aria-pressed="false">
            <span class="ico" id="btTemaI">${icone('lua', 'ic')}</span>
          </button>
          <a class="fer__b fer__b--txt" id="btLang" href="${outraLingua()}" hreflang="${en ? 'pt-PT' : 'en'}"
             data-sem-seta aria-label="${en ? 'Ver em portugu\u00eas' : 'Read this page in English'}"
             >${en ? 'PT' : 'EN'}</a>
        </div>
        <button class="ham" id="btMenu" type="button" aria-expanded="false" aria-controls="menu"
                aria-label="Menu"><i></i><i></i></button>
      </div>
    </div>

    <div class="menu" id="menu" hidden>
      <div class="menu__in">
        <nav class="menu__l" aria-label="${en ? 'Main' : 'Principal'}">${links(false)}</nav>
      </div>
    </div>

    <nav class="tabs" aria-label="${en ? 'Pages' : 'Páginas'}">${PAGINAS.filter((p) => !p.pe).map((p) => {
    const ativa = p.href === atual;
    return `<a class="tab${ativa ? ' tab--on' : ''}" href="${caminho(p.href, lingua)}"${ativa ? ' aria-current="page"' : ''}>
        ${icone(p.ico, 'tab__i')}<span>${p.tab?.[lingua] || p[lingua]}</span></a>`;
  }).join('')}</nav>`;
  /* Numa página que abre com fotografia a sangrar — ou com a faixa escura dos
     números, como a «Época a época» —, o cabeçalho está por cima dela enquanto
     não se rola: tem de ser branco, ou não se lê. Marca-se aqui, em
     JavaScript, e não com :has() em CSS, porque isto é um facto da página e
     não uma consequência do que lá está. */
  alvo.classList.toggle('nav--sobre-foto', !!document.querySelector('.hero, .topo-p--escuro'));

  /* Trocar de língua à mão é uma escolha: fica guardada, e o
     reencaminhamento da primeira visita passa a respeitá-la. */
  alvo.querySelector('#btLang')?.addEventListener('click', () => {
    try { localStorage.setItem('fs-lingua', en ? 'pt' : 'en'); } catch { /* modo privado */ }
  });

  menuMovel(alvo);
  document.dispatchEvent(new CustomEvent('fs:nav'));
}

export function rodape(lingua = 'pt', canais = []) {
  const alvo = document.getElementById('pe');
  if (!alvo) return;
  const en = lingua === 'en';

  /* Já teve quatro colunas, depois três, depois duas — contacto e páginas —
     e um botão flutuante de contacto por cima de tudo. No telemóvel o fim de
     cada página dizia «contacto» duas vezes com o menu no meio. Ficou uma
     faixa só: os dois canais em linha, e por baixo o legal e as coordenadas.
     A coluna das páginas saiu de vez — no ecrã largo o cabeçalho já mostra
     os nomes todos, e no telemóvel a barra de baixo também. Um rodapé não é
     sítio para apresentar ninguém; é sítio para ir embora com elegância. */
  const t = en
    ? { cred: '© 2026 Francisca Salgado', legal: 'Privacy', termos: 'Terms', cookies: 'Cookies' }
    : { cred: '© 2026 Francisca Salgado', legal: 'Privacidade', termos: 'Termos', cookies: 'Cookies' };

  alvo.className = 'pe';
  alvo.innerHTML = `
    <div class="env">
      <div class="pe__c">${canais.map((c) => `
        <a href="${c.url}"${c.url.startsWith('mailto:') ? '' : ' target="_blank" rel="noopener"'} data-sem-seta data-mag>${icone(c.chave, 'ic ic--pe')}<span>${c.nome}</span></a>`).join('')}</div>
      <div class="pe__f">
        <span>${t.cred}</span>
        <nav class="pe__legal" aria-label="${t.legal}">
          <a href="${caminho('privacidade.html', lingua)}" data-mag>${t.legal}</a>
          <a href="${caminho('termos.html', lingua)}" data-mag>${t.termos}</a>
          <button class="pe__ck" type="button" id="abrirCookies">${t.cookies}</button>
        </nav>
        <span class="num">Algés · 38°42′N 9°14′W</span>
      </div>
    </div>`;
}

/* ── tema ─────────────────────────────────────────────────── */
export function tema() {
  const raiz = document.documentElement;
  let guardado = null;
  try { guardado = localStorage.getItem('fs-tema'); } catch { /* modo privado */ }
  /* Escuro por omissão — decisão do tutor. A preferência do sistema deixa de
     mandar no primeiro contacto; quem preferir claro carrega uma vez e fica
     guardado. */
  raiz.dataset.tema = guardado || 'escuro';

  const pintar = () => {
    const escuro = raiz.dataset.tema === 'escuro';
    const cx = document.getElementById('btTemaI');
    if (cx) cx.innerHTML = icone(escuro ? 'sol' : 'lua', 'ic');
    document.getElementById('btTema')?.setAttribute('aria-pressed', String(escuro));
  };

  // o botão nasce com a nav, que é desenhada depois — daí ouvir no documento
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#btTema')) return;
    raiz.dataset.tema = raiz.dataset.tema === 'escuro' ? 'claro' : 'escuro';
    try { localStorage.setItem('fs-tema', raiz.dataset.tema); } catch { /* modo privado */ }
    pintar();
    document.dispatchEvent(new CustomEvent('fs:tema'));
  });
  document.addEventListener('fs:nav', pintar);
  pintar();
}

/* O botão flutuante de contacto viveu aqui. Saiu: com o contacto no rodapé de
   todas as páginas, era o mesmo email pela segunda vez, a flutuar ao lado da
   barra de páginas. Um sítio destes tem um pedido por visita, não precisa de
   perseguir ninguém pelo ecrã. */
