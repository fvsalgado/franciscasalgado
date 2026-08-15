/* Handicap na lista de federados da FPG, em direto.
 *
 * Do lado do servidor, como o WAGR e o EGR: a lista pede sessão, cookies e uma
 * volta por três endereços, e não manda cabeçalho de CORS nenhum — nada disso
 * se faz do browser. Doze horas de cache, mais uma semana a servir enquanto
 * revalida: um handicap mexe depois de uma volta contada, não de hora a hora.
 *
 * A falhar, responde 502 e o lado do browser cai em data/handicap.json.
 */

import { buscarHandicap } from './_handicap.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=604800');
  try {
    return res.status(200).json(await buscarHandicap());
  } catch (e) {
    return res.status(502).json({ erro: 'handicap indisponível', detalhe: String(e.message || e) });
  }
}
