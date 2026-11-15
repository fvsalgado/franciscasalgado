/* A angariação «Rumo à Florida» (/fundme).
 *
 * Tudo o que mexe vem de /api/fundme: o total, o acumulado dia a dia, os
 * nomes e as mensagens, e o que está em data/fundme.json (meta, etapas,
 * evento). Se a função não responder, a página lê o data/fundme.json e
 * mostra o que lá está, sem total.
 *
 * A página: o cartão de embarque (a viagem e quanto já se juntou), o apoio
 * (um valor e um botão; o nome e a mensagem só para quem quiser), o gráfico,
 * a conta da viagem em forma de recibo, a bandeira com os nomes de quem
 * apoiou e os postais com as mensagens.
 *
 * O formulário funciona sem JavaScript (um POST para /api/fundme/apoiar, que
 * responde com um 303 para a Stripe). Com JavaScript vai em JSON.
 *
 * Com ?ecra na morada, a página passa a ser o ecrã da clubhouse: o avião a
 * andar de Lisboa para Miami, o total, a bandeira a ondular com os nomes, os
 * postais a passar e uma festa a cada apoio novo. Atualiza-se sozinho.
 */

const $ = (id) => document.getElementById(id);
const DIA = 86400000;
const AVIAO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5Z"/></svg>';

