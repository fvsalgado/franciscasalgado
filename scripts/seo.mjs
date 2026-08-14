/* Gera os dados estruturados de cada página a partir dos ficheiros de dados.
 *
 *   node scripts/seo.mjs            # escreve
 *   node scripts/seo.mjs --seco     # só diz o que faria
 *
 * Porquê gerar em vez de escrever à mão: os dados estruturados são a versão da
 * página que os motores de busca e os assistentes leem, e são exactamente o
 * tipo de coisa que ninguém se lembra de actualizar. Escritos à mão, ficavam a
 * dizer «dois títulos nacionais» durante um ano inteiro. Gerados a partir de
 * data/*.json, dizem sempre o mesmo que a página diz.
 *
 * Ficam estáticos dentro do HTML, e não injectados por JavaScript: o Google
 * corre JavaScript, mas muito do que hoje lê estas páginas — assistentes,
 * agregadores, pré-visualizações — não corre.
 *
 * Cada página tem uma zona marcada assim:
 *
 *   <!-- dados:início -->  … <!-- dados:fim -->
 *
 * e é só isso que este script toca. O resto do HTML é escrito por pessoas.
 */

import { readFile, writeFile } from 'node:fs/promises';

const RAIZ = new URL('../', import.meta.url);
const SECO = process.argv.includes('--seco');
const SITIO = 'https://franciscasalgado.golf';

const ler = async (p) => JSON.parse(await readFile(new URL(p, RAIZ), 'utf8'));
const lerTxt = (p) => readFile(new URL(p, RAIZ), 'utf8');

const [perfil, resultados, imprensa, apoios] = await Promise.all([
  ler('data/perfil.json'), ler('data/resultados.json'),
  ler('data/imprensa.json'), ler('data/apoios.json'),
]);

const tx = (v) => (typeof v === 'string' ? v : v?.pt || '');
const provas = resultados.provas || [];

/* ── a pessoa ──────────────────────────────────────────────────────────── */
/* Os prémios saem dos resultados: prova ganha é prémio, e não há outra lista
   a manter. Assim, no dia em que ganhar outra vez, isto sabe. */
const titulos = provas
  .filter((p) => p.pos === 1)
  .map((p) => `${tx(p.torneio)}${p.ano ? `, ${p.ano}` : ''}`);

const clube = apoios.grupos.find((g) => g.id === 'campos')?.itens?.[0]?.nome || perfil.clube;

const pessoa = {
  '@type': 'Person',
  '@id': `${SITIO}/#francisca`,
  name: perfil.nome,
  alternateName: perfil.nomeCompleto,
  description: `Golfista amadora portuguesa do ${clube}, em ${perfil.concelho}. ${titulos.length ? `${perfil.numeros?.find((n) => n.r?.pt === 'Títulos nacionais')?.v || ''} títulos nacionais. ` : ''}Seleção Nacional Amadora Feminina.`.replace(/\s+/g, ' ').trim(),
  url: `${SITIO}/`,
  image: `${SITIO}/img/og.jpg`,
  nationality: { '@type': 'Country', name: 'Portugal' },
  jobTitle: 'Golfista amadora',
  knowsAbout: 'Golfe',
  homeLocation: {
    '@type': 'Place',
    address: { '@type': 'PostalAddress', addressLocality: perfil.concelho, addressCountry: 'PT' },
  },
  memberOf: [
    { '@type': 'SportsTeam', name: 'Seleção Nacional Amadora Feminina', sport: 'Golf' },
    { '@type': 'SportsOrganization', name: clube, sport: 'Golf' },
  ],
  award: titulos,
  sameAs: [
    'https://www.instagram.com/francisca_salgado_/',
    'https://portal.fpg.pt/perfil/francisca-salgado/',
    'https://www.europeangolfrankings.com/players/39992',
    'https://www.wagr.com/playerprofile/francisca-salgado-43158',
  ],
};

