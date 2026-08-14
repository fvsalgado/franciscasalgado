/* Cabeçalho, rodapé e tema, num sítio só. Com sete páginas e sem passo de
   compilação, repetir isto em cada ficheiro era garantir que um dia ficavam
   diferentes. */

import { icone } from './icones.js';
import { outraLingua } from './i18n.js';

export const PAGINAS = [
  { href: 'index.html', pt: 'Início', en: 'Home' },
  { href: 'resultados.html', pt: 'Resultados', en: 'Results' },
  { href: 'percurso.html', pt: 'Percurso', en: 'Her story' },
  { href: 'imprensa.html', pt: 'Imprensa', en: 'Press' },
  { href: 'parcerias.html', pt: 'Parcerias', en: 'Partnerships' },
];

const aqui = () => {
  const f = location.pathname.split('/').pop() || 'index.html';
  return f === '' ? 'index.html' : f;
};

/* A marca: o nome ao lado da bandeira do buraco. Uma coisa e outra, e não um
   logótipo por desenhar — a bandeira já diz de que desporto se trata. */
const marca = () => `
  <a class="marca" href="index.html" data-mag aria-label="Francisca Salgado">
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

  const links = (classe) => PAGINAS.map((p) => {
    const ativa = p.href === atual;
    return `<a href="${p.href}"${ativa ? ' aria-current="page"' : ''}${classe ? ' data-mag' : ''}>${p[lingua]}</a>`;
  }).join('');

  alvo.className = 'nav';
  alvo.innerHTML = `
    <div class="nav__in">
      ${marca()}
      <nav class="nav__links" aria-label="${en ? 'Main' : 'Principal'}">${links(true)}</nav>
      <div class="nav__fer">
        <button class="cap cap--ico" id="btTema" type="button"
                aria-label="${en ? 'Switch theme' : 'Alternar tema'}" aria-pressed="false">
          <span class="ico" id="btTemaI">${icone('lua', 'ic')}</span>
        </button>
        <a class="cap" id="btLang" href="${outraLingua()}" hreflang="${en ? 'pt-PT' : 'en'}"
           data-sem-seta aria-label="${en ? 'Ver em portugu\u00eas' : 'Read this page in English'}"
           >${en ? 'PT' : 'EN'}</a>
        <a class="cap cap--cheio nav__cta" href="parcerias.html#contacto" data-mag>${en ? 'Get in touch' : 'Contactar'}</a>
        <button class="ham" id="btMenu" type="button" aria-expanded="false" aria-controls="menu"
                aria-label="Menu"><i></i><i></i></button>
      </div>
    </div>

    <div class="menu" id="menu" hidden>
      <div class="menu__in">
        <nav class="menu__l" aria-label="${en ? 'Main' : 'Principal'}">${links(false)}</nav>
        <a class="cap cap--cheio menu__b" href="parcerias.html#contacto">${en ? 'Get in touch' : 'Contactar'}</a>
      </div>
    </div>`;
  menuMovel(alvo);
  document.dispatchEvent(new CustomEvent('fs:nav'));
}

export function rodape(lingua = 'pt', canais = []) {
  const alvo = document.getElementById('pe');
  if (!alvo) return;
  const en = lingua === 'en';

  const t = en
    ? { frase: 'Amateur golfer. Vale de Janelas, Óbidos. Portuguese national team.',
        onde: 'Where to follow', ver: 'Pages', falar: 'Get in touch',
        kit: 'Press kit', apoiar: 'Become a partner',
        cred: '© 2026 Francisca Salgado', legal: 'Privacy', termos: 'Terms', cookies: 'Cookies' }
    : { frase: 'Golfista amadora. Vale de Janelas, Óbidos. Seleção Nacional.',
        onde: 'Onde seguir', ver: 'Páginas', falar: 'Falar com',
        kit: 'Kit de imprensa', apoiar: 'Ser parceiro',
        cred: '© 2026 Francisca Salgado', legal: 'Privacidade', termos: 'Termos', cookies: 'Cookies' };

  const sub = (c) => (typeof c.sub === 'string' ? c.sub : c.sub?.[lingua] || '');

  alvo.className = 'pe';
  alvo.innerHTML = `
    <div class="env">
      <p class="pe__nome" aria-hidden="true">Francisca Salgado</p>
      <div class="pe__g">
        <div>
          <p class="rot">Francisca Salgado</p>
          <p class="txt" style="font-size:.85rem;margin-top:1rem">${t.frase}</p>
        </div>
        <div>
          <p class="rot">${t.onde}</p>
          <ul class="pe__l">${canais.map((c) => `
            <li><a href="${c.url}" target="_blank" rel="noopener" data-sem-seta data-mag>${icone(c.chave, 'ic ic--pe')}<span>${c.nome}</span></a></li>`).join('')}</ul>
        </div>
        <div>
          <p class="rot">${t.ver}</p>
          <ul class="pe__l">${PAGINAS.map((p) => `<li><a href="${p.href}" data-mag>${p[lingua]}</a></li>`).join('')}</ul>
        </div>
        <div>
          <p class="rot">${t.falar}</p>
          <ul class="pe__l">
            <li><a href="parcerias.html#contacto" data-mag>${t.apoiar}</a></li>
            <li><a href="imprensa.html" data-mag>${t.kit}</a></li>
          </ul>
        </div>
      </div>
      <div class="pe__f">
        <span>${t.cred}</span>
        <nav class="pe__legal" aria-label="${t.legal}">
          <a href="privacidade.html" data-mag>${t.legal}</a>
          <a href="termos.html" data-mag>${t.termos}</a>
          <button class="pe__ck" type="button" id="abrirCookies">${t.cookies}</button>
        </nav>
        <span class="num">Óbidos · 39°22′N 9°09′W</span>
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