const T = {
  pt: {
    de: (m) => `de ${m}`,
    apoios: (n, p) => `<b>${n}</b> ${n === 1 ? 'apoio' : 'apoios'} · ${p}%`,
    dias: (n) => (n === 0 ? '<b>embarca hoje</b>' : `faltam <b>${n}</b> ${n === 1 ? 'dia' : 'dias'}`),
    fechado: 'Os apoios abrem em breve',
    aEnviar: 'A abrir o pagamento…',
    erros: {
      valor: 'Escolha um valor entre {min} e {max}.',
      demasiados: 'Demasiadas tentativas seguidas. Tente outra vez daqui a pouco.',
      fechado: 'A angariação está fechada.',
      pagamento: 'Os pagamentos ainda não estão ligados.',
      stripe: 'A Stripe não respondeu. Tente outra vez.',
      indisponivel: 'Não foi possível abrir o pagamento. Tente outra vez.',
      rede: 'Sem ligação. Tente outra vez.',
    },
    obrigado: (n) => `<strong>Obrigada${n ? `, ${n}` : ''}!</strong> O seu apoio já conta${n ? ', e o seu nome já está na bandeira' : ''}.`,
    aEntrar: '<strong>Obrigada!</strong> O pagamento está a ser confirmado. Com Multibanco, o apoio aparece aqui quando a referência for paga.',
    fotoDepois: ' A sua fotografia já está num postal.',
    cartao: {
      nome: 'o seu nome, para a bandeira', frase: 'uma mensagem para a Francisca',
      bt: 'Entregar o cartão', btS: (v) => `Apoio de ${v}, pago na Stripe`, btSOutro: 'Escreva o valor livre',
    },
    foto: {
      preparar: 'A preparar…', enviar: 'A enviar…', pronta: 'Fotografia pronta', aEsperar: 'A enviar a fotografia…', alt: 'A sua fotografia',
      erro: { formato: 'Este formato não abre aqui. Experimente outra fotografia.', grande: 'A fotografia é grande demais.', demasiados: 'Demasiadas fotografias seguidas. Tente daqui a pouco.', fotos: 'As fotografias ainda não estão ligadas.', rede: 'A fotografia não seguiu. Pode apoiar na mesma, ou tentar outra vez.' },
    },
    fontes: { online: 'online', clube: 'no clube', empresas: 'empresas, pela Fundação do Desporto' },
    hoje: 'hoje',
    nesseDia: 'nesse dia',
    semFontes: 'Ainda sem apoios. O primeiro pode ser o seu.',
    meta: 'Meta',
    roll: 'Roll Up no Vale de Janelas',
    partida: 'Florida',
    anonimo: 'Anónimo',
    quando: (d) => (d === 0 ? 'hoje' : d === 1 ? 'ontem' : `há ${d} dias`),
    eventoData: (d, l) => `${d} · ${l}`,
    eventoSemData: (l) => `Data a anunciar · ${l}`,
    tabela: ['Dia', 'Nesse dia', 'Acumulado'],
    recibo: {
      cab: 'Rumo à Florida', sub: 'Lisboa → Miami · janeiro de 2027', n: 'Recibo n.º 2027',
      faltam: (v) => `faltam ${v}`, pago: 'Pago', total: 'Total', juntamos: 'Já juntámos', falta: 'Falta',
      obrigado: 'Obrigada!', completo: 'Viagem paga. Obrigada!',
    },
    bandeiraVazia: 'A bandeira está à espera do primeiro nome.',
    semNome: (n) => (n === 1 ? 'E mais um apoio sem nome.' : `E mais ${n} apoios sem nome.`),
    nomes: (n) => (n === 1 ? '1 nome na bandeira.' : `${n} nomes na bandeira.`),
    postaisVazio: 'Ainda não chegaram postais. O primeiro pode ser o seu.',
    noClube: 'no clube',
    fotoDe: (n) => (n ? `Fotografia de ${n}` : 'Fotografia de quem apoia'),
    comFoto: (n) => `${n} está com a Francisca.`,
  },
  en: {
    de: (m) => `of ${m}`,
    apoios: (n, p) => `<b>${n}</b> ${n === 1 ? 'gift' : 'gifts'} · ${p}%`,
    dias: (n) => (n === 0 ? '<b>flies today</b>' : `<b>${n}</b> ${n === 1 ? 'day' : 'days'} to go`),
    fechado: 'Opening soon',
    aEnviar: 'Opening the payment…',
    erros: {
      valor: 'Please choose an amount between {min} and {max}.',
      demasiados: 'Too many attempts in a row. Please try again shortly.',
      fechado: 'The appeal is closed.',
      pagamento: 'Payments are not switched on yet.',
      stripe: 'Stripe did not respond. Please try again.',
      indisponivel: 'The payment could not be opened. Please try again.',
      rede: 'No connection. Please try again.',
    },
    obrigado: (n) => `<strong>Thank you${n ? `, ${n}` : ''}!</strong> Your gift already counts${n ? ', and your name is on the flag' : ''}.`,
    aEntrar: '<strong>Thank you!</strong> Your payment is being confirmed. With Multibanco, it shows here once the reference is paid.',
    fotoDepois: ' Your photo is already on a postcard.',
    cartao: {
      nome: 'your name, for the flag', frase: 'a message for Francisca',
      bt: 'Hand in the card', btS: (v) => `A ${v} gift, paid via Stripe`, btSOutro: 'Type your amount',
    },
    foto: {
      preparar: 'Preparing…', enviar: 'Uploading…', pronta: 'Photo ready', aEsperar: 'Uploading your photo…', alt: 'Your photo',
      erro: { formato: 'This format does not open here. Please try another photo.', grande: 'The photo is too large.', demasiados: 'Too many photos in a row. Please try again shortly.', fotos: 'Photos are not switched on yet.', rede: 'The photo did not upload. You can still give, or try again.' },
    },
    fontes: { online: 'online', clube: 'at the club', empresas: 'companies, via Fundação do Desporto' },
    hoje: 'today',
    nesseDia: 'that day',
    semFontes: 'No gifts yet. The first one could be yours.',
    meta: 'Target',
    roll: 'Roll Up at Vale de Janelas',
    partida: 'Florida',
    anonimo: 'Anonymous',
    quando: (d) => (d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`),
    eventoData: (d, l) => `${d} · ${l}`,
    eventoSemData: (l) => `Date to be announced · ${l}`,
    tabela: ['Day', 'That day', 'Running total'],
    recibo: {
      cab: 'Road to Florida', sub: 'Lisbon → Miami · January 2027', n: 'Receipt no. 2027',
      faltam: (v) => `${v} to go`, pago: 'Paid', total: 'Total', juntamos: 'Raised so far', falta: 'Still to go',
      obrigado: 'Thank you!', completo: 'Trip paid for. Thank you!',
    },
    bandeiraVazia: 'The flag is waiting for its first name.',
    semNome: (n) => (n === 1 ? 'And one more gift without a name.' : `And ${n} more gifts without a name.`),
    nomes: (n) => (n === 1 ? '1 name on the flag.' : `${n} names on the flag.`),
    postaisVazio: 'No postcards yet. The first one could be yours.',
    noClube: 'at the club',
    fotoDe: (n) => (n ? `Photo from ${n}` : 'Photo from a supporter'),
    comFoto: (n) => `${n} is with Francisca.`,
  },
};

/* ── formatos ─────────────────────────────────────────────── */

const grupos = (n, sep) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
const euros = (n, l) => (l === 'en' ? `€${grupos(n, ',')}` : `${grupos(n, '.')} €`);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tx = (v, l) => (v && typeof v === 'object' ? v[l] ?? v.pt : v);
const diaLisboa = (ms = Date.now()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
const ms = (dia) => Date.parse(`${dia}T12:00:00Z`);
const diasEntre = (a, b) => Math.round((ms(b) - ms(a)) / DIA);
const dataCurta = (dia, l) => new Intl.DateTimeFormat(l === 'en' ? 'en-GB' : 'pt-PT', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  .format(new Date(ms(dia))).replace('.', '');
const dataLonga = (dia, l) => new Intl.DateTimeFormat(l === 'en' ? 'en-GB' : 'pt-PT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
  .format(new Date(ms(dia)));
const quieto = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── os dados ─────────────────────────────────────────────── */

async function carregar() {
  try {
    const r = await fetch('/api/fundme', { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch {
    // sem a função (ou num servidor local sem ela), o que está escrito à mão
    try {
      const d = await (await fetch('/data/fundme.json')).json();
      return { ...d, total: null, apoios: 0, porOrigem: {}, serie: [], mural: [], stripe: 'sem_funcao', aberto: false };
    } catch {
      return null;
    }
  }
}

/* ── o cartão de embarque ─────────────────────────────────── */

function bilhete(d, l) {
  const t = T[l];
  const total = d.total ?? 0;
  $('fmTotal').textContent = d.total == null ? '—' : euros(total, l);
  $('fmMeta').textContent = t.de(euros(d.meta, l));
  if (d.partida) {
    const dia = new Date(d.partida + 'T12:00:00Z');
    const mes = new Intl.DateTimeFormat(l === 'en' ? 'en-GB' : 'pt-PT', { month: 'short', timeZone: 'UTC' }).format(dia).replace('.', '');
    $('fmEmbarque').textContent = `${dia.getUTCDate()} ${mes.toUpperCase()}`;
  }
  const p = Math.min(100, (total / d.meta) * 100);
  const barra = $('fmBarra');
  barra.setAttribute('aria-valuemax', d.meta);
  barra.setAttribute('aria-valuenow', Math.round(total));
  barra.setAttribute('aria-valuetext', `${euros(total, l)} / ${euros(d.meta, l)}`);
  requestAnimationFrame(() => { $('fmBarraI').style.width = `${p}%`; });
  let acc = 0;
  $('fmMarcos').innerHTML = (d.etapas ?? []).slice(0, -1)
    .map((e) => { acc += e.valor; return `<i style="left:${(acc / d.meta) * 100}%"></i>`; }).join('');
  $('fmApoios').innerHTML = d.total == null ? '' : t.apoios(d.apoios ?? 0, Math.floor(p));
  const faltam = d.partida ? diasEntre(diaLisboa(), d.partida) : -1;
  $('fmDias').innerHTML = faltam >= 0 ? t.dias(faltam) : '';
}

/* ── o apoio ──────────────────────────────────────────────── */

/* As marcas a caneta do cartão, como num cartão de golfe a sério: o par
 * sublinha-se, o birdie circula-se, o eagle leva dois círculos, o albatroz
 * três, o hole in one pinta-se. O valor livre leva um círculo. */
const TRACO = 'M8 30C6 15 22 5 35 6c15 1 24 10 22 23-2 13-15 20-29 19C14 47 6 39 9 25';
const TRACO2 = 'M3 29C1 11 20 0 35 1c18 1 28 12 26 27-2 16-17 24-33 23C11 50 1 41 4 24';
const MARCAS = {
  par: '<path d="M9 45c13 3 31 3 46-2"/>',
  birdie: `<path d="${TRACO}"/>`,
  eagle: `<path d="${TRACO}"/><path d="${TRACO2}"/>`,
  albatroz: `<path d="${TRACO}"/><path d="${TRACO2}"/><path d="${TRACO2}" transform="translate(32 27) scale(1.16) translate(-32 -27)"/>`,
  hio: `<ellipse cx="32" cy="27" rx="25" ry="21" class="fm-sc__disco"/><path d="${TRACO}"/>`,
  livre: `<path d="${TRACO}"/>`,
};
const RESULTADOS = ['par', 'birdie', 'eagle', 'albatroz', 'hio'];
const marca = (tipo) => `<svg viewBox="0 0 64 54" aria-hidden="true">${MARCAS[tipo] ?? MARCAS.birdie}</svg>`;

function formulario(d, l) {
  const t = T[l];
  const f = $('fmForm');
  $('fmLingua').value = l;
  const origem = new URLSearchParams(location.search).get('o');
  if (origem && /^[a-z0-9-]{1,20}$/.test(origem)) $('fmOrigem').value = origem;
  $('fmNome').placeholder = t.cartao.nome;
  $('fmMsg').placeholder = t.cartao.frase;

  // os valores vêm dos dados; cada um é um «buraco» do cartão, com a sua marca
  const valores = (d.valores?.length ? d.valores : [25, 50, 150, 300, 500]).slice(0, 5);
  const inicial = valores.includes(d.valorInicial) ? d.valorInicial : valores[Math.min(2, valores.length - 1)];
  const g = $('fmValores');
  g.style.setProperty('--n', valores.length + 1);
  g.querySelectorAll('.fm-sc__v').forEach((c, i, todas) => { if (i < todas.length - 1) c.remove(); });
  const livre = g.querySelector('.fm-sc__v--livre');
  livre.insertAdjacentHTML('beforebegin', valores.map((v, i) =>
    `<label class="fm-sc__v fm-sc__v--${RESULTADOS[i]}"><input type="radio" name="valor" value="${v}"${v === inicial ? ' checked' : ''} aria-label="${euros(v, l)}" /><span class="fm-sc__n">${grupos(v, l === 'en' ? ',' : '.')}<small>€</small></span>${marca(RESULTADOS[i])}</label>`).join(''));
  if (!livre.querySelector('svg')) livre.insertAdjacentHTML('beforeend', marca('livre'));
  // os cabeçalhos acompanham o número de valores
  const cab = g.querySelectorAll('.fm-sc__h:not(.fm-sc__lab)');
  const res = g.querySelectorAll('.fm-sc__r');
  cab.forEach((c, i) => { c.hidden = i > valores.length; });
  res.forEach((c, i) => { c.hidden = i < res.length - 1 && i >= valores.length; });

  const campo = $('fmOutro');
  campo.min = d.minimo ?? 5;
  campo.max = d.maximo ?? 5000;

  const escolhido = () => f.querySelector('input[name="valor"]:checked')?.value;
  const atualizar = () => {
    const v = escolhido();
    const eOutro = v === 'outro';
    $('fmOutroC').classList.toggle('fm-outro--on', eOutro);
    const n = eOutro ? Number(campo.value) : Number(v);
    $('fmBtT').textContent = !d.aberto ? t.fechado : t.cartao.bt;
    $('fmBtS').textContent = !d.aberto ? '' : n > 0 ? t.cartao.btS(euros(n, l)) : t.cartao.btSOutro;
  };
  f.addEventListener('change', (e) => {
    if (e.target.name === 'valor' && e.target.value === 'outro') campo.focus();
    atualizar();
  });
  campo.addEventListener('input', atualizar);
  campo.addEventListener('focus', () => { f.querySelector('input[value="outro"]').checked = true; atualizar(); });

  // a mensagem de apoio: um «+» discreto que abre a linha
  if (!$('fmMsg').value) {
    $('fmFraseC').hidden = true;
    $('fmFraseBt').hidden = false;
  }
  $('fmFraseBt').addEventListener('click', () => {
    $('fmFraseC').hidden = false;
    $('fmFraseBt').hidden = true;
    $('fmMsg').focus();
  });

  const bt = $('fmBt');
  const fechar = !d.aberto;
  f.querySelectorAll('input, textarea, button').forEach((el) => { el.disabled = fechar; });
  f.classList.toggle('fm-form--fechado', fechar);
  atualizar();

  const erro = (codigo) => {
    const msg = (t.erros[codigo] || t.erros.indisponivel)
      .replace('{min}', euros(d.minimo ?? 5, l)).replace('{max}', euros(d.maximo ?? 5000, l));
    $('fmErro').textContent = msg;
    $('fmErro').hidden = false;
  };
  const doLink = new URLSearchParams(location.search).get('erro');
  if (doLink) erro(doLink);

  const esperarFoto = fotografia(d, l);

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    $('fmErro').hidden = true;
    const dadosF = Object.fromEntries(new FormData(f));
    const v = dadosF.valor === 'outro' ? Number(dadosF.outro) : Number(dadosF.valor);
    if (!(v >= (d.minimo ?? 5) && v <= (d.maximo ?? 5000))) { erro('valor'); campo.focus(); return; }
    bt.disabled = true;
    // se a fotografia ainda vai a caminho, espera-se por ela (sem ela, segue)
    $('fmBtT').textContent = t.foto.aEsperar;
    dadosF.foto = await esperarFoto();
    $('fmBtT').textContent = t.aEnviar;
    try {
      const r = await fetch(f.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // quem assina, escreve uma mensagem ou junta uma fotografia quer aparecer
        body: JSON.stringify({ ...dadosF, mural: (dadosF.nome || dadosF.mensagem || dadosF.foto) ? '1' : '0' }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.url) { location.assign(j.url); return; }
      erro(j.erro);
    } catch {
      erro('rede');
    }
    bt.disabled = false;
    atualizar();
  });
}

/* ── a fotografia de quem apoia ───────────────────────────── */

/** Reduz no próprio telemóvel: no máximo 1600 px, em JPEG. Desenhar num
 *  canvas também deita fora a localização e o resto dos dados da câmara. */
async function reduzir(ficheiro, lado = 1600) {
  let img;
  try {
    img = await createImageBitmap(ficheiro, { imageOrientation: 'from-image' });
  } catch {
    img = await new Promise((ok, falha) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => falha(new Error('formato'));
      i.src = URL.createObjectURL(ficheiro);
    });
  }
  const w = img.width || img.naturalWidth;
  const h = img.height || img.naturalHeight;
  if (!w || !h) throw new Error('formato');
  const k = Math.min(1, lado / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * k);
  c.height = Math.round(h * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  img.close?.();
  const b = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.84));
  if (!b) throw new Error('formato');
  return b;
}

/** O campo da fotografia: escolher, reduzir, enviar logo (enquanto a pessoa
 *  escreve o resto) e mostrar como ficou. Devolve a função que o envio do
 *  formulário chama para ter o endereço — espera pelo envio, se for preciso. */
function fotografia(d, l) {
  const t = T[l].foto;
  if (!d.fotos || !d.aberto || !window.fetch) return async () => '';
  $('fmFotoC').hidden = false;
  const campo = $('fmFoto');
  const pre = $('fmFotoPre');
  const caixa = $('fmFotoC');
  const estado = (txt, classe = '') => { $('fmFotoEstado').textContent = txt; caixa.className = `fm-foto ${classe}`; pre.className = `fm-sc__foto ${classe}`; };
  let envio = null;
  let vez = 0;

  $('fmFotoBt').addEventListener('click', () => campo.click());
  pre.addEventListener('click', () => campo.click());
  campo.addEventListener('change', () => {
    const ficheiro = campo.files?.[0];
    campo.value = '';
    if (!ficheiro) return;
    const esta = ++vez;
    $('fmFotoUrl').value = '';
    $('fmFotoBt').hidden = true;
    $('fmFotoInfo').hidden = false;
    $('fmFotoX').hidden = false;
    $('fmFotoImg').removeAttribute('src');
    $('fmFotoImg').alt = t.alt;
    pre.hidden = false;
    estado(t.preparar, 'fm-foto--a');
    envio = (async () => {
      const b = await reduzir(ficheiro);
      if (esta !== vez) return '';
      $('fmFotoImg').src = URL.createObjectURL(b);
      estado(t.enviar, 'fm-foto--a');
      const r = await fetch('/api/fundme/foto', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: b });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.foto) throw new Error(j.erro || 'rede');
      if (esta !== vez) return '';
      $('fmFotoUrl').value = j.foto;
      estado(t.pronta, 'fm-foto--ok');
      return j.foto;
    })();
    envio.catch((e) => { if (esta === vez) estado(t.erro[e.message] || t.erro.rede, 'fm-foto--erro'); });
  });
  $('fmFotoTirar').addEventListener('click', () => {
    vez++;
    envio = null;
    $('fmFotoUrl').value = '';
    pre.hidden = true;
    $('fmFotoInfo').hidden = true;
    $('fmFotoX').hidden = true;
    $('fmFotoBt').hidden = false;
    caixa.className = 'fm-foto';
  });

  return async () => {
    if (!envio) return $('fmFotoUrl').value;
    try { return (await envio) || ''; } catch { return ''; }
  };
}

/* ── a volta da Stripe ────────────────────────────────────── */

async function obrigado(l) {
  const q = new URLSearchParams(location.search);
  const sessao = q.get('obrigado');
  if (!sessao) return false;
  const caixa = $('fmObrigado');
  // a morada fica limpa: recarregar ou partilhar não repete o agradecimento
  q.delete('obrigado');
  history.replaceState(null, '', `${location.pathname}${q.toString() ? `?${q}` : ''}#apoiar`);
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(`/api/fundme?sessao=${encodeURIComponent(sessao)}`, { cache: 'no-store' });
      const j = await r.json();
      if (j.pago) {
        caixa.innerHTML = T[l].obrigado(esc(j.nome || '')) + (j.foto ? T[l].fotoDepois : '');
        caixa.hidden = false;
        return true;
      }
    } catch { /* tenta outra vez */ }
    caixa.innerHTML = T[l].aEntrar;
    caixa.hidden = false;
    await new Promise((ok) => setTimeout(ok, 5000));
  }
  return false;
}