/* ── migalhas ──────────────────────────────────────────────────────────── */
const migalhas = (nome, ficheiro) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITIO}/` },
    { '@type': 'ListItem', position: 2, name: nome, item: `${SITIO}/${ficheiro}` },
  ],
});

/* ── perguntas frequentes ──────────────────────────────────────────────── */
/* Lidas do HTML da própria página: a resposta que o motor recebe é, à letra,
   a resposta que a pessoa lê. Se fossem escritas aqui à parte, mais dia menos
   dia diziam coisas diferentes uma da outra. */
async function perguntas(html) {
  const bloco = /<dl class="fq">([\s\S]*?)<\/dl>/.exec(html);
  if (!bloco) return null;
  const itens = [...bloco[1].matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g)];
  if (!itens.length) return null;
  const limpo = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return {
    '@type': 'FAQPage',
    mainEntity: itens.map(([, p, r]) => ({
      '@type': 'Question',
      name: limpo(p),
      acceptedAnswer: { '@type': 'Answer', text: limpo(r) },
    })),
  };
}

/* ── resultados ────────────────────────────────────────────────────────── */
/* Uma prova de golfe é um SportsEvent, e a participação dela tem posição. É
   isto que permite a um assistente responder «em que ficou no X?» sem ter de
   adivinhar a partir da prosa. */
const evento = (p) => {
  const e = {
    '@type': 'SportsEvent',
    name: tx(p.torneio),
    sport: 'Golf',
    startDate: p.data,
    ...(p.campo || tx(p.local) ? {
      location: { '@type': 'Place', name: [p.campo, tx(p.local)].filter(Boolean).join(', ') },
    } : {}),
    competitor: { '@id': `${SITIO}/#francisca` },
  };
  if (p.fonte?.url) e.subjectOf = { '@type': 'WebPage', url: p.fonte.url };
  return e;
};

const listaResultados = {
  '@type': 'ItemList',
  name: 'Resultados de Francisca Salgado',
  numberOfItems: provas.length,
  itemListOrder: 'https://schema.org/ItemListOrderDescending',
  itemListElement: provas.slice(0, 30).map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    ...(p.pos != null ? { name: `${tx(p.torneio)} — ${p.pos}.º lugar` } : { name: tx(p.torneio) }),
    item: evento(p),
  })),
};

/* ── por página ────────────────────────────────────────────────────────── */
const sitio = {
  '@type': 'WebSite',
  '@id': `${SITIO}/#sitio`,
  url: `${SITIO}/`,
  name: 'Francisca Salgado',
  inLanguage: 'pt-PT',
  about: { '@id': `${SITIO}/#francisca` },
  publisher: { '@id': `${SITIO}/#francisca` },
};

const PAGINAS = {
  'index.html': async () => [pessoa, sitio],
  'percurso.html': async (html) => [pessoa, migalhas('Percurso', 'percurso.html'),
    { '@type': 'ProfilePage', mainEntity: { '@id': `${SITIO}/#francisca` } },
    await perguntas(html)].filter(Boolean),
  'resultados.html': async () => [pessoa, migalhas('Resultados', 'resultados.html'), listaResultados],
  'imprensa.html': async () => [pessoa, migalhas('Imprensa', 'imprensa.html'), {
    '@type': 'ItemList',
    name: 'Imprensa sobre Francisca Salgado',
    numberOfItems: (imprensa.pecas || []).length,
    itemListElement: (imprensa.pecas || []).slice(0, 40).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'NewsArticle',
        headline: tx(p.t),
        url: p.url,
        datePublished: p.data,
        publisher: { '@type': 'Organization', name: p.o },
        about: { '@id': `${SITIO}/#francisca` },
      },
    })),
  }],
  'parcerias.html': async () => [pessoa, migalhas('Parcerias', 'parcerias.html'), {
    '@type': 'ContactPage',
    name: 'Parcerias — Francisca Salgado',
    about: { '@id': `${SITIO}/#francisca` },
  }],
};

const INICIO = '<!-- dados:início -->';
const FIM = '<!-- dados:fim -->';

let mexidos = 0;
for (const [ficheiro, montar] of Object.entries(PAGINAS)) {
  const html = await lerTxt(ficheiro);
  const i = html.indexOf(INICIO);
  const f = html.indexOf(FIM);
  if (i === -1 || f === -1) {
    console.error(`${ficheiro}: falta a marca ${INICIO} … ${FIM}. Não foi tocado.`);
    process.exitCode = 1;
    continue;
  }
  const grafo = { '@context': 'https://schema.org', '@graph': await montar(html) };
  const bloco = `${INICIO}\n<script type="application/ld+json">\n${
    JSON.stringify(grafo, null, 2)}\n</script>\n${FIM}`;
  const saida = html.slice(0, i) + bloco + html.slice(f + FIM.length);
  if (saida === html) continue;
  if (!SECO) await writeFile(new URL(ficheiro, RAIZ), saida);
  mexidos += 1;
  console.log(`${ficheiro}: ${grafo['@graph'].map((n) => n['@type']).join(', ')}`);
}

