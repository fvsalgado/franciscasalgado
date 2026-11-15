/* /api/fundme/gerir — as fotografias à espera de aprovação, para a página
 * /fundme/gerir. Só com a chave FUNDME_CHAVE (variável na Vercel), em
 * «Authorization: Bearer <chave>».
 *
 * GET  → { fotos: [{ id, nome, mensagem, quando, foto, estado }], soltas }
 *        estado: 'pendente' | 'aprovada' | 'recusada'. «soltas» são
 *        fotografias enviadas sem pagamento feito, com mais de dois dias.
 * POST { id, acao } → acao: 'aprovar' (passa a aparecer), 'retirar' (deixa
 *        de aparecer, fica a pendente), 'recusar' (apaga-a), ou
 *        { acao: 'limpar' } (apaga as soltas).
 */

import {
  APROVADAS, PENDENTES, SESSAO, anfitriaoBlob, blobApagar, blobCopiar, blobLigado, blobListar,
  caminhoAprovada, chaveCerta, curto, dados, demasiados, fotoValida, limpar, sessoesPagas, stripe, stripeLigada,
} from './_comum.js';

const DOIS_DIAS = 2 * 86400000;

function corpo(req) {
  const b = req.body;
  if (b && typeof b === 'object' && !Buffer.isBuffer(b)) return b;
  try { return JSON.parse(String(b || '{}')); } catch { return {}; }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (!process.env.FUNDME_CHAVE) return res.status(503).json({ erro: 'chave_por_ligar' });
  if (!blobLigado()) return res.status(503).json({ erro: 'blob_por_ligar' });
  if (!stripeLigada()) return res.status(503).json({ erro: 'stripe_por_ligar' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'desconhecido';
  const dada = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!chaveCerta(dada)) {
    if (demasiados(`gerir:${ip}`, 20)) return res.status(429).json({ erro: 'demasiados' });
    return res.status(401).json({ erro: 'chave' });
  }

  const d = dados();
  if (!d) return res.status(500).json({ erro: 'dados' });

  try {
    if (req.method === 'GET') {
      const [sessoes, pendentes, aprovadas] = await Promise.all([sessoesPagas(d), blobListar(PENDENTES), blobListar(APROVADAS)]);
      const existe = new Set(pendentes.map((b) => b.url));
      const aprov = new Map(aprovadas.map((b) => [b.pathname, b.url]));
      const usadas = new Set();
      const fotos = sessoes
        .filter((s) => fotoValida(s.metadata?.foto))
        .map((s) => {
          usadas.add(s.metadata.foto);
          const aprovada = aprov.get(caminhoAprovada(s.id));
          return {
            id: s.id,
            nome: limpar(s.metadata?.nome, 40) || null,
            mensagem: limpar(s.metadata?.mensagem, 140) || null,
            quando: s.created * 1000,
            foto: s.metadata.foto,
            estado: aprovada ? 'aprovada' : existe.has(s.metadata.foto) ? 'pendente' : 'recusada',
          };
        })
        // as pendentes primeiro; dentro de cada grupo, as mais recentes
        .sort((a, b) => (b.estado === 'pendente') - (a.estado === 'pendente') || b.quando - a.quando);
      const soltas = pendentes.filter((b) => !usadas.has(b.url) && Date.now() - Date.parse(b.uploadedAt) > DOIS_DIAS).length;
      return res.status(200).json({ fotos, soltas, aprovar: d.fotos?.aprovar !== false });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ erro: 'metodo' });
    }

    const { id, acao } = corpo(req);

    if (acao === 'limpar') {
      const [sessoes, pendentes] = await Promise.all([sessoesPagas(d), blobListar(PENDENTES)]);
      const usadas = new Set(sessoes.map((s) => s.metadata?.foto).filter(Boolean));
      const soltas = pendentes.filter((b) => !usadas.has(b.url) && Date.now() - Date.parse(b.uploadedAt) > DOIS_DIAS).map((b) => b.url);
      await blobApagar(soltas);
      return res.status(200).json({ apagadas: soltas.length });
    }

    if (!SESSAO.test(String(id || '')) || !['aprovar', 'retirar', 'recusar'].includes(acao)) return res.status(400).json({ erro: 'pedido' });
    const r = await stripe(`checkout/sessions/${id}`);
    if (!r?.ok) return res.status(404).json({ erro: 'sessao' });
    const s = await r.json();
    if (s.metadata?.kind !== 'fundme' || !fotoValida(s.metadata?.foto)) return res.status(404).json({ erro: 'sessao' });

    const aprovada = `https://${anfitriaoBlob()}/${caminhoAprovada(id)}`;
    if (acao === 'aprovar') await blobCopiar(s.metadata.foto, caminhoAprovada(id));
    if (acao === 'retirar') await blobApagar([aprovada]);
    if (acao === 'recusar') await blobApagar([aprovada, s.metadata.foto]);
    return res.status(200).json({ ok: true, id: curto(id) });
  } catch (e) {
    console.error('fundme/gerir:', e.message);
    return res.status(502).json({ erro: 'servico' });
  }
}
