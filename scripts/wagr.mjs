/* Refresca o instantâneo em data/wagr.json.
 *
 *   node scripts/wagr.mjs
 *
 * O cartão do site lê primeiro /api/wagr, que vai ao WAGR na hora. Este
 * ficheiro só serve de recurso — quando o sítio corre sem funções, ou quando
 * o WAGR está em baixo. Convém refrescá-lo de vez em quando para o recurso
 * não ficar velho de meses.
 */

import { writeFile } from 'node:fs/promises';

const PLAYER_ID = 43158;
const API = 'https://worldgolfranking2021api.wagr.com/api/wagr/playerprofile/getPlayerById';
const DESTINO = new URL('../data/wagr.json', import.meta.url);

const r = await fetch(`${API}?profileId=${PLAYER_ID}`, { headers: { Accept: 'application/json' } });
if (!r.ok) {
  console.error(`WAGR respondeu ${r.status}. Ficheiro não tocado.`);
  process.exit(1);
}

const d = await r.json();
const s = d.playerStatisticsInfo || {};

const saida = {
  '_leia-me': 'Instantâneo da ficha da jogadora no World Amateur Golf Ranking. Serve de recurso quando /api/wagr não está disponível (alojamento estático, função em baixo). Para refrescar: node scripts/wagr.mjs',
  atualizado: new Date().toISOString().slice(0, 10),
  playerId: d.playerId,
  perfil: `https://www.wagr.com/playerprofile/${d.playerProfileLink || ''}`,
  nome: d.name,
  pais: d.countryName,
  posicao: d.position,
  mediaPontos: d.pointsAverage,
  divisor: d.divisor,
  melhorPosicao: s.bestRanking,
  vitorias: s.wins,
  top10: s.top10Finishes,
  provasContadas: s.countingEvents,
  imagem: d.imageUrl,
};

await writeFile(DESTINO, `${JSON.stringify(saida, null, 2)}\n`);
console.log(`data/wagr.json: ${saida.posicao}.º do mundo, média ${saida.mediaPontos} (${saida.atualizado})`);
