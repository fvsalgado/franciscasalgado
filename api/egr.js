/* Ficha da jogadora no European Golf Rankings, em direto.
 *
 * Tal como o WAGR, tem de ser do lado do servidor: o EGR serve HTML e não
 * manda cabeçalho de CORS nenhum, por isso o navegador não lhe consegue
 * chegar a partir deste domínio. Aqui não há CORS, e a página tem 12 KB.
 *
 * Seis horas de cache, mais um dia a servir enquanto revalida — um ranking
 * europeu mexe uma vez por semana.
 */

import { buscarEgr } from './_egr.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
  try {
    return res.status(200).json(await buscarEgr());
  } catch (e) {
    return res.status(502).json({ erro: 'egr indisponível', detalhe: String(e.message || e) });
  }
}
