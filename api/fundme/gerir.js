/* /api/fundme/gerir — o que quem apoia escreveu e juntou (o nome, a mensagem
 * e a fotografia), para a página /fundme/gerir. Só com a chave FUNDME_CHAVE
 * (variável na Vercel), em «Authorization: Bearer <chave>».
 *
 * Com `mural.aprovar: true` (como está), nada disto aparece na página nem no
 * ecrã do clube antes de alguém da família carregar em «Mostrar». Sem ele,
 * aparece logo, e aqui esconde-se o que não deve estar à vista. As
 * fotografias seguem `fotos.aprovar` da mesma maneira. O dinheiro não passa
 * por aqui: o total conta sempre.
 *
 * GET  → { apoios: [{ id, nome, mensagem, quando, foto, estado, fotoEstado }],
 *          porAprovar, soltas, aprovar }
 *        estado: 'pendente' (à espera) | 'aprovado' (na página) | 'escondido'.
 *        fotoEstado: null (não tem) | 'a_vista' | 'fora' (existe, mas não
 *        aparece) | 'apagada'. «soltas» são fotografias enviadas sem
 *        pagamento feito, com mais de dois dias.
 * POST { id, acao } → acao:
 *        'mostrar'           o nome, a mensagem e a fotografia aparecem;
 *        'mostrar_sem_foto'  aparecem o nome e a mensagem, a fotografia não;
 *        'esconder'          nada aparece (o apoio continua a contar);
 *        'recusar'           apaga a fotografia de vez;
 *        ou { acao: 'limpar' } (apaga as soltas).
 *        As decisões podem mudar-se: vale a última.
 */

import {
  PENDENTES, SESSAO, anfitriaoBlob, aprovarMural, blobApagar, blobCopiar, blobLigado, blobListar,
  caminhoAprovada, chaveCerta, comAprovacao, curto, dados, decisaoDe, demasiados, ficheirosDoMural, fotoAVista, fotoValida,
  guardarVisto, lerPedido, limpar, sessoesPagas, stripe, stripeLigada,
} from './_comum.js';

const DOIS_DIAS = 2 * 86400000;
const ACOES = ['mostrar', 'mostrar_sem_foto', 'esconder', 'recusar'];
// a página de antes de haver aprovação de nomes dizia assim
const ANTIGAS = { aprovar: 'mostrar', retirar: 'mostrar_sem_foto' };

function corpo(req) {
  const b = req.body;
  if (b && typeof b === 'object' && !Buffer.isBuffer(b)) return b;
  try { return JSON.parse(String(b || '{}')); } catch { return {}; }
}

/** Um apoio, como a página de gerir o mostra. */
export function cartao(s, d, ficheiros) {
  const f = s.metadata?.foto;
  const temFoto = fotoValida(f);
  const existe = temFoto && ficheiros.existentes.has(f);
  return {
    id: s.id,
    nome: limpar(s.metadata?.nome, 40) || null,
    mensagem: limpar(s.metadata?.mensagem, 140) || null,
    quando: s.created * 1000,
    // a que veio, para quem aprova a poder ver; nunca sai daqui para a página
    foto: existe ? f : null,
    estado: decisaoDe(s, d, ficheiros.vistos),
    fotoEstado: !temFoto ? null : !existe ? 'apagada' : fotoAVista(s, d, ficheiros) ? 'a_vista' : 'fora',
  };
}

export default async function handler(req, res) {
  lerPedido(req);
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
      const [sessoes, ficheiros] = await Promise.all([sessoesPagas(d), ficheirosDoMural()]);
      const usadas = new Set(sessoes.map((s) => s.metadata?.foto).filter(Boolean));
      const ordem = { pendente: 0, aprovado: 1, escondido: 2 };
      const apoios = sessoes
        .map((s) => cartao(s, d, ficheiros))
        // só os que têm alguma coisa para mostrar; os anónimos não passam por aqui
        .filter((c) => c.nome || c.mensagem || c.fotoEstado)
        // os que esperam primeiro; dentro de cada grupo, os mais recentes
        .sort((a, b) => ordem[a.estado] - ordem[b.estado] || b.quando - a.quando);
      const soltas = ficheiros.pendentes.filter((b) => !usadas.has(b.url) && Date.now() - Date.parse(b.uploadedAt) > DOIS_DIAS).length;
      return res.status(200).json({
        apoios,
        porAprovar: apoios.filter((c) => c.estado === 'pendente').length,
        soltas,
        aprovar: aprovarMural(d),
        aprovarFotos: comAprovacao(d),
      });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ erro: 'metodo' });
    }

    const pedido = corpo(req);
    const id = String(pedido.id || '');
    const acao = ANTIGAS[pedido.acao] ?? pedido.acao;

    if (acao === 'limpar') {
      const [sessoes, pendentes] = await Promise.all([sessoesPagas(d), blobListar(PENDENTES)]);
      const usadas = new Set(sessoes.map((s) => s.metadata?.foto).filter(Boolean));
      const soltas = pendentes.filter((b) => !usadas.has(b.url) && Date.now() - Date.parse(b.uploadedAt) > DOIS_DIAS).map((b) => b.url);
      await blobApagar(soltas);
      return res.status(200).json({ apagadas: soltas.length });
    }

    if (!SESSAO.test(id) || !ACOES.includes(acao)) return res.status(400).json({ erro: 'pedido' });
    const r = await stripe(`checkout/sessions/${id}`);
    if (!r?.ok) return res.status(404).json({ erro: 'sessao' });
    const s = await r.json();
    if (s.metadata?.kind !== 'fundme') return res.status(404).json({ erro: 'sessao' });

    const foto = fotoValida(s.metadata?.foto) ? s.metadata.foto : null;
    const aprovada = `https://${anfitriaoBlob()}/${caminhoAprovada(id)}`;

    if (acao === 'recusar') {
      if (!foto) return res.status(404).json({ erro: 'sessao' });
      await blobApagar([aprovada, foto]);
      return res.status(200).json({ ok: true, id: curto(id) });
    }

    if (acao === 'mostrar') {
      // primeiro a fotografia, depois a decisão: se a cópia falhar (a
      // fotografia foi apagada, ou o Blob não respondeu), o nome e a mensagem
      // entram na mesma e a fotografia fica de fora, à vista de quem aprova
      let comFoto = false;
      if (foto) {
        try {
          await blobCopiar(foto, caminhoAprovada(id));
          comFoto = true;
        } catch (e) {
          console.error('fundme/gerir: a fotografia não se copiou', e.message);
        }
      }
      await guardarVisto(id, foto && !comFoto ? 'semfoto' : 'sim');
      return res.status(200).json({ ok: true, id: curto(id), foto: comFoto });
    }

    // 'mostrar_sem_foto' e 'esconder': a decisão primeiro (é ela que tira de
    // vista), e só depois a cópia aprovada, que deixa de fazer falta
    await guardarVisto(id, acao === 'esconder' ? 'nao' : 'semfoto');
    if (foto) await blobApagar([aprovada]).catch((e) => console.error('fundme/gerir: a cópia aprovada não se apagou', e.message));
    return res.status(200).json({ ok: true, id: curto(id) });
  } catch (e) {
    console.error('fundme/gerir:', e.message);
    return res.status(502).json({ erro: 'servico' });
  }
}
