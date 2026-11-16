/* Os testes da angariação «Rumo à Florida»: a aprovação dos nomes, das
 * mensagens e das fotografias antes de aparecerem.
 *
 *   node --test scripts/fundme.test.mjs
 *
 * Não falam com a Stripe nem com o Blob: a rede é a fingir (um `fetch` de
 * brincar), e as chaves são palavras quaisquer. Nenhum nome verdadeiro.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

process.env.STRIPE_SECRET_KEY = 'chave-a-fingir';
process.env.FUNDME_CHAVE = 'uma-frase-comprida-a-fingir';
process.env.BLOB_STORE_ID = 'store_lojaafingir';
process.env.VERCEL_OIDC_TOKEN = 'credencial-a-fingir';

const comum = await import('../api/fundme/_comum.js');
const { default: publico } = await import('../api/fundme/index.js');
const { default: gerir } = await import('../api/fundme/gerir.js');
const { arrumar, curto, decisaoDe, fotoAVista, resumo, caminhoAprovada, caminhoVisto } = comum;

const ANFITRIAO = 'lojaafingir.public.blob.vercel-storage.com';
const fotoDe = (n) => `https://${ANFITRIAO}/fundme/pendentes/foto-${n}.jpg`;
const sessao = (n, extra = {}) => ({
  id: `cs_test_${String(n).padStart(12, 'a')}`,
  created: 1794700000 + n * 60,
  amount_total: 2500,
  payment_status: 'paid',
  status: 'complete',
  metadata: { kind: 'fundme', nome: `Apoiante ${n}`, mensagem: `Mensagem ${n}`, mural: '1', foto: '', ...extra },
});
const COM = { inicio: '2026-11-16', meta: 5000, fotos: { aceitar: true, aprovar: true }, mural: { aprovar: true }, manuais: [], excluir: [], ocultar: [] };
const SEM = { ...COM, fotos: { aceitar: true, aprovar: false }, mural: { aprovar: false } };
const visto = (s, decisao, quando = '2026-11-20T10:00:00.000Z') => ({
  pathname: caminhoVisto(s.id, decisao).replace('.txt', '-AbC123.txt'),
  url: `https://${ANFITRIAO}/${caminhoVisto(s.id, decisao).replace('.txt', '-AbC123.txt')}`,
  uploadedAt: quando,
});
const pendente = (url, quando = '2026-11-20T09:00:00.000Z') => ({ pathname: new URL(url).pathname.slice(1), url, uploadedAt: quando });
const aprovada = (s) => ({ pathname: caminhoAprovada(s.id), url: `https://${ANFITRIAO}/${caminhoAprovada(s.id)}`, uploadedAt: '2026-11-20T10:00:00.000Z' });

/* ── as contas, sem rede ───────────────────────────────────── */

test('com aprovação, um apoio por ver conta no total e não mostra o nome nem a mensagem', () => {
  const r = resumo({ sessoes: [sessao(1)], d: COM, vistos: new Map() });
  assert.equal(r.total, 25);
  assert.equal(r.apoios, 1);
  assert.deepEqual(r.mural, []);
  assert.equal(r.aEntrar, 1);
  assert.doesNotMatch(JSON.stringify(r), /Apoiante|Mensagem/);
});

test('depois de aprovado, aparece; escondido, deixa de aparecer; o total não muda', () => {
  const s = sessao(1);
  const sim = resumo({ sessoes: [s], d: COM, ...arrumar([visto(s, 'sim')]) });
  assert.equal(sim.mural.length, 1);
  assert.equal(sim.mural[0].nome, 'Apoiante 1');
  assert.equal(sim.mural[0].mensagem, 'Mensagem 1');
  assert.equal(sim.aEntrar, 0);
  const nao = resumo({ sessoes: [s], d: COM, ...arrumar([visto(s, 'sim'), visto(s, 'nao', '2026-11-20T11:00:00.000Z')]) });
  assert.deepEqual(nao.mural, []);
  assert.equal(nao.aEntrar, 0);
  assert.equal(nao.total, 25);
});

