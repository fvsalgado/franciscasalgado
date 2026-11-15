/* POST /api/fundme/foto — guarda a fotografia de quem apoia, antes de pagar.
 *
 * A página reduz a fotografia no próprio telemóvel (no máximo 1600 px, em
 * JPEG, o que também tira a localização e o resto dos dados da câmara) e
 * manda os bytes aqui, como application/octet-stream. Guarda-se no Vercel
 * Blob em fundme/pendentes/, com um nome ao acaso, e devolve-se { foto } —
 * o endereço segue com o apoio para a Stripe.
 *
 * Uma fotografia sem pagamento não aparece em lado nenhum; com pagamento,
 * só depois de aprovada em /fundme/gerir (a não ser que `fotos.aprovar`
 * esteja a false em data/fundme.json).
 */

import { PENDENTES, blobGuardar, dados, demasiados, fotosAbertas } from './_comum.js';

const MAXIMO = 3 * 1024 * 1024;

/** Os bytes do pedido: a Vercel dá-os em req.body quando o tipo é
 *  application/octet-stream; senão, lê-se a corrente. */
async function bytes(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  const partes = [];
  let n = 0;
  for await (const p of req) {
    n += p.length;
    if (n > MAXIMO) throw Object.assign(new Error('grande'), { estado: 413 });
    partes.push(p);
  }
  return Buffer.concat(partes);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ erro: 'metodo' });
  }
  const d = dados();
  if (!d?.aberto || !fotosAbertas(d)) return res.status(503).json({ erro: 'fotos' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'desconhecido';
  if (demasiados(`foto:${ip}`, 12)) return res.status(429).json({ erro: 'demasiados' });

  let b;
  try {
    b = await bytes(req);
  } catch (e) {
    return res.status(e.estado || 400).json({ erro: e.message === 'grande' ? 'grande' : 'corpo' });
  }
  if (b.length > MAXIMO) return res.status(413).json({ erro: 'grande' });
  // só JPEG: é o que a página manda depois de reduzir
  if (b.length < 1000 || b[0] !== 0xff || b[1] !== 0xd8 || b[2] !== 0xff) return res.status(415).json({ erro: 'tipo' });

  try {
    const r = await blobGuardar(`${PENDENTES}foto.jpg`, b, 'image/jpeg');
    return res.status(200).json({ foto: r.url });
  } catch (e) {
    console.error('fundme/foto:', e.message);
    return res.status(502).json({ erro: 'guardar' });
  }
}
