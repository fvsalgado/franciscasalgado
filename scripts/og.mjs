/* As imagens de partilha, 1200 × 630.
 *
 *   node scripts/og.mjs
 *
 * São quatro: img/og.jpg, para o sítio em geral; img/og-witb.jpg, para a
 * página do saco — que existe para ser partilhada e por isso merece um cartão
 * seu, com os tacos e não com o retrato; e img/og-fundme.jpg e
 * og-fundme-en.jpg, o cartaz do «Rumo à Florida», um em cada língua (o
 * traduzir.mjs troca-o no en/fundme.html).
 *
 *   node scripts/og.mjs fundme      # só as do /fundme (e principal, saco)
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
const fila = await Promise.all(['driver-hero', 'madeira-hero', 'hibrido-hero', 'ferros-hero', 'wedge-hero',
  'putter', 'bola-prov1-2025', 'luva'].map((n) => b64(`img/witb/${n}.webp`)));

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

/* ── o cartão do «Rumo à Florida» ──────────────────────────────────────────
 *
 * Para o /fundme, que é a página que mais se vai mandar por WhatsApp. Um
 * cartaz em três colunas: o apelo à esquerda, a Francisca com a taça num
 * polaroide ao meio (com o selo do Junior Orange Bowl preso ao canto) e o
 * canhoto do cartão de embarque à direita, com o botão e o endereço.
 *
 * O quadrado que o WhatsApp corta do meio (285…915) é o polaroide com o selo
 * e o «Rumo à Florida!» escrito à mão: em pequeno, continua a ser o convite
 * inteiro. As duas colunas dos lados são para a pré-visualização larga.
 *
 * Nada de totais: a imagem fica em cache semanas nas redes, e um número
 * congelado lia-se como o de hoje. */
const fm = {
  foto: await b64('img/fundme/francisca-campea-clube-4x5.webp'),
  campo: await b64('img/fundme/francisca-campea-clube.webp'),
  logo: await b64('img/fundme/junior-orange-bowl.webp'),
  caveat: await fonte('fonts/caveat.woff2'),
};
const FM_TXT = {
  pt: { rot: 'Rumo à Florida', t: 'Ajude a<br>Francisca<br><em>a chegar à<br>Florida.</em>', sub: 'Junior Orange Bowl<br>Coral Gables · janeiro 2027',
        mao: 'Rumo à Florida!', cima: 'Apoie a Francisca', baixo: 'Rumo à Florida · 2027',
        lis: 'Lisboa', mia: 'Miami', emb: 'Embarque', dia: '3 jan. 2027', meta: 'Meta', bt: 'Apoiar' },
  en: { rot: 'Road to Florida', t: 'Help<br>Francisca<br><em>get to<br>Florida.</em>', sub: 'Junior Orange Bowl<br>Coral Gables · January 2027',
        mao: 'Road to Florida!', cima: 'Support Francisca', baixo: 'Road to Florida · 2027',
        lis: 'Lisbon', mia: 'Miami', emb: 'Departs', dia: '3 Jan 2027', meta: 'Target', bt: 'Give' },
};
const metaFm = JSON.parse(await readFile(new URL('data/fundme.json', RAIZ), 'utf8')).meta || 5000;

