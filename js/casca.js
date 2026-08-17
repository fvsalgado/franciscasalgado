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
export const PAGINAS = [
  { href: 'index.html', pt: 'Francisca', en: 'Francisca' },
  { href: 'resultados.html', pt: 'Época a época', en: 'Season by season' },
  { href: 'jogadora.html', pt: 'A jogadora', en: 'The player' },
  { href: 'parcerias.html', pt: 'Parcerias', en: 'Partnerships' },
  { href: 'imprensa.html', pt: 'Imprensa', en: 'Press' },
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
        <button class="cap cap--ico" id="btTema" type="button"
                aria-label="${en ? 'Switch theme' : 'Alternar tema'}" aria-pressed="false">
          <span class="ico" id="btTemaI">${icone('lua', 'ic')}</span>
        </button>
        <a class="cap" id="btLang" href="${outraLingua()}" hreflang="${en ? 'pt-PT' : 'en'}"
           data-sem-seta aria-label="${en ? 'Ver em portugu\u00eas' : 'Read this page in English'}"
           >${en ? 'PT' : 'EN'}</a>
        <button class="ham" id="btMenu" type="button" aria-expanded="false" aria-controls="menu"
                aria-label="Menu"><i></i><i></i></button>
      </div>
    </div>

    <div class="menu" id="menu" hidden>
      <div class="menu__in">
        <nav class="menu__l" aria-label="${en ? 'Main' : 'Principal'}">${links(false)}</nav>
      </div>
    </div>`;
  /* Numa página que abre com fotografia a sangrar — ou com a faixa escura dos
     números, como a «Época a época» —, o cabeçalho está por cima dela enquanto
     não se rola: tem de ser branco, ou não se lê. Marca-se aqui, em
     JavaScript, e não com :has() em CSS, porque isto é um facto da página e
     não uma consequência do que lá está. */
  alvo.classList.toggle('nav--sobre-foto', !!document.querySelector('.hero, .topo-p--stats'));

  menuMovel(alvo);
  document.dispatchEvent(new CustomEvent('fs:nav'));
}

export function rodape(lingua = 'pt', canais = []) {
  const alvo = document.getElementById('pe');
  if (!alvo) return;
  const en = lingua === 'en';

  /* Já teve quatro colunas, depois três. Agora duas: contacto e páginas.
     A coluna de abertura — o nome outra vez, e uma frase de apresentação —
     saiu com a marca de água gigante por cima dela: o nome já está no
     cabeçalho de todas as páginas, e quem chegou ao fundo já sabe onde está.
     Um rodapé não é sítio para apresentar ninguém; é sítio para ir embora
     com elegância. */
  const t = en
    ? { onde: 'Contact', ver: 'Pages',
        cred: '© 2026 Francisca Salgado', legal: 'Privacy', termos: 'Terms', cookies: 'Cookies' }
    : { onde: 'Contacto', ver: 'Páginas',
        cred: '© 2026 Francisca Salgado', legal: 'Privacidade', termos: 'Termos', cookies: 'Cookies' };

  alvo.className = 'pe';
  alvo.innerHTML = `
    <div class="env">
      <div class="pe__g">
        <div>
          <p class="rot">${t.onde}</p>
          <ul class="pe__l">${canais.map((c) => `
            <li><a href="${c.url}" target="_blank" rel="noopener" data-sem-seta data-mag>${icone(c.chave, 'ic ic--pe')}<span>${c.nome}</span></a></li>`).join('')}</ul>
        </div>
        <div>
          <p class="rot">${t.ver}</p>
          <ul class="pe__l">${PAGINAS.map((p) => `<li><a href="${caminho(p.href, lingua)}" data-mag>${p[lingua]}</a></li>`).join('')}</ul>
        </div>
      </div>
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
  raiz.dataset.tema = guardado || (matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro');

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

/* ── botão flutuante de contacto ──────────────────────────── */
/* Duas maneiras de falar com ela, sempre à mão, em qualquer página e em
   qualquer ponto da página. O sítio tem o contacto no fim de uma página só, e
   quem chega a meio de outra teria de o ir procurar — que é precisamente
   quando desiste.

   Fechado é um botão; aberto mostra o email e o Instagram. Não abre sozinho e
   não tapa nada: fica no canto de baixo, do lado oposto ao banner dos cookies
   e ao convite da língua. */
export function flutuante(lingua = 'pt') {
  if (document.getElementById('fala')) return;
  const en = lingua === 'en';
  const cx = document.createElement('div');
  cx.className = 'fala';
  cx.id = 'fala';
  cx.innerHTML = `
    <div class="fala__l" id="falaL" hidden>
      <a class="fala__a" href="mailto:birdie@franciscasalgado.golf" data-sem-seta>
        ${icone('email', 'ic')}<span>birdie@franciscasalgado.golf</span>
      </a>
      <a class="fala__a" href="https://www.instagram.com/francisca_salgado_/"
         target="_blank" rel="noopener" data-sem-seta>
        ${icone('instagram', 'ic')}<span>@francisca_salgado_</span>
      </a>
    </div>
    <button class="fala__b" id="falaB" type="button" aria-expanded="false" aria-controls="falaL">
      ${icone('email', 'ic')}<span>${en ? 'Contact' : 'Contacto'}</span>
    </button>`;
  document.body.append(cx);

  const bt = cx.querySelector('#falaB');
  const lista = cx.querySelector('#falaL');
  const abrir = (sim) => {
    lista.hidden = !sim;
    bt.setAttribute('aria-expanded', String(sim));
    cx.classList.toggle('fala--aberto', sim);
  };
  bt.addEventListener('click', () => abrir(lista.hidden));
  document.addEventListener('click', (e) => { if (!cx.contains(e.target)) abrir(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') abrir(false); });
}
