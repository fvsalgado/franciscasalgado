/* Leitor do handicap na lista de federados da FPG.
 *
 * A federação publica o handicap de cada federado numa lista de pesquisa, que
 * vive em scoring.fpg.pt e é embutida no portal. Para a Francisca:
 *
 *   n.º 43832 · Vale de Janelas · HCP 0.3 · Válido
 *
 * É o número que um treinador universitário procura primeiro, e é o único
 * indicador de nível que muda sozinho ao longo da época — por isso vale a pena
 * ir buscá-lo em vez de o escrever à mão e deixá-lo envelhecer.
 *
 * ── como se chega lá ─────────────────────────────────────────────────────
 * O endereço do iframe não serve lista nenhuma: abre uma sessão. Responde 302
 * para uma página de preparação, que é onde o `ack` fica guardado do lado
 * deles, e só depois se cai no formulário. E o formulário também não traz a
 * tabela — vem vazio, e a lista chega a seguir por AJAX, de um método jTable da
 * própria página.
 *
 * São três passos e não um, e todos são precisos:
 *
 *   1. GET  linkpage.aspx?…&ack=…   com cabeçalhos de navegação — sem eles
 *           responde 500 e nem chega a redirecionar. Devolve a ASP.NET_SessionId;
 *   2. seguir as redireções com essa sessão na mão, até ao Federatedsearch.aspx;
 *   3. POST Federatedsearch.aspx/HandicapsLST, com a sessão e com os mesmos
 *           campos que o botão «Procura» envia.
 *
 * Sem o cookie do primeiro passo, o terceiro responde 200 com
 * `{"Result":"ERROR"}` — e a página de erro que eles próprios tentam mostrar
 * também rebenta, o que torna a mensagem inútil. A sessão é o que falta, não os
 * parâmetros.
 *
 * Duas armadilhas que já custaram tempo: o `ClubCode` é o valor da lista de
 * clubes, onde «Todos …» é `0` — não é o `All` que aparece no endereço do
 * iframe; e o `fetch` do Node não guarda cookies, por isso a sessão anda aqui à
 * mão, de passo em passo.
 *
 * Se um dia isto deixar de responder não parte nada: o data/handicap.json
 * continua a servir o último valor confirmado, com a data, e o vigia põe o
 * assunto no VIGIA-ATENCAO.md quando esse valor fizer mais de um mês.
 */

export const NUMERO = 43832;
export const ENTRADA = 'https://scoring.fpg.pt/lists/linkpage.aspx?page=searchfed&club=All&ack=8428ACK987';
export const PAGINA = 'https://scoring.fpg.pt/lists/Federatedsearch.aspx';
export const METODO = `${PAGINA}/HandicapsLST`;
export const FICHA = 'https://portal.fpg.pt/handicaps-course-rating/pesquisa-de-handicaps/';

/* Um browser a abrir o iframe. Sem isto o primeiro pedido responde 500. */
const COMO_BROWSER = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    + ' (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
};

/* Os mesmos campos que o botão «Procura» manda, com os mesmos valores fixos —
   copiados do jtable('load') da página. Mexer num deles é mudar a pergunta. */
const pergunta = (numero) => ({
  name: '',
  fedno: String(numero),
  ClubCode: '0',
  FedStat: '9',
  Gender: '',
  Agelev: '-1',
  HcpStat: '-1',
  FHcp: '-99',
  THcp: '-99',
  ProAm: '0',
  IniFlag: '0',
  FAge: '0',
  TAge: '999',
  Permit: '',
  MaxResults: '5',
  MessMax: 'Demasiados resultados. Por favor refine a pesquisa introduzindo mais detalhes.',
  jtStartIndex: 0,
  jtPageSize: 5,
  jtSorting: 'name ASC',
});

/* Segue as redireções à mão, guardando os cookies pelo caminho. O fetch não
   tem frasco de cookies e o `redirect: 'follow'` perde-os entre saltos, que é
   precisamente onde a sessão nasce. */
async function abrirSessao(fetchImpl, limite = 6) {
  const frasco = new Map();
  let url = ENTRADA;

  for (let salto = 0; salto < limite; salto += 1) {
    const r = await fetchImpl(url, {
      redirect: 'manual',
      headers: {
        ...COMO_BROWSER,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Sec-Fetch-Dest': 'iframe',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        Referer: 'https://portal.fpg.pt/',
        ...(frasco.size ? { Cookie: [...frasco].map(([k, v]) => `${k}=${v}`).join('; ') } : {}),
      },
    });

    for (const posto of r.headers.getSetCookie?.() ?? []) {
      const [, k, v] = /^\s*([^=;]+)=([^;]*)/.exec(posto) || [];
      if (k) frasco.set(k, v);
    }

    const seguinte = r.status >= 300 && r.status < 400 && r.headers.get('location');
    if (!seguinte) {
      if (!r.ok) throw new Error(`HTTP ${r.status} ao abrir a sessão`);
      break;
    }
    url = new URL(seguinte, url).toString();
  }

  if (!frasco.size) throw new Error('a FPG não abriu sessão — mudou a entrada?');
  return [...frasco].map(([k, v]) => `${k}=${v}`).join('; ');
}

/* A resposta vem embrulhada duas vezes: o ASP.NET põe tudo dentro de `d`, e o
   jTable põe os registos dentro de `Records`. */
export function lerHandicap(corpo, numero = NUMERO) {
  const d = typeof corpo === 'string' ? JSON.parse(corpo) : corpo;
  const dentro = d?.d ?? d;
  if (dentro?.Result && dentro.Result !== 'OK') {
    throw new Error(`a FPG recusou a pesquisa — ${dentro.Message || dentro.Result}`);
  }
  const registos = dentro?.Records || [];
  const l = registos.find((x) => String(x.federation_code) === String(numero)) || registos[0];
  if (!l) return null;
  const hcp = Number.parseFloat(String(l.hcp_exact).replace(',', '.'));
  if (!Number.isFinite(hcp)) return null;
  return {
    numeroFederada: Number(l.federation_code) || numero,
    nome: l.name,
    clube: l.acronym || l.club_name,
    handicap: hcp,
    estado: l.hcp_status,
  };
}

export async function buscarHandicap(fetchImpl = fetch, numero = NUMERO) {
  const cookie = await abrirSessao(fetchImpl);

  const r = await fetchImpl(METODO, {
    method: 'POST',
    headers: {
      ...COMO_BROWSER,
      'Content-Type': 'application/json; charset=UTF-8',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      Origin: 'https://scoring.fpg.pt',
      Referer: PAGINA,
      Cookie: cookie,
    },
    body: JSON.stringify(pergunta(numero)),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);

  const texto = await r.text();
  let d;
  try { d = lerHandicap(texto, numero); }
  catch (e) {
    if (e instanceof SyntaxError) throw new Error(`resposta que não é JSON — ${texto.slice(0, 80)}`);
    throw e;
  }
  if (!d) throw new Error('lista lida mas sem a linha dela — a FPG mudou de formato?');
  return { ...d, atualizado: new Date().toISOString().slice(0, 10), fonte: FICHA };
}