const cartaoFundme = (l) => {
  const t = FM_TXT[l];
  const milhares = (n, sep) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  const metaTxt = l === 'en' ? `€${milhares(metaFm, ',')}` : `${milhares(metaFm, '.')} €`;
  return `<!doctype html><html lang="${l === 'en' ? 'en' : 'pt-PT'}"><head><meta charset="utf-8"><style>
@font-face{font-family:'Fraunces';font-weight:300 700;font-style:normal;src:url(data:font/woff2;base64,${dados.fraunces}) format('woff2')}
@font-face{font-family:'Manrope';font-weight:300 800;src:url(data:font/woff2;base64,${dados.manrope}) format('woff2')}
@font-face{font-family:'Caveat';font-weight:400 700;src:url(data:font/woff2;base64,${fm.caveat}) format('woff2')}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;background:#0F241A;color:#fff;font-family:'Manrope',sans-serif;position:relative}
/* a mesma fotografia, muito desfocada: o céu azul e as dunas verdes do dia da taça */
.fundo{position:absolute;inset:-60px;background:url(${fm.campo}) center 30%/cover;filter:blur(26px) saturate(1.3) brightness(.92)}
.v{position:absolute;inset:0;background:
  radial-gradient(42% 70% at 50% 40%,rgba(255,236,190,.22) 0%,rgba(255,236,190,0) 100%),
  linear-gradient(90deg,rgba(8,26,18,.9) 0%,rgba(8,26,18,.72) 22%,rgba(8,26,18,.12) 42%,rgba(8,26,18,.08) 60%,rgba(8,26,18,.5) 78%,rgba(8,26,18,.82) 100%),
  linear-gradient(180deg,rgba(8,26,18,0) 60%,rgba(8,26,18,.45) 100%)}
.risca{position:absolute;left:0;right:0;bottom:0;height:8px;background:linear-gradient(90deg,#1B6B47 0 50%,#E8711C 50% 100%)}

/* esquerda: o apelo */
.esq{position:absolute;left:56px;top:0;bottom:0;width:300px;display:flex;flex-direction:column;justify-content:center}
.rot{font-size:13px;font-weight:800;letter-spacing:.24em;text-transform:uppercase;color:#F59A4E}
.tit{font-family:'Fraunces',serif;font-weight:400;font-variation-settings:'opsz' 144;font-size:56px;line-height:.98;letter-spacing:-.03em;margin-top:16px;
     text-shadow:0 2px 30px rgba(0,0,0,.45)}
.tit em{font-style:italic;font-weight:300;color:#8FD9AE}
.sub{font-size:14px;line-height:1.5;font-weight:700;color:#CFE0D5;margin-top:22px;letter-spacing:.01em}

/* ao meio: o polaroide e o selo */
.pol{position:absolute;left:430px;top:46px;width:340px;padding:15px 15px 0;background:#FFFEF9;border-radius:3px;transform:rotate(-3.5deg);
     box-shadow:0 30px 60px -20px rgba(0,0,0,.7),0 8px 18px -8px rgba(0,0,0,.5)}
.pol img{display:block;width:310px;height:388px;object-fit:cover;object-position:50% 30%}
.q{display:block}
.mao{font-family:'Caveat',cursive;font-weight:700;font-size:40px;line-height:1;color:#1B3A2B;text-align:center;padding:12px 0 16px;transform:rotate(-1.5deg)}
.fita{position:absolute;left:50%;top:-14px;width:120px;height:30px;margin-left:-60px;background:rgba(232,113,28,.82);transform:rotate(2deg);
      box-shadow:0 2px 6px rgba(0,0,0,.2)}
.selo{position:absolute;left:712px;top:26px;width:160px;height:160px;transform:rotate(-10deg);filter:drop-shadow(0 12px 18px rgba(0,0,0,.45))}
.selo svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.selo .fundo-s{fill:#FFFEFA}.selo .risco{fill:none;stroke:#1B6B47;stroke-width:2.2}
.selo .trac{fill:none;stroke:#E8711C;stroke-width:1.8;stroke-dasharray:4.5 4;opacity:.75}
.selo text{font-family:'Manrope';font-weight:800;font-size:15px;letter-spacing:.13em;text-transform:uppercase;fill:#1B6B47}
.selo text.b{font-size:13px;letter-spacing:.12em;fill:#12281E}
.selo .est{fill:#E8711C}
.selo img{position:absolute;left:50%;top:50%;width:54%;transform:translate(-50%,-50%)}

/* direita: o canhoto do cartão de embarque */
.dir{position:absolute;right:38px;top:50%;width:238px;transform:translateY(-50%);background:#FFFEF9;color:#12281E;border-radius:18px;padding:22px 22px 20px;
     box-shadow:0 30px 60px -24px rgba(0,0,0,.7)}
.rota{display:flex;align-items:flex-end;justify-content:space-between}
.c{font-family:'Fraunces',serif;font-weight:400;font-variation-settings:'opsz' 144;font-size:46px;line-height:.9;letter-spacing:-.03em}
.c small{display:block;font:800 10px/1.3 'Manrope';letter-spacing:.16em;text-transform:uppercase;color:#5B6E62;margin-top:6px}
.c:last-child{text-align:right}
.av{width:30px;height:30px;color:#1B6B47;transform:rotate(90deg);margin-bottom:22px}
.linha{display:flex;justify-content:space-between;margin-top:16px;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#5B6E62}
.linha b{display:block;font-size:16px;letter-spacing:0;text-transform:none;color:#12281E;margin-top:3px}
.corte{border-top:2px dashed rgba(18,40,30,.2);margin:16px -4px}
.bt{display:flex;align-items:center;justify-content:center;gap:10px;background:#1B6B47;color:#fff;border-radius:12px;padding:12px 0;font-size:19px;font-weight:800}
.bt i{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#E8711C;font-style:normal;font-size:15px}
.dom{text-align:center;font-size:12.5px;font-weight:800;letter-spacing:.02em;color:#1B6B47;margin-top:11px}
</style></head><body>
  <div class="fundo"></div><div class="v"></div>

  <div class="esq">
    <p class="rot">${t.rot}</p>
    <p class="tit">${t.t}</p>
    <p class="sub">${t.sub}</p>
  </div>

  <div class="pol"><span class="fita"></span><img src="${fm.foto}" alt=""><p class="q mao">${t.mao}</p></div>
  <div class="selo">
    <svg viewBox="0 0 200 200"><defs><path id="c" d="M30 100a70 70 0 0 1 140 0"/><path id="b" d="M15 100a85 85 0 0 0 170 0"/></defs>
      <circle class="fundo-s" cx="100" cy="100" r="97"/><circle class="risco" cx="100" cy="100" r="91"/><circle class="trac" cx="100" cy="100" r="64"/>
      <text><textPath href="#c" startOffset="50%" text-anchor="middle">${t.cima}</textPath></text>
      <text class="b"><textPath href="#b" startOffset="50%" text-anchor="middle">${t.baixo}</textPath></text>
      <path class="est" d="M23 100l2.6-3 2.6 3-2.6 3zM171.8 100l2.6-3 2.6 3-2.6 3z"/></svg>
    <img src="${fm.logo}" alt="">
  </div>

  <div class="dir">
    <div class="rota">
      <div class="c">LIS<small>${t.lis}</small></div>
      <svg class="av" viewBox="0 0 24 24"><path fill="currentColor" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5Z"/></svg>
      <div class="c">MIA<small>${t.mia}</small></div>
    </div>
    <div class="linha"><span>${t.emb}<b>${t.dia}</b></span><span style="text-align:right">${t.meta}<b>${metaTxt}</b></span></div>
    <div class="corte"></div>
    <div class="bt">${t.bt} <i>→</i></div>
    <p class="dom">franciscasalgado.golf/fundme</p>
  </div>
  <div class="risca"></div>
</body></html>`;
};

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