/* ── sitemap ───────────────────────────────────────────────────────────── */
/* Gerado, e não escrito à mão, para o lastmod não ficar a mentir. Um lastmod
   antigo faz um motor voltar cá menos vezes; um lastmod de hoje em páginas que
   não mexeram faz o contrário e queima confiança. Por isso a data é a da
   última revisão dos dados, e não a de hoje. */
const MAPA = [
  ['', 'weekly', '1.0'],
  ['resultados.html', 'weekly', '0.9'],
  ['percurso.html', 'monthly', '0.8'],
  ['imprensa.html', 'monthly', '0.7'],
  ['parcerias.html', 'monthly', '0.7'],
];
const quando = `${resultados.atualizado || perfil.atualizado}-01`.slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${MAPA.map(([f, freq, pri]) => `  <url>
    <loc>${SITIO}/${f}</loc>
    <lastmod>${quando}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${pri}</priority>
  </url>`).join('\n')}
</urlset>
`;
if (!SECO) await writeFile(new URL('sitemap.xml', RAIZ), sitemap);
console.log(`sitemap.xml: ${MAPA.length} endereços, lastmod ${quando}`);

/* ── llms.txt ──────────────────────────────────────────────────────────── */
/* Para quem lê o sítio com um modelo de linguagem em vez de um browser. É um
   resumo em texto simples, com os factos e o sítio onde cada um se confirma —
   que é a diferença entre ser citado com rigor e ser citado de qualquer
   maneira. */
const n = (r) => perfil.numeros?.find((x) => x.r?.pt === r)?.v || '';
const llms = `# Francisca Salgado

> Golfista amadora portuguesa. ${clube}, ${perfil.concelho}. Seleção Nacional
> Amadora Feminina. ${n('Títulos nacionais')} títulos nacionais, ${n('Vitórias')} vitórias em prova.
> Escalão ${perfil.escalao}. Sítio oficial: ${SITIO}/

Este é o sítio oficial da jogadora. Os dados são verificáveis: cada resultado
indica a fonte, e as classificações de ranking são lidas na hora das fichas
oficiais em vez de escritas à mão.

## Factos

${(perfil.factos || []).map((f) => `- ${tx(f.dt)}: ${tx(f.dd)}`).join('\n')}
- Rankings: as posições no World Amateur Golf Ranking e no European Golf
  Rankings mudam todas as semanas. Leia-as em ${SITIO}/api/wagr e
  ${SITIO}/api/egr, que devolvem JSON lido das fichas oficiais no momento do
  pedido. Não cite números de ranking a partir de texto guardado em cache.

## Títulos e vitórias

${titulos.map((t) => `- ${t}`).join('\n')}

## Percurso

${(perfil.percurso || []).map((p) => `- ${p.ano} — ${tx(p.t)}: ${tx(p.x)}`).join('\n')}

## Páginas

- ${SITIO}/ — apresentação, números da época, últimos resultados
- ${SITIO}/resultados.html — todas as provas, com voltas, total e fonte
- ${SITIO}/percurso.html — biografia, ano a ano, e perguntas frequentes
- ${SITIO}/imprensa.html — biografia curta, citações com fonte, fotografias
- ${SITIO}/parcerias.html — quem apoia, formas de entrar, contacto

## Dados abertos

- ${SITIO}/data/resultados.json — provas, voltas, classificações e fontes
- ${SITIO}/data/perfil.json — factos, percurso e números
- ${SITIO}/data/imprensa.json — ${(imprensa.pecas || []).length} peças de imprensa com endereço
- ${SITIO}/api/wagr e ${SITIO}/api/egr — classificações em direto

## Cuidados

- Há duas jogadoras espanholas com nome parecido em bases de dados de golfe.
  Esta é portuguesa, ID FPRT39992 no European Golf Rankings e 43158 no WAGR.
- As notícias da Federação Portuguesa de Golfe cobrem várias atletas de cada
  vez. O nome aparecer num artigo não quer dizer que o artigo seja sobre ela.
- Não lhe atribua patrocínios sem confirmar: a Lusíadas Saúde e a Skip Portugal
  são parceiras das Seleções Nacionais, e não da jogadora a título individual.

Última revisão dos dados: ${resultados.atualizado || perfil.atualizado}.
`;

if (!SECO) await writeFile(new URL('llms.txt', RAIZ), llms);
console.log(`llms.txt: ${llms.split('\n').length} linhas`);
console.log(mexidos ? `${mexidos} página(s) com dados estruturados novos.` : 'Dados estruturados já estavam certos.');