test('vale a decisão mais recente, venha a lista pela ordem que vier', () => {
  const s = sessao(1);
  const antes = visto(s, 'nao', '2026-11-20T10:00:00.000Z');
  const depois = visto(s, 'sim', '2026-11-20T10:05:00.000Z');
  assert.equal(arrumar([antes, depois]).vistos.get(curto(s.id)), 'sim');
  assert.equal(arrumar([depois, antes]).vistos.get(curto(s.id)), 'sim');
});

test('sem se conseguir ler as decisões, com aprovação não aparece nome nenhum', () => {
  const s = sessao(1);
  assert.equal(decisaoDe(s, COM, null), 'pendente');
  assert.deepEqual(resumo({ sessoes: [s], d: COM, vistos: null }).mural, []);
});

test('sem aprovação, aparece logo, e um «nao» esconde na mesma', () => {
  const s = sessao(1);
  assert.equal(resumo({ sessoes: [s], d: SEM, vistos: new Map() }).mural.length, 1);
  assert.equal(resumo({ sessoes: [s], d: SEM, vistos: null }).mural.length, 1);
  assert.deepEqual(resumo({ sessoes: [s], d: SEM, ...arrumar([visto(s, 'nao')]) }).mural, []);
});

test('a fotografia só aparece com o apoio aprovado, sem «semfoto» e com a cópia aprovada', () => {
  const s = sessao(1, { foto: fotoDe(1) });
  const base = [pendente(fotoDe(1))];
  assert.equal(fotoAVista(s, COM, arrumar(base)), null); // por ver
  assert.equal(fotoAVista(s, COM, arrumar([...base, visto(s, 'sim')])), null); // aprovado, mas sem cópia
  assert.match(fotoAVista(s, COM, arrumar([...base, visto(s, 'sim'), aprovada(s)])), /fundme\/aprovadas\/[0-9a-f]{16}\.jpg\?v=\d+$/);
  assert.equal(fotoAVista(s, COM, arrumar([...base, visto(s, 'semfoto'), aprovada(s)])), null);
  assert.equal(fotoAVista(s, COM, arrumar([...base, visto(s, 'nao'), aprovada(s)])), null);
  // sem aprovação de fotografias: a que veio, enquanto existir
  assert.equal(fotoAVista(s, SEM, arrumar(base)), fotoDe(1));
  assert.equal(fotoAVista(s, SEM, arrumar([])), null);
});

test('os registos à mão não esperam por ninguém: quem os escreve é a família', () => {
  const d = { ...COM, manuais: [{ data: '2026-11-25', valor: 640, origem: 'clube', nome: 'Grupo a', mensagem: { pt: 'Boa viagem', en: 'Safe trip' } }] };
  const r = resumo({ sessoes: [], d, vistos: new Map() });
  assert.equal(r.mural.length, 1);
  assert.equal(r.mural[0].nome, 'Grupo a');
});

test('um ficheiro com um nome que não é decisão nenhuma não decide nada', () => {
  const s = sessao(1);
  const lixo = [
    { pathname: `fundme/vistos/${curto(s.id)}/talvez.txt`, url: 'x', uploadedAt: '2026-11-20T10:00:00.000Z' },
    { pathname: `fundme/vistos/${curto(s.id)}/simples.txt`, url: 'x', uploadedAt: '2026-11-20T10:00:00.000Z' },
    { pathname: 'fundme/vistos/naoehash/sim.txt', url: 'x', uploadedAt: '2026-11-20T10:00:00.000Z' },
    { pathname: `fundme/vistos/outra/${curto(s.id)}/sim.txt`, url: 'x', uploadedAt: '2026-11-20T10:00:00.000Z' },
    { pathname: `fundme/vistos/${curto(s.id)}.sim.txt`, url: 'x', uploadedAt: '2026-11-20T10:00:00.000Z' },
  ];
  assert.equal(arrumar(lixo).vistos.size, 0);
});

/* ── as funções, com a rede a fingir ───────────────────────── */

