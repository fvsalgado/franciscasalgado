/* O que as funções da angariação «Rumo à Florida» partilham: os dados de
 * data/fundme.json, a conversa com a Stripe e com o Vercel Blob (as
 * fotografias), e as contas.
 *
 * A Stripe é o registo. Não há base de dados: o total, o gráfico e o mural
 * saem dos pagamentos que lá estão, mais o que se escreveu à mão em
 * data/fundme.json (o dinheiro dado no clube e o que chega pela Fundação do
 * Desporto). Assim não há duas contas que se possam desencontrar.
 *
 * As contas (resumo, diaDe, limpar) não falam com a rede, para se poderem
 * testar sozinhas.
 */

import { createHash, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/* ── os dados ─────────────────────────────────────────────── */

/** data/fundme.json, ou null. Lido a cada pedido: é pequeno, e uma alteração
 *  publicada entra sem esperar por nada. */
export function dados() {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), 'data', 'fundme.json'), 'utf8'));
  } catch (e) {
    console.error('fundme: data/fundme.json', e.message);
    return null;
  }
}

/** A parte dos dados que a página precisa e pode ver. */
export function publico(d) {
  return {
    meta: d.meta,
    inicio: d.inicio,
    partida: d.partida,
    valores: d.valores,
    valorInicial: d.valorInicial,
    minimo: d.minimo,
    maximo: d.maximo,
    evento: d.evento ?? null,
    fotos: fotosAbertas(d),
    aprovar: aprovarMural(d),
  };
}

/* ── a Stripe ─────────────────────────────────────────────── */

export const stripeLigada = () => Boolean(process.env.STRIPE_SECRET_KEY);

/** Um id de sessão do Checkout, tal como a Stripe os escreve. */
export const SESSAO = /^cs_(live|test)_[A-Za-z0-9]{10,200}$/;

/** Os parâmetros da Stripe vão em formulário, com os objectos achatados:
 *  { a: { b: [1] } } → a[b][0]=1. Vazios e null ficam de fora. */
export function formulario(obj, prefixo = '', saida = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    const chave = prefixo ? `${prefixo}[${k}]` : k;
    if (typeof v === 'object') formulario(v, chave, saida);
    else saida.append(chave, String(v));
  }
  return saida;
}

