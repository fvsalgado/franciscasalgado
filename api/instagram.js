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
// followers_count e follows_count só existem em contas Business/Creator
const PERFIL = 'username,name,media_count,followers_count,follows_count';

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
  const t = encodeURIComponent(token);
  const pedir = (u) => fetch(u, { signal: AbortSignal.timeout(8000) });

  try {
    // as publicações e a ficha do perfil vêm ao mesmo tempo; se a ficha
    // falhar — conta pessoal, sem followers_count — as publicações entram na
    // mesma, e o cartão fica sem contas em vez de ficar sem nada
    const [rm, rp] = await Promise.all([
      pedir(`https://graph.instagram.com/me/media?fields=${CAMPOS}&limit=12&access_token=${t}`),
      pedir(`https://graph.instagram.com/me?fields=${PERFIL}&access_token=${t}`),
    ]);
    if (!rm.ok) throw new Error(`HTTP ${rm.status}`);
    const d = await rm.json();
    const perfil = rp.ok ? await rp.json() : null;

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

    return res.status(200).json({
      atualizado: new Date().toISOString().slice(0, 10),
      perfil: perfil ? {
        arroba: perfil.username,
        nome: perfil.name,
        publicacoes: perfil.media_count ?? null,
        seguidores: perfil.followers_count ?? null,
        aSeguir: perfil.follows_count ?? null,
      } : null,
      publicacoes,
    });
  } catch (e) {
    return res.status(502).json({ erro: 'instagram indisponível', detalhe: String(e.message || e) });
  }
}
