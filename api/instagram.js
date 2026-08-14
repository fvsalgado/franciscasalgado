/* Publicações do Instagram.
 *
 * A conta ser pública não chega. O Instagram deixou de servir o conteúdo do
 * perfil a quem não tem sessão iniciada: a página devolve 600 KB de JavaScript
 * sem uma única publicação lá dentro, e a API pública de perfil responde
 * `require_login: true` a pedidos vindos de servidores. Não há truque — há
 * duas maneiras honestas de ter isto a funcionar:
 *
 * 1. **Com token** (o que esta função faz). A conta é dela, por isso pode
 *    emitir um token de longa duração na Graph API da Meta e guardá-lo na
 *    Vercel como variável de ambiente IG_TOKEN. A partir daí as publicações
 *    entram sozinhas e nunca mais é preciso mexer.
 * 2. **À mão**, pondo os códigos das publicações em data/instagram.json. É o
 *    caminho de recurso, e não precisa de token nenhum.
 *
 * Sem token, esta função responde 501 e o site cai no caminho 2 — em vez de
 * fingir que a coisa está ligada.
 */

const CAMPOS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';

export default async function handler(req, res) {
  const token = process.env.IG_TOKEN;
  if (!token) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(501).json({
      erro: 'sem token',
      comoLigar: 'Guarde um token de longa duração da Graph API da Meta em IG_TOKEN, nas variáveis de ambiente do projeto. Enquanto não houver, o site usa os códigos de data/instagram.json.',
    });
  }

  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
  try {
    const r = await fetch(
      `https://graph.instagram.com/me/media?fields=${CAMPOS}&limit=12&access_token=${encodeURIComponent(token)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();

    // só o que serve para desenhar um cartão, e nada do token de volta
    const publicacoes = (d.data || [])
      .filter((p) => p.permalink)
      .map((p) => ({
        id: p.id,
        url: p.permalink,
        imagem: p.media_type === 'VIDEO' ? p.thumbnail_url : p.media_url,
        legenda: (p.caption || '').split('\n')[0].slice(0, 180),
        tipo: p.media_type,
        quando: (p.timestamp || '').slice(0, 10),
      }));

    return res.status(200).json({ atualizado: new Date().toISOString().slice(0, 10), publicacoes });
  } catch (e) {
    return res.status(502).json({ erro: 'instagram indisponível', detalhe: String(e.message || e) });
  }
}