/** Uma Stripe e um Blob de brincar. `blobs` é a loja; `falhas` faz falhar. */
function rede({ sessoes = [], blobs = [], falhas = {} } = {}) {
  const pedidos = [];
  const real = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(String(url));
    const metodo = init.method || 'GET';
    pedidos.push({ metodo, url: u, headers: init.headers || {}, body: init.body });
    const json = (corpo, estado = 200) => new Response(JSON.stringify(corpo), { status: estado, headers: { 'content-type': 'application/json' } });
    if (u.host === 'api.stripe.com') {
      if (falhas.stripe) return json({ error: {} }, 500);
      if (u.pathname === '/v1/payment_method_configurations') return json({ data: [] });
      if (u.pathname === '/v1/checkout/sessions' && metodo === 'GET') return json({ data: sessoes, has_more: false });
      const m = /^\/v1\/checkout\/sessions\/(cs_[A-Za-z0-9_]+)$/.exec(u.pathname);
      if (m && metodo === 'GET') {
        const s = sessoes.find((x) => x.id === m[1]);
        return s ? json(s) : json({ error: {} }, 404);
      }
      // nenhuma função desta angariação escreve numa sessão já feita
      return json({ error: { message: 'pedido inesperado' } }, 400);
    }
    if (u.host === 'vercel.com' && u.pathname.startsWith('/api/blob')) {
      if (falhas.blob) return json({ error: {} }, 500);
      if (metodo === 'GET') {
        const prefixo = u.searchParams.get('prefix') || '';
        return json({ blobs: blobs.filter((b) => b.pathname.startsWith(prefixo)), hasMore: false });
      }
      if (metodo === 'PUT') {
        const caminho = u.searchParams.get('pathname');
        const de = u.searchParams.get('fromUrl');
        if (de && !blobs.some((b) => b.url === de)) return json({ error: {} }, 404);
        if (de && falhas.copia) return json({ error: {} }, 500);
        const acaso = init.headers['x-add-random-suffix'] === '1';
        const final = acaso ? caminho.replace(/(\.[a-z]+)$/, `-R${pedidos.length}$1`) : caminho;
        const novo = { pathname: final, url: `https://${ANFITRIAO}/${final}`, uploadedAt: new Date(Date.UTC(2026, 10, 25, 10, 0, pedidos.length)).toISOString() };
        const i = blobs.findIndex((b) => b.pathname === final);
        if (i >= 0) blobs[i] = novo; else blobs.push(novo);
        return json(novo);
      }
      if (metodo === 'POST' && u.pathname.endsWith('/delete')) {
        const { urls } = JSON.parse(init.body);
        for (const x of urls) {
          const i = blobs.findIndex((b) => b.url === x);
          if (i >= 0) blobs.splice(i, 1);
        }
        return json({});
      }
    }
    return json({ error: 'endereço inesperado' }, 500);
  };
  return { pedidos, blobs, repor: () => { globalThis.fetch = real; } };
}