/* ── o gráfico ────────────────────────────────────────────── */

function grafico(d, l) {
  const t = T[l];
  const caixa = $('fmGrafico');
  const serie = d.serie ?? [];
  if (!serie.length) { caixa.innerHTML = ''; return; }
  const W = Math.max(300, Math.round(caixa.clientWidth || 800));
  const peq = W < 560;
  const H = peq ? 260 : 340;
  const M = { l: peq ? 34 : 48, r: peq ? 14 : 22, t: 22, b: 32 };
  const inicio = d.inicio || serie[0].dia;
  const fim = d.partida && d.partida > serie[serie.length - 1].dia ? d.partida : serie[serie.length - 1].dia;
  const n = Math.max(1, diasEntre(inicio, fim));
  const topo = Math.max(d.meta, d.total ?? 0) * 1.1;
  const x = (dia) => M.l + (diasEntre(inicio, dia) / n) * (W - M.l - M.r);
  const y = (v) => M.t + (H - M.t - M.b) * (1 - v / topo);
  const passo = topo > 8000 ? 2000 : 1000;
  let s = '';
  for (let v = 0; v <= topo; v += passo) {
    s += `<line class="fm-g__grelha" x1="${M.l}" x2="${W - M.r}" y1="${y(v)}" y2="${y(v)}"/>`;
    s += `<text class="fm-g__eixo" x="${M.l - 8}" y="${y(v) + 4}" text-anchor="end">${v ? `${v / 1000}${l === 'en' ? 'k' : ' mil'}` : '0'}</text>`;
  }
  s += `<line class="fm-g__meta" x1="${M.l}" x2="${W - M.r}" y1="${y(d.meta)}" y2="${y(d.meta)}"/>`;
  s += `<text class="fm-g__meta-t" x="${W - M.r}" y="${y(d.meta) - 8}" text-anchor="end">${t.meta} ${euros(d.meta, l)}</text>`;
  const pts = serie.map((p) => `${x(p.dia).toFixed(1)},${y(p.total).toFixed(1)}`);
  const ult = serie[serie.length - 1];
  s += `<path class="fm-g__area" d="M${x(serie[0].dia)},${y(0)} L${pts.join(' L')} L${x(ult.dia)},${y(0)} Z"/>`;
  s += `<polyline class="fm-g__linha" points="${pts.join(' ')}"/>`;

  // as datas no eixo: o início, uns quantos dias pelo meio, a partida
  const marcas = peq ? 3 : 6;
  for (let i = 0; i <= marcas; i++) {
    const dia = new Date(ms(inicio) + Math.round((n * i) / marcas) * DIA).toISOString().slice(0, 10);
    const ehFim = i === marcas && d.partida && dia === d.partida;
    s += `<text class="fm-g__eixo" x="${x(dia)}" y="${H - 10}" text-anchor="${i === 0 ? 'start' : i === marcas ? 'end' : 'middle'}">${ehFim ? `${dataCurta(dia, l)} · ${t.partida}` : dataCurta(dia, l)}</text>`;
  }

  // o dia do evento, se já passou
  const ev = d.evento?.data;
  const pEv = ev && serie.find((p) => p.dia === ev);
  if (pEv) {
    s += `<line class="fm-g__ev" x1="${x(ev)}" x2="${x(ev)}" y1="${y(pEv.total)}" y2="${y(0)}"/>`;
    s += `<circle class="fm-g__ev-p" cx="${x(ev)}" cy="${y(pEv.total)}" r="5"/>`;
    s += `<text class="fm-g__ev-t" x="${x(ev) - 9}" y="${y(pEv.total) - (peq ? 10 : 26)}" text-anchor="end">${peq ? 'Roll Up' : t.roll}</text>`;
    if (!peq && pEv.dia_valor) s += `<text class="fm-g__eixo" x="${x(ev) - 9}" y="${y(pEv.total) - 10}" text-anchor="end">+${euros(pEv.dia_valor, l)}</text>`;
  }
  s += `<circle class="fm-g__fim" cx="${x(ult.dia)}" cy="${y(ult.total)}" r="6"/>`;
  const aDireita = x(ult.dia) < W - 120;
  s += `<text class="fm-g__fim-t" x="${x(ult.dia) + (aDireita ? 12 : -12)}" y="${y(ult.total) + 6}" text-anchor="${aDireita ? 'start' : 'end'}">${euros(ult.total, l)}</text>`;
  s += '<line class="fm-g__cruz" id="fmCruz" x1="0" x2="0" y1="0" y2="0" visibility="hidden"/><circle class="fm-g__cruz-p" id="fmCruzP" r="5" visibility="hidden"/>';

  const resumoTxt = `${euros(d.total ?? 0, l)} ${t.de(euros(d.meta, l))}`;
  caixa.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(resumoTxt)}">${s}</svg><div class="fm-g__dica" id="fmDica" hidden></div>`;

  // a dica ao passar: o dia mais perto do ponteiro
  const svg = caixa.querySelector('svg');
  const dica = $('fmDica');
  const cruz = $('fmCruz');
  const cruzP = $('fmCruzP');
  const mover = (ev2) => {
    const r = svg.getBoundingClientRect();
    const px = ((ev2.clientX - r.left) / r.width) * W;
    let melhor = serie[0];
    for (const p of serie) if (Math.abs(x(p.dia) - px) < Math.abs(x(melhor.dia) - px)) melhor = p;
    const cx = x(melhor.dia);
    const cy = y(melhor.total);
    cruz.setAttribute('x1', cx); cruz.setAttribute('x2', cx); cruz.setAttribute('y1', M.t); cruz.setAttribute('y2', y(0));
    cruzP.setAttribute('cx', cx); cruzP.setAttribute('cy', cy);
    cruz.setAttribute('visibility', 'visible'); cruzP.setAttribute('visibility', 'visible');
    dica.innerHTML = `<span>${dataCurta(melhor.dia, l)}</span><b>${euros(melhor.total, l)}</b>${melhor.dia_valor ? `<span>+${euros(melhor.dia_valor, l)} ${t.nesseDia}</span>` : ''}`;
    dica.hidden = false;
    const esq = (cx / W) * r.width;
    dica.style.left = `${Math.min(Math.max(esq, 60), r.width - 60)}px`;
    dica.style.top = `${(cy / H) * r.height}px`;
  };
  svg.addEventListener('pointermove', mover);
  svg.addEventListener('pointerdown', mover);
  svg.addEventListener('pointerleave', () => {
    dica.hidden = true;
    cruz.setAttribute('visibility', 'hidden'); cruzP.setAttribute('visibility', 'hidden');
  });

  // a mesma coisa em tabela, para quem não vê o gráfico
  const linhas = serie.filter((p) => p.dia_valor).map((p) =>
    `<tr><td>${dataCurta(p.dia, l)}</td><td>${euros(p.dia_valor, l)}</td><td>${euros(p.total, l)}</td></tr>`).join('');
  $('fmTabela').innerHTML = `<table><thead><tr>${t.tabela.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${linhas}</tbody></table>`;
}

