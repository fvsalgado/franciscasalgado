/* POST /api/fundme/apoiar — abre o pagamento de um apoio na Stripe.
 *
 * Corpo, em JSON (a página com JavaScript) ou formulário (sem JavaScript):
 *   valor     20, 50, 100… ou 'outro', e então conta o campo `outro`
 *   nome      para o mural (opcional, até 40 caracteres)
 *   mensagem  para a Francisca (opcional, até 140)
 *   mural     '1' para aparecer no mural
 *   foto      o endereço que /api/fundme/foto devolveu (opcional)
 *   lingua    'pt' ou 'en'
 *   origem    de onde veio quem apoia (o QR do clube, o ecrã…), só para saber
 *
 * Com JSON responde { url }; com formulário manda o browser para a Stripe
 * (303). Os erros voltam à página com ?erro=<motivo>#apoiar.
 *
 * O que aqui se escreve vai nos metadados do pagamento — é de lá que o
 * /api/fundme tira o mural. Nada disto fica guardado noutro sítio.
 */

import { baseDe, dados, demasiados, fotoValida, limpar, lerPedido, stripe, stripeLigada } from './_comum.js';

const TXT = {
  pt: {
    produto: 'Rumo à Florida — Francisca Salgado',
    descricao: 'Apoio à viagem da Francisca ao Junior Orange Bowl, na Florida, em janeiro de 2027.',
    aoPagar: 'Obrigado por apoiar a Francisca. O recibo segue para o seu email.',
    extrato: 'Rumo à Florida · apoio',
  },
  en: {
    produto: 'Road to Florida — Francisca Salgado',
    descricao: "A gift towards Francisca's trip to the Junior Orange Bowl in Florida, January 2027.",
    aoPagar: 'Thank you for supporting Francisca. Your receipt will be emailed to you.',
    extrato: 'Road to Florida · gift',
  },
};

/** O corpo, venha como vier: a Vercel já o desfaz em objecto quando é JSON
 *  ou formulário; se chegar em texto, desfaz-se aqui. */
function corpo(req) {
  const b = req.body;
  if (b && typeof b === 'object') return b;
  const s = typeof b === 'string' ? b : '';
  if (s.trim().startsWith('{')) { try { return JSON.parse(s); } catch { return {}; } }
  return Object.fromEntries(new URLSearchParams(s));
}

export default async function handler(req, res) {
  lerPedido(req);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ erro: 'metodo' });
  }
  const c = corpo(req);
  const json = String(req.headers['content-type'] || '').includes('application/json');
  const lingua = c.lingua === 'en' ? 'en' : 'pt';
  const base = baseDe(req.headers['x-forwarded-host'] || req.headers.host, lingua);
  const falha = (estado, erro) => (json
    ? res.status(estado).json({ erro })
    : res.redirect(303, `${base}?erro=${erro}#apoiar`));

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'desconhecido';
  if (demasiados(ip)) return falha(429, 'demasiados');

  const d = dados();
  if (!d?.aberto) return falha(409, 'fechado');
  if (!stripeLigada()) return falha(503, 'pagamento');

  const bruto = c.valor === 'outro' ? c.outro : c.valor;
  const valor = Math.round(Number(String(bruto ?? '').replace(',', '.')));
  const minimo = Number(d.minimo) || 5;
  const maximo = Number(d.maximo) || 5000;
  if (!Number.isFinite(valor) || valor < minimo || valor > maximo) return falha(400, 'valor');

  const nome = limpar(c.nome, 40);
  const mensagem = limpar(c.mensagem, 140);
  const foto = fotoValida(c.foto) ? c.foto : '';
  const mural = (c.mural === '1' || c.mural === 'on' || c.mural === true) && Boolean(nome || mensagem || foto);
  const origem = /^[a-z0-9-]{1,20}$/.test(String(c.origem || '')) ? c.origem : '';
  const t = TXT[lingua];

  const meta = { kind: 'fundme', lingua, nome, mensagem, mural: mural ? '1' : '0', origem, foto };
  const params = {
    mode: 'payment',
    submit_type: 'donate',
    locale: lingua,
    line_items: {
      0: {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: valor * 100,
          product_data: { name: t.produto, description: t.descricao },
        },
      },
    },
    // sempre em euros: sem a conversão automática para a moeda de quem paga
    // (a Stripe cobra 4% a mais por ela, e um apoio é em euros)
    adaptive_pricing: { enabled: false },
    custom_text: { submit: { message: t.aoPagar } },
    metadata: meta,
    payment_intent_data: { description: `${t.extrato} · ${valor} €`, metadata: meta },
    success_url: `${base}?obrigado={CHECKOUT_SESSION_ID}#apoiar`,
    cancel_url: `${base}#apoiar`,
  };

  try {
    const r = await stripe('checkout/sessions', params);
    if (!r?.ok) {
      console.error('fundme/apoiar: a Stripe recusou', r?.status, (await r?.text().catch(() => ''))?.slice(0, 300));
      return falha(502, 'stripe');
    }
    const s = await r.json();
    return json ? res.status(200).json({ url: s.url }) : res.redirect(303, s.url);
  } catch (e) {
    console.error('fundme/apoiar:', e.message);
    return falha(503, 'indisponivel');
  }
}