/** Chama uma função como a Vercel a chama, e devolve { estado, corpo, cabecas }. */
async function chamar(handler, { metodo = 'GET', url = '/api/fundme', chave, corpo } = {}) {
  const cabecas = {};
  let estado = 200;
  let saida = null;
  const res = {
    setHeader: (k, v) => { cabecas[k.toLowerCase()] = v; },
    status: (n) => { estado = n; return res; },
    json: (j) => { saida = j; return res; },
  };
  const req = { method: metodo, url, headers: { ...(chave && { authorization: `Bearer ${chave}` }), 'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 250)}` }, body: corpo };
  await handler(req, res);
  return { estado, corpo: saida, cabecas };
}
const CHAVE = process.env.FUNDME_CHAVE;

test('a página pública nunca recebe o nome, a mensagem ou a fotografia de um apoio por ver', async () => {
  const s = sessao(1, { foto: fotoDe(1) });
  const r = rede({ sessoes: [s], blobs: [pendente(fotoDe(1))] });
  try {
    const { estado, corpo } = await chamar(publico);
    assert.equal(estado, 200);
    assert.equal(corpo.total, 25);
    assert.equal(corpo.apoios, 1);
    assert.deepEqual(corpo.mural, []);
    assert.equal(corpo.aEntrar, 1);
    assert.equal(corpo.aprovar, true);
    assert.doesNotMatch(JSON.stringify(corpo), /Apoiante|Mensagem|pendentes/);
  } finally { r.repor(); }
});

test('com o Blob a falhar, a página pública não mostra nomes e não fica em cache', async () => {
  const s = sessao(2);
  // noutra «instância» não há lista de há pouco: usa-se uma data muito à frente
  const agora = Date.now;
  Date.now = () => agora() + 3600000;
  const r = rede({ sessoes: [s], blobs: [visto(s, 'sim')], falhas: { blob: true } });
  try {
    const { corpo, cabecas } = await chamar(publico);
    assert.deepEqual(corpo.mural, []);
    assert.equal(corpo.total, 25);
    assert.equal(cabecas['cache-control'], 's-maxage=5');
  } finally { r.repor(); Date.now = agora; }
});

test('gerir: sem a chave certa não entra, e não lista nada', async () => {
  const r = rede({ sessoes: [sessao(1)] });
  try {
    assert.equal((await chamar(gerir, { url: '/api/fundme/gerir' })).estado, 401);
    assert.equal((await chamar(gerir, { url: '/api/fundme/gerir', chave: 'outra-frase-qualquer' })).estado, 401);
    assert.equal(r.pedidos.length, 0);
  } finally { r.repor(); }
});

test('gerir: lista quem assinou, escreveu ou juntou fotografia, os que esperam primeiro; os anónimos não', async () => {
  const a = sessao(1);
  const b = sessao(2, { foto: fotoDe(2) });
  const anonimo = sessao(3, { nome: '', mensagem: '', mural: '0' });
  const r = rede({ sessoes: [a, b, anonimo], blobs: [pendente(fotoDe(2)), visto(a, 'sim')] });
  try {
    const { estado, corpo } = await chamar(gerir, { url: '/api/fundme/gerir', chave: CHAVE });
    assert.equal(estado, 200);
    assert.deepEqual(corpo.apoios.map((x) => [x.id, x.estado, x.fotoEstado]), [[b.id, 'pendente', 'fora'], [a.id, 'aprovado', null]]);
    assert.equal(corpo.porAprovar, 1);
    assert.equal(corpo.aprovar, true);
  } finally { r.repor(); }
});

test('gerir: «mostrar» copia a fotografia, guarda a decisão, e a página pública passa a mostrá-los', async () => {
  const s = sessao(1, { foto: fotoDe(1) });
  const r = rede({ sessoes: [s], blobs: [pendente(fotoDe(1))] });
  try {
    const { estado, corpo } = await chamar(gerir, { metodo: 'POST', url: '/api/fundme/gerir', chave: CHAVE, corpo: { id: s.id, acao: 'mostrar' } });
    assert.equal(estado, 200);
    assert.equal(corpo.foto, true);
    assert.ok(r.blobs.some((b) => b.pathname === caminhoAprovada(s.id)));
    assert.ok(r.blobs.some((b) => b.pathname.startsWith(`fundme/vistos/${curto(s.id)}/sim`)));
    // nada se escreve na Stripe: só leituras
    assert.ok(r.pedidos.filter((p) => p.url.host === 'api.stripe.com').every((p) => p.metodo === 'GET'));
    const pub = (await chamar(publico)).corpo;
    assert.equal(pub.mural.length, 1);
    assert.equal(pub.mural[0].nome, 'Apoiante 1');
    assert.match(pub.mural[0].foto, /fundme\/aprovadas\//);
    assert.equal(pub.mural[0].id, curto(s.id)); // o id da Stripe nunca sai
    assert.doesNotMatch(JSON.stringify(pub), /cs_test_/);
  } finally { r.repor(); }
});

test('gerir: «sem a fotografia» mostra o nome e tira a fotografia; «esconder» tira tudo; «mostrar» volta a pôr', async () => {
  const s = sessao(1, { foto: fotoDe(1) });
  const r = rede({ sessoes: [s], blobs: [pendente(fotoDe(1))] });
  const fazer = (acao) => chamar(gerir, { metodo: 'POST', url: '/api/fundme/gerir', chave: CHAVE, corpo: { id: s.id, acao } });
  try {
    await fazer('mostrar');
    await fazer('mostrar_sem_foto');
    let pub = (await chamar(publico)).corpo;
    assert.equal(pub.mural[0].nome, 'Apoiante 1');
    assert.equal(pub.mural[0].foto, null);
    assert.ok(!r.blobs.some((b) => b.pathname === caminhoAprovada(s.id)));
    await fazer('esconder');
    pub = (await chamar(publico)).corpo;
    assert.deepEqual(pub.mural, []);
    assert.equal(pub.total, 25);
    await fazer('mostrar');
    pub = (await chamar(publico)).corpo;
    assert.match(pub.mural[0].foto, /fundme\/aprovadas\//);
  } finally { r.repor(); }
});

test('gerir: se a fotografia não se copiar, o nome entra e a fotografia fica de fora', async () => {
  const s = sessao(1, { foto: fotoDe(1) });
  const r = rede({ sessoes: [s], blobs: [pendente(fotoDe(1))], falhas: { copia: true } });
  try {
    const { estado, corpo } = await chamar(gerir, { metodo: 'POST', url: '/api/fundme/gerir', chave: CHAVE, corpo: { id: s.id, acao: 'mostrar' } });
    assert.equal(estado, 200);
    assert.equal(corpo.foto, false);
    const pub = (await chamar(publico)).corpo;
    assert.equal(pub.mural[0].nome, 'Apoiante 1');
    assert.equal(pub.mural[0].foto, null);
  } finally { r.repor(); }
});

test('gerir: «recusar» apaga a fotografia de vez, e só com fotografia', async () => {
  const s = sessao(1, { foto: fotoDe(1) });
  const semFoto = sessao(2);
  const r = rede({ sessoes: [s, semFoto], blobs: [pendente(fotoDe(1))] });
  const fazer = (id, acao) => chamar(gerir, { metodo: 'POST', url: '/api/fundme/gerir', chave: CHAVE, corpo: { id, acao } });
  try {
    await fazer(s.id, 'mostrar');
    assert.equal((await fazer(s.id, 'recusar')).estado, 200);
    assert.ok(!r.blobs.some((b) => b.pathname.startsWith('fundme/pendentes/') || b.pathname.startsWith('fundme/aprovadas/')));
    const pub = (await chamar(publico)).corpo;
    assert.equal(pub.mural[0].foto, null);
    assert.equal((await fazer(semFoto.id, 'recusar')).estado, 404);
  } finally { r.repor(); }
});

test('gerir: um pedido torto, um apoio de outra coisa ou um método a mais não fazem nada', async () => {
  const outro = sessao(9, { kind: 'outra-coisa' });
  const r = rede({ sessoes: [sessao(1), outro] });
  const pedir = (corpo, metodo = 'POST') => chamar(gerir, { metodo, url: '/api/fundme/gerir', chave: CHAVE, corpo });
  try {
    assert.equal((await pedir({ id: 'nao-e-uma-sessao', acao: 'mostrar' })).estado, 400);
    assert.equal((await pedir({ id: sessao(1).id, acao: 'publicar' })).estado, 400);
    assert.equal((await pedir({ id: outro.id, acao: 'mostrar' })).estado, 404);
    assert.equal((await pedir({ id: sessao(5).id, acao: 'mostrar' })).estado, 404);
    assert.equal((await pedir({}, 'DELETE')).estado, 405);
    assert.ok(!r.blobs.length);
  } finally { r.repor(); }
});

test('quem volta da Stripe fica a saber que o nome e a fotografia esperam', async () => {
  const s = sessao(1, { foto: fotoDe(1) });
  const r = rede({ sessoes: [s] });
  try {
    const { corpo } = await chamar(publico, { url: `/api/fundme?sessao=${s.id}` });
    assert.equal(corpo.pago, true);
    // data/fundme.json, tal como está publicado, tem a aprovação ligada
    assert.equal(corpo.aguarda, true);
    assert.equal(corpo.aguardaFoto, true);
  } finally { r.repor(); }
});

test('data/fundme.json está com a aprovação ligada, para nomes e para fotografias', () => {
  const d = comum.dados();
  assert.equal(d.mural?.aprovar, true);
  assert.equal(d.fotos?.aprovar, true);
});
