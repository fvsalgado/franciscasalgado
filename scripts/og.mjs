/* As imagens de partilha, 1200 × 630.
 *
 *   node scripts/og.mjs
 *
 * São duas: img/og.jpg, para o sítio em geral, e img/og-witb.jpg, para a
 * página do saco — que existe para ser partilhada e por isso merece um cartão
 * seu, com os tacos e não com o retrato.
 *
 * É o que aparece quando alguém manda o endereço por WhatsApp, por email ou
 * numa rede social, e muita gente nunca vê mais nada do sítio senão isto.
 *
 * Era desenhada à mão num HTML à parte, com o retrato e uma frase escrita lá
 * dentro. Envelheceu duas vezes: quando a página inicial passou a abrir com a
 * fotografia de jogo, e quando os títulos deixaram de ser dois. Agora o texto
 * vem de data/perfil.json e a fotografia é a mesma do hero, por isso segue o
 * sítio em vez de ficar para trás.
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const RAIZ = new URL('../', import.meta.url);
const perfil = JSON.parse(await readFile(new URL('data/perfil.json', RAIZ), 'utf8'));

const num = (r) => perfil.numeros?.find((n) => n.r?.pt === r)?.v || '';
const b64 = async (p) => `data:image/webp;base64,${(await readFile(new URL(p, RAIZ))).toString('base64')}`;
const fonte = async (p) => (await readFile(new URL(p, RAIZ))).toString('base64');

const saco = JSON.parse(await readFile(new URL('data/witb.json', RAIZ), 'utf8'));

/* Quantos tacos, a sério: um driver, duas madeiras, um híbrido, seis ferros,
   três wedges e o putter. Contado do data/witb.json e não escrito à mão, para
   não ficar a dizer catorze no dia em que ela trocar um híbrido por um ferro. */
const QUANTOS = { Driver: 1, Madeiras: 2, Híbrido: 1, Ferros: 6, Wedges: 3, Putter: 1 };
const tacos = (saco.tacos || []).reduce((n, t) => n + (QUANTOS[t.t?.pt] || 1), 0);

const dados = {
  foto: await b64('img/swing.webp'),
  fraunces: await fonte('fonts/fraunces.woff2'),
  manrope: await fonte('fonts/manrope.woff2'),
  titulos: num('Títulos nacionais'),
  vitorias: num('Vitórias'),
  desde: num('Desde'),
};

const cartaoPrincipal = `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><style>
@font-face{font-family:'Fraunces';font-weight:300 700;src:url(data:font/woff2;base64,${dados.fraunces}) format('woff2')}
@font-face{font-family:'Manrope';font-weight:300 800;src:url(data:font/woff2;base64,${dados.manrope}) format('woff2')}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;background:#0B1512;color:#fff;
     font-family:'Manrope',sans-serif;position:relative}
/* A fotografia é vertical e ela está encostada à esquerda do enquadramento,
   por isso quem manda aqui é a altura: a 5% vê-se a cara e o taco, mais
   abaixo perdia-se a cabeça e ficava só o casaco. */
.f{position:absolute;inset:0}
.f img{width:100%;height:100%;object-fit:cover;object-position:50% 5%}

/* Uma camada que assenta o preto no fundo, onde vive o texto, e uma vinheta
   que fecha os cantos sem apagar a fotografia por cima. */
.v{position:absolute;inset:0;background:
  linear-gradient(180deg,rgba(6,14,11,.5) 0%,rgba(6,14,11,.3) 20%,rgba(6,14,11,.86) 56%,rgba(6,14,11,.96) 84%)}
.v2{position:absolute;inset:0;background:
  radial-gradient(120% 92% at 34% 26%,rgba(6,14,11,0) 0%,rgba(6,14,11,.4) 54%,rgba(6,14,11,.8) 100%)}

/* Composição de cima para baixo, e nada mais largo do que 560px.
 *
 * O WhatsApp mostra muitas vezes a pré-visualização em pequeno, e para isso
 * corta esta imagem num quadrado tirado do meio — 630 px de largura de um
 * total de 1200. Uma composição encostada a um dos lados desaparecia nesse
 * corte: ficava um pedaço de palavra e mais nada. Empilhada ao centro, o
 * corte quadrado continua a ser o cartão inteiro, só mais apertado. */
.q{position:absolute;left:0;right:0;bottom:46px;display:flex;flex-direction:column;
   align-items:center;text-align:center}
.q > *{max-width:500px}
.rot{font-size:14px;font-weight:800;letter-spacing:.26em;text-transform:uppercase;color:#8FD9AE}
.nome{font-family:'Fraunces',serif;font-weight:400;font-variation-settings:'opsz' 144;
      font-size:82px;line-height:.94;letter-spacing:-.042em;margin-top:15px;
      text-shadow:0 2px 44px rgba(0,0,0,.55)}
.sub{font-family:'Fraunces',serif;font-weight:300;font-style:italic;font-variation-settings:'opsz' 40;
     font-size:24px;line-height:1.35;color:#DCE8DF;margin-top:17px;text-wrap:balance}
.risco{width:150px;height:1px;background:rgba(255,255,255,.34);margin:27px 0 17px}
.ns{font-size:13px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;
    color:#9FC3AC;white-space:nowrap}
.ns b{color:#8FD9AE;font-weight:800}
.dom{font-size:18px;font-weight:800;letter-spacing:.17em;text-transform:uppercase;
     white-space:nowrap;margin-top:13px}
</style></head><body>
  <div class="f"><img src="${dados.foto}" alt=""></div>
  <div class="v"></div>
  <div class="v2"></div>
  <div class="q">
    <p class="rot">Golfista amadora · Seleção Nacional</p>
    <p class="nome">Francisca<br>Salgado</p>
    <p class="sub">Campeã nacional Sub-18. Do Vale de Janelas para os campos da Europa.</p>
    <span class="risco"></span>
    <p class="ns"><b>${dados.titulos}</b> títulos nacionais · <b>${dados.vitorias}</b> vitórias · desde <b>${dados.desde}</b></p>
    <p class="dom">franciscasalgado.golf</p>
  </div>
</body></html>`;

