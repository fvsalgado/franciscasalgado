/* Escreve as páginas inglesas, em /en/, a partir das portuguesas.
 *
 *   node scripts/traduzir.mjs            # escreve
 *   node scripts/traduzir.mjs --seco     # só diz o que faria
 *
 * ── Porquê ficheiros e não um botão ──────────────────────────────────────
 * O inglês era aplicado ao vivo, por JavaScript, sobre a página portuguesa.
 * Funcionava para quem lá estava e não existia para mais ninguém: o endereço
 * era o mesmo, e portanto não havia nada para indexar, para partilhar, para
 * marcar nos favoritos, nem para declarar em hreflang. Um motor de busca via
 * um sítio só, em português.
 *
 * Agora cada página tem duas: /resultados.html e /en/resultados.html. Cada uma
 * declara a outra em hreflang, e cada uma se declara a si em canonical. É a
 * forma que o Google documenta, e é a única que os assistentes conseguem
 * seguir.
 *
 * ── Como ────────────────────────────────────────────────────────────────
 * O português vive no HTML. Cada pedaço traduzível tem `data-t="chave"`, e o
 * inglês dessa chave está em scripts/en.mjs. Este script copia o ficheiro,
 * troca o conteúdo de cada elemento marcado, e arruma o cabeçalho.
 *
 * Uma chave sem tradução deixa o português no sítio e sai avisada no fim. Meia
 * página traduzida é melhor do que uma página em branco, e o aviso garante que
 * ninguém se esquece do resto.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { EN } from './en.mjs';

const RAIZ = new URL('../', import.meta.url);
const SECO = process.argv.includes('--seco');
const SITIO = 'https://franciscasalgado.golf';

const PAGINAS = ['index.html', 'resultados.html', 'recruiting.html', 'witb.html',
                 'imprensa.html', 'parcerias.html', 'privacidade.html', 'termos.html'];

/* Os títulos e as descrições não têm `data-t` — vivem no <head>, onde não há
   elementos para marcar. Ficam aqui, ao lado do resto do inglês. */
const CABECALHOS = {
  'index.html': {
    titulo: 'Francisca Salgado — amateur golfer, Portuguese national team',
    desc: 'Francisca Salgado, Portuguese amateur golfer and national U18 champion. Vale de Janelas, Óbidos. Results, live rankings, her story and press.',
  },
  'resultados.html': {
    titulo: 'Results — Francisca Salgado',
    desc: 'Every result Francisca Salgado has on record, season by season — rounds, totals and score to par — plus her WAGR and European Golf Rankings positions.',
  },
  'recruiting.html': {
    titulo: 'College recruiting — Francisca Salgado',
    desc: 'Francisca Salgado, Portuguese amateur golfer, class of 2027: handicap, WAGR world ranking, European U18 ranking, schedule and results — for college coaches.',
  },
  'witb.html': {
    titulo: "What's in the bag — Francisca Salgado",
    desc: "Every one of Francisca Salgado's fourteen clubs: Cobra OPTM X driver, 3DP Tour irons, King wedges, "
      + 'Scotty Cameron Phantom 5 putter, Titleist Pro V1 ball — with lofts, shafts and the bag.',
  },
  'imprensa.html': {
    titulo: 'Press — Francisca Salgado',
    desc: 'Press kit for Francisca Salgado: short biography, checkable facts, sourced quotes and high-resolution photographs, free to publish.',
  },
  'parcerias.html': {
    titulo: 'Partnerships — Francisca Salgado',
    desc: 'Partnering with Francisca Salgado: who already backs her, the three ways in — season, event or groundwork — and how to get in touch.',
  },
  'privacidade.html': { titulo: 'Privacy — Francisca Salgado', desc: 'How this site handles personal data.' },
  'termos.html': { titulo: 'Terms — Francisca Salgado', desc: 'Terms of use for this site.' },
};

const emFalta = new Set();
const semChave = new Set();

/* Troca o conteúdo de cada elemento com data-t. Feito com expressão regular e
   não com um parser: a marca é sempre `data-t="chave"` dentro da etiqueta de
   abertura, escrita por nós, e o conteúdo nunca tem etiquetas encaixadas do
   mesmo nome. Um parser de HTML aqui era peso para não resolver problema
   nenhum — e reescreveria o resto do ficheiro à sua maneira. */
function traduzirCorpo(html, ficheiro) {
  return html.replace(
    /<(\w+)([^>]*\bdata-t="([\w-]+)"[^>]*)>([\s\S]*?)<\/\1>/g,
    (todo, etiqueta, atributos, chave, dentro) => {
      const en = EN[chave];
      if (en === undefined) { emFalta.add(`${ficheiro}: ${chave}`); return todo; }
      return `<${etiqueta}${atributos}>${en}</${etiqueta}>`;
    },
  );
}