function fontes(d, l) {
  const t = T[l];
  const o = d.porOrigem ?? {};
  const ordem = ['online', 'clube', 'empresas', ...Object.keys(o).filter((k) => !['online', 'clube', 'empresas'].includes(k))];
  const itens = ordem.filter((k) => o[k] > 0).map((k) =>
    `<div class="fm-fonte"><span class="fm-fonte__v num">${euros(o[k], l)}</span><span class="fm-fonte__r">${esc(t.fontes[k] ?? k)}</span></div>`);
  if (d.hoje > 0) itens.push(`<div class="fm-fonte fm-fonte--hoje"><span class="fm-fonte__v num">+${euros(d.hoje, l)}</span><span class="fm-fonte__r">${t.hoje}</span></div>`);
  $('fmFontes').innerHTML = itens.length ? itens.join('') : `<p class="fm-fonte__vazio">${t.semFontes}</p>`;
}

/* ── a conta da viagem, em recibo ─────────────────────────── */

function recibo(d, l) {
  const t = T[l].recibo;
  const lista = d.etapas ?? [];
  if (!lista.length) { $('fmEtapasS').hidden = true; return; }
  const total = d.total ?? 0;
  const meta = lista.reduce((s, e) => s + e.valor, 0) || d.meta;
  let acc = 0;
  let pagas = 0;
  const linhas = lista.map((e) => {
    const ini = acc;
    acc += e.valor;
    const p = Math.max(0, Math.min(1, (total - ini) / e.valor));
    if (p >= 1) pagas++;
    const estado = p >= 1 ? 'fm-r__l--pago' : p > 0 ? 'fm-r__l--meio' : '';
    const nota = p > 0 && p < 1 ? t.faltam(euros(Math.ceil(e.valor - (total - ini)), l)) : tx(e.x, l);
    return `<li class="fm-r__l ${estado}">
      <span class="fm-r__t"><span>${esc(tx(e.t, l))}</span></span>
      <span class="fm-r__v">${euros(e.valor, l)}</span>
      <span class="fm-r__x">${esc(nota)}</span>
      ${p > 0 && p < 1 ? `<span class="fm-r__b" aria-hidden="true"><i style="width:${p * 100}%"></i></span>` : ''}
    </li>`;
  });
  const falta = Math.max(0, meta - total);
  const completo = falta === 0 && total > 0;
  $('fmRecibo').innerHTML = `
    <div class="fm-r">
      <div class="fm-r__cab">
        <svg class="fm-r__ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M8 20.2V3.6l9.2 3.3L8 10.2"/><ellipse cx="12" cy="20.4" rx="6.8" ry="1.7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
        <b>${t.cab}</b>
        <span>${t.sub}</span>
        <span class="fm-r__n">${t.n}</span>
      </div>
      <ol class="fm-r__ls">${linhas.join('')}</ol>
      ${pagas ? `<span class="fm-r__selo" style="--linhas:${pagas}" aria-hidden="true">${t.pago}<small>${euros(lista.slice(0, pagas).reduce((s, e) => s + e.valor, 0), l)}</small></span>` : ''}
      <div class="fm-r__tot"><span>${t.total}</span><span>${euros(meta, l)}</span></div>
      <div class="fm-r__tot fm-r__tot--j"><span>${t.juntamos}</span><span>${euros(total, l)}</span></div>
      ${completo ? '' : `<div class="fm-r__tot fm-r__tot--f"><span>${t.falta}</span><span>${euros(falta, l)}</span></div>`}
      <div class="fm-r__pe">
        <p>${completo ? t.completo : t.obrigado}</p>
        <span class="fm-r__barras" aria-hidden="true"></span>
        <span class="fm-r__url">franciscasalgado.golf/fundme</span>
      </div>
    </div>`;
}

/* ── a bandeira com os nomes ──────────────────────────────── */