/** GET (sem corpo) ou POST (com parâmetros) à API da Stripe; null sem chave. */
export async function stripe(caminho, params) {
  const chave = process.env.STRIPE_SECRET_KEY;
  if (!chave) return null;
  return fetch(`https://api.stripe.com/v1/${caminho}`, {
    method: params ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${chave}`,
      ...(params && { 'Content-Type': 'application/x-www-form-urlencoded' }),
    },
    body: params ? formulario(params) : undefined,
    signal: AbortSignal.timeout(10000),
  });
}

/* ── os modos de pagamento ─────────────────────────────────
 *
 * O cartão de apoio mostra com que se pode pagar, e tem de dizer a verdade.
 * O apoiar.js não escolhe modos nenhuns: o Checkout usa a configuração por
 * omissão da conta, a que se edita em dashboard.stripe.com/settings/payment_methods.
 * É essa que se lê aqui — ligar ou desligar um modo no painel muda a página
 * sozinho, em dez minutos no máximo.
 *
 * Só entram os que a página sabe desenhar, pela ordem que interessa a quem
 * paga em Portugal. Se a Stripe não responder (ou a chave não puder ler a
 * configuração), vale a lista `pagamentos` do data/fundme.json. */
export const METODOS = ['mb_way', 'multibanco', 'card', 'apple_pay', 'google_pay', 'paypal', 'revolut_pay'];
let metodosGuardados = null;

export async function metodosPagamento(d) {
  const reserva = { lista: (Array.isArray(d?.pagamentos) ? d.pagamentos : ['card']).filter((m) => METODOS.includes(m)), de: 'dados' };
  if (!stripeLigada()) return reserva;
  if (metodosGuardados && Date.now() - metodosGuardados.quando < 10 * 60000) return metodosGuardados.r;
  try {
    const r = await stripe('payment_method_configurations?limit=20');
    if (!r?.ok) throw new Error(`HTTP ${r?.status}`);
    const todas = (await r.json()).data || [];
    const cfg = todas.find((c) => c.is_default && c.active !== false) || todas.find((c) => c.active && !c.parent);
    if (!cfg) throw new Error('sem configuração por omissão');
    const lista = METODOS.filter((m) => cfg[m]?.available === true);
    if (!lista.length) throw new Error('nenhum modo que a página conheça');
    metodosGuardados = { quando: Date.now(), r: { lista, de: 'stripe' } };
    return metodosGuardados.r;
  } catch (e) {
    console.error('fundme: modos de pagamento', e.message);
    return reserva;
  }
}

/** As sessões do Checkout desta angariação, pagas. A conta pode ter outros
 *  pagamentos: só contam os que levam `metadata.kind = 'fundme'`. Vai à
 *  Stripe só desde a véspera do início, cem de cada vez. */
export async function sessoesPagas(d) {
  const desde = Math.floor(Date.parse(`${d.inicio}T00:00:00Z`) / 1000) - 86400;
  const todas = [];
  let depois = null;
  for (let pagina = 0; pagina < 30; pagina++) {
    const q = new URLSearchParams({ limit: '100', status: 'complete', 'created[gte]': String(desde) });
    if (depois) q.set('starting_after', depois);
    const r = await stripe(`checkout/sessions?${q}`);
    if (!r?.ok) throw new Error(`Stripe HTTP ${r?.status ?? 0}`);
    const j = await r.json();
    todas.push(...(j.data ?? []));
    if (!j.has_more || !j.data?.length) break;
    depois = j.data[j.data.length - 1].id;
  }
  return todas.filter((s) => s.metadata?.kind === 'fundme' && s.payment_status === 'paid');
}

/* ── as fotografias (Vercel Blob) ─────────────────────────── */

/* Quem apoia pode juntar uma fotografia. A página reduz-na e manda-a para
 * /api/fundme/foto, que a guarda no Vercel Blob em fundme/pendentes/, com um
 * nome que não se adivinha; o endereço segue nos metadados do pagamento.
 * Com `fotos.aprovar: true` (como está), só aparece depois de aprovada em
 * /fundme/gerir: aprovar copia-a para fundme/aprovadas/<id>.jpg, e é essa
 * lista que a página e o ecrã mostram. Sem ele, aparece logo com o apoio, e
 * apagá-la lá tira-a de vista. Fala-se com o Blob pela API
 * que o @vercel/blob usa, sem dependências, como com a Stripe. */

const BLOB = 'https://vercel.com/api/blob';
const BLOB_VERSAO = '13';

/* Duas maneiras de a loja estar ligada ao projeto, como no @vercel/blob:
 * - a antiga, com uma chave BLOB_READ_WRITE_TOKEN (vercel_blob_rw_<loja>_…);
 * - a de agora, sem chave: BLOB_STORE_ID diz qual é a loja, e a função
 *   identifica-se com o token OIDC que a Vercel junta a cada pedido
 *   (cabeçalho x-vercel-oidc-token) ou, à falta dele, VERCEL_OIDC_TOKEN. */
export const blobLigado = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

/** O id da loja: de dentro da chave antiga, ou de BLOB_STORE_ID sem o «store_». */
const loja = () => (process.env.BLOB_READ_WRITE_TOKEN
  ? String(process.env.BLOB_READ_WRITE_TOKEN).split('_')[3] ?? ''
  : String(process.env.BLOB_STORE_ID || '').replace(/^store_/, ''));

const CONTEXTO = Symbol.for('@vercel/request-context');
let oidcDoPedido = '';

/** Cada função chama isto com o pedido: guarda o token OIDC que a Vercel lá
 *  põe, para as conversas com o Blob que vêm a seguir. */
export function lerPedido(req) {
  const t = req?.headers?.['x-vercel-oidc-token'];
  if (t) oidcDoPedido = String(t);
}

/** Com que se fala com o Blob: a chave antiga, ou o token OIDC mais recente. */
function credencial() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  return globalThis[CONTEXTO]?.get?.()?.headers?.['x-vercel-oidc-token'] || oidcDoPedido || process.env.VERCEL_OIDC_TOKEN || '';
}

/** Onde ficam os ficheiros públicos desta loja. */
export const anfitriaoBlob = () => `${loja().toLowerCase()}.public.blob.vercel-storage.com`;

/** Aceitar fotografias: com o Blob ligado e sem `fotos.aceitar: false`. */
export const fotosAbertas = (d) => blobLigado() && d?.fotos?.aceitar !== false;

/** Mostrar só as aprovadas em /fundme/gerir, ou (o normal) todas as dos
 *  pagamentos feitos, enquanto não forem apagadas lá. */
export const comAprovacao = (d) => d?.fotos?.aprovar === true;

/* ── a aprovação dos nomes e das mensagens ─────────────────
 *
 * Com `mural.aprovar: true` em data/fundme.json, o nome e a mensagem de um
 * apoio só aparecem (na bandeira, nos postais, no ecrã e no /api/fundme)
 * depois de alguém da família os ver em /fundme/gerir. O dinheiro conta logo:
 * o total e o número de apoios não esperam por ninguém.
 *
 * A decisão fica no Blob, ao lado das fotografias, num ficheiro vazio de
 * interesse cujo NOME é a decisão: fundme/vistos/<curto(id)>/<decisão>.txt.
 * Guarda-se com a mesma chamada das fotografias (o Blob junta-lhe um sufixo
 * ao acaso), e a lista de fundme/ — que já se pedia por causa das
 * fotografias — traz as decisões de borla. Mudar de ideias é guardar outro:
 * vale o mais recente.
 *   sim      o nome, a mensagem e a fotografia aparecem
 *   semfoto  o nome e a mensagem aparecem, a fotografia não
 *   nao      nada aparece (o apoio continua a contar)
 */

/** Esperar por aprovação antes de mostrar nomes e mensagens. */
export const aprovarMural = (d) => d?.mural?.aprovar === true;

export const RAIZ = 'fundme/';
export const VISTOS = 'fundme/vistos/';
export const DECISOES = ['sim', 'semfoto', 'nao'];
export const caminhoVisto = (id, decisao) => `${VISTOS}${curto(id)}/${decisao}.txt`;

/** Guarda a decisão sobre um apoio. */
export const guardarVisto = (id, decisao) => blobGuardar(caminhoVisto(id, decisao), Buffer.from(decisao), 'text/plain');

/** Arruma a lista de fundme/ no que as contas precisam:
 *  - aprovadas: curto(id) → endereço da fotografia aprovada;
 *  - existentes: os endereços das fotografias que ainda estão em pendentes/;
 *  - vistos: curto(id) → a decisão mais recente sobre esse apoio;
 *  - pendentes: os ficheiros de pendentes/, tal como vieram. */
export function arrumar(ficheiros) {
  const aprovadas = new Map();
  const existentes = new Set();
  const vistos = new Map();
  const quandoVisto = new Map();
  const pendentes = [];
  for (const b of ficheiros ?? []) {
    const p = String(b?.pathname ?? '');
    if (p.startsWith(APROVADAS)) {
      const m = /\/([0-9a-f]{16})\.jpg$/.exec(p);
      // o ?v= muda quando se volta a aprovar, para não ficar a antiga em cache
      if (m) aprovadas.set(m[1], `${b.url}?v=${Date.parse(b.uploadedAt) || 0}`);
    } else if (p.startsWith(PENDENTES)) {
      existentes.add(b.url);
      pendentes.push(b);
    } else if (p.startsWith(VISTOS)) {
      // o sufixo ao acaso que o Blob junta ao nome vem depois da decisão
      const m = /^([0-9a-f]{16})\/(sim|semfoto|nao)(?![a-z])[^/]*$/.exec(p.slice(VISTOS.length));
      if (!m) continue;
      const quando = Date.parse(b.uploadedAt) || 0;
      if (!quandoVisto.has(m[1]) || quando >= quandoVisto.get(m[1])) {
        quandoVisto.set(m[1], quando);
        vistos.set(m[1], m[2]);
      }
    }
  }
  return { aprovadas, existentes, vistos, pendentes };
}

/* A última lista que chegou bem, por instância: se o Blob falhar a meio de um
 * dia de evento, servem-se as decisões de há pouco em vez de esconder tudo.
 * O preço: uma decisão tomada nesses minutos só se vê quando o Blob voltar. */
let ultimaLista = null;
const DEZ_MINUTOS = 10 * 60000;

/** A lista de fundme/, arrumada. Se o Blob falhar, a de há menos de dez
 *  minutos; sem ela, lança o erro (e quem chama esconde o que não sabe). */
export async function ficheirosDoMural(agora = Date.now()) {
  try {
    const r = arrumar(await blobListar(RAIZ));
    ultimaLista = { quando: agora, r };
    return r;
  } catch (e) {
    if (ultimaLista && agora - ultimaLista.quando < DEZ_MINUTOS) {
      console.error('fundme: lista do Blob (serve-se a de há pouco)', e.message);
      return ultimaLista.r;
    }
    throw e;
  }
}

/** O que está decidido sobre um apoio: 'aprovado', 'escondido' ou 'pendente'.
 *  `vistos` é o Map de arrumar(); null quer dizer que não se conseguiu ler.
 *  Um «nao» esconde sempre. Sem decisão: com aprovação, espera; sem ela,
 *  aparece. Sem se saber (null) e com aprovação, espera: não se mostra um
 *  nome sem se saber o que foi decidido sobre ele. */
export function decisaoDe(s, d, vistos) {
  const v = vistos?.get(curto(s.id));
  if (v === 'nao') return 'escondido';
  if (v === 'sim' || v === 'semfoto') return 'aprovado';
  return aprovarMural(d) ? 'pendente' : 'aprovado';
}

/** A fotografia de um apoio que pode aparecer, ou null. Só com o apoio
 *  aprovado e sem «semfoto»; depois, como sempre: com `fotos.aprovar`, a
 *  cópia aprovada; sem ele, a que veio, se ainda existir. */
export function fotoAVista(s, d, { aprovadas = new Map(), existentes = null, vistos = new Map() } = {}) {
  if (decisaoDe(s, d, vistos) !== 'aprovado') return null;
  if (vistos?.get(curto(s.id)) === 'semfoto') return null;
  if (comAprovacao(d)) return aprovadas.get(curto(s.id)) ?? null;
  const f = s.metadata?.foto;
  return fotoValida(f) && (!existentes || existentes.has(f)) ? f : null;
}

async function blob(caminho, init = {}) {
  const chave = credencial();
  if (!chave || !loja()) throw new Error('Blob por ligar');
  const r = await fetch(`${BLOB}${caminho}`, {
    ...init,
    headers: { authorization: `Bearer ${chave}`, 'x-api-version': BLOB_VERSAO, 'x-vercel-blob-store-id': loja(), ...init.headers },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`Blob HTTP ${r.status} ${(await r.text().catch(() => '')).slice(0, 200)}`);
  return r.json();
}

/** Guarda bytes num caminho; o Blob junta-lhe um sufixo ao acaso. */
export const blobGuardar = (caminho, bytes, tipo) => blob(`/?${new URLSearchParams({ pathname: caminho })}`, {
  method: 'PUT',
  body: bytes,
  headers: { 'x-vercel-blob-access': 'public', 'x-content-type': tipo, 'x-add-random-suffix': '1', 'x-cache-control-max-age': '31536000' },
});

/** Copia um ficheiro da loja para um caminho fixo (substitui se já houver). */
export const blobCopiar = (de, caminho) => blob(`/?${new URLSearchParams({ pathname: caminho, fromUrl: de })}`, {
  method: 'PUT',
  headers: { 'x-vercel-blob-access': 'public', 'x-add-random-suffix': '0', 'x-allow-overwrite': '1', 'x-content-type': 'image/jpeg', 'x-cache-control-max-age': '300' },
});

export const blobApagar = (urls) => (urls.length
  ? blob('/delete', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ urls }) })
  : Promise.resolve(null));

/** Os ficheiros com um prefixo, mil de cada vez. */
export async function blobListar(prefixo) {
  const todos = [];
  let cursor = null;
  for (let pagina = 0; pagina < 10; pagina++) {
    const q = new URLSearchParams({ prefix: prefixo, limit: '1000' });
    if (cursor) q.set('cursor', cursor);
    const j = await blob(`?${q}`, { method: 'GET' });
    todos.push(...(j.blobs ?? []));
    if (!j.hasMore || !j.cursor) break;
    cursor = j.cursor;
  }
  return todos;
}

/** Um nome curto e estável para um apoio, que não deixa ver o id da Stripe. */
export const curto = (id) => createHash('sha256').update(String(id)).digest('hex').slice(0, 16);

export const PENDENTES = 'fundme/pendentes/';
export const APROVADAS = 'fundme/aprovadas/';
export const caminhoAprovada = (id) => `${APROVADAS}${curto(id)}.jpg`;

/** Uma fotografia que veio desta loja, por /api/fundme/foto. Nada de outros
 *  endereços nos metadados. */
export function fotoValida(url) {
  if (!blobLigado() || typeof url !== 'string' || url.length > 400) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.host === anfitriaoBlob() && /^\/fundme\/pendentes\/[A-Za-z0-9._-]{1,120}$/.test(u.pathname) && !u.search;
  } catch {
    return false;
  }
}

/** A chave de /fundme/gerir, comparada sem dar pistas pelo tempo. */
export function chaveCerta(dada) {
  const certa = process.env.FUNDME_CHAVE;
  if (!certa || certa.length < 12 || !dada) return false;
  const a = createHash('sha256').update(String(dada)).digest();
  const b = createHash('sha256').update(certa).digest();
  return timingSafeEqual(a, b);
}

/* ── as contas ────────────────────────────────────────────── */

const LISBOA = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' });

/** O dia, em Lisboa, de um instante em milissegundos: 'AAAA-MM-DD'. */
export const diaDe = (ms) => LISBOA.format(new Date(ms));

/** Texto escrito por quem apoia: sem caracteres de controlo, espaços
 *  arrumados, cortado no tamanho. */
export function limpar(texto, max) {
  return String(texto ?? '')
    .replace(/[\u0000-\u001F\u007F\u200B-\u200F\u2028-\u202E\u2066-\u2069]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Os dias de `de` a `ate`, inclusive, como 'AAAA-MM-DD'. */
function dias(de, ate) {
  const lista = [];
  const fim = Date.parse(`${ate}T12:00:00Z`);
  for (let t = Date.parse(`${de}T12:00:00Z`); t <= fim && lista.length < 400; t += 86400000) {
    lista.push(new Date(t).toISOString().slice(0, 10));
  }
  return lista;
}

/**
 * O que a página mostra, feito das sessões pagas e dos registos à mão.
 * - total e apoios (cada pagamento ou registo conta um);
 * - porOrigem: online, clube, empresas (e o que mais se escrever à mão);
 * - serie: o total acumulado, dia a dia, do início até hoje;
 * - mural: só quem pediu para aparecer e já foi aprovado (ver decisaoDe),
 *   sem valores, o mais recente primeiro, com a fotografia quando a houver
 *   (ver fotoAVista). `aprovadas`, `existentes` e `vistos` vêm de arrumar();
 * - aEntrar: quantos apoios com nome estão à espera de aprovação (só o
 *   número: a página usa-o para não lhes chamar «sem nome»).
 */
export function resumo({ sessoes = [], d, agora = Date.now(), aprovadas = new Map(), existentes = null, vistos = new Map() }) {
  const excluir = new Set(d.excluir ?? []);
  const ocultar = new Set(d.ocultar ?? []);

  const entradas = [
    ...sessoes.filter((s) => !excluir.has(s.id)).map((s) => {
      // o que não está aprovado não leva nome, mensagem nem fotografia: daqui
      // para a frente não há como aparecerem
      const decisao = decisaoDe(s, d, vistos);
      const aVista = decisao === 'aprovado';
      const quer = s.metadata?.mural === '1';
      return {
        id: s.id,
        dia: diaDe(s.created * 1000),
        quando: s.created * 1000,
        valor: (s.amount_total ?? 0) / 100,
        origem: 'online',
        nome: aVista ? limpar(s.metadata?.nome, 40) || null : null,
        mensagem: aVista ? limpar(s.metadata?.mensagem, 140) || null : null,
        foto: aVista ? fotoAVista(s, d, { aprovadas, existentes, vistos }) : null,
        mural: quer,
        aEntrar: quer && decisao === 'pendente' && Boolean(limpar(s.metadata?.nome, 40)),
      };
    }),
    ...(d.manuais ?? []).filter((m) => Number(m.valor) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(m.data ?? '')).map((m, i) => ({
      id: m.id ?? `manual-${i}`,
      dia: m.data,
      quando: Date.parse(`${m.data}T12:00:00Z`),
      valor: Number(m.valor),
      origem: m.origem || 'clube',
      nome: limpar(m.nome, 60) || null,
      mensagem: m.mensagem ?? null, // à mão pode vir em {pt, en}
      foto: /^(\/img\/|https:\/\/)[^\s"'<>]{1,300}$/.test(m.foto ?? '') ? m.foto : null,
      mural: m.mural !== false && Boolean(m.nome),
    })),
  ];

  const total = Math.round(entradas.reduce((s, e) => s + e.valor, 0) * 100) / 100;
  const porOrigem = {};
  for (const e of entradas) porOrigem[e.origem] = Math.round(((porOrigem[e.origem] ?? 0) + e.valor) * 100) / 100;

  const porDia = new Map();
  for (const e of entradas) porDia.set(e.dia, (porDia.get(e.dia) ?? 0) + e.valor);
  const hoje = diaDe(agora);
  const primeiro = [d.inicio, ...porDia.keys()].sort()[0];
  let acc = 0;
  const serie = dias(primeiro, hoje < primeiro ? primeiro : hoje).map((dia) => {
    acc += porDia.get(dia) ?? 0;
    return { dia, total: Math.round(acc * 100) / 100, dia_valor: Math.round((porDia.get(dia) ?? 0) * 100) / 100 };
  });

  const mural = entradas
    .filter((e) => e.mural && (e.nome || e.mensagem || e.foto) && !ocultar.has(e.id))
    .sort((a, b) => b.quando - a.quando)
    .slice(0, 60)
    .map((e) => ({ id: curto(e.id), nome: e.nome, mensagem: e.mensagem, foto: e.foto, dia: e.dia, origem: e.origem }));

  return {
    total,
    apoios: entradas.length,
    porOrigem,
    serie,
    mural,
    aEntrar: entradas.filter((e) => e.aEntrar).length,
    hoje: Math.round((porDia.get(hoje) ?? 0) * 100) / 100,
  };
}

/** O endereço base da página, para a volta da Stripe. Só aceita os domínios
 *  do sítio; qualquer outro anfitrião volta ao domínio principal. */
export function baseDe(host, lingua) {
  const h = String(host || '').toLowerCase();
  const nosso = h === 'franciscasalgado.golf' || h.endsWith('.vercel.app') || /^localhost(:\d+)?$/.test(h);
  const raiz = nosso ? `${h.startsWith('localhost') ? 'http' : 'https'}://${h}` : 'https://franciscasalgado.golf';
  return `${raiz}${lingua === 'en' ? '/en' : ''}/fundme`;
}

/** Um travão em memória da instância: dez pedidos por hora por endereço. */
const visto = new Map();
export function demasiados(ip, maximo = 10) {
  const agora = Date.now();
  const lista = (visto.get(ip) || []).filter((t) => agora - t < 3600000);
  lista.push(agora);
  visto.set(ip, lista);
  if (visto.size > 5000) visto.clear();
  return lista.length > maximo;
}