/* O cabeçalho: canonical, og:url e as alternativas. */
function arrumarCabeca(html, ficheiro, { en }) {
  const nome = ficheiro === 'index.html' ? '' : ficheiro;
  const pt = `${SITIO}/${nome}`;
  /* Com barra no fim: é o endereço onde a página vive. As ligações internas já
     não dependem disso — ver ligacoesInglesas() —, mas o canonical deve apontar
     ao endereço canónico e não a um que o servidor tenha de resolver. */
  const ing = nome ? `${SITIO}/en/${nome}` : `${SITIO}/en/`;
  const meu = en ? ing : pt;
  const cab = CABECALHOS[ficheiro];

  let s = html;
  s = s.replace(/<html lang="[^"]*"/, `<html lang="${en ? 'en' : 'pt-PT'}"`);
  s = s.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${meu}$2`);
  s = s.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${meu}$2`);
  s = s.replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1${en ? 'en_GB' : 'pt_PT'}$2`);
  s = s.replace(/(<meta property="og:locale:alternate" content=")[^"]*(")/, `$1${en ? 'pt_PT' : 'en_GB'}$2`);

  if (en && cab) {
    s = s.replace(/<title>[\s\S]*?<\/title>/, `<title>${cab.titulo}</title>`);
    s = s.replace(/(<meta name="description" content=")[^"]*(")/, `$1${cab.desc}$2`);
    s = s.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${cab.titulo}$2`);
    s = s.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${cab.desc}$2`);
  }

  /* hreflang nas duas: cada página aponta para si e para a irmã. x-default vai
     ao português, que é a língua da casa — é o que um motor serve a quem não
     encaixa em nenhuma das duas. As três linhas têm de estar nas duas versões,
     senão o Google ignora o par inteiro. */
  const alt = [
    `<link rel="alternate" hreflang="pt-PT" href="${pt}" />`,
    `<link rel="alternate" hreflang="en" href="${ing}" />`,
    `<link rel="alternate" hreflang="x-default" href="${pt}" />`,
  ].join('\n');
  s = s.replace(/\n?<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>/g, '');
  s = s.replace(/(<link rel="canonical"[^>]*\/>)/, `$1\n${alt}`);

  return s;
}

/* As ligações internas escritas no HTML são relativas — «resultados.html» —, e
   dentro de /en/ isso só funciona enquanto o endereço acabar em barra. Em
   «/en» sem barra resolvem contra a raiz e devolvem a página portuguesa, que
   foi exactamente o defeito que alguém apanhou a navegar. Na cópia inglesa
   passam a levar o caminho inteiro; assim não dependem de um carácter no fim
   do endereço nem de nenhuma regra do servidor.

   Só as das páginas do sítio. O que aponta para /data/, /img/, /api/ ou para
   fora fica como está — é comum às duas línguas. */
const PAGINA = /^(index|resultados|recruiting|imprensa|parcerias|privacidade|termos)\.html(#[\w-]+)?$/;

function ligacoesInglesas(html) {
  return html.replace(/(<a\b[^>]*\bhref=")([^"]+)(")/g, (todo, antes, alvo, depois) => (
    PAGINA.test(alvo) ? `${antes}/en/${alvo}${depois}` : todo
  ));
}

/* As páginas legais não devem ser indexadas em nenhuma das línguas — já estão
   fora do robots.txt, e a etiqueta fecha a porta pelo lado de dentro. */
const LEGAIS = new Set(['privacidade.html', 'termos.html']);

let escritas = 0;
if (!SECO) await mkdir(new URL('en/', RAIZ), { recursive: true });

for (const f of PAGINAS) {
  const original = await readFile(new URL(f, RAIZ), 'utf8');

  // a portuguesa leva as alternativas e o canonical arrumados
  const pt = arrumarCabeca(original, f, { en: false });
  if (pt !== original && !SECO) await writeFile(new URL(f, RAIZ), pt);

  // a inglesa nasce da portuguesa já arrumada
  let ing = traduzirCorpo(pt, f);
  ing = ligacoesInglesas(ing);
  ing = arrumarCabeca(ing, f, { en: true });
  if (LEGAIS.has(f) && !ing.includes('name="robots"')) {
    ing = ing.replace('</title>', '</title>\n<meta name="robots" content="noindex,follow" />');
  }
  if (!SECO) await writeFile(new URL(`en/${f}`, RAIZ), ing);
  escritas += 1;

  const marcadas = [...pt.matchAll(/\bdata-t="([\w-]+)"/g)].map((m) => m[1]);
  const trocadas = marcadas.filter((c) => EN[c] !== undefined).length;
  console.log(`en/${f}: ${trocadas}/${marcadas.length} pedaços em inglês`);
}

/* Chaves em scripts/en.mjs que já não têm elemento nenhum no HTML. Não partem
   nada — mas são inglês escrito para texto português que entretanto mudou, e
   mais vale saber. */
const todasAsChaves = new Set();
for (const f of PAGINAS) {
  const h = await readFile(new URL(f, RAIZ), 'utf8');
  for (const m of h.matchAll(/\bdata-t="([\w-]+)"/g)) todasAsChaves.add(m[1]);
}
for (const c of Object.keys(EN)) if (!todasAsChaves.has(c)) semChave.add(c);

console.log(`\n${escritas} página(s) em /en/.`);
if (emFalta.size) {
  console.log(`\nSem tradução (ficou o português):\n${[...emFalta].map((x) => `  - ${x}`).join('\n')}`);
  process.exitCode = 1;
}
if (semChave.size) {
  console.log(`\nInglês sem uso no HTML (${semChave.size}): ${[...semChave].join(', ')}`);
}
