/* Resultados: a lista de provas, o marcador de cada uma e o agrupamento por
   época. É o coração do sítio — tudo o resto pendura-se nisto.

   Regra que atravessa o ficheiro: nada se inventa. Quando a classificação
   final de uma prova não está publicada, fica o marcador e a caixa da posição
   diz que não sabe. É menos bonito do que pôr lá um número, e é o certo. */

import { icone } from './icones.js';

let CACHE = null;

export async function carregar() {
  if (CACHE) return CACHE;
  try {
    CACHE = await (await fetch('data/resultados.json', { cache: 'no-cache' })).json();
  } catch (e) {
    console.warn('resultados:', e.message);
    CACHE = { provas: [] };
  }
  return CACHE;
}

/* ── peças pequenas ───────────────────────────────────────── */

const MESES = {
  pt: ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'],
  en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
};

export function dataCurta(p, lingua) {
  if (p.dataTexto) return (p.dataTexto[lingua] || p.dataTexto.pt).toUpperCase();
  const d = new Date(`${p.data}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(p.ano);
  return `${d.getDate()} ${MESES[lingua === 'en' ? 'en' : 'pt'][d.getMonth()]} ${d.getFullYear()}`;
}

/* Ordinal da posição. Ela é uma jogadora — em português o ordinal é feminino,
   e escrever «1.º» num sítio que é dela seria descuido, não economia. */
function ordinal(n, lingua) {
  if (lingua === 'en') {
    const r = n % 100;
    if (r >= 11 && r <= 13) return 'th';
    return ['th', 'st', 'nd', 'rd'][n % 10] || 'th';
  }
  return '.ª';
}

function caixaPos(p, lingua) {
  if (p.pos == null) {
    const t = lingua === 'en' ? 'Final placing not published' : 'Classificação final não publicada';
    return `<span class="pos pos--sem" title="${t}" aria-label="${t}">${icone('bola', 'ph__i')}</span>`;
  }
  const cls = p.pos <= 3 ? ` pos--${p.pos}` : '';
  const t = p.posT ? 'T' : '';
  const lido = (p.posTexto?.[lingua] || p.posTexto?.pt) || `${t}${p.pos}${ordinal(p.pos, lingua)}`;
  /* O número e o ordinal vão dentro de um <span> só. A caixa é uma grelha
     centrada, e sem este embrulho o texto solto e o <sup> tornavam-se dois
     itens da grelha — o ordinal caía para a linha de baixo. */
  return `<span class="pos${cls}" aria-label="${lido}"><span>${t}${p.pos}<sup>${ordinal(p.pos, lingua)}</sup></span></span>`;
}

function marcador(p) {
  if (p.total == null && !p.voltas?.length) return '';
  const voltas = (p.voltas || []).map((v) => `<i>${v}</i>`).join('');
  const total = p.total != null ? `<b class="num">${p.total}</b>` : '';
  let par = '';
  if (p.par != null) {
    const cls = p.par < 0 ? 'par--sob' : p.par === 0 ? 'par--par' : 'par--acima';
    const txt = p.par < 0 ? `−${Math.abs(p.par)}` : p.par === 0 ? 'PAR' : `+${p.par}`;
    par = `<span class="par ${cls}">${txt}</span>`;
  }
  return `<span class="marcador num">${voltas}${total}${par}</span>`;
}

const SELOS = {
  wagr: { pt: 'WAGR', en: 'WAGR', cls: 'selo--wagr' },
  titulo: { pt: 'Título', en: 'Title', cls: 'selo--titulo' },
  podio: { pt: 'Pódio', en: 'Podium', cls: 'selo--titulo' },
  selecao: { pt: 'Seleção', en: 'National team', cls: 'selo--selecao' },
};

function selos(p, lingua) {
  return (p.selos || [])
    .map((s) => SELOS[s])
    .filter(Boolean)
    .map((s) => `<span class="selo ${s.cls}">${s[lingua] || s.pt}</span>`)
    .join('');
}

const tx = (v, lingua) => (typeof v === 'string' ? v : v?.[lingua] || v?.pt || '');

/* ── uma prova ────────────────────────────────────────────── */

function linhaProva(p, lingua, { comNota = false } = {}) {
  const local = [p.campo, tx(p.local, lingua)].filter(Boolean).join(' · ');
  const especial = p.posTexto ? `<span class="selo selo--titulo">${tx(p.posTexto, lingua)}</span>` : '';
  const nota = comNota && p.nota
    ? `<p class="prova__l" style="margin-top:.45rem">${tx(p.nota, lingua)}</p>` : '';

  return `
    <article class="prova" data-ano="${p.ano}" data-id="${p.id}">
      ${caixaPos(p, lingua)}
      <div class="prova__q">
        <span class="prova__data num">${dataCurta(p, lingua)}${p.escalao ? ` · ${tx(p.escalao, lingua)}` : ''}</span>
        <h3 class="prova__t">${tx(p.torneio, lingua)}</h3>
        ${local ? `<p class="prova__l">${local}</p>` : ''}
        ${nota}
      </div>
      <div class="prova__a">
        ${marcador(p)}
        ${especial}
        ${selos(p, lingua)}
      </div>
    </article>`;
}

/* O realce ao passar por cima é feito aqui, e não em CSS puro, porque o
   preenchimento tem de sair quando o ponteiro vai para a linha seguinte —
   com :hover encavalitavam-se dois preenchimentos durante a transição. */
function realce(cx) {
  cx.addEventListener('pointerover', (e) => {
    const l = e.target.closest('.prova');
    cx.querySelectorAll('.prova.tocada').forEach((o) => { if (o !== l) o.classList.remove('tocada'); });
    if (l) l.classList.add('tocada');
  });
  cx.addEventListener('pointerleave', () => {
    cx.querySelectorAll('.prova.tocada').forEach((o) => o.classList.remove('tocada'));
  });
}

/* ── lista simples (página inicial) ───────────────────────── */

export async function ultimas(cx, lingua = 'pt', quantas = 5) {
  if (!cx) return;
  const { provas = [] } = await carregar();
  const lista = provas.slice(0, quantas);

  if (!lista.length) {
    cx.innerHTML = `<p class="provas__vazio">${lingua === 'en' ? 'No results yet.' : 'Ainda sem resultados.'}</p>`;
    return;
  }
  cx.className = 'provas';
  cx.innerHTML = lista.map((p) => linhaProva(p, lingua)).join('');
  realce(cx);
}

/* ── lista completa, por época, com filtros ───────────────── */

export async function porEpoca(cx, filtrosCx, lingua = 'pt') {
  if (!cx) return;
  const { provas = [] } = await carregar();
  if (!provas.length) {
    cx.innerHTML = `<p class="provas__vazio">${lingua === 'en' ? 'No results yet.' : 'Ainda sem resultados.'}</p>`;
    return;
  }

  const FILTROS = [
    { chave: 'tudo', pt: 'Tudo', en: 'Everything', teste: () => true },
    { chave: 'titulo', pt: 'Vitórias', en: 'Wins', teste: (p) => p.pos === 1 },
    { chave: 'podio', pt: 'Pódios', en: 'Podiums', teste: (p) => p.pos != null && p.pos <= 3 },
    { chave: 'wagr', pt: 'Ranking mundial', en: 'World ranking', teste: (p) => p.selos?.includes('wagr') },
    { chave: 'selecao', pt: 'Seleção', en: 'National team', teste: (p) => p.selos?.includes('selecao') },
  ];

  let ativo = 'tudo';

  function pintarFiltros() {
    if (!filtrosCx) return;
    filtrosCx.className = 'filtros';
    filtrosCx.innerHTML = FILTROS.map((f) => {
      const n = provas.filter(f.teste).length;
      if (!n) return '';
      return `<button class="filtro${f.chave === ativo ? ' filtro--on' : ''}" type="button"
                data-f="${f.chave}" aria-pressed="${f.chave === ativo}">
                ${f[lingua] || f.pt}<span class="filtro__n">${n}</span></button>`;
    }).join('');
  }

  function pintar() {
    const teste = FILTROS.find((f) => f.chave === ativo)?.teste || (() => true);
    const visiveis = provas.filter(teste);

    // agrupa por ano, mantendo a ordem em que vêm do ficheiro (mais recente primeiro)
    const anos = [...new Set(visiveis.map((p) => p.ano))];

    cx.innerHTML = anos.map((ano) => {
      const doAno = visiveis.filter((p) => p.ano === ano);
      const vitorias = doAno.filter((p) => p.pos === 1).length;
      const podios = doAno.filter((p) => p.pos != null && p.pos <= 3).length;

      const resumo = lingua === 'en'
        ? `${doAno.length} event${doAno.length === 1 ? '' : 's'}` +
          (podios ? ` · <b>${podios}</b> podium${podios === 1 ? '' : 's'}` : '') +
          (vitorias ? ` · <b>${vitorias}</b> win${vitorias === 1 ? '' : 's'}` : '')
        : `${doAno.length} prova${doAno.length === 1 ? '' : 's'}` +
          (podios ? ` · <b>${podios}</b> pódio${podios === 1 ? '' : 's'}` : '') +
          (vitorias ? ` · <b>${vitorias}</b> vitória${vitorias === 1 ? '' : 's'}` : '');

      return `
        <section class="epoca">
          <div class="epoca__cab">
            <h2 class="epoca__ano num">${ano}</h2>
            <p class="epoca__r">${resumo}</p>
          </div>
          <div class="provas">${doAno.map((p) => linhaProva(p, lingua, { comNota: true })).join('')}</div>
        </section>`;
    }).join('');

    cx.querySelectorAll('.provas').forEach(realce);
  }

  filtrosCx?.addEventListener('click', (e) => {
    const b = e.target.closest('.filtro');
    if (!b) return;
    ativo = b.dataset.f;
    pintarFiltros();
    pintar();
  });

  pintarFiltros();
  pintar();
}

/* ── palmarès: só o que foi ganho ─────────────────────────── */

export async function palmares(cx, lingua = 'pt') {
  if (!cx) return;
  const { provas = [] } = await carregar();
  const titulos = provas.filter((p) => p.pos === 1);
  if (!titulos.length) { cx.innerHTML = ''; return; }

  cx.className = 'palm';
  cx.innerHTML = titulos.map((p) => `
    <article class="tit">
      ${icone('taca', 'tit__b')}
      <span class="tit__ano num">${p.ano}</span>
      <h3 class="tit__t">${tx(p.torneio, lingua)}</h3>
      <p class="tit__s">${[p.campo, tx(p.local, lingua)].filter(Boolean).join(' · ')}</p>
    </article>`).join('');
}

/* ── o resultado mais recente, para o hero ────────────────── */

export async function ultimo(lingua = 'pt') {
  const { provas = [] } = await carregar();
  const p = provas[0];
  if (!p) return null;
  const lugar = p.posTexto ? tx(p.posTexto, lingua)
    : p.pos != null ? `${p.posT ? 'T' : ''}${p.pos}${ordinal(p.pos, lingua)}`
    : (lingua === 'en' ? 'Played' : 'Disputado');
  return {
    prova: p,
    texto: `${dataCurta(p, lingua)} · ${lugar} · ${tx(p.torneio, lingua)}`,
  };
}
