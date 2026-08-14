/* Traz para cá as capas dos vídeos do YouTube.
 *
 *   node scripts/capas.mjs
 *
 * O sítio promete que nada é carregado do YouTube antes de alguém carregar no
 * botão. Uma capa pedida a i.ytimg.com no momento em que a página abre quebra
 * essa promessa — é um pedido a um servidor da Google, com o endereço de quem
 * está a ler, por causa de um vídeo que talvez nunca seja visto.
 *
 * Por isso as capas são copiadas uma vez, guardadas em img/videos/, e servidas
 * daqui. A página mostra a imagem verdadeira do vídeo e continua a não falar
 * com o YouTube antes do clique.
 *
 * Corre à mão quando se acrescenta um vídeo. São quatro ficheiros; não vale a
 * pena pô-lo no vigia diário.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const RAIZ = new URL('../', import.meta.url);
const { videos = [] } = JSON.parse(await readFile(new URL('data/videos.json', RAIZ), 'utf8'));

await mkdir(new URL('img/videos/', RAIZ), { recursive: true });

/* maxresdefault é 1280×720 e nem sempre existe; hqdefault existe sempre, mas
   vem com barras pretas em cima e em baixo quando o vídeo não é 4:3. Tenta-se
   a boa primeiro. */
const TAMANHOS = ['maxresdefault', 'sddefault', 'hqdefault'];

for (const v of videos) {
  let bruto = null;
  let qual = null;
  for (const t of TAMANHOS) {
    const r = await fetch(`https://i.ytimg.com/vi/${v.id}/${t}.jpg`);
    if (!r.ok) continue;
    const b = Buffer.from(await r.arrayBuffer());
    // o YouTube devolve uma imagem cinzenta de 120×90 quando o tamanho não existe
    if (b.length < 6000) continue;
    bruto = b; qual = t; break;
  }
  if (!bruto) { console.error(`${v.id}: sem capa`); process.exitCode = 1; continue; }

  const jpg = new URL(`img/videos/${v.id}.jpg`, RAIZ);
  await writeFile(jpg, bruto);

  /* Converte para webp e corta as barras pretas do hqdefault. O Pillow já cá
     está por causa de outras coisas; não se acrescenta dependência nenhuma. */
  const py = `
import sys
from PIL import Image
im = Image.open(${JSON.stringify(jpg.pathname)}).convert('RGB')
l, a = im.size
# hqdefault: 480x360 com barras pretas — a imagem útil é a faixa 16:9 do meio
if (l, a) == (480, 360):
    h = int(l * 9 / 16)
    im = im.crop((0, (a - h) // 2, l, (a + h) // 2))
im.thumbnail((1280, 1280), Image.LANCZOS)
im.save(${JSON.stringify(jpg.pathname.replace(/\.jpg$/, '.webp'))}, 'WEBP', quality=82, method=6)
print(f'{im.size[0]}x{im.size[1]}')
`;
  const r = spawnSync('python3', ['-c', py], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(`${v.id}: falhou a conversão — ${r.stderr.trim()}`); process.exitCode = 1; continue; }
  spawnSync('rm', ['-f', jpg.pathname]);
  console.log(`img/videos/${v.id}.webp  ${r.stdout.trim()}  (de ${qual})`);
}