/* ── o cartão do saco ──────────────────────────────────────────────────────
 *
 * Os tacos numa fila, e o texto por baixo. O verde claro é o mesmo da secção
 * no sítio, e é ele que faz os três tacos pretos verem-se — sobre escuro
 * desapareciam, que é a razão de este cartão não ser escuro como o outro. */
const fila = await Promise.all(['driver', 'madeira', 'hibrido', 'ferros', 'wedge',
  'putter', 'bola', 'luva'].map((n) => b64(`img/witb/${n}.webp`)));

const cartaoSaco = `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><style>
@font-face{font-family:'Fraunces';font-weight:300 700;src:url(data:font/woff2;base64,${dados.fraunces}) format('woff2')}
@font-face{font-family:'Manrope';font-weight:300 800;src:url(data:font/woff2;base64,${dados.manrope}) format('woff2')}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;background:#DCE7DA;color:#12281E;
     font-family:'Manrope',sans-serif;display:flex;flex-direction:column;
     align-items:center;justify-content:center;padding:0 0 6px}
/* A fila inteira tem de caber nos 1200: com folga a mais os tacos das pontas
   ficavam cortados pela moldura, e um driver meio cortado numa imagem de
   partilha lê-se como imagem partida, não como enquadramento. */
.t{display:flex;align-items:flex-end;justify-content:center;gap:22px;
   border-bottom:1px solid rgba(27,107,71,.4);padding-bottom:2px}
.t img{display:block;height:214px;width:auto}
.q{display:flex;flex-direction:column;align-items:center;text-align:center;margin-top:34px}
.q > *{max-width:560px}
.rot{font-size:14px;font-weight:800;letter-spacing:.26em;text-transform:uppercase;color:#1B6B47}
.nome{font-family:'Fraunces',serif;font-weight:400;font-variation-settings:'opsz' 144;
      font-size:72px;line-height:.94;letter-spacing:-.042em;margin-top:14px;white-space:nowrap}
.ns{font-size:15px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
    color:#3F5C4C;margin-top:18px;white-space:nowrap}
.ns b{color:#1B6B47;font-weight:800}
.dom{font-size:17px;font-weight:800;letter-spacing:.17em;text-transform:uppercase;
     white-space:nowrap;margin-top:14px;color:#1B6B47}
</style></head><body>
  <div class="t">${fila.map((d) => `<img src="${d}" alt="">`).join('')}</div>
  <div class="q">
    <p class="rot">What&rsquo;s in the bag</p>
    <p class="nome">Francisca Salgado</p>
    <p class="ns"><b>${tacos}</b> tacos &middot; Cobra &middot; Scotty Cameron &middot; Titleist</p>
    <p class="dom">franciscasalgado.golf</p>
  </div>
</body></html>`;