const unicos = (mural) => {
  const vistos = new Set();
  return (mural ?? []).map((m) => m.nome).filter((n) => {
    if (!n) return false;
    const k = n.toLocaleLowerCase('pt');
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
};

/** A bandeira desenhada em SVG, com os nomes escritos como assinaturas. A
 *  largura decide quantos cabem por linha; o pano cresce para baixo com o
 *  número de linhas. `ondula` põe o pano a mexer (o ecrã da clubhouse). */
export function bandeiraSVG(nomes, { W = 640, letra = 20, max = 80, ondula = false, convite = false } = {}) {
  const x0 = 54;
  const larg = W - x0 - 34;
  const passo = letra * 1.7;
  const linhas = [];
  let fila = [];
  let usado = 0;
  const lista = nomes.slice(0, max);
  for (const n of lista) {
    const w = n.length * letra * 0.5 + letra * 1.2;
    if (usado + w > larg && fila.length) { linhas.push(fila); fila = []; usado = 0; }
    fila.push([n, w]);
    usado += w;
  }
  if (fila.length) linhas.push(fila);
  const yNomes = 150;
  const fundo = Math.max(250, yNomes + linhas.length * passo + 14);
  const H = fundo + 60;
  // um sorteio fixo por nome: a mesma pessoa fica sempre com a mesma inclinação
  const roda = (n) => { let h = 7; for (const c of n) h = (h * 31 + c.charCodeAt(0)) % 997; return (h % 11) - 5; };
  let txt = '';
  linhas.forEach((f, r) => {
    const tot = f.reduce((s, [, w]) => s + w, 0);
    let x = x0 + (larg - tot) / 2;
    const y = yNomes + r * passo;
    for (const [n, w] of f) {
      const cx = (x + w / 2).toFixed(0);
      const tam = letra + (roda(n) % 3);
      txt += `<text x="${cx}" y="${y}" text-anchor="middle" font-size="${tam}" transform="rotate(${roda(n)} ${cx} ${y})">${esc(n)}</text>`;
      x += w;
    }
  });
  const R = W - 20;
  const pano = (o) => `M${x0} 24 C${W * 0.3} ${8 + o} ${W * 0.62} ${44 - o} ${R} 22 L${R} ${fundo} C${W * 0.62} ${fundo + 22 - o} ${W * 0.3} ${fundo - 18 + o} ${x0} ${fundo + 6} Z`;
  const faixa = (o) => `M${x0} 24 C${W * 0.3} ${8 + o} ${W * 0.62} ${44 - o} ${R} 22 L${R} 52 C${W * 0.62} ${72 - o} ${W * 0.3} ${38 + o} ${x0} 54 Z`;
  const anima = (f) => (ondula ? `<animate attributeName="d" dur="5s" repeatCount="indefinite" values="${f(0)};${f(14)};${f(0)}" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>` : '');
  return `<svg viewBox="0 0 ${W} ${H}" class="fm-flag${ondula ? ' fm-flag--ondula' : ''}" aria-hidden="true">
    <rect x="${x0 - 8}" y="14" width="8" height="${H - 22}" rx="4" class="fm-flag__mastro"/>
    <path d="${pano(0)}" class="fm-flag__pano">${anima(pano)}</path>
    <path d="${faixa(0)}" class="fm-flag__faixa">${anima(faixa)}</path>
    <text x="${x0 + larg / 2}" y="98" text-anchor="middle" class="fm-flag__clube">Vale de Janelas</text>
    <text x="${x0 + larg / 2}" y="121" text-anchor="middle" class="fm-flag__sub">ROAD TO THE ORANGE BOWL · 2027</text>
    <g class="fm-flag__nomes">${txt}</g>
    ${convite ? `<g class="fm-flag__convite"><text x="${x0 + larg / 2}" y="${yNomes + 28}" text-anchor="middle">O primeiro nome fica aqui</text><text x="${x0 + larg / 2}" y="${yNomes + 56}" text-anchor="middle" class="fm-flag__convite-en">Your name here</text><line x1="${x0 + larg * 0.22}" x2="${x0 + larg * 0.78}" y1="${yNomes + 38}" y2="${yNomes + 38}"/></g>` : ''}
    <ellipse cx="${x0 - 4}" cy="${H - 8}" rx="64" ry="7" class="fm-flag__chao"/>
  </svg>`;
}

function bandeira(d, l) {
  const t = T[l];
  const nomes = unicos(d.mural);
  const caixa = $('fmBandeira');
  const W = caixa.clientWidth < 560 ? 420 : 680;
  caixa.innerHTML = bandeiraSVG(nomes.length ? nomes : [], { W, letra: 20, ondula: !quieto() });
  const semNome = Math.max(0, (d.apoios ?? 0) - (d.mural ?? []).filter((m) => m.nome).length);
  const partes = [];
  if (nomes.length) partes.push(t.nomes(nomes.length)); else partes.push(t.bandeiraVazia);
  if (semNome > 0 && nomes.length) partes.push(t.semNome(semNome));
  $('fmBandeiraMais').textContent = partes.join(' ');
}

/* ── os postais ───────────────────────────────────────────── */

const SELO = '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M8 20.2V3.6l9.2 3.3L8 10.2"/></svg>';

const postal = (m, l, i, duas = false) => {
  const t = T[l];
  const hoje = diaLisboa();
  const carimbo = dataCurta(m.dia, l).toUpperCase();
  const quandoEm = (x) => (m.origem === 'clube' ? T[x].noClube : T[x].quando(Math.max(0, diasEntre(m.dia, hoje))));
  const quando = quandoEm(l);
  const msg = tx(m.mensagem, l);
  // a fotografia vem presa ao postal, como uma polaroide (sem crédito: é de quem apoia)
  const foto = m.foto
    ? `<figure class="fm-postal__foto"><img src="${esc(m.foto)}" alt="${esc(t.fotoDe(m.nome))}" loading="lazy" decoding="async" data-credito-feito="1" /></figure>`
    : '';
  return `<li class="fm-postal${m.foto ? ' fm-postal--foto' : ''}" style="--r:${[-2.2, 1.6, -1, 2, -1.6, 1.1][i % 6]}deg">
    <span class="fm-postal__selo" aria-hidden="true">${SELO}</span>
    <span class="fm-postal__carimbo" aria-hidden="true">${esc(carimbo)}</span>
    ${foto}
    ${msg ? `<p class="fm-postal__t">${esc(msg)}</p>` : `<p class="fm-postal__t fm-postal__t--so">${esc(m.nome ? t.comFoto(m.nome) : t.anonimo)}</p>`}
    <p class="fm-postal__q"><b>${duas && !m.nome ? bi(T.pt.anonimo, T.en.anonimo) : esc(m.nome || t.anonimo)}</b><span>${duas ? bi(esc(quandoEm('pt')), esc(quandoEm('en'))) : esc(quando)}</span></p>
  </li>`;
};

function postais(d, l) {
  const lista = (d.mural ?? []).filter((m) => tx(m.mensagem, l) || m.foto);
  const ul = $('fmPostais');
  if (!lista.length) { ul.innerHTML = `<li class="fm-postais__vazio">${T[l].postaisVazio}</li>`; $('fmMais').hidden = true; return; }
  const POR = 6;
  let mostrados = POR;
  const pintar = () => {
    ul.innerHTML = lista.slice(0, mostrados).map((m, i) => postal(m, l, i)).join('');
    $('fmMais').hidden = mostrados >= lista.length;
  };
  $('fmMais').onclick = () => { mostrados += POR; pintar(); };
  pintar();
}

function evento(d, l) {
  const ev = d.evento;
  if (!ev?.mostrar) { $('fmEvento').hidden = true; return; }
  const local = tx(ev.local, l) || '';
  const q = ev.data ? T[l].eventoData(dataLonga(ev.data, l), local) : T[l].eventoSemData(local);
  $('fmEventoQ').textContent = q.charAt(0).toUpperCase() + q.slice(1);
}

/* ── o ecrã da clubhouse ──────────────────────────────────── */

/* Um número a subir até ao valor novo, em vez de saltar. */
function contar(el, de, ate, dur = 1800) {
  if (quieto() || de === ate) { el.textContent = euros(ate, 'pt'); return; }
  const t0 = performance.now();
  const passo = (agora) => {
    const k = Math.min(1, (agora - t0) / dur);
    const e = 1 - (1 - k) ** 3;
    el.textContent = euros(de + (ate - de) * e, 'pt');
    if (k < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

/* A festa de um apoio novo: uma faixa a descer com o nome (se o houver) e
   uma chuva de bolas de golfe a sair do número. */
/** Um punhado de bolas de golfe a saltar de um ponto do ecrã. */
function bolas(caixa, x, y, n = 26) {
  if (quieto()) return;
  caixa.querySelectorAll('.fm-festa__bola').forEach((b) => b.remove());
  for (let i = 0; i < n; i++) {
    const b = document.createElement('i');
    b.className = 'fm-festa__bola';
    b.style.left = x;
    b.style.top = y;
    b.style.setProperty('--x', `${(Math.random() - 0.5) * 80}vw`);
    b.style.setProperty('--y', `${-15 - Math.random() * 55}vh`);
    b.style.setProperty('--d', `${1.4 + Math.random() * 1.3}s`);
    b.style.setProperty('--t', `${0.6 + Math.random() * 1}`);
    caixa.append(b);
  }
}

/** Um apoio sem nome: uma faixa no topo, com o valor (não diz de quem é). */
function festa(valor) {
  const caixa = $('fmEcraFesta');
  caixa.innerHTML = `<div class="fm-festa__faixa"><b>+${euros(valor, 'pt')}</b> ${bi('Novo apoio · Obrigada!', 'New gift · Thank you!')}</div>`;
  bolas(caixa, '30vw', '62vh');
  caixa.classList.remove('fm-festa--on');
  void caixa.offsetWidth;
  caixa.classList.add('fm-festa--on');
  setTimeout(() => caixa.classList.remove('fm-festa--on'), 7000);
}

/* ── o destaque: quem acabou de apoiar com mensagem, fotografia ou nome ──
 * O ecrã escurece e o postal entra em grande no meio, com a fotografia
 * presa ao lado; a mensagem escreve-se letra a letra e cai o carimbo
 * «Novo apoio». Uns segundos depois, o postal desce para a fita. Se
 * chegarem vários de uma vez, vão um a seguir ao outro. O valor nunca
 * aparece aqui. */

const fila = [];
let emDestaque = false;

/** O texto letra a letra, sem partir palavras. */
function letras(texto) {
  let k = 0;
  return String(texto).split(/\s+/).map((p) =>
    `<span class="fm-d__p">${[...p].map((c) => `<span style="--i:${k++}">${esc(c)}</span>`).join('')}</span>`).join(' ');
}

function destacar(m) {
  // muitos de seguida: um apoio só com nome deixa de ter momento próprio
  // (o nome já entrou na bandeira), para a fila não ficar para trás
  if (m.marco === undefined && fila.length >= 2 && !m.foto && !tx(m.mensagem, 'pt')) return;
  fila.push(m);
  if (!emDestaque) proximoDestaque();
}

/** Com gente à espera, cada momento dura menos. */
const pressa = () => (fila.length >= 3 ? 0.5 : fila.length >= 1 ? 0.7 : 1);

async function proximoDestaque() {
  const caixa = $('fmEcraDestaque');
  const m = fila.shift();
  if (!m) { emDestaque = false; caixa.className = 'fm-destaque'; return; }
  emDestaque = true;
  if (m.marco !== undefined) { marco(caixa, m); return; }
  const en = linguaEcra() === 'en';
  const msg = tx(m.mensagem, en ? 'en' : 'pt');
  const tipo = m.foto ? 'foto' : msg ? 'msg' : 'nome';
  const texto = msg || (en ? `Thank you, ${m.nome}!` : `Obrigada, ${m.nome}!`);
  const passo = Math.max(14, Math.min(55, 1900 / texto.length));
  caixa.innerHTML = `<div class="fm-destaque__fundo"></div>
    <div class="fm-destaque__palco">
      <p class="fm-destaque__r">${en ? 'Just in' : 'Acabou de chegar'}</p>
      <div class="fm-destaque__par">
        ${m.foto ? `<figure class="fm-destaque__foto"><img src="${esc(m.foto)}" alt="" data-credito-feito="1" /></figure>` : ''}
        <article class="fm-destaque__postal fm-destaque__postal--${tipo}" style="--passo:${passo.toFixed(0)}ms">
          <span class="fm-destaque__selo" aria-hidden="true">${SELO}</span>
          <span class="fm-destaque__carimbo" aria-hidden="true">Novo apoio<br />New gift</span>
          <p class="fm-destaque__t">${letras(texto)}</p>
          ${msg ? `<p class="fm-destaque__q"><b>${esc(m.nome || (en ? 'Anonymous' : 'Anónimo'))}</b><span>${en ? 'Road to Florida' : 'Rumo à Florida'} · 2027</span></p>`
            : `<p class="fm-destaque__q"><span>${en ? 'Their name is now on the flag' : 'O nome já está na bandeira'}</span></p>`}
        </article>
      </div>
    </div>`;
  // com fotografia, espera que ela chegue (no máximo três segundos)
  const img = caixa.querySelector('img');
  if (img && !img.complete) await Promise.race([new Promise((ok) => { img.onload = ok; img.onerror = ok; }), new Promise((ok) => setTimeout(ok, 3000))]);
  caixa.className = 'fm-destaque';
  void caixa.offsetWidth;
  caixa.classList.add('fm-destaque--on');
  setTimeout(() => bolas(caixa, '50vw', '58vh', 24 + faseAtual * 8), 900);
  const dura = ({ foto: 11000, msg: 9000, nome: 6500 }[tipo] + (msg ? Math.min(3000, msg.length * 18) : 0)) * pressa();
  setTimeout(() => {
    caixa.classList.add('fm-destaque--sai');
    setTimeout(proximoDestaque, 1000);
  }, dura);
}

/* ── a viagem em fases ──────────────────────────────────────
 * O ecrã muda com o total, como uma viagem: na pista (sem apoios, tudo a
 * convidar), descolagem, cruzeiro, sobre o Atlântico, Miami à vista e
 * aterragem na meta. Cada fase tem o seu céu (data-fase no #fmEcra, as cores
 * no CSS) e mais movimento do que a anterior; passar de fase tem um momento
 * em grande. */

const FASES = [
  { pt: 'Na pista · à espera do primeiro apoio', en: 'On the runway · waiting for the first gift', marco: '' },
  { pt: 'Descolagem', en: 'Take-off', marco: 'Descolámos!', marcoEn: 'We have take-off!' },
  { pt: 'Velocidade de cruzeiro', en: 'Cruising', marco: 'Um quarto do caminho!', marcoEn: 'A quarter of the way!' },
  { pt: 'Sobre o Atlântico', en: 'Over the Atlantic', marco: 'A meio do Atlântico', marcoEn: 'Halfway across the Atlantic' },
  { pt: 'Miami à vista', en: 'Miami in sight', marco: 'Miami à vista!', marcoEn: 'Miami in sight!' },
  { pt: 'Aterrámos em Miami!', en: 'Landed in Miami!', marco: 'Aterrámos!', marcoEn: 'We made it!' },
];
const faseDe = (total, meta, apoios) => {
  if (!apoios || total <= 0) return 0;
  const p = total / meta;
  return p >= 1 ? 5 : p >= 0.75 ? 4 : p >= 0.5 ? 3 : p >= 0.25 ? 2 : 1;
};
let faseAtual = 0;

const acaso = (a, b) => a + Math.random() * (b - a);

/* O ecrã fala as duas línguas, uma de cada vez: cada texto tem as duas
 * versões sobrepostas e o ecrã troca de uma para a outra num esbatido lento,
 * de 12 em 12 segundos. Os momentos em grande saem na língua do momento. */
const bi = (pt, en) => `<span class="fm-bi"><span lang="pt">${pt}</span><span lang="en">${en}</span></span>`;
const linguaEcra = () => ($('fmEcra')?.classList.contains('fm-ecra--en') ? 'en' : 'pt');
function linguas() {
  setInterval(() => $('fmEcra').classList.toggle('fm-ecra--en'), 12000);
}

/** O céu de cada fase: nuvens a passar (o avião anda), estrelas, confettis. */
function ceu(fase) {
  const calmo = quieto();
  const nuvens = [1, 3, 5, 6, 5, 3][fase];
  const dur = [110, 80, 55, 42, 48, 70][fase];
  $('fmEcraNuvens').innerHTML = calmo ? '' : Array.from({ length: nuvens }, (_, i) =>
    `<i class="fm-nuvem" style="--y:${acaso(4, 60).toFixed(1)}vh;--s:${acaso(0.6, 1.5).toFixed(2)};--dur:${(dur * acaso(0.8, 1.25)).toFixed(0)}s;--atraso:-${(dur * i / nuvens + acaso(0, 8)).toFixed(0)}s;--o:${acaso(0.08, 0.2).toFixed(2)}"></i>`).join('');
  const estrelas = [0, 0, 0, 34, 50, 70][fase];
  $('fmEcraEstrelas').innerHTML = calmo ? '' : Array.from({ length: estrelas }, () =>
    `<i style="left:${acaso(0, 100).toFixed(1)}vw;top:${acaso(0, 75).toFixed(1)}vh;--t:${acaso(0.5, 1.6).toFixed(2)};--d:${acaso(2, 5).toFixed(1)}s;--a:-${acaso(0, 5).toFixed(1)}s"></i>`).join('');
  const cores = ['#F7F5EE', '#8FD9AE', '#F28C28', '#FFB347', '#1B6B47'];
  $('fmEcraConfettis').innerHTML = calmo || fase < 5 ? '' : Array.from({ length: 70 }, (_, i) =>
    `<i class="${i % 4 ? 'fm-conf' : 'fm-conf fm-conf--bola'}" style="left:${acaso(0, 100).toFixed(1)}vw;--c:${cores[i % cores.length]};--dur:${acaso(6, 12).toFixed(1)}s;--atraso:-${acaso(0, 12).toFixed(1)}s;--r:${acaso(-360, 360).toFixed(0)}deg;--x:${acaso(-8, 8).toFixed(1)}vw"></i>`).join('');
}

/** Os convites de quando ainda há pouco: o texto debaixo do QR vai mudando. */
const CONVITES = [
  bi('Aponte a câmara', 'Point your camera'),
  bi('Escolha o seu buraco', 'Pick your hole'),
  bi('Assine a bandeira', 'Sign the flag'),
  bi('Deixe uma mensagem', 'Leave a message'),
];
function convites() {
  let n = 0;
  setInterval(() => {
    const el = $('fmEcraCta');
    n = (n + 1) % CONVITES.length;
    el.classList.add('fm-ecra__cta--sai');
    setTimeout(() => { el.innerHTML = CONVITES[n]; el.classList.remove('fm-ecra__cta--sai'); }, 450);
  }, 4500);
}

/** Postais por escrever, para a fita não ficar vazia antes da primeira mensagem. */
const POR_ESCREVER = [
  { t: ['A primeira mensagem pode ser a sua.', 'The first message could be yours.'], q: ['Aponte a câmara ao QR', 'Point your camera at the QR'] },
  { t: ['Deixe uma mensagem para a viagem.', 'Leave Francisca a message for the trip.'], q: ['Mensagem de apoio', 'Message of support'] },
  { t: ['Junte uma fotografia consigo, ou com ela.', 'Add a photo of you, or with her.'], q: ['Uma fotografia', 'A photo'] },
  { t: ['O seu nome vai na bandeira para a Florida.', 'Your name goes on the flag to Florida.'], q: ['Assine a bandeira', 'Sign the flag'] },
];
const postalVazio = (p, i) => `<li class="fm-postal fm-postal--vazio" style="--r:${[-2, 1.5, -1, 2][i % 4]}deg">
    <span class="fm-postal__selo" aria-hidden="true">${SELO}</span>
    <p class="fm-postal__t">${bi(esc(p.t[0]), esc(p.t[1]))}</p>
    <p class="fm-postal__q"><b>${bi(esc(p.q[0]), esc(p.q[1]))}</b><span>✎</span></p>
  </li>`;

/** O momento de passar de fase: o avião atravessa o ecrã e a fase em grande. */
function marco(caixa, m) {
  const f = FASES[m.marco];
  const en = linguaEcra() === 'en';
  const pct = m.marco >= 5 ? '100' : String([0, 0, 25, 50, 75][m.marco] || '');
  const falta = en ? `<b>${euros(m.falta, 'en')}</b> to go` : `Faltam <b>${euros(m.falta, 'pt')}</b>`;
  caixa.innerHTML = `<div class="fm-destaque__fundo"></div>
    <div class="fm-marco">
      <span class="fm-marco__av" aria-hidden="true">${AVIAO}</span>
      ${m.marco > 1 ? `<p class="fm-marco__p">${pct}<small>%</small></p>` : ''}
      <p class="fm-marco__t d">${esc(en ? f.marcoEn : f.marco)}</p>
      <p class="fm-marco__f">${m.falta > 0 ? falta : en ? 'Thank you, everyone' : 'Obrigada a todos'}</p>
    </div>`;
  caixa.className = 'fm-destaque fm-destaque--marco';
  void caixa.offsetWidth;
  caixa.classList.add('fm-destaque--on');
  setTimeout(() => bolas(caixa, '50vw', '55vh', 30 + m.marco * 10), 700);
  setTimeout(() => {
    caixa.classList.add('fm-destaque--sai');
    setTimeout(proximoDestaque, 1000);
  }, (m.marco >= 5 ? 12000 : 8000) * pressa());
}

let ecraAntes = null;
function ecra(d) {
  const total = d.total ?? 0;
  const p = Math.min(100, (total / d.meta) * 100);
  const mural = d.mural ?? [];
  const fase = faseDe(total, d.meta, d.apoios);
  const antes = ecraAntes;
  ecraAntes = {
    total,
    fase,
    nomes: unicos(mural).join('|'),
    ids: new Set(mural.map((m) => m.id)),
    fotos: new Set(mural.filter((m) => m.foto).map((m) => m.id)),
  };

  // a fase: o céu e o movimento
  const caixaEcra = $('fmEcra');
  if (!antes || antes.fase !== fase) {
    faseAtual = fase;
    caixaEcra.dataset.fase = String(fase);
    ceu(fase);
  }
  $('fmEcraFase').innerHTML = `<b>${bi(esc(FASES[fase].pt), esc(FASES[fase].en))}</b>`;

  contar($('fmEcraTotal'), antes ? antes.total : 0, total, antes ? 2200 : 2600);
  $('fmEcraMeta').innerHTML = bi(`de ${euros(d.meta, 'pt')}`, `of ${euros(d.meta, 'en')}`);
  $('fmEcraFeito').style.width = `${p}%`;
  $('fmEcraAviao').style.left = `${p}%`;
  const faltam = d.partida ? diasEntre(diaLisboa(), d.partida) : -1;
  $('fmEcraInfo').innerHTML = [
    `<span><b>${d.apoios ?? 0}</b> ${bi(d.apoios === 1 ? 'apoio' : 'apoios', d.apoios === 1 ? 'gift' : 'gifts')}</span>`,
    d.hoje ? `<span><b>+${euros(d.hoje, 'pt')}</b> ${bi('hoje', 'today')}</span>` : '',
    faltam >= 0 ? `<span><b>${faltam}</b> ${bi(faltam === 1 ? 'dia' : 'dias', faltam === 1 ? 'day to go' : 'days to go')}</span>` : '',
  ].join('');

  // a bandeira só se redesenha quando entra um nome novo
  const nomes = unicos(mural);
  if (!antes || antes.nomes !== ecraAntes.nomes) {
    $('fmEcraBandeira').innerHTML = bandeiraSVG(nomes, { W: 620, letra: 22, max: 60, ondula: true, convite: !nomes.length });
  }

  // os postais a passar, numa fita sem fim (a lista vai duas vezes); sem
  // mensagens ainda, passam postais por escrever, a convidar
  const msgs = mural.filter((m) => tx(m.mensagem, 'pt') || m.foto).slice(0, 14);
  const fita = $('fmEcraFita');
  const chave = msgs.length ? msgs.map((m) => `${m.id}${m.foto ? 'f' : ''}`).join('|') : 'vazio';
  if (fita.dataset.chave !== chave) {
    fita.dataset.chave = chave;
    const um = msgs.length ? msgs.map((m, i) => postal(m, 'pt', i, true)).join('') : POR_ESCREVER.map(postalVazio).join('');
    fita.innerHTML = `<ul>${um}</ul><ul aria-hidden="true">${um}</ul>`;
    // a fita anda mais depressa à medida que a viagem avança
    fita.style.setProperty('--dur', `${Math.max(26, (msgs.length || 4) * [9, 8, 7, 6, 6, 5][fase])}s`);
  }

  if (!antes) return;
  // quem entrou agora no mural, e as fotografias que acabaram de aparecer
  const novos = mural.filter((m) => !antes.ids.has(m.id));
  const fotosNovas = mural.filter((m) => m.foto && antes.ids.has(m.id) && !antes.fotos.has(m.id));
  [...novos, ...fotosNovas].reverse().forEach(destacar);
  if (total > antes.total && !novos.length) festa(total - antes.total);
  // passar de fase: depois dos postais, o momento da fase nova
  if (fase > antes.fase) destacar({ marco: fase, falta: Math.max(0, d.meta - total) });
}

/* ── a hora e o tempo no campo ───────────────────────────────
 * Uma barra fina no topo, como num quadro de resultados: o sítio, a hora,
 * o céu e a temperatura, o vento (de onde vem, e as rajadas), a chuva nas
 * próximas três horas e o pôr do sol. Vem do Open-Meteo (sem chave), pedido
 * pelo próprio browser do ecrã de 10 em 10 minutos; se falhar, fica a hora.
 * As coordenadas estão em data/fundme.json (evento.coordenadas). */

const ICONES = {
  sol: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  lua: '<path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1Z"/>',
  parcial: '<circle cx="8.5" cy="8.5" r="3.2"/><path d="M8.5 2.6v1.4M2.6 8.5H4M4.3 4.3l1 1M12.7 4.3l-1 1"/><path d="M8 19.5h9.5a3.5 3.5 0 0 0 .2-7 5 5 0 0 0-9.4-.6A3.8 3.8 0 0 0 8 19.5Z"/>',
  nuvem: '<path d="M7 19h10.5a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-10.5-1A4.5 4.5 0 0 0 7 19Z"/>',
  nevoeiro: '<path d="M4 9h16M3 13h18M5 17h14"/>',
  chuva: '<path d="M7 15h10.5a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-10.5-1A4.5 4.5 0 0 0 7 15Z"/><path d="M8.5 18l-1 2.5M12.5 18l-1 2.5M16.5 18l-1 2.5"/>',
  trovoada: '<path d="M7 14h10.5a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-10.5-1A4.5 4.5 0 0 0 7 14Z"/><path d="M12.5 15.5l-2.5 3.5h3l-2 3.5"/>',
  neve: '<path d="M7 15h10.5a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-10.5-1A4.5 4.5 0 0 0 7 15Z"/><path d="M8.5 19h.01M12 20.5h.01M15.5 19h.01"/>',
  seta: '<path d="M12 3v18M12 21l-5-5M12 21l5-5"/>',
  gota: '<path d="M12 3.5c3.5 4.3 6 7.6 6 10.6a6 6 0 0 1-12 0c0-3 2.5-6.3 6-10.6Z"/>',
  ocaso: '<path d="M3 17h18M6 21h12M7.8 17a4.2 4.2 0 0 1 8.4 0M12 6v5M9.5 8.5 12 6l2.5 2.5"/>',
  bandeira: '<path d="M6 21V3l11 4-11 4"/>',
};
const icone = (n, rodar = 0) => `<svg viewBox="0 0 24 24" aria-hidden="true"${rodar ? ` style="transform:rotate(${rodar}deg)"` : ''}>${ICONES[n]}</svg>`;

/** O código WMO do céu: o ícone e as palavras. */
function ceuAgora(codigo, dia) {
  const c = Number(codigo);
  if (c <= 1) return [dia ? 'sol' : 'lua', dia ? 'Sol' : 'Limpo', dia ? 'Sunny' : 'Clear'];
  if (c === 2) return ['parcial', 'Pouco nublado', 'Partly cloudy'];
  if (c === 3) return ['nuvem', 'Nublado', 'Cloudy'];
  if (c === 45 || c === 48) return ['nevoeiro', 'Nevoeiro', 'Fog'];
  if (c >= 51 && c <= 57) return ['chuva', 'Chuvisco', 'Drizzle'];
  if ((c >= 61 && c <= 67) || (c >= 80 && c <= 82)) return ['chuva', 'Chuva', 'Rain'];
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return ['neve', 'Neve', 'Snow'];
  if (c >= 95) return ['trovoada', 'Trovoada', 'Thunderstorm'];
  return ['nuvem', 'Nublado', 'Cloudy'];
}
const RUMOS_PT = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
const RUMOS_EN = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const rumo = (graus) => Math.round((((Number(graus) % 360) + 360) % 360) / 45) % 8;
const horaLisboa = (ms = Date.now()) => new Intl.DateTimeFormat('pt-PT', { timeZone: 'Europe/Lisbon', hour: '2-digit', minute: '2-digit' }).format(ms);

let meteo = null;
function pintarTempo(d) {
  const sitio = tx(d.evento?.local, 'pt') || "Praia D'El Rey";
  const partes = [
    `<span class="fm-tp__sitio">${icone('bandeira')}${esc(sitio)}</span>`,
    `<span class="fm-tp__hora" id="fmEcraHora">${horaLisboa()}</span>`,
  ];
  if (meteo) {
    const a = meteo.current;
    const [ic, pt, en] = ceuAgora(a.weather_code, a.is_day);
    const r = rumo(a.wind_direction_10m);
    // a chuva: a maior probabilidade nas próximas três horas
    const agora = Date.now() / 1000;
    const prox = (meteo.hourly?.time ?? []).map((t, i) => [t, meteo.hourly.precipitation_probability?.[i]])
      .filter(([t]) => t >= agora - 3600 && t <= agora + 3 * 3600).map(([, p]) => p ?? 0);
    const chuva = prox.length ? Math.max(...prox) : null;
    const ocaso = meteo.daily?.sunset?.[0];
    partes.push(
      `<span class="fm-tp__i">${icone(ic)}<b>${Math.round(a.temperature_2m)}°</b><small>${bi(pt, en)}</small></span>`,
      // a seta aponta para onde o vento vai (vem de r)
      `<span class="fm-tp__i fm-tp__vento">${icone('seta', (Number(a.wind_direction_10m) || 0))}<b>${Math.round(a.wind_speed_10m)}</b><small>km/h ${bi(RUMOS_PT[r], RUMOS_EN[r])} · ${bi('rajadas', 'gusts')} ${Math.round(a.wind_gusts_10m)}</small></span>`,
      chuva !== null ? `<span class="fm-tp__i">${icone('gota')}<b>${chuva}%</b><small>${bi('chuva até 3 h', 'rain next 3 h')}</small></span>` : '',
      ocaso ? `<span class="fm-tp__i">${icone('ocaso')}<b>${horaLisboa(ocaso * 1000)}</b><small>${bi('pôr do sol', 'sunset')}</small></span>` : '',
    );
  }
  $('fmEcraTempo').innerHTML = partes.join('');
}

function tempo(d) {
  const c = d.evento?.coordenadas ?? { lat: 39.331, lon: -9.327 };
  const pedir = async () => {
    try {
      const q = new URLSearchParams({
        latitude: c.lat, longitude: c.lon,
        current: 'temperature_2m,is_day,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
        hourly: 'precipitation_probability', daily: 'sunset',
        timezone: 'Europe/Lisbon', timeformat: 'unixtime', forecast_days: '1', wind_speed_unit: 'kmh',
      });
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`, { cache: 'no-store' });
      const j = await r.json();
      if (r.ok && j.current) meteo = j;
    } catch { /* fica a hora */ }
    pintarTempo(d);
  };
  pintarTempo(d);
  pedir();
  setInterval(pedir, 10 * 60000);
  setInterval(() => { const h = $('fmEcraHora'); if (h) h.textContent = horaLisboa(); }, 5000);
}

/* ── o modo de demonstração (?ecra&demo) ─────────────────────
 * Para ver o ecrã a crescer sem apoios a sério: simula uma noite de Roll Up,
 * do zero à meta, e recomeça. `?ecra&demo=6` muda o intervalo (segundos). */
const DEMO = [
  { nome: 'Rita M.', mensagem: 'Vai com tudo, Francisca!', foto: '/img/retrato.webp', valor: 150 },
  { nome: 'Joana P.', valor: 50 },
  { valor: 25 },
  { nome: 'Grupo de quarta-feira', mensagem: 'Do Vale de Janelas para a Florida.', valor: 640 },
  { nome: 'Peter & Claire', mensagem: 'Go get them, Francisca! The whole Wednesday group is behind you.', valor: 300 },
  { nome: 'Avó Lena', mensagem: 'Já tens a mala feita?', valor: 500 },
  { valor: 1000 },
  { nome: 'Duarte', valor: 150 },
  { nome: 'Luísa F.', mensagem: 'Que orgulho! Traz a bandeira de volta cheia de histórias.', valor: 300 },
  { valor: 1500 },
  { nome: 'Teresa C.', mensagem: 'Biltmore, here she comes.', valor: 500 },
];
function demo(d, passo) {
  $('fmEcraDemo').hidden = false;
  const vazio = () => ({ ...d, total: 0, apoios: 0, hoje: 0, mural: [] });
  let estado = vazio();
  let i = 0;
  ecra(estado);
  const seguinte = () => {
    if (i >= DEMO.length) {
      // a meta foi atingida: uns segundos de festa, e volta ao início
      i = 0;
      estado = vazio();
      fila.length = 0;
      ecraAntes = null;
      ecra(estado);
      setTimeout(seguinte, passo * 1000);
      return;
    }
    const e = DEMO[i++];
    estado = {
      ...estado,
      total: estado.total + e.valor,
      apoios: estado.apoios + 1,
      hoje: estado.hoje + e.valor,
      mural: e.nome || e.mensagem ? [{ id: `demo${i}`, nome: e.nome ?? null, mensagem: e.mensagem ?? null, foto: e.foto ?? null, dia: diaLisboa(), origem: 'online' }, ...estado.mural] : estado.mural,
    };
    ecra(estado);
    setTimeout(seguinte, (i >= DEMO.length ? 45 : passo) * 1000);
  };
  setTimeout(seguinte, passo * 1000);
}

/* ── tudo ─────────────────────────────────────────────────── */

export async function fundme(l) {
  const noEcra = document.documentElement.classList.contains('fm-ecra-on');
  const d = await carregar();
  if (!d) return;

  if (noEcra) {
    $('fmEcra').hidden = false;
    convites();
    linguas();
    tempo(d);
    const q = new URLSearchParams(location.search);
    if (q.has('demo')) { demo(d, Math.max(3, Number(q.get('demo')) || 12)); return; }
    ecra(d);
    setInterval(async () => { const n = await carregar(); if (n) ecra(n); }, 20000);
    return;
  }

  const pintar = (x) => { bilhete(x, l); grafico(x, l); fontes(x, l); recibo(x, l); bandeira(x, l); postais(x, l); };
  pintar(d);
  formulario(d, l);
  evento(d, l);

  let largura = $('fmGrafico').clientWidth;
  addEventListener('resize', () => {
    const w = $('fmGrafico').clientWidth;
    if (Math.abs(w - largura) > 20) { largura = w; grafico(d, l); bandeira(d, l); }
  });

  // quem volta da Stripe: agradece, e quando o pagamento entrar refaz os números
  if (await obrigado(l)) {
    const n = await carregar();
    if (n) pintar(n);
  }
}
