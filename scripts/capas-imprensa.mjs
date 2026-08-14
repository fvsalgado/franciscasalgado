/* Miniatura de cada peça de imprensa.
 *
 *   node scripts/capas-imprensa.mjs
 *
 * Vai a cada notícia, lê a imagem de abertura que a própria casa declara em
 * `og:image` — a mesma que aparece quando se partilha o endereço numa rede
 * social — e guarda uma miniatura em img/imprensa/pecas/.
 *
 * Guardada aqui e não pedida na hora: numa lista de quarenta peças seriam
 * quarenta pedidos a oito servidores diferentes de cada vez que a página
 * abre, cada um com o endereço de quem está a ler.
 *
 * Uma peça sem `og:image`, ou cuja imagem não se consiga ir buscar, fica sem
 * miniatura — e a linha mostra na mesma o símbolo da casa e o título.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const RAIZ = new URL('../', import.meta.url);
const UA = 'Mozilla/5.0 (compatible; franciscasalgado.golf)';
const DESTINO = 'img/imprensa/pecas/';

const imprensa = JSON.parse(await readFile(new URL('data/imprensa.json', RAIZ), 'utf8'));
await mkdir(new URL(DESTINO, RAIZ), { recursive: true });

/* Nome de ficheiro a partir do endereço: estável, e não depende da ordem da
   lista nem do título, que podem mudar. */
const chave = (url) => {
  const u = new URL(url);
  const fim = u.pathname.replace(/\/$/, '').split('/').pop() || u.hostname;
  return `${u.hostname.replace(/^www\./, '').split('.')[0]}-${fim}`
    .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
};

const meta = (html, prop) => {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i');
  return re.exec(html)?.[1] || re2.exec(html)?.[1] || null;
};

let feitas = 0;
let semImagem = 0;

for (const p of imprensa.pecas || []) {
  if (p.capa) { feitas += 1; continue; }          // já cá está

  let html = '';
  try {
    const r = await fetch(p.url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'follow' });
    if (r.ok) html = await r.text();
  } catch { /* segue */ }

  const src = meta(html, 'og:image') || meta(html, 'twitter:image');
  if (!src) { semImagem += 1; console.error(`sem og:image  ${p.url}`); continue; }

  let bruto;
  try {
    const abs = new URL(src, p.url).href;
    const r = await fetch(abs, { headers: { 'User-Agent': UA, Referer: p.url } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    bruto = Buffer.from(await r.arrayBuffer());
    if (bruto.length < 2000) throw new Error('imagem vazia');
  } catch (e) { semImagem += 1; console.error(`imagem falhou   ${p.url} — ${e.message}`); continue; }

  const k = chave(p.url);
  const tmp = new URL(`${DESTINO}${k}.orig`, RAIZ);
  await writeFile(tmp, bruto);

  /* Recorte 3:2 pelo meio e 320px de largura: é uma miniatura de lista, e não
     vale a pena servir a fotografia inteira do jornal para a mostrar a 72px. */
  const py = `
from PIL import Image
im = Image.open(${JSON.stringify(tmp.pathname)}).convert('RGB')
l, a = im.size
alvo = 3 / 2
if l / a > alvo:
    nl = int(a * alvo); im = im.crop(((l - nl) // 2, 0, (l + nl) // 2, a))
else:
    na = int(l / alvo); im = im.crop((0, (a - na) // 2, l, (a + na) // 2))
im = im.resize((320, 213), Image.LANCZOS)
im.save(${JSON.stringify(new URL(`${DESTINO}${k}.webp`, RAIZ).pathname)}, 'WEBP', quality=76, method=6)
`;
  const r = spawnSync('python3', ['-c', py], { encoding: 'utf8' });
  spawnSync('rm', ['-f', tmp.pathname]);
  if (r.status !== 0) { semImagem += 1; console.error(`conversão falhou ${p.url} — ${r.stderr.trim().split('\n').pop()}`); continue; }

  p.capa = `${k}.webp`;
  feitas += 1;
}

await writeFile(new URL('data/imprensa.json', RAIZ), `${JSON.stringify(imprensa, null, 2)}\n`);
console.log(`\n${feitas} peça(s) com miniatura, ${semImagem} sem.`);