/* ── desenhar ──────────────────────────────────────────────────────────── */
const b = await chromium.launch({ args: ['--no-sandbox'] });

async function desenhar(html, jpg, nome) {
  const p = await (await b.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 })).newPage();
  await p.setContent(html, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(400);

  /* O quadrado que o WhatsApp corta do meio vai dos 285 aos 915. Se um dia um
     texto crescer para fora dele — um nome de patrocínio, um número com mais um
     algarismo — a pré-visualização pequena volta a ficar cortada ao meio, e
     ninguém dá por isso a olhar para a imagem larga. Por isso mede-se. */
  const fora = await p.evaluate(() => [...document.querySelectorAll('.q p, .q span')]
    .map((e) => ({ t: e.textContent.trim().slice(0, 24), ...e.getBoundingClientRect().toJSON() }))
    .filter((c) => c.width && (c.left < 295 || c.right > 905))
    .map((c) => `${c.t} — ${Math.round(c.left)}…${Math.round(c.right)}`));
  if (fora.length) console.error(`${nome}: fora do quadrado seguro:\n  ${fora.join('\n  ')}`);

  const png = new URL(`img/og-tmp-${nome}.png`, RAIZ);
  await p.screenshot({ path: png.pathname });
  await p.close();

  /* JPEG e não WebP: o WhatsApp e alguns leitores de email ainda tropeçam em
     WebP nas pré-visualizações, e estas imagens só servem para ser
     pré-visualizadas. */
  const r = spawnSync('python3', ['-c', `
from PIL import Image
im = Image.open(${JSON.stringify(png.pathname)}).convert('RGB').resize((1200, 630), Image.LANCZOS)
im.save(${JSON.stringify(new URL(jpg, RAIZ).pathname)}, quality=88, optimize=True, progressive=True)
print(im.size)
`], { encoding: 'utf8' });
  spawnSync('rm', ['-f', png.pathname]);
  if (r.status !== 0) { console.error(r.stderr); process.exit(1); }

  /* O WhatsApp, o Facebook e o LinkedIn guardam a pré-visualização de um
     endereço durante semanas, e vão buscá-la pelo endereço da imagem. Trocar os
     bytes no mesmo ficheiro não chega: continuam a mostrar a antiga. Por isso a
     imagem leva atrás um `?v=` tirado do seu próprio conteúdo — muda quando a
     imagem muda, e fica igual quando se corre isto sem nada ter mudado. */
  const bytes = await readFile(new URL(jpg, RAIZ));
  const v = createHash('sha256').update(bytes).digest('hex').slice(0, 8);
  console.log(`${jpg}: ${r.stdout.trim()}, ${Math.round(bytes.length / 1024)} KB, v=${v}`);
  return v;
}

const v = await desenhar(cartaoPrincipal, 'img/og.jpg', 'principal');
const vSaco = await desenhar(cartaoSaco, 'img/og-witb.jpg', 'saco');
await b.close();

/* ── carimbar as páginas ───────────────────────────────────────────────── */
const paginas = [];
for (const dir of ['', 'en/']) {
  for (const f of await readdir(new URL(dir || './', RAIZ))) {
    if (f.endsWith('.html')) paginas.push(`${dir}${f}`);
  }
}

/* A ordem importa: `og-witb.jpg` primeiro. Ao contrário, a expressão do
   `og.jpg` mordia o princípio do outro nome e deixava lá `-witb.jpg` solto. */
const CARIMBOS = [
  [/\/img\/og-witb\.jpg(\?v=[a-f0-9]+)?/g, `/img/og-witb.jpg?v=${vSaco}`],
  [/\/img\/og\.jpg(\?v=[a-f0-9]+)?/g, `/img/og.jpg?v=${v}`],
];

let tocadas = 0;
for (const p of paginas) {
  const ficheiro = new URL(p, RAIZ);
  const antes = await readFile(ficheiro, 'utf8');
  const depois = CARIMBOS.reduce((t, [re, novo]) => t.replace(re, novo), antes);
  if (depois !== antes) { await writeFile(ficheiro, depois); tocadas += 1; }
}

await writeFile(new URL('data/og.json', RAIZ), `${JSON.stringify({ v, witb: vSaco }, null, 2)}\n`);

console.log(`${tocadas} página(s) actualizada(s).`);
