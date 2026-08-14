/* Refresca o instantâneo em data/egr.json.
 *
 *   node scripts/egr.mjs
 *
 * O cartão lê primeiro /api/egr, que vai à ficha na hora. Este ficheiro é o
 * recurso para quando não há funções ou o EGR está em baixo.
 */

import { writeFile } from 'node:fs/promises';
import { buscarEgr } from '../api/_egr.js';

const d = await buscarEgr();
await writeFile(new URL('../data/egr.json', import.meta.url), `${JSON.stringify(d, null, 2)}\n`);
console.log(`data/egr.json: ${d.posicaoEscalao
  ? `${d.posicaoEscalao}.ª em ${d.escalao} e ${d.posicao}.ª entre todas`
  : `${d.posicao}.ª entre todas`}, ${d.pontos} pontos, média ${d.mediaVolta} (${d.atualizado})`);
