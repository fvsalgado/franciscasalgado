/* GET /api/fundme — o estado da angariação «Rumo à Florida»: o total, quantos
 * apoios, de onde vieram, o acumulado dia a dia e o mural.
 *
 * GET /api/fundme?sessao=cs_… — se um pagamento já entrou. É o que a página
 * pergunta quando alguém volta da Stripe: com cartão ou MB WAY entra logo;
 * com Multibanco só quando a referência for paga.
 *
 * Trinta segundos de cache na berma, e mais cinco minutos a servir enquanto
 * revalida: a Stripe não é chamada por cada visita, e um apoio novo aparece
 * em menos de um minuto.
 *
 * Sem STRIPE_SECRET_KEY responde na mesma, com o que está escrito à mão, e
 * `stripe: 'por_ligar'` — a página mostra os números e fecha o botão.
 */

import { SESSAO, dados, publico, resumo, sessoesPagas, stripe, stripeLigada } from './_comum.js';

export default async function handler(req, res) {
  const d = dados();
  if (!d) return res.status(500).json({ erro: 'dados' });

  const sessao = new URL(req.url, 'http://x').searchParams.get('sessao');
  if (sessao) {
    res.setHeader('Cache-Control', 'no-store');
    if (!SESSAO.test(sessao) || !stripeLigada()) return res.status(400).json({ erro: 'sessao' });
    try {
      const r = await stripe(`checkout/sessions/${sessao}`);
      if (!r?.ok) return res.status(404).json({ erro: 'sessao' });
      const s = await r.json();
      if (s.metadata?.kind !== 'fundme') return res.status(404).json({ erro: 'sessao' });
      return res.status(200).json({
        pago: s.payment_status === 'paid',
        concluida: s.status === 'complete',
        nome: s.metadata?.nome || null,
      });
    } catch (e) {
      console.error('fundme: sessão', e.message);
      return res.status(502).json({ erro: 'stripe' });
    }
  }

  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=300');
  let sessoes = [];
  let estado = stripeLigada() ? 'ligada' : 'por_ligar';
  if (estado === 'ligada') {
    try {
      sessoes = await sessoesPagas(d);
    } catch (e) {
      console.error('fundme: lista', e.message);
      estado = 'erro';
      // com a Stripe a falhar, não se serve um total que parece mais baixo
      // do que é: a berma guarda isto só uns segundos
      res.setHeader('Cache-Control', 's-maxage=5');
    }
  }

  return res.status(200).json({
    ...publico(d),
    ...resumo({ sessoes, d }),
    stripe: estado,
    aberto: Boolean(d.aberto) && estado !== 'por_ligar',
    atualizado: new Date().toISOString(),
  });
}
