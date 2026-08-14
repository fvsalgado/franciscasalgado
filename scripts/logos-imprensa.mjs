/* Traz para cá o símbolo de cada meio que escreveu sobre ela.
 *
 *   node scripts/logos-imprensa.mjs
 *
 * A tira do «Saiu em» era uma fila de nomes em texto. Com o símbolo de cada
 * casa ao lado do nome lê-se num relance quem já escreveu — que é a única
 * coisa que aquela tira serve para dizer.
 *
 * Os símbolos são copiados uma vez e servidos daqui, como as capas dos vídeos:
 * pedi-los ao servidor de cada jornal quando a página abre seria mandar o
 * endereço de quem lê para oito sítios diferentes de cada vez.
 *
 * Vai buscar o ícone que a própria casa declara no HTML — apple-touch-icon
 * primeiro, que é o maior, depois os <link rel=icon>, e o favicon.ico como
 * último recurso. Um meio que não declare nada fica sem símbolo e a tira
 * mostra-lhe só o nome; não se inventa um logótipo a ninguém.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const RAIZ = new URL('../', import.meta.url);
const UA = 'Mozilla/5.0 (compatible; franciscasalgado.golf)';

const imprensa = JSON.parse(await readFile(new URL('data/imprensa.json', RAIZ), 'utf8'));

/* Um meio por nome, com o endereço da primeira peça — é de lá que sai o
   domínio. A lista é derivada das peças, e não escrita à parte, para não haver
   um meio na tira que já não tenha peça nenhuma. */
const casas = new Map();
for (const p of imprensa.pecas || []) {
  if (!casas.has(p.o)) casas.set(p.o, { nome: p.o, exemplo: p.url });
}

const SEM_WWW = (h) => h.replace(/^www\./, '');
const abs = (u, base) => { try { return new URL(u, base).href; } catch { return null; } };

async function icone(sitio) {
  let html = '';
  try {
    const r = await fetch(sitio, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'follow' });
    if (r.ok) html = await r.text();
  } catch { /* segue para o favicon */ }

  const candidatos = [];
  for (const [, tag] of html.matchAll(/<link\b([^>]*\brel=["'][^"']*icon[^"']*["'][^>]*)>/gi)) {
    const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href) continue;
    const rel = /rel=["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase() || '';
    const tam = Number(/sizes=["'](\d+)/i.exec(tag)?.[1] || 0);
    // apple-touch-icon costuma ser 180×180 e sem transparência estranha
    const peso = (rel.includes('apple') ? 1000 : 0) + tam;
    candidatos.push({ url: abs(href, sitio), peso });
  }
  candidatos.push({ url: abs('/apple-touch-icon.png', sitio), peso: -1 });
  candidatos.push({ url: abs('/favicon.ico', sitio), peso: -2 });
  candidatos.sort((a, b) => b.peso - a.peso);

  for (const c of candidatos) {
    if (!c.url) continue;
    try {
      const r = await fetch(c.url, { headers: { 'User-Agent': UA } });
      if (!r.ok) continue;
      const b = Buffer.from(await r.arrayBuffer());
      if (b.length < 300) continue;
      return { bytes: b, url: c.url };
    } catch { /* tenta o seguinte */ }
  }
  return null;
}

await mkdir(new URL('img/imprensa/', RAIZ), { recursive: true });

const chave = (n) => n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const saiuEm = [];
for (const { nome, exemplo } of casas.values()) {
  const u = new URL(exemplo);
  const sitio = `${u.protocol}//${u.host}/`;
  const k = chave(nome);
  const achado = await icone(sitio);

  let logo = '';
  if (achado) {
    const tmp = new URL(`img/imprensa/${k}.orig`, RAIZ);
    await writeFile(tmp, achado.bytes);
    const py = `
from PIL import Image
im = Image.open(${JSON.stringify(tmp.pathname)})
if getattr(im, 'n_frames', 1) > 1: im.seek(im.n_frames - 1)   # .ico: a maior é a última
im = im.convert('RGBA')
im.thumbnail((160, 160), Image.LANCZOS)
fundo = Image.new('RGBA', im.size, (255, 255, 255, 0))
fundo.alpha_composite(im)
fundo.save(${JSON.stringify(new URL(`img/imprensa/${k}.webp`, RAIZ).pathname)}, 'WEBP', quality=88, method=6)
print(f'{im.size[0]}x{im.size[1]}')
`;
    const r = spawnSync('python3', ['-c', py], { encoding: 'utf8' });
    spawnSync('rm', ['-f', tmp.pathname]);
    if (r.status === 0) { logo = `${k}.webp`; console.log(`${nome.padEnd(24)} ${r.stdout.trim().padEnd(9)} ${achado.url}`); }
    else console.error(`${nome.padEnd(24)} falhou a conversão: ${r.stderr.trim().split('\n').pop()}`);
  } else {
    console.error(`${nome.padEnd(24)} sem ícone declarado — fica só o nome`);
  }

  saiuEm.push({ nome, logo, url: sitio, dominio: SEM_WWW(u.host) });
}

imprensa.saiuEm = saiuEm;
await writeFile(new URL('data/imprensa.json', RAIZ), `${JSON.stringify(imprensa, null, 2)}\n`);
console.log(`\ndata/imprensa.json: ${saiuEm.length} meios, ${saiuEm.filter((s) => s.logo).length} com símbolo.`);
