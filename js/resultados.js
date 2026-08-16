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
    CACHE = await (await fetch('/data/resultados.json', { cache: 'no-cache' })).json();
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

/* Mês e ano — «DEZ 2017». Para legendas de gráficos, onde o dia não acrescenta
   nada a uma linha que atravessa nove anos. */
export function mesAno(iso, lingua) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 4);
  return `${MESES[lingua === 'en' ? 'en' : 'pt'][d.getMonth()]} ${d.getFullYear()}`;
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

/* ── os marcadores saíram da página ──────────────────────────
 *
 * Cada prova mostrava as voltas, o total e o resultado face ao par. Numa lista
 * de quarenta provas isso são cento e tal números, e a página deixava de se ler
 * — a classificação, que é o que interessa, ficava afogada em algarismos.
 *
 * Os números não se perderam: continuam todos no data/resultados.json, que é
 * público e está anunciado no llms.txt, e é de lá que sai a média por época.
 * O que saiu foi mostrá-los todos ao mesmo tempo. */

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

/* Uma prova é a data, o nome, onde foi e em que lugar ficou. Mais nada.
 *
 * Levava também as voltas, o total, o resultado face ao par e um comentário
 * escrito à mão. Quarenta provas assim são uma parede: quem chega para saber o
 * que ela fez em 2025 lê duzentos números e três parágrafos por ano, e desiste
 * antes de chegar ao que interessa. */
