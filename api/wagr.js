/* Ficha da jogadora no World Amateur Golf Ranking, em direto.
 *
 * Porque é que isto tem de ser uma função e não uma chamada do navegador: a
 * API do WAGR responde com `access-control-allow-origin: https://www.wagr.com`
 * e mais nenhum. Do lado do servidor não há CORS nenhum, por isso é aqui que
 * a chamada se faz. Não há chave nem segredo — é o mesmo pedido público que o
 * sítio deles faz a si próprio.
 *
 * Devolve só os campos que o cartão mostra. A resposta fica em cache na berma
 * durante seis horas, com mais um dia a servir enquanto revalida: uma
 * classificação mundial mexe uma vez por semana, e assim uma indisponibilidade
 * do lado do WAGR não se vê no site.
 */

const PLAYER_ID = 43158;
const API = 'https://worldgolfranking2021api.wagr.com/api/wagr/playerprofile/getPlayerById';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');

  try {
    const r = await fetch(`${API}?profileId=${PLAYER_ID}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    const s = d.playerStatisticsInfo || {};

    return res.status(200).json({
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
    });
  } catch (e) {
    /* 502 e não um corpo inventado: quem chama sabe distinguir isto de dados
       bons e cai no instantâneo de data/wagr.json. */
    return res.status(502).json({ erro: 'wagr indisponível', detalhe: String(e.message || e) });
  }
}
