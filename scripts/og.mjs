/* A imagem de partilha — img/og.jpg, 1200 × 630.
 *
 *   node scripts/og.mjs
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

import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const RAIZ = new URL('../', import.meta.url);
const perfil = JSON.parse(await readFile(new URL('data/perfil.json', RAIZ), 'utf8'));

const num = (r) => perfil.numeros?.find((n) => n.r?.pt === r)?.v || '';
const b64 = async (p) => `data:image/webp;base64,${(await readFile(new URL(p, RAIZ))).toString('base64')}`;
const fonte = async (p) => (await readFile(new URL(p, RAIZ))).toString('base64');

const dados = {
  foto: await b64('img/swing.webp'),
  fraunces: await fonte('fonts/fraunces.woff2'),
  manrope: await fonte('fonts/manrope.woff2'),
  titulos: num('Títulos nacionais'),
  vitorias: num('Vitórias'),
  desde: num('Desde'),
};

const html = `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><style>
@font-face{font-family:'Fraunces';font-weight:300 700;src:url(data:font/woff2;base64,${dados.fraunces}) format('woff2')}
@font-face{font-family:'Manrope';font-weight:300 800;src:url(data:font/woff2;base64,${dados.manrope}) format('woff2')}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;background:#0B1512;color:#fff;
     font-family:'Manrope',sans-serif;position:relative}
.f{position:absolute;inset:0}
.f img{width:100%;height:100%;object-fit:cover;object-position:64% 32%}
/* Escurece da esquerda para a direita: o texto vive à esquerda e a jogadora
   fica visível à direita, como na página. */
.v{position:absolute;inset:0;background:
  linear-gradient(90deg,rgba(6,14,11,.94) 0%,rgba(6,14,11,.88) 34%,rgba(6,14,11,.42) 66%,rgba(6,14,11,.22) 100%)}
.q{position:absolute;inset:0;padding:62px 74px;display:flex;flex-direction:column;justify-content:space-between;width:760px}
.rot{font-size:17px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:#8FD9AE;
     display:flex;align-items:center;gap:18px;white-space:nowrap}
.rot::before{content:"";width:54px;height:2px;background:#8FD9AE}
.nome{font-family:'Fraunces',serif;font-weight:400;font-variation-settings:'opsz' 144;
      font-size:104px;line-height:.9;letter-spacing:-.045em}
.sub{font-family:'Fraunces',serif;font-weight:300;font-style:italic;font-variation-settings:'opsz' 40;
     font-size:27px;line-height:1.32;color:#D8E6DC;max-width:24ch;margin-top:20px}
.pe{display:flex;align-items:flex-end;justify-content:space-between;gap:28px}
.dom{font-size:20px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;white-space:nowrap}
.ns{display:flex;gap:34px}
.n{display:flex;flex-direction:column;gap:2px}
.n b{font-family:'Fraunces',serif;font-weight:400;font-variation-settings:'opsz' 48;
     font-size:40px;line-height:1;color:#8FD9AE}
.n i{font-style:normal;font-size:12px;font-weight:800;letter-spacing:.16em;
     text-transform:uppercase;color:#B9CFC2;white-space:nowrap}
</style></head><body>
  <div class="f"><img src="${dados.foto}" alt=""></div>
  <div class="v"></div>
  <div class="q">
    <p class="rot">Golfista amadora · Seleção Nacional</p>
    <div>
      <p class="nome">Francisca<br>Salgado</p>
      <p class="sub">Campeã nacional Sub-18. Do Vale de Janelas para os campos da Europa.</p>
    </div>
    <div class="pe">
      <span class="dom">franciscasalgado.golf</span>
      <div class="ns">
        <span class="n"><b>${dados.titulos}</b><i>Títulos nacionais</i></span>
        <span class="n"><b>${dados.vitorias}</b><i>Vitórias</i></span>
        <span class="n"><b>${dados.desde}</b><i>Desde</i></span>
      </div>
    </div>
  </div>
</body></html>`;

const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 })).newPage();
await p.setContent(html, { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(400);
const png = new URL('img/og-tmp.png', RAIZ);
await p.screenshot({ path: png.pathname });
await b.close();

/* JPEG e não WebP: o WhatsApp e alguns leitores de email ainda tropeçam em
   WebP nas pré-visualizações, e esta imagem só serve para ser pré-visualizada. */
const r = spawnSync('python3', ['-c', `
from PIL import Image
im = Image.open(${JSON.stringify(png.pathname)}).convert('RGB').resize((1200, 630), Image.LANCZOS)
im.save(${JSON.stringify(new URL('img/og.jpg', RAIZ).pathname)}, quality=88, optimize=True, progressive=True)
print(im.size)
`], { encoding: 'utf8' });
spawnSync('rm', ['-f', png.pathname]);
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }

const { size } = await import('node:fs').then((fs) => fs.promises.stat(new URL('img/og.jpg', RAIZ)));
console.log(`img/og.jpg: ${r.stdout.trim()}, ${Math.round(size / 1024)} KB`);
