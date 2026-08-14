/* Movimento partilhado: cursor desenhado, botões magnéticos, revelação ao
   rolar, paralaxe e o comportamento da barra de navegação. Tudo num único
   ciclo de animação — dois observadores e um rAF, não vinte. */

export const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── cursor ───────────────────────────────────────────────── */
export function cursor() {
  const el = document.getElementById('cur');
  if (!el || reduzido || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;

  const ponto = el.querySelector('.cur__p');
  const anel = el.querySelector('.cur__a');
  let x = innerWidth / 2, y = innerHeight / 2, ax = x, ay = y;

  addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    document.body.classList.add('tem-cur');
  }, { passive: true });

  addEventListener('pointerleave', () => document.body.classList.remove('tem-cur'));

  /* Os botões magnéticos são ligados por delegação: metade deles nasce depois
     de o JS correr (nav, rodapé, listas vindas dos JSON), e prender ouvintes
     um a um no arranque deixava-os todos de fora. */
  let preso = null;
  document.addEventListener('pointerover', (e) => {
    const b = e.target.closest('[data-mag]');
    if (!b || b === preso) return;
    preso = b;
    document.body.classList.add('cur-mag');
  });
  document.addEventListener('pointerout', (e) => {
    const b = e.target.closest('[data-mag]');
    if (!b || b !== preso || b.contains(e.relatedTarget)) return;
    document.body.classList.remove('cur-mag');
    b.style.transform = '';
    preso = null;
  });
  document.addEventListener('pointermove', (e) => {
    if (!preso) return;
    const r = preso.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) * 0.16;
    const dy = (e.clientY - (r.top + r.height / 2)) * 0.26;
    preso.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
  }, { passive: true });

  (function ciclo() {
    ax += (x - ax) * 0.18;
    ay += (y - ay) * 0.18;
    ponto.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%)`;
    anel.style.translate = `${ax}px ${ay}px`;
    requestAnimationFrame(ciclo);
  })();
}

/* ── títulos: a linha sobe da máscara ─────────────────────── */
export function partirTitulos() {
  document.querySelectorAll('.ani').forEach((h) => {
    if (h.dataset.partido === '1') return;
    h.innerHTML = `<span class="ani__l" style="--i:0">${h.innerHTML}</span>`;
    h.dataset.partido = '1';
  });
}

/* ── revelação + paralaxe + nav, num só rAF ───────────────── */

const ALVOS = '.ani, .sobe-i, .sec, .topo-p';
let obs = null;

const marcar = (el) => { el.classList.add('vis'); obs?.unobserve(el); };

/** Regista o que apareceu depois do arranque. Metade do conteúdo deste sítio
    nasce dos ficheiros JSON, muito depois de o observador ter sido criado —
    sem isto, ficava por revelar, ou seja, invisível para sempre. */
export function observar(raiz = document) {
  raiz.querySelectorAll(ALVOS).forEach((el) => {
    if (el.dataset.obs === '1') return;
    el.dataset.obs = '1';
    obs?.observe(el);
  });
}

/* Rede de segurança. O observador é o caminho normal, mas há maneiras de
   chegar a meio da página sem gerar interseção nenhuma — uma âncora, a tecla
   Fim, uma janela redimensionada, um screenshot de página inteira. Esta
   varredura corre uma vez por quadro e não deixa texto escondido em nenhum
   desses casos: é literalmente o que separa a página de aparecer em branco. */
function varrer() {
  const lim = innerHeight * 0.94;
  document.querySelectorAll(ALVOS).forEach((el) => {
    if (el.getBoundingClientRect().top < lim) marcar(el);
  });
}

export function rolagem() {
  const nav = document.getElementById('nav');

  obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => { if (e.isIntersecting) marcar(e.target); });
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
  observar();

  let ultimo = scrollY, pendente = false;

  function passo() {
    pendente = false;
    const y = scrollY;

    if (nav) {
      nav.classList.toggle('colada', y > 40);
    }
    ultimo = y;
    varrer();

    if (!reduzido) {
      document.querySelectorAll('[data-parallax]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        const meio = r.top + r.height / 2 - innerHeight / 2;
        el.style.translate = `0 ${(-meio * parseFloat(el.dataset.parallax)).toFixed(1)}px`;
      });
    }
  }

  const agendar = () => { if (!pendente) { pendente = true; requestAnimationFrame(passo); } };
  addEventListener('scroll', agendar, { passive: true });
  addEventListener('resize', agendar, { passive: true });
  passo();

  /* Uma última passagem quando tudo assentou. Serve o caso de quem chega
     direto a uma âncora a meio da página: os tipos de letra e as imagens ainda
     mudam alturas depois do primeiro desenho, e sem isto ficava por revelar
     o que entretanto subiu para dentro do ecrã. */
  addEventListener('load', () => setTimeout(varrer, 400));
}
