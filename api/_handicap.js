/* Leitor do handicap na lista de federados da FPG.
 *
 * A federação publica o handicap de cada federado numa lista de pesquisa, que
 * vive em scoring.fpg.pt e é embutida no portal. Para a Francisca:
 *
 *   n.º 43832 · Vale de Janelas (177) · HCP 0.3 · Válido
 *
 * É o número que um treinador universitário procura primeiro, e é o único
 * indicador de nível que muda sozinho ao longo da época — por isso vale a pena
 * ir buscá-lo em vez de o escrever à mão e deixá-lo envelhecer.
 *
 * Aviso honesto: este leitor nunca foi visto a funcionar. A caixa onde foi
 * escrito não chega ao scoring.fpg.pt (devolve 500 a tudo), e por isso a
 * primeira prova de vida vai ser a ronda diária no GitHub Actions, que corre de
 * uma ligação normal. Se falhar lá também, não parte nada: data/handicap.json
 * continua a servir o último valor confirmado à mão, com a data, e o vigia
 * avisa quando esse valor fizer mais de um mês.
 */

export const NUMERO = 43832;
export const LISTA = 'https://scoring.fpg.pt/lists/linkpage.aspx?page=searchfed&club=All&ack=8428ACK987';
export const FICHA = 'https://portal.fpg.pt/handicaps-course-rating/pesquisa-de-handicaps/';

const limpo = (s) => (s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/* A tabela dá uma linha por federado, e as células vêm sempre pela mesma
   ordem: n.º, nome, clube, HCP, estado, sexo. Procura-se pelo número, que não
   muda; o nome vem escrito à maneira deles e pode mudar de um dia para o
   outro. */
export function lerHandicap(html, numero = NUMERO) {
  for (const [, linha] of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cel = [...linha.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => limpo(c[1]));
    if (cel.length < 5 || cel[0] !== String(numero)) continue;
    const hcp = Number.parseFloat(String(cel[3]).replace(',', '.'));
    if (!Number.isFinite(hcp)) return null;
    return { numeroFederada: numero, nome: cel[1], clube: cel[2], handicap: hcp, estado: cel[4] };
  }
  return null;
}

export async function buscarHandicap(fetchImpl = fetch, numero = NUMERO) {
  const r = await fetchImpl(`${LISTA}&fed=${numero}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; franciscasalgado.golf)',
      Accept: 'text/html',
      Referer: FICHA,
    },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = lerHandicap(await r.text(), numero);
  if (!d) throw new Error('lista lida mas sem a linha dela — a FPG mudou de formato?');
  return { ...d, atualizado: new Date().toISOString().slice(0, 10), fonte: FICHA };
}
