/* O cartão do World Amateur Golf Ranking.

   Dois caminhos, por esta ordem:
   1. /api/wagr — a função serverless, que vai buscar a ficha ao WAGR na hora.
      É o caminho normal, e é o que faz o número estar sempre certo.
   2. data/wagr.json — o instantâneo guardado no repositório. Serve quando o
      sítio corre sem funções (alojamento estático, um `npx serve` local) ou
      quando o WAGR está em baixo.

   Em qualquer dos casos o cartão diz de quando são os dados e leva a ligação
   para a ficha oficial: quem quiser confirmar, confirma na fonte.

   O cartão não mostra a fotografia que o WAGR tem na ficha dela. Seria mais um
   pedido ao servidor de terceiros a cada visita, e a fotografia é deles — o
   cartão é sobre um número, e a cara dela já está no resto da página. */

import { icone } from './icones.js';

const CHAVE = 'fs-wagr-v1';

const T = {
  pt: {
    rot: 'World Amateur Golf Ranking',
    pos: 'Classificação mundial',
    melhor: 'Melhor de sempre',
    media: 'Média de pontos',
    provas: 'Provas contadas',
    top10: 'Top 10',
    vitorias: 'Vitórias',
    ver: 'Ver a ficha no WAGR',
    de: 'Dados de',
    aovivo: 'Em direto',
    guardado: 'Instantâneo',
    falha: 'Não foi possível ler a classificação agora.',
  },
  en: {
    rot: 'World Amateur Golf Ranking',
    pos: 'World ranking',
    melhor: 'Career best',
    media: 'Points average',
    provas: 'Counting events',
    top10: 'Top 10s',
    vitorias: 'Wins',
    ver: 'See the WAGR profile',
    de: 'Data from',
    aovivo: 'Live',
    guardado: 'Snapshot',
    falha: 'Could not read the ranking right now.',
  },
};

/* A média vem do WAGR com quatro casas decimais, que ninguém lê. Duas chegam,
   e em português a vírgula é vírgula. */
function media(v, lingua) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  const s = n.toFixed(2);
  return lingua === 'en' ? s : s.replace('.', ',');
}

const data = (iso, lingua) => {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lingua === 'en' ? 'en-GB' : 'pt-PT',
    { day: 'numeric', month: 'long', year: 'numeric' });
};

async function buscar() {
  // 1) a função, se existir
  try {
    const r = await fetch('/api/wagr', { cache: 'no-cache' });
    if (r.ok) {
      const d = await r.json();
      if (d?.posicao) {
        try { sessionStorage.setItem(CHAVE, JSON.stringify(d)); } catch { /* modo privado */ }
        return { d, vivo: true };
      }
    }
  } catch { /* sem funções, ou sem rede — segue para o instantâneo */ }

  // 2) o instantâneo do repositório
  try {
    const d = await (await fetch('data/wagr.json', { cache: 'no-cache' })).json();
    if (d?.posicao) return { d, vivo: false };
  } catch (e) { console.warn('wagr:', e.message); }

  return null;
}

export async function wagr(cx, lingua = 'pt') {
  if (!cx) return;
  const t = T[lingua] || T.pt;

  const r = await buscar();
  if (!r) { cx.innerHTML = `<p class="provas__vazio">${t.falha}</p>`; return; }
  const { d, vivo } = r;

  const numeros = [
    { r: t.melhor, v: d.melhorPosicao, sup: lingua === 'en' ? '' : '.ª' },
    { r: t.vitorias, v: d.vitorias },
    { r: t.top10, v: d.top10 },
    { r: t.provas, v: d.provasContadas },
  ].filter((n) => n.v != null);

  cx.className = 'wagr';
  cx.innerHTML = `
    <div class="wagr__cabeca">
      <span class="wagr__f">${icone('taca', 'ic')}</span>
      <div class="wagr__id">
        <p class="wagr__rot">${t.rot}</p>
        <p class="wagr__n">${d.nome || 'Francisca Salgado'}</p>
        <p class="wagr__p">${d.pais || 'Portugal'}</p>
      </div>
      <span class="wagr__estado ${vivo ? 'wagr__estado--vivo' : ''}">${vivo ? t.aovivo : t.guardado}</span>
    </div>

    <div class="wagr__grande">
      <span class="wagr__pos num">${d.posicao}<sup>${lingua === 'en' ? '' : '.ª'}</sup></span>
      <span class="wagr__pr">${t.pos}</span>
      <span class="wagr__media num">${media(d.mediaPontos, lingua)} <i>${t.media}</i></span>
    </div>

    <dl class="wagr__l">
      ${numeros.map((n) => `
        <div><dt>${n.r}</dt><dd class="num">${n.v}${n.sup || ''}</dd></div>`).join('')}
    </dl>

    <div class="wagr__pe">
      <a class="cap cap--cheio" href="${d.perfil}" target="_blank" rel="noopener" data-mag>${t.ver}</a>
      <span class="wagr__data num">${t.de} ${data(d.atualizado, lingua)}</span>
    </div>`;
}
