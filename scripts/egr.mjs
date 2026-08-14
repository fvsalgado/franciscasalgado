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
d['_leia-me'] = 'Instantâneo da ficha no European Golf Rankings. Recurso para quando /api/egr não está disponível. Para refrescar: node scripts/egr.mjs';
await writeFile(new URL('../data/egr.json', import.meta.url), `${JSON.stringify(d, null, 2)}\n`);
console.log(`data/egr.json: ${d.posicao}.º da Europa, ${d.pontos} pontos, média ${d.mediaVolta} (${d.atualizado})`);