/* `node scripts/og.mjs fundme` desenha só esse; os outros guardam a versão
   que tinham (redesenhar muda os bytes, e com eles o ?v=, e as redes voltavam
   a ir buscar uma imagem que não mudou). */
const SO = process.argv.slice(2);
const antes = JSON.parse(await readFile(new URL('data/og.json', RAIZ), 'utf8').catch(() => '{}'));
const quero = (n) => !SO.length || SO.includes(n);
const v = quero('principal') ? await desenhar(cartaoPrincipal, 'img/og.jpg', 'principal') : antes.v;
const vSaco = quero('saco') ? await desenhar(cartaoSaco, 'img/og-witb.jpg', 'saco') : antes.witb;
const vFm = quero('fundme') ? await desenhar(cartaoFundme('pt'), 'img/og-fundme.jpg', 'fundme') : antes.fundme;
const vFmEn = quero('fundme') ? await desenhar(cartaoFundme('en'), 'img/og-fundme-en.jpg', 'fundme-en') : antes.fundmeEn;
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
  [/\/img\/og-fundme-en\.jpg(\?v=[a-f0-9]+)?/g, `/img/og-fundme-en.jpg?v=${vFmEn}`],
  [/\/img\/og-fundme\.jpg(\?v=[a-f0-9]+)?/g, `/img/og-fundme.jpg?v=${vFm}`],
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

await writeFile(new URL('data/og.json', RAIZ), `${JSON.stringify({ v, witb: vSaco, fundme: vFm, fundmeEn: vFmEn }, null, 2)}\n`);

console.log(`${tocadas} página(s) actualizada(s).`);
