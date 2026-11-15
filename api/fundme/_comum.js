/* O que as duas funções da angariação «Rumo à Florida» partilham: os dados de
 * data/fundme.json, a conversa com a Stripe e as contas.
 *
 * A Stripe é o registo. Não há base de dados: o total, o gráfico e o mural
 * saem dos pagamentos que lá estão, mais o que se escreveu à mão em
 * data/fundme.json (o dinheiro dado no clube e o que chega pela Fundação do
 * Desporto). Assim não há duas contas que se possam desencontrar.
 *
 * As contas (resumo, diaDe, limpar) não falam com a rede, para se poderem
 * testar sozinhas.
 */

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
 * - mural: só quem pediu para aparecer, sem valores, o mais recente primeiro.
 */
export function resumo({ sessoes = [], d, agora = Date.now() }) {
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
    .filter((e) => e.mural && (e.nome || e.mensagem) && !ocultar.has(e.id))
    .sort((a, b) => b.quando - a.quando)
    .slice(0, 60)
    .map((e) => ({ nome: e.nome, mensagem: e.mensagem, dia: e.dia, origem: e.origem }));

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
