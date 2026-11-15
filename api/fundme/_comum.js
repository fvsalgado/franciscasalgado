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
    etapas: d.etapas ?? [],
    evento: d.evento ?? null,
    fotos: fotosAbertas(d),
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
 * Sem `fotos.aprovar` (como está), aparece logo com o apoio, e apagá-la em
 * /fundme/gerir tira-a de vista. Com `fotos.aprovar: true`, só aparece
 * depois de aprovada lá: aprovar copia-a para fundme/aprovadas/<id>.jpg, e
 * é essa lista que a página e o ecrã mostram. Fala-se com o Blob pela API
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
 * - mural: só quem pediu para aparecer, sem valores, o mais recente primeiro,
 *   com a fotografia quando a houver (aprovada, se `fotos.aprovar`);
 *   `aprovadas` é o Map curto(id) → endereço que o index.js lê do Blob, e
 *   `existentes` o Set das fotografias que ainda lá estão (sem aprovação).
 */
export function resumo({ sessoes = [], d, agora = Date.now(), aprovadas = new Map(), existentes = null }) {
  const aprovar = comAprovacao(d);
  /* a fotografia de um pagamento: com aprovação, a aprovada; sem ela, a que
     veio, se ainda existir (apagada em /fundme/gerir, deixa de aparecer) */
  const fotoDe = (s) => {
    if (aprovar) return aprovadas.get(curto(s.id)) ?? null;
    const f = s.metadata?.foto;
    return fotoValida(f) && (!existentes || existentes.has(f)) ? f : null;
  };
  const excluir = new Set(d.excluir ?? []);
  const ocultar = new Set(d.ocultar ?? []);

  const entradas = [
    ...sessoes.filter((s) => !excluir.has(s.id)).map((s) => ({
      id: s.id,
      dia: diaDe(s.created * 1000),
      quando: s.created * 1000,
      valor: (s.amount_total ?? 0) / 100,
      origem: 'online',
      nome: limpar(s.metadata?.nome, 40) || null,
      mensagem: limpar(s.metadata?.mensagem, 140) || null,
      foto: fotoDe(s),
      mural: s.metadata?.mural === '1',
    })),
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