function linhaProva(p, lingua, { comNota = false } = {}) {
  const local = [p.campo, tx(p.local, lingua)].filter(Boolean).join(' · ');
  const especial = p.posTexto ? `<span class="selo selo--titulo">${tx(p.posTexto, lingua)}</span>` : '';
  /* De onde veio este resultado. É a única linha que fica além do essencial, e
     fica porque é ela que faz a diferença entre uma afirmação e uma afirmação
     que alguém pode ir verificar — que é a razão de ser deste sítio. */
  const fonte = comNota && p.fonte?.url
    ? `<p class="prova__f"><a href="${p.fonte.url}" target="_blank" rel="noopener" data-mag>${
        lingua === 'en' ? 'Source' : 'Fonte'}: ${p.fonte.nome}</a></p>` : '';

  return `
    <article class="prova" data-ano="${p.ano}" data-id="${p.id}">
      ${caixaPos(p, lingua)}
      <div class="prova__q">
        <span class="prova__data num">${dataCurta(p, lingua)}${p.escalao ? ` · ${tx(p.escalao, lingua)}` : ''}</span>
        <h3 class="prova__t">${tx(p.torneio, lingua)}</h3>
        ${local ? `<p class="prova__l">${local}</p>` : ''}
        ${fonte}
      </div>
      <div class="prova__a">
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

/* O que aconteceu numa época não é só a lista de provas: é também o que ela
   fez nesse ano, escrito por extenso, e o que se escreveu sobre ela. Estavam
   em três páginas diferentes, e a ordem era a mesma nas três. Aqui vêm juntos,
   por baixo do mesmo ano. */
async function extras(lingua) {
  const nada = { texto: new Map(), pecas: new Map(), casas: new Map() };
  try {
    const [perfil, imprensa] = await Promise.all([
      (await fetch('/data/perfil.json', { cache: 'no-cache' })).json(),
      (await fetch('/data/imprensa.json', { cache: 'no-cache' })).json(),
    ]);

    const texto = new Map((perfil.percurso || []).map((e) => [String(e.ano), e]));
    const pecas = new Map();
    for (const p of imprensa.pecas || []) {
      const ano = String(p.data || '').slice(0, 4);
      if (!ano) continue;
      if (!pecas.has(ano)) pecas.set(ano, []);
      pecas.get(ano).push(p);
    }
    const casas = new Map((imprensa.saiuEm || []).filter((c) => c?.logo).map((c) => [c.nome, c.logo]));
    return { texto, pecas, casas };
  } catch (e) {
    console.warn('época:', e.message);
    return nada;
  }
}

/* As três contagens que resumem a carreira, à cabeça da página. Saem das
   provas, e não de uma lista à parte: no dia em que ganhar outra vez, isto
   sabe. O que conta como título nacional está marcado prova a prova, no
   ficheiro — pelo nome não dava, porque o Drive Tour também se chama
   «Campeonato Nacional de Jovens» e ganhar uma etapa não é ser campeã. */
export async function contagens(cx, lingua = 'pt') {
  if (!cx) return;
  const { provas = [] } = await carregar();
  const en = lingua === 'en';

  const linhas = [
    { n: provas.filter((p) => p.nacional === 'campea').length,
      r: en ? 'National titles' : 'Títulos nacionais' },
    { n: provas.filter((p) => p.nacional === 'vice').length,
      r: en ? 'National runner-up' : 'Vice-campeã nacional' },
    /* Duas contagens e não uma, porque são duas coisas.
     *
     * «Chamadas à Seleção» é quantas vezes foi convocada — inclui as provas
     * disputadas em Portugal, que também são convocatórias. «Provas fora» é
     * quantas vezes saiu do país, convocada ou por iniciativa própria. Postas
     * lado a lado dizem o que nenhuma diz sozinha: com que frequência é
     * chamada, e quanto do calendário dela é feito na estrada. */
    { n: provas.filter((p) => p.selos?.includes('selecao')).length,
      r: en ? 'Caps for Portugal' : 'Chamadas à Seleção' },
    { n: provas.filter((p) => p.pais && p.pais !== 'PT').length,
      r: en ? 'Events abroad' : 'Provas fora' },
    { n: provas.filter((p) => p.pos === 1).length,
      r: en ? 'Wins' : 'Vitórias' },
  ].filter((l) => l.n);

  cx.className = 'conta';
  cx.innerHTML = linhas.map((l) => `
    <div class="conta__i">
      <span class="conta__n num">${l.n}</span>
      <span class="conta__r">${l.r}</span>
    </div>`).join('');
}

export async function porEpoca(cx, filtrosCx, lingua = 'pt') {
  if (!cx) return;
  const { provas = [] } = await carregar();
  if (!provas.length) {
    cx.innerHTML = `<p class="provas__vazio">${lingua === 'en' ? 'No results yet.' : 'Ainda sem resultados.'}</p>`;
    return;
  }
  const mais = await extras(lingua);
  const en = lingua === 'en';

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

      /* O relato, os destaques e a imprensa do ano só aparecem sem filtro
         posto. Com «Vitórias» escolhido, a lista mostra três provas e seria
         estranho trazer atrás o relato de uma época inteira. */
      const inteira = ativo === 'tudo';
      const conta = mais.texto.get(String(ano));
      const ps = mais.pecas.get(String(ano)) || [];

      const historia = inteira && conta ? `
        <div class="epoca__conta">
          <h3 class="epoca__t">${conta.t?.[lingua] || conta.t?.pt || ''}</h3>
          <p class="epoca__x">${conta.x?.[lingua] || conta.x?.pt || ''}</p>
        </div>` : '';

      const imprensa = inteira && ps.length ? `
        <details class="epoca__im">
          <summary><span>${ps.length} ${
            en ? `press piece${ps.length === 1 ? '' : 's'}` : `peça${ps.length === 1 ? '' : 's'} de imprensa`
          }</span></summary>
          <ol class="pecas">${ps.map((p) => {
            const logo = mais.casas.get(p.o);
            return `<li class="peca">
              <a href="${p.url}" target="_blank" rel="noopener" data-sem-seta data-mag>
                <span class="peca__f">${p.capa
                  ? `<img src="/img/imprensa/pecas/${p.capa}" alt="" loading="lazy" decoding="async" data-credito-feito="1" />`
                  : ''}</span>
                <span class="peca__o">${logo
                  ? `<img src="/img/imprensa/${logo}" alt="" loading="lazy" decoding="async" data-credito-feito="1" />`
                  : ''}<span>${p.o}</span></span>
                <span class="peca__t">${p.t?.[lingua] || p.t?.pt || ''}</span>
                <span class="peca__a num">${p.data}<i class="peca__s" aria-hidden="true">↗</i></span>
              </a></li>`;
          }).join('')}</ol>
        </details>` : '';

      /* O que fica à vista de cada ano são os destaques — títulos, vitórias e
         internacionalizações —, e não o resultado de cada volta. Uma época tem
         provas boas e provas más, e uma lista de todas as voltas afoga as
         primeiras nas segundas. Quem quiser o registo inteiro abre-o. */
      const destaque = (r, itens) => (itens.length ? `
        <div class="dest">
          <p class="dest__r">${r}</p>
          <ul class="dest__l">${itens.join('')}</ul>
        </div>` : '');

      const nome = (p) => tx(p.torneio, lingua);
      const onde = (p) => tx(p.local, lingua).split(',').pop().trim();

      const titulos = doAno.filter((p) => p.nacional === 'campea')
        .map((p) => `<li><b>${nome(p)}</b></li>`);
      const vices = doAno.filter((p) => p.nacional === 'vice')
        .map((p) => `<li>${nome(p)}</li>`);
      const ganhas = doAno.filter((p) => p.pos === 1 && p.nacional !== 'campea')
        .map((p) => `<li><b>${nome(p)}</b></li>`);
      const caps = doAno.filter((p) => p.selos?.includes('selecao'))
        .map((p) => `<li>${nome(p)}${onde(p) ? ` <span class="dest__o">${onde(p)}</span>` : ''}</li>`);

      const destaques = inteira ? [
        destaque(en ? 'National champion' : 'Campeã nacional', titulos),
        destaque(en ? 'Wins' : 'Vitórias', ganhas),
        destaque(en ? 'National runner-up' : 'Vice-campeã nacional', vices),
        destaque(en ? 'For Portugal' : 'Ao serviço da Seleção', caps),
      ].join('') : '';

      const lista = `<div class="provas">${doAno.map((p) => linhaProva(p, lingua, { comNota: true })).join('')}</div>`;

      /* Cada época abre e fecha, e só a primeira nasce aberta.
       *
       * Nove épocas seguidas eram 6800 pixéis de rolagem antes de se chegar ao
       * fim — doze ecrãs de telemóvel para uma página que é para se percorrer,
       * não para se ler de uma ponta à outra. E o que se procura numa página
       * destas é quase sempre um ano em concreto.
       *
       * Fechada, a época continua a dizer o que interessa: o ano, quantas
       * provas, quantos pódios, quantas vitórias. Isso é o resumo de uma época
       * inteira numa linha, e é a linha que faz decidir se vale a pena abrir.
       *
       * `<details>` e não JavaScript: o conteúdo continua no HTML — quem indexa
       * lê-o na mesma —, funciona sem uma linha de script, e o browser trata do
       * teclado e do leitor de ecrã sem ninguém lhe pedir. */
      return `
        <details class="epoca" id="e${ano}"${ano === anos[0] ? ' open' : ''}>
          <summary class="epoca__cab">
            <h2 class="epoca__ano num">${ano}</h2>
            <p class="epoca__r">${resumo}</p>
          </summary>
          ${historia}
          ${inteira ? `<div class="dests">${destaques}</div>
          <details class="epoca__im epoca__todas">
            <summary><span>${en
              ? (doAno.length === 1 ? `the one event of ${ano}` : `all ${doAno.length} events of ${ano}`)
              : (doAno.length === 1 ? `a prova de ${ano}` : `as ${doAno.length} provas de ${ano}`)
            }</span></summary>
            ${lista}
          </details>` : lista}
          ${imprensa}
        </details>`;
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

/* ── a próxima prova, se houver ───────────────────────────── */
/* Só entra aqui prova anunciada por fonte identificada. Passada a data, sai
   sozinha da lista e o hero volta ao último resultado — sem ninguém ter de
   se lembrar de a apagar. */
export async function proxima(lingua = 'pt') {
  const { proximas = [] } = await carregar();
  const hoje = new Date().toISOString().slice(0, 10);
  const p = proximas
    .filter((x) => x.data && x.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data))[0];
  if (!p) return null;
  return { prova: p, texto: `${dataCurta(p, lingua)} · ${tx(p.torneio, lingua)}` };
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

/* ── o que ainda não aconteceu ────────────────────────────── */
/* A primeira pergunta de quem abre uma página de resultados não é o que já
   houve — é o que vem aí. Só entram aqui provas anunciadas por fonte
   identificada, e cada uma sai sozinha da lista assim que a data passa. */
export async function proximas(cx, lingua = 'pt') {
  if (!cx) return;
  const { proximas: ps = [] } = await carregar();
  const hoje = new Date().toISOString().slice(0, 10);
  const lista = ps.filter((p) => p.data && p.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data));
  /* Sem provas marcadas, a secção inteira sai da página — e não fica uma faixa
     em branco onde estava. É o mesmo critério do resto do sítio: o que não
     existe não aparece. */
  if (!lista.length) { cx.innerHTML = ''; cx.closest('section[data-se-vazio]')?.toggleAttribute('hidden', true); return; }
  cx.closest('section[data-se-vazio]')?.toggleAttribute('hidden', false);
  const en = lingua === 'en';

  cx.className = 'aseguir';
  cx.innerHTML = `
    <p class="rot rot--so">${en ? 'Coming up' : 'A seguir'}</p>
    <div class="aseguir__l">${lista.map((p) => {
      const onde = [p.campo, tx(p.local, lingua)].filter(Boolean).join(' · ');
      return `
      <article class="prox-p">
        <span class="prox-p__d num">${dataCurta(p, lingua)}</span>
        <div class="prox-p__q">
          <h3 class="prox-p__t">${tx(p.torneio, lingua)}</h3>
          ${onde ? `<p class="prox-p__l">${onde}</p>` : ''}
          ${p.nota ? `<p class="prox-p__x">${tx(p.nota, lingua)}</p>` : ''}
        </div>
        ${p.escalao ? `<span class="selo selo--selecao">${tx(p.escalao, lingua)}</span>` : ''}
        ${p.fonte?.url ? `<p class="prova__f"><a href="${p.fonte.url}" target="_blank" rel="noopener" data-mag>${
          en ? 'Source' : 'Fonte'}: ${p.fonte.nome}</a></p>` : ''}
      </article>`;
    }).join('')}</div>`;
}
