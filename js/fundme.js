/* A angariação «Rumo à Florida» (/fundme).
 *
 * Tudo o que mexe vem de /api/fundme: o total, o acumulado dia a dia, os
 * nomes e as mensagens, e o que está em data/fundme.json (meta,
 * evento). Se a função não responder, a página lê o data/fundme.json e
 * mostra o que lá está, sem total.
 *
 * A página: o cartão de embarque (a viagem, quanto já se juntou e a volta
 * de 18 buracos), o cartão de apoio, o gráfico, a bandeira com os nomes de
 * quem apoiou, os postais com as mensagens e a previsão para o Roll Up.
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
    aEnviar: 'A preparar o seu apoio…',
    erros: {
      valor: 'Escolha um valor entre {min} e {max}.',
      semValor: 'Escolha primeiro o valor do seu apoio.',
      demasiados: 'Demasiadas tentativas seguidas. Tente outra vez daqui a pouco.',
      fechado: 'A angariação está fechada.',
      pagamento: 'Os apoios online ainda não estão ligados.',
      stripe: 'A Stripe não respondeu. Tente outra vez.',
      indisponivel: 'Não foi possível seguir com o apoio. Tente outra vez.',
      rede: 'Sem ligação. Tente outra vez.',
    },
    obrigado: (n) => `<strong>Obrigada${n ? `, ${n}` : ''}!</strong> O seu apoio já conta${n ? ', e o seu nome já está na bandeira' : ''}.`,
    aEntrar: '<strong>Obrigada!</strong> O seu apoio está a ser confirmado. Com Multibanco, aparece aqui quando a referência for confirmada.',
    fotoDepois: ' A sua fotografia já está num postal.',
    cartao: {
      nome: 'O seu nome', frase: 'Uma mensagem para a Francisca',
      bt: (v) => `Apoiar com ${v}`, btOutro: 'Escreva o seu valor',
      alb: 'Albatroz',
      efeito: (v, f) => `Com <b>${v}</b>, a Francisca fica a <b>${f}</b> da meta.`,
      chega: (v) => `Com <b>${v}</b>, a meta fica cumprida.`,
      faltaSo: (f) => `Faltam <b>${f}</b> para a meta.`,
      alem: 'A meta já foi alcançada. Cada apoio a mais dá folga à viagem.',
      pagar: (lista) => `Pode apoiar com ${lista}.`,
      escolha: 'Escolha um valor',
      metodos: { mb_way: 'MB WAY', multibanco: 'Multibanco', card: 'cartão', apple_pay: 'Apple Pay', google_pay: 'Google Pay', paypal: 'PayPal', revolut_pay: 'Revolut Pay' },
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
    aEnviar: 'Getting your gift ready…',
    erros: {
      valor: 'Please choose an amount between {min} and {max}.',
      semValor: 'Please choose the amount of your gift first.',
      demasiados: 'Too many attempts in a row. Please try again shortly.',
      fechado: 'The appeal is closed.',
      pagamento: 'Online gifts are not switched on yet.',
      stripe: 'Stripe did not respond. Please try again.',
      indisponivel: 'Your gift could not be started. Please try again.',
      rede: 'No connection. Please try again.',
    },
    obrigado: (n) => `<strong>Thank you${n ? `, ${n}` : ''}!</strong> Your gift already counts${n ? ', and your name is on the flag' : ''}.`,
    aEntrar: '<strong>Thank you!</strong> Your gift is being confirmed. With Multibanco, it shows here once the reference is confirmed.',
    fotoDepois: ' Your photo is already on a postcard.',
    cartao: {
      nome: 'Your name', frase: 'A message for Francisca',
      bt: (v) => `Give ${v}`, btOutro: 'Type your amount',
      alb: 'Albatross',
      efeito: (v, f) => `With <b>${v}</b>, Francisca is <b>${f}</b> from the target.`,
      chega: (v) => `With <b>${v}</b>, the target is reached.`,
      faltaSo: (f) => `<b>${f}</b> to go.`,
      alem: 'The target has been reached. Every extra gift gives the trip some breathing room.',
      pagar: (lista) => `You can give by ${lista}.`,
      escolha: 'Choose an amount',
      metodos: { mb_way: 'MB WAY', multibanco: 'Multibanco', card: 'card', apple_pay: 'Apple Pay', google_pay: 'Google Pay', paypal: 'PayPal', revolut_pay: 'Revolut Pay' },
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
  // a volta, como no ecrã: a meta em 18 buracos, a ida e a volta
  const volta = $('fmVolta');
  volta.setAttribute('aria-valuemax', d.meta);
  volta.setAttribute('aria-valuenow', Math.round(total));
  volta.setAttribute('aria-valuetext', `${euros(total, l)} / ${euros(d.meta, l)}`);
  volta.innerHTML = voltaPagina(total, d, l);
  $('fmApoios').innerHTML = d.total == null ? '' : t.apoios(d.apoios ?? 0, Math.floor(p));
  const faltam = d.partida ? diasEntre(diaLisboa(), d.partida) : -1;
  $('fmDias').innerHTML = faltam >= 0 ? t.dias(faltam) : '';
}

/** A volta na página: a meta dividida em 18 buracos, em duas linhas (a ida
 *  e a volta), com os feitos marcados, a bola no que se joga e a fase. É o
 *  mesmo cartão do ecrã, à medida de um telemóvel. */
function voltaPagina(total, d, l) {
  const porBuraco = d.meta / 18;
  const feitos = Math.min(18, Math.floor(total / porBuraco + 1e-9));
  const parte = feitos >= 18 ? 0 : (total - feitos * porBuraco) / porBuraco;
  const fase = FASES[faseDe(total, d.meta, d.apoios)];
  const en = l === 'en';
  const cel = (n) => {
    if (n <= feitos) return `<span class="fm-vb fm-vb--feito"><small>${n}</small><i></i></span>`;
    if (n === feitos + 1) return `<span class="fm-vb fm-vb--agora" style="--f:${parte.toFixed(2)}"><small>${n}</small><b></b></span>`;
    return `<span class="fm-vb"><small>${n}</small></span>`;
  };
  const linha = (a, nome, soma) => `<div class="fm-volta__l"><span class="fm-volta__n">${nome}</span>${Array.from({ length: 9 }, (_, i) => cel(a + i)).join('')}<span class="fm-volta__s">${soma}</span></div>`;
  return `${linha(1, en ? 'Out' : 'Ida', Math.min(9, feitos))}${linha(10, en ? 'In' : 'Volta', Math.max(0, feitos - 9))}
    <p class="fm-volta__q"><span class="fm-volta__f">${esc(en ? fase.en : fase.pt)}</span><span><b>${feitos >= 18 ? 18 : feitos}</b> ${en ? 'holes played' : 'buracos feitos'} · ${en ? '1 hole' : '1 buraco'} ≈ ${euros(porBuraco, l)}</span></p>`;
}

/* ── o apoio ──────────────────────────────────────────────── */

/* As marcas a caneta do cartão, como num cartão de golfe a sério: o par
 * sublinha-se, o birdie circula-se, o eagle leva dois círculos, o albatroz
 * três, o hole in one pinta-se. O valor livre leva um círculo. */
/* ── o cartão de apoio ────────────────────────────────────── */

/* Os nomes de golfe de cada valor, por ordem: estão lá pelo sorriso, o
   número é que manda. */
const GOLFE = ['Par', 'Birdie', 'Eagle', 'alb', 'Hole in one'];

/* Os símbolos dos modos de pagamento, desenhados aqui para não depender de
   ninguém: Apple, Visa, PayPal e Revolut são os do Simple Icons (CC0); o G é
   o de quatro cores da Google; MB WAY e Multibanco são letras. */
const SVG = (vb, corpo, cls = '') => `<svg viewBox="${vb}"${cls ? ` class="${cls}"` : ''} aria-hidden="true">${corpo}</svg>`;
const PAGAMENTO = {
  mb_way: ['<span class="fm-pg fm-pg--mbway"><b>MB</b>WAY</span>'],
  multibanco: ['<span class="fm-pg fm-pg--mb"><i>MB</i>Multibanco</span>'],
  card: [
    `<span class="fm-pg fm-pg--visa">${SVG('0 7 24 10', '<path fill="#1A1F71" d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"/>')}</span>`,
    `<span class="fm-pg fm-pg--mc">${SVG('0 0 38 24', '<circle cx="13" cy="12" r="9" fill="#EB001B"/><circle cx="25" cy="12" r="9" fill="#F79E1B"/><path fill="#FF5F00" d="M19 5.3a9 9 0 0 1 0 13.4 9 9 0 0 1 0-13.4Z"/>')}</span>`,
  ],
  apple_pay: [`<span class="fm-pg fm-pg--apple">${SVG('0 0 24 24', '<path fill="currentColor" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>')}Pay</span>`],
  google_pay: [`<span class="fm-pg fm-pg--google">${SVG('0 0 48 48', '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>')}Pay</span>`],
  paypal: [`<span class="fm-pg fm-pg--paypal">${SVG('0 0 24 24', '<path fill="#003087" d="M15.607 4.653H8.941L6.645 19.251H1.82L4.862 0h7.995c3.754 0 6.375 2.294 6.473 5.513-.648-.478-2.105-.86-3.722-.86m6.57 5.546c0 3.41-3.01 6.853-6.958 6.853h-2.493L11.595 24H6.74l1.845-11.538h3.592c4.208 0 7.346-3.634 7.153-6.949a5.24 5.24 0 0 1 2.848 4.686M9.653 5.546h6.408c.907 0 1.942.222 2.363.541-.195 2.741-2.655 5.483-6.441 5.483H8.714Z"/>')}PayPal</span>`],
  revolut_pay: [`<span class="fm-pg fm-pg--revolut">${SVG('0 0 24 24', '<path fill="currentColor" d="M20.9133 6.9566C20.9133 3.1208 17.7898 0 13.9503 0H2.424v3.8605h10.9782c1.7376 0 3.177 1.3651 3.2087 3.043.016.84-.2994 1.633-.8878 2.2324-.5886.5998-1.375.9303-2.2144.9303H9.2322a.2756.2756 0 0 0-.2755.2752v3.431c0 .0585.018.1142.052.1612L16.2646 24h5.3114l-7.2727-10.094c3.6625-.1838 6.61-3.2612 6.61-6.9494zM6.8943 5.9229H2.424V24h4.4704z"/>')}Pay</span>`],
};

function metodos(d, l) {
  const t = T[l].cartao;
  const lista = (d.pagamentos?.length ? d.pagamentos : ['card']).filter((m) => PAGAMENTO[m]);
  $('fmMetodos').innerHTML = lista.flatMap((m) => PAGAMENTO[m]).map((b) => `<li>${b}</li>`).join('');
  const nomes = lista.map((m) => t.metodos[m]);
  const junta = typeof Intl.ListFormat === 'function'
    ? new Intl.ListFormat(l === 'en' ? 'en-GB' : 'pt-PT', { type: 'disjunction' }).format(nomes)
    : nomes.join(', ');
  $('fmMetodosT').textContent = t.pagar(junta);
}

function formulario(d, l) {
  const t = T[l];
  const f = $('fmForm');
  $('fmLingua').value = l;
  const origem = new URLSearchParams(location.search).get('o');
  if (origem && /^[a-z0-9-]{1,20}$/.test(origem)) $('fmOrigem').value = origem;
  $('fmNome').placeholder = t.cartao.nome;
  $('fmMsg').placeholder = t.cartao.frase;

  // os valores vêm dos dados; o último botão é sempre o valor livre
  const valores = (d.valores?.length ? d.valores : [25, 50, 150, 300, 500]).slice(0, 5);
  // nenhum valor vem escolhido: quem apoia escolhe (`valorInicial` nos dados pré-escolhe um, se um dia se quiser)
  const inicial = valores.includes(d.valorInicial) ? d.valorInicial : null;
  const g = $('fmValores');
  g.querySelectorAll('.fm-ap__v:not(.fm-ap__v--livre)').forEach((c) => c.remove());
  g.querySelector('.fm-ap__v--livre').insertAdjacentHTML('beforebegin', valores.map((v, i) => {
    const golfe = GOLFE[i] === 'alb' ? t.cartao.alb : GOLFE[i];
    return `<label class="fm-ap__v"><input type="radio" name="valor" value="${v}"${v === inicial ? ' checked' : ''} /><b class="fm-ap__q">${euros(v, l)}</b>${golfe ? `<small>${golfe}</small>` : ''}</label>`;
  }).join(''));
  g.classList.toggle('fm-ap__vals--4', valores.length === 3);

  metodos(d, l);

  const campo = $('fmOutro');
  campo.min = d.minimo ?? 5;
  campo.max = d.maximo ?? 5000;

  // o que este apoio faz à meta: a barra com o que já há e, a cor de laranja,
  // o que este apoio lhe junta
  const temTotal = d.aberto && Number.isFinite(d.total) && d.meta > 0;
  $('fmEfeito').hidden = !temTotal;
  const efeito = (n) => {
    if (!temTotal) return;
    const ja = Math.min(1, d.total / d.meta);
    const seu = n > 0 ? Math.min(1 - ja, n / d.meta) : 0;
    $('fmEfJa').style.width = `${ja * 100}%`;
    $('fmEfSeu').style.width = `${seu * 100}%`;
    $('fmEfSeu').style.minWidth = seu > 0 ? '.45rem' : '0';
    const falta = d.meta - d.total - (n > 0 ? n : 0);
    $('fmEfeitoT').innerHTML = d.total >= d.meta ? t.cartao.alem
      : !(n > 0) ? t.cartao.faltaSo(euros(d.meta - d.total, l))
        : falta <= 0 ? t.cartao.chega(euros(n, l))
          : t.cartao.efeito(euros(n, l), euros(falta, l));
  };

  const escolhido = () => f.querySelector('input[name="valor"]:checked')?.value;
  const atualizar = () => {
    const v = escolhido();
    const eOutro = v === 'outro';
    $('fmOutroC').classList.toggle('fm-outro--on', eOutro);
    const n = eOutro ? Number(campo.value) : Number(v);
    $('fmBtT').textContent = !d.aberto ? t.fechado : n > 0 ? t.cartao.bt(euros(n, l)) : eOutro ? t.cartao.btOutro : t.cartao.escolha;
    $('fmBt').classList.toggle('fm-ap__bt--espera', d.aberto && !(n > 0));
    efeito(n);
  };
  f.addEventListener('change', (e) => {
    if (e.target.name === 'valor') {
      $('fmErro').hidden = true;
      g.classList.remove('fm-ap__vals--falta');
      if (e.target.value === 'outro') campo.focus();
    }
    atualizar();
  });
  campo.addEventListener('input', atualizar);
  campo.addEventListener('focus', () => { f.querySelector('input[value="outro"]').checked = true; atualizar(); });

  // a mensagem de apoio: um botão que abre o campo
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
    if (!dadosF.valor) {
      erro('semValor');
      // o grupo dos valores abana, para se ver onde é
      g.classList.remove('fm-ap__vals--falta');
      void g.offsetWidth;
      g.classList.add('fm-ap__vals--falta');
      g.querySelector('input')?.focus({ preventScroll: true });
      g.scrollIntoView({ behavior: quieto() ? 'auto' : 'smooth', block: 'center' });
      return;
    }
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
  const estado = (txt, classe = '') => { $('fmFotoEstado').textContent = txt; caixa.className = `fm-foto ${classe}`; pre.className = `fm-ap__foto ${classe}`; };
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

/** A bandeira do clube, desenhada em SVG: uma bandeira de buraco a sério,
 *  com a proporção de uma bandeira de green (cerca de 3 por 2), o pano a
 *  ondular em dobras, a bainha cosida, o nome do clube bordado e os nomes de
 *  quem apoia assinados a marcador, cada um com a sua cor e inclinação.
 *  O pano não cresce: com mais nomes, as assinaturas ficam mais pequenas e
 *  mais juntas, como numa bandeira assinada de verdade. `ondula` põe-na a
 *  mexer; `convite` deixa um lugar para o primeiro nome; `cena` prolonga a
 *  vara até sair da imagem (a fotografia do campo atrás). */
export function bandeiraSVG(nomes, { W = 640, max = 80, ondula = false, convite = false, vento = 1, cena = false, proporcao = 1.45, varaAbaixo = 0.3 } = {}) {
  const x0 = 40;
  const R = W - 16;
  const larg = R - x0;
  const topo = 30;
  const alt = Math.round(larg / proporcao);
  const fundo = topo + alt;
  const H = cena ? Math.round(fundo + alt * varaAbaixo) : fundo + 54;
  const lista = nomes.slice(0, max);
  const sorte = (n, k) => { let h = 2166136261 ^ k; for (const c of n) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };

  // o cabeçalho bordado
  const hh = alt * 0.27;
  const cx = x0 + larg / 2;
  const fc = Math.min(larg / 14, hh * 0.34);
  // o nome dela no topo do pano: dezassete letras, que têm de caber com folga
  const fh = Math.min(fc, larg / 17.5);

  // as assinaturas: escolhe-se a grelha que deixa a letra maior
  const ax0 = x0 + larg * 0.07;
  const ax1 = R - larg * 0.05;
  const ay0 = topo + hh + alt * 0.03;
  const ay1 = fundo - alt * 0.06;
  const aw = ax1 - ax0;
  const ah = ay1 - ay0;
  const n = lista.length;
  const medio = n ? lista.reduce((t, x) => t + Math.max(5, x.length), 0) / n : 10;
  let melhor = { c: 1, tam: 0 };
  for (let c = 1; c <= 8 && n; c++) {
    const linhas = Math.ceil(n / c);
    const tam = Math.min((ah / linhas) * 0.74, ((aw / c) * 0.9) / (medio * 0.44), fc * 1.15);
    if (tam > melhor.tam) melhor = { c, tam };
  }
  const cols = melhor.c;
  const linhas = Math.max(1, Math.ceil(n / cols));
  const celW = aw / cols;
  const celH = ah / linhas;
  const tintas = ['#1C1C1C', '#1E3A8A', '#14532D', '#1C1C1C', '#7A2E0E', '#273449'];
  let assin = '';
  lista.forEach((nome, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const nessa = r === linhas - 1 ? n - r * cols : cols; // a última linha, centrada
    const desvio = (cols - nessa) / 2 + (r % 2 ? 0.16 : -0.16) * (nessa > 1 ? 1 : 0);
    const tam = Math.min(melhor.tam * (0.88 + sorte(nome, 4) * 0.26), (celW * 0.94) / (Math.max(4, nome.length) * 0.44));
    const meia = nome.length * tam * 0.23;
    let x = ax0 + celW * (c + 0.5 + desvio) + (sorte(nome, 1) - 0.5) * celW * 0.14;
    x = Math.max(ax0 + meia, Math.min(ax1 - meia, x));
    const y = ay0 + celH * (r + 0.66) + (sorte(nome, 2) - 0.5) * celH * 0.22;
    const rot = ((sorte(nome, 3) - 0.5) * 16).toFixed(1);
    const cor = tintas[Math.floor(sorte(nome, 5) * tintas.length)];
    const letra = letraDe(nome);
    assin += `<text x="${x.toFixed(0)}" y="${y.toFixed(0)}" font-size="${(tam * letra.s).toFixed(1)}" font-family="'${letra.f}',Caveat,cursive" font-weight="${letra.p}" fill="${cor}" text-anchor="middle" transform="rotate(${rot} ${x.toFixed(0)} ${y.toFixed(0)})">${esc(nome)}</text>`;
  });

  // o pano: as orlas de cima e de baixo ondulam; `o` é o momento da onda
  const a = larg * 0.016 * vento;
  const pano = (o, d = 0) => {
    const t = topo + d;
    const b = fundo - d;
    const xl = x0 + d;
    const xr = R - d - Math.sin(o) * larg * 0.006;
    return `M${xl} ${t} C${x0 + larg * 0.3} ${t - a * Math.sin(o)} ${x0 + larg * 0.62} ${t + a * Math.sin(o + 1.6)} ${xr} ${t + 2 + a * 0.4 * Math.sin(o + 0.8)}`
      + ` C${xr + 3} ${t + (b - t) * 0.35} ${xr - 3} ${t + (b - t) * 0.7} ${xr} ${b + a * 0.4 * Math.sin(o + 2)}`
      + ` C${x0 + larg * 0.62} ${b + a * Math.sin(o + 1.6)} ${x0 + larg * 0.3} ${b - a * Math.sin(o)} ${xl} ${b} Z`;
  };
  const dur = (5.5 / vento).toFixed(1);
  const anima = (d) => (ondula ? `<animate attributeName="d" dur="${dur}s" repeatCount="indefinite" values="${pano(0, d)};${pano(1.4, d)};${pano(2.8, d)};${pano(1.4, d)};${pano(0, d)}" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1;.45 0 .55 1"/>` : '');
  const id = `fl${W}${n}${cena ? 'c' : ''}`;
  const bainha = Math.max(9, larg * 0.016);
  const vara = Math.max(10, larg * 0.017);
  const camadas = (fill) => `<path d="${pano(0)}" fill="${fill}">${anima(0)}</path>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="fm-flag${ondula ? ' fm-flag--ondula' : ''}"${cena ? ' preserveAspectRatio="xMinYMax meet"' : ''} aria-hidden="true">
    <defs>
      <linearGradient id="${id}p" x1="0" x2="1"><stop offset="0" stop-color="#E4DECD"/><stop offset=".35" stop-color="#FFFFFF"/><stop offset=".7" stop-color="#EAE5D7"/><stop offset="1" stop-color="#A39C8B"/></linearGradient>
      <linearGradient id="${id}d" x1="0" x2="1">
        <stop offset="0" stop-color="#6B5B3E" stop-opacity=".06"/><stop offset=".16" stop-color="#FFF" stop-opacity=".38"/><stop offset=".31" stop-color="#6B5B3E" stop-opacity=".06"/>
        <stop offset=".48" stop-color="#FFF" stop-opacity=".34"/><stop offset=".64" stop-color="#6B5B3E" stop-opacity=".07"/><stop offset=".81" stop-color="#FFF" stop-opacity=".3"/><stop offset="1" stop-color="#6B5B3E" stop-opacity=".1"/>
        ${ondula ? `<animateTransform attributeName="gradientTransform" type="translate" values="-.06 0;.06 0;-.06 0" dur="${dur}s" repeatCount="indefinite"/>` : ''}
      </linearGradient>
      <linearGradient id="${id}l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF3D6" stop-opacity=".32"/><stop offset=".45" stop-color="#FFF" stop-opacity="0"/><stop offset="1" stop-color="#3B3122" stop-opacity=".14"/></linearGradient>
      <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset=".8" stop-color="#3B3122" stop-opacity="0"/><stop offset="1" stop-color="#3B3122" stop-opacity=".13"/></linearGradient>
      <filter id="${id}s" x="-5%" y="-5%" width="115%" height="125%"><feDropShadow dx="${cena ? 1 : 2}" dy="${cena ? 3 : 6}" stdDeviation="${cena ? 3 : 6}" flood-color="#14291F" flood-opacity="${cena ? '.18' : '.22'}"/></filter>
    </defs>
    ${cena ? '' : `<ellipse cx="${x0 - 8}" cy="${H - 10}" rx="70" ry="7" fill="#14291F" opacity=".14"/>`}
    <rect x="${x0 - vara - 3}" y="10" width="${vara}" height="${cena ? H : H - 20}" ${cena ? '' : `rx="${vara / 2}"`} fill="url(#${id}p)"/>
    <circle cx="${x0 - 3 - vara / 2}" cy="11" r="${vara * 0.72}" fill="#F7F4EB" stroke="#B9B2A1" stroke-width=".8"/>
    <g class="fm-flag__pano" style="transform-origin:${x0}px ${topo}px">
    <g filter="url(#${id}s)"><path d="${pano(0)}" fill="#FCFAF3">${anima(0)}</path></g>
    ${camadas(`url(#${id}d)`)}${camadas(`url(#${id}l)`)}${camadas(`url(#${id}b)`)}
    <path d="${pano(0, larg * 0.016)}" fill="none" stroke="#1B5E3F" stroke-width="${Math.max(1, larg * 0.0018)}" stroke-dasharray="${larg * 0.008} ${larg * 0.0065}" opacity=".5">${anima(larg * 0.016)}</path>
    <rect x="${x0 - 4}" y="${topo - 2}" width="${bainha}" height="${alt + 4}" fill="#1B5E3F" opacity=".94"/>
    <g class="fm-flag__brasao" fill="none" stroke="#1B5E3F" stroke-linecap="round" stroke-linejoin="round">
      <path d="M${cx - fc * 0.22} ${topo + hh * 0.36}V${topo + hh * 0.06}l${fc * 0.42} ${hh * 0.055}-${fc * 0.42} ${hh * 0.055}" stroke-width="${Math.max(1.6, fc * 0.07)}"/>
      <path d="M${cx - fc * 2.1} ${topo + hh * 0.38}H${cx - fc * 0.6}M${cx + fc * 0.6} ${topo + hh * 0.38}H${cx + fc * 2.1}" stroke-width="${Math.max(.8, fc * 0.03)}" opacity=".6"/>
    </g>
    <text x="${cx}" y="${topo + hh * 0.72}" text-anchor="middle" font-family="Fraunces,serif" font-weight="600" font-size="${fh.toFixed(1)}" letter-spacing="${(fh * 0.14).toFixed(1)}" fill="#14291F">FRANCISCA SALGADO</text>
    <text x="${cx}" y="${topo + hh * 0.97}" text-anchor="middle" font-family="Fraunces,serif" font-style="italic" font-size="${(fc * 0.56).toFixed(1)}" fill="#1B5E3F">Road to Florida · 2027</text>
    <g class="fm-flag__nomes" font-family="Caveat,cursive" font-weight="600">${assin}</g>
    ${convite && !n ? `<g class="fm-flag__convite"><text x="${cx}" y="${ay0 + ah * 0.45}" text-anchor="middle" font-family="Caveat,cursive" font-size="${(fc * 0.95).toFixed(1)}" fill="#1B5E3F" opacity=".55">O primeiro nome fica aqui · Your name here</text><line x1="${x0 + larg * 0.2}" x2="${x0 + larg * 0.8}" y1="${ay0 + ah * 0.58}" y2="${ay0 + ah * 0.58}"/></g>` : ''}
    </g>
  </svg>`;
}

/** A bandeira «no campo»: a fotografia do buraco 9 de Praia D'El Rey, onde
 *  é o Roll Up, desfocada como numa fotografia tirada junto à bandeira, e a
 *  bandeira à frente, com a vara a sair da imagem. */
export function bandeiraCena(nomes, opcoes = {}) {
  return `<img class="fm-cena__f" src="/img/campos/praia-del-rey-9.webp" alt="" width="1400" height="933" decoding="async" />
    <span class="fm-cena__ceu" aria-hidden="true"></span>
    <span class="fm-cena__estrelas" aria-hidden="true"></span>
    <span class="fm-cena__nuvens" aria-hidden="true"></span>
    <span class="fm-cena__luz" aria-hidden="true"></span>
    ${bandeiraSVG(nomes, { ...opcoes, cena: true })}
    <canvas class="fm-flag fm-flag--tecido" aria-hidden="true"></canvas>
    <span class="fm-cena__tempo" aria-hidden="true"></span>`;
}

/* ── a bandeira de tecido ─────────────────────────────────────
 * O SVG de cima é uma bandeira desenhada: só as orlas ondulam, e o resto é
 * um cartão. Esta é de pano. O desenho da bandeira (a trama, a manga verde
 * cosida à volta da vara, o nome dela bordado, as assinaturas) pinta-se uma
 * vez numa textura, e cada quadro corta-a em tiras verticais que sobem e
 * descem numa onda que nasce quieta junto à vara e cresce até à ponta. Cada
 * tira apanha luz ou sombra conforme a inclinação do pano, e o pano encolhe
 * na horizontal onde dobra. É assim que os nomes se deformam com as dobras.
 * O vento da cena manda na onda; uma rajada faz o pano estalar. Se o canvas
 * falhar, fica o SVG. Com movimento reduzido, um quadro parado. */
/* As letras das assinaturas: cada pessoa assina com a sua mão. Uma bandeira
   assinada a sério tem marcador grosso, letra redonda de escola, assinatura
   corrida e rabiscos — com uma letra só, parecia impressa. A letra de cada
   nome sai do próprio nome (sempre a mesma para a mesma pessoa). `s` acerta o
   tamanho, porque cada letra tem a sua escala. */
const ASSINATURAS = [
  { f: 'Caveat', p: 600, s: 1 },
  { f: 'Kalam', p: 400, s: 0.8 },
  { f: 'Permanent Marker', p: 400, s: 0.66 },
  { f: 'Reenie Beanie', p: 400, s: 1.14 },
  { f: 'Homemade Apple', p: 400, s: 0.62 },
  { f: 'Nothing You Could Do', p: 400, s: 0.72 },
  { f: 'Covered By Your Grace', p: 400, s: 0.96 },
];
const letraDe = (nome) => {
  let h = 2166136261 ^ 6;
  for (const ch of nome) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return ASSINATURAS[(h >>> 0) % ASSINATURAS.length];
};

function texturaBandeira(nomes, { larg, alt, max = 80, convite = false }) {
  const TW = 1500;
  const q = TW / larg;
  const c = document.createElement('canvas');
  c.width = TW;
  c.height = Math.round(alt * q);
  const g = c.getContext('2d');
  g.scale(q, q);
  // o pano: branco-creme, um pouco mais quente em baixo
  const fundo = g.createLinearGradient(0, 0, 0, alt);
  fundo.addColorStop(0, '#FFFEF9');
  fundo.addColorStop(1, '#F1EDE2');
  g.fillStyle = fundo;
  g.fillRect(0, 0, larg, alt);
  // a trama: fios finos nas duas direcções e um grão leve
  g.lineWidth = 0.3;
  g.strokeStyle = 'rgba(110,98,74,.045)';
  g.beginPath();
  for (let y = 0.8; y < alt; y += 1.9) { g.moveTo(0, y); g.lineTo(larg, y); }
  g.stroke();
  let semente = 7;
  const acaso = () => { semente = (semente * 16807) % 2147483647; return semente / 2147483647; };
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = acaso() < 0.5 ? 'rgba(90,78,55,.05)' : 'rgba(255,255,255,.5)';
    g.fillRect(acaso() * larg, acaso() * alt, 0.9, 0.9);
  }
  // a manga do lado da vara: verde, com a costura à vista
  const manga = Math.max(10, larg * 0.034);
  const mg = g.createLinearGradient(0, 0, manga, 0);
  mg.addColorStop(0, '#123F2B');
  mg.addColorStop(0.45, '#1F6B48');
  mg.addColorStop(1, '#174F36');
  g.fillStyle = mg;
  g.fillRect(0, 0, manga, alt);
  g.setLineDash([larg * 0.007, larg * 0.005]);
  g.lineWidth = larg * 0.0018;
  g.strokeStyle = 'rgba(255,255,255,.55)';
  g.beginPath(); g.moveTo(manga - larg * 0.007, 0); g.lineTo(manga - larg * 0.007, alt); g.stroke();
  // a orla cosida nos outros três lados
  const m = larg * 0.02;
  g.strokeStyle = 'rgba(27,94,63,.42)';
  g.strokeRect(manga + m * 0.7, m, larg - manga - m * 1.7, alt - 2 * m);
  g.setLineDash([]);

  // o cabeçalho bordado: a bandeirinha, os traços, o nome dela e a viagem
  const hh = alt * 0.27;
  const cx = manga + (larg - manga) / 2;
  const fc = Math.min(larg / 14, hh * 0.34);
  const fh = Math.min(fc, larg / 17.5);
  g.strokeStyle = '#1B5E3F';
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.lineWidth = Math.max(1.4, fc * 0.07);
  g.beginPath();
  g.moveTo(cx - fc * 0.22, hh * 0.36); g.lineTo(cx - fc * 0.22, hh * 0.06);
  g.lineTo(cx + fc * 0.2, hh * 0.115); g.lineTo(cx - fc * 0.22, hh * 0.17);
  g.stroke();
  g.lineWidth = Math.max(0.7, fc * 0.03);
  g.globalAlpha = 0.6;
  g.beginPath();
  g.moveTo(cx - fc * 2.1, hh * 0.38); g.lineTo(cx - fc * 0.6, hh * 0.38);
  g.moveTo(cx + fc * 0.6, hh * 0.38); g.lineTo(cx + fc * 2.1, hh * 0.38);
  g.stroke();
  g.globalAlpha = 1;
  const espacado = (txt, x, y, esp) => {
    const letras = [...txt];
    const w = letras.map((l) => g.measureText(l).width);
    let px = x - (w.reduce((a, b) => a + b, 0) + esp * (letras.length - 1)) / 2;
    g.textAlign = 'left';
    letras.forEach((l, i) => { g.fillText(l, px, y); px += w[i] + esp; });
  };
  g.fillStyle = '#14291F';
  g.font = `600 ${fh.toFixed(1)}px Fraunces, Georgia, serif`;
  // bordado: uma sombra curta por baixo da linha
  g.shadowColor = 'rgba(20,41,31,.25)';
  g.shadowOffsetY = fh * 0.04;
  espacado('FRANCISCA SALGADO', cx, hh * 0.72, fh * 0.14);
  g.shadowColor = 'transparent';
  g.fillStyle = '#1B5E3F';
  g.font = `italic 400 ${(fc * 0.56).toFixed(1)}px Fraunces, Georgia, serif`;
  g.textAlign = 'center';
  g.fillText('Road to Florida · 2027', cx, hh * 0.97);

  // as assinaturas, a marcador: a mesma grelha do SVG
  const lista = nomes.slice(0, max);
  const n = lista.length;
  const ax0 = manga + larg * 0.05;
  const ax1 = larg - larg * 0.05;
  const ay0 = hh + alt * 0.03;
  const ay1 = alt - alt * 0.06;
  const aw = ax1 - ax0;
  const ah = ay1 - ay0;
  const sorte = (nome, k) => { let h = 2166136261 ^ k; for (const ch of nome) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };
  const medio = n ? lista.reduce((t, x) => t + Math.max(5, x.length), 0) / n : 10;
  let melhor = { c: 1, tam: 0 };
  for (let col = 1; col <= 8 && n; col++) {
    const linhas = Math.ceil(n / col);
    const tam = Math.min((ah / linhas) * 0.74, ((aw / col) * 0.9) / (medio * 0.44), fc * 1.15);
    if (tam > melhor.tam) melhor = { c: col, tam };
  }
  const cols = melhor.c;
  const linhas = Math.max(1, Math.ceil(n / cols));
  const celW = aw / cols;
  const celH = ah / linhas;
  const tintas = ['#1C1C1C', '#1E3A8A', '#14532D', '#1C1C1C', '#7A2E0E', '#273449'];
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  lista.forEach((nome, i) => {
    const r = Math.floor(i / cols);
    const col = i % cols;
    const nessa = r === linhas - 1 ? n - r * cols : cols;
    const desvio = (cols - nessa) / 2 + (r % 2 ? 0.16 : -0.16) * (nessa > 1 ? 1 : 0);
    const letra = letraDe(nome);
    let tam = melhor.tam * (0.88 + sorte(nome, 4) * 0.26) * letra.s;
    // mede-se a sério: cada letra tem a sua largura, e o nome tem de caber na célula
    g.font = `${letra.p} ${tam.toFixed(1)}px "${letra.f}", Caveat, cursive`;
    const largura = g.measureText(nome).width;
    if (largura > celW * 0.82) { tam *= (celW * 0.82) / largura; g.font = `${letra.p} ${tam.toFixed(1)}px "${letra.f}", Caveat, cursive`; }
    const meia = Math.min(largura, celW * 0.82) / 2;
    let x = ax0 + celW * (col + 0.5 + desvio) + (sorte(nome, 1) - 0.5) * celW * 0.08;
    x = Math.max(ax0 + meia, Math.min(ax1 - meia, x));
    const y = ay0 + celH * (r + 0.66) + (sorte(nome, 2) - 0.5) * celH * 0.22;
    g.save();
    g.translate(x, y);
    g.rotate(((sorte(nome, 3) - 0.5) * 16 * Math.PI) / 180);
    g.fillStyle = tintas[Math.floor(sorte(nome, 5) * tintas.length)];
    // o marcador grosso cobre mais; a esferográfica fina deixa ver o pano
    g.globalAlpha = letra.f === 'Permanent Marker' ? 0.88 : 0.93;
    g.fillText(nome, 0, 0);
    g.restore();
  });
  if (convite && !n) {
    g.fillStyle = 'rgba(27,94,63,.55)';
    g.font = `600 ${(fc * 0.95).toFixed(1)}px Caveat, cursive`;
    g.fillText('O primeiro nome fica aqui · Your name here', cx, ay0 + ah * 0.45);
    g.setLineDash([larg * 0.004, larg * 0.004]);
    g.strokeStyle = 'rgba(27,94,63,.45)';
    g.lineWidth = larg * 0.0012;
    g.beginPath(); g.moveTo(ax0 + aw * 0.15, ay0 + ah * 0.58); g.lineTo(ax1 - aw * 0.15, ay0 + ah * 0.58); g.stroke();
  }
  return c;
}

async function tecer(caixa, nomes, { W = 900, max = 80, vento = 1, convite = false, varaAbaixo = 0.3, proporcao = 1.45 } = {}) {
  caixa._tecido?.parar();
  const cv = caixa.querySelector('canvas.fm-flag--tecido');
  const ctx = cv?.getContext?.('2d');
  if (!ctx) return;
  try {
    await Promise.all(['600 40px Caveat', '600 40px Fraunces', 'italic 400 40px Fraunces', ...ASSINATURAS.map((a) => `${a.p} 40px "${a.f}"`)].map((f) => document.fonts.load(f)));
  } catch { /* desenha com o que houver */ }
  if (!cv.isConnected) return;

  // a mesma geometria do SVG, para a bandeira ficar no mesmo sítio
  const x0 = 40;
  const larg = W - 16 - x0;
  const topo = 30;
  const alt = Math.round(larg / proporcao);
  const H = Math.round(topo + alt + alt * varaAbaixo);
  const vara = Math.max(10, larg * 0.017);
  const tex = texturaBandeira(nomes, { larg, alt, max, convite });
  const TW = tex.width;
  const TH = tex.height;
  // tiras de 2 unidades: mais finas, e a orla ondula sem degraus
  const N = Math.round(larg / 2);
  const dy = new Float32Array(N + 1);
  const xs = new Float32Array(N + 1);
  const est = new Float32Array(N + 1);

  let dpr = 1;
  let cw = 0;
  let chh = 0;
  // o pano pinta-se à parte, para a luz e a sombra caírem só sobre ele
  const off = document.createElement('canvas');
  const octx = off.getContext('2d');
  const medir = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cw = cv.clientWidth;
    chh = cv.clientHeight;
    cv.width = Math.max(1, Math.round(cw * dpr));
    cv.height = Math.max(1, Math.round(chh * dpr));
    off.width = cv.width;
    off.height = cv.height;
  };
  medir();

  let fase = 0;
  let fase2 = 0;
  let fase3 = 0;
  let antes = null;
  let rajadaT0 = -99;
  let rajadaF = 1;
  // o vento a sério nunca é igual dois segundos seguidos: uma soma de ondas
  // lentas com períodos que não batem certo uns com os outros (não se repete)
  const sopro = (t) => 0.5 * Math.sin(t * 0.29 + 1.3) + 0.3 * Math.sin(t * 0.71 + 0.2) + 0.2 * Math.sin(t * 1.53 + 2.6);
  const t0 = Math.random() * 100;
  const desenhar = (t) => {
    const dt = antes == null ? 0 : Math.min(0.1, t - antes);
    antes = t;
    // a rajada: entra depressa e morre devagar
    const tr = t - rajadaT0;
    const raj = tr < 0 || tr > 5 ? 0 : Math.min(1, tr / 0.35) * Math.exp(-tr / 1.4) * rajadaF;
    // a força do vento agora: a de base, a subir e a descer devagar, e as rajadas
    const v = vento * (1 + 0.32 * sopro(t + t0)) * (1 + 1.1 * raj);
    // três ondas a correr a velocidades diferentes: a grande, uma segunda mais
    // curta e o tremor da ponta. Como andam desencontradas, o pano nunca repete
    fase += dt * 2.1 * v;
    fase2 += dt * 3.3 * v;
    fase3 += dt * (6 + 5 * raj) * v;
    // a onda: viva, mas sem dobrar os nomes ao ponto de não se lerem de longe
    const A = alt * 0.038 * Math.pow(v, 0.55);
    // com pouco vento o pano descai; com rajada estica
    const queda = (alt * 0.05) / Math.max(0.6, v);
    const k1 = Math.PI * 2 * 1.1;
    const k2 = Math.PI * 2 * 1.85;
    const k3 = Math.PI * 2 * 3.4;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const env = 0.08 + 0.92 * Math.pow(u, 0.85);
      const ph = k1 * u - fase;
      dy[i] = A * env * (Math.sin(ph) + 0.3 * Math.sin(k2 * u - fase2 + 1.3) + (0.1 + 0.25 * raj) * env * Math.sin(k3 * u - fase3))
        + queda * u * u;
      est[i] = 1 + 0.03 * env * v * Math.sin(ph + 1.1);
    }
    xs[0] = x0;
    const passo = larg / N;
    for (let i = 1; i <= N; i++) {
      const incl = (dy[i] - dy[i - 1]) / passo;
      xs[i] = xs[i - 1] + passo / Math.sqrt(1 + incl * incl);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, chh);
    const sc = Math.min(cw / W, chh / H);
    ctx.translate(0, chh - H * sc);
    ctx.scale(sc, sc);

    // a vara: fibra branca, redonda, com a bola no topo
    const px = x0 - vara - 3;
    const gv = ctx.createLinearGradient(px, 0, px + vara, 0);
    gv.addColorStop(0, '#9E9786'); gv.addColorStop(0.35, '#FFFFFF'); gv.addColorStop(0.7, '#E2DCCB'); gv.addColorStop(1, '#8F887A');
    ctx.fillStyle = gv;
    ctx.fillRect(px, 10, vara, H);
    const gb = ctx.createRadialGradient(px + vara * 0.35, 6, 1, px + vara / 2, 11, vara * 0.8);
    gb.addColorStop(0, '#FFFFFF'); gb.addColorStop(1, '#B5AE9E');
    ctx.fillStyle = gb;
    ctx.beginPath(); ctx.arc(px + vara / 2, 11, vara * 0.75, 0, Math.PI * 2); ctx.fill();

    // o pano, tira a tira, no canvas de trabalho
    octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.clearRect(0, 0, off.width, off.height);
    octx.setTransform(dpr * sc, 0, 0, dpr * sc, 0, dpr * (chh - H * sc));
    octx.imageSmoothingQuality = 'high';
    const sw = TW / N;
    for (let i = 0; i < N; i++) {
      const h = alt * est[i];
      octx.drawImage(tex, i * sw, 0, sw + 0.6, TH, xs[i], topo + dy[i] - (h - alt) / 2, xs[i + 1] - xs[i] + 0.6, h);
    }
    // a luz e a sombra das dobras: o pano que sobe para a ponta apanha luz, o
    // que desce fica na sombra. Dois gradientes de lado a lado, pintados só
    // por cima do pano (source-atop), sem as costuras de tira para tira.
    const xa = xs[0];
    const xb = xs[N];
    const claro = octx.createLinearGradient(xa, 0, xb, 0);
    const escuro = octx.createLinearGradient(xa, 0, xb, 0);
    for (let i = 0; i < N; i += 2) {
      const incl = (dy[i + 1] - dy[i]) / (larg / N);
      const luz = Math.max(-0.65, Math.min(0.65, -incl * 2.6));
      const pos = (xs[i] - xa) / (xb - xa);
      claro.addColorStop(pos, `rgba(255,252,242,${Math.max(0, luz * 0.62).toFixed(3)})`);
      escuro.addColorStop(pos, `rgba(46,36,20,${Math.max(0, -luz * 0.55).toFixed(3)})`);
    }
    octx.globalCompositeOperation = 'source-atop';
    octx.fillStyle = claro;
    octx.fillRect(xa - 2, 0, xb - xa + 4, H);
    octx.fillStyle = escuro;
    octx.fillRect(xa - 2, 0, xb - xa + 4, H);
    // a manga é um tubo: sombra e brilho redondos por cima do verde
    const manga = Math.max(10, larg * 0.034);
    const gm = octx.createLinearGradient(x0, 0, x0 + manga, 0);
    gm.addColorStop(0, 'rgba(0,0,0,.3)'); gm.addColorStop(0.45, 'rgba(255,255,255,.18)'); gm.addColorStop(1, 'rgba(0,0,0,.22)');
    octx.fillStyle = gm;
    octx.fillRect(x0, 0, manga, H);
    octx.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(off, 0, 0);
  };

  caixa.classList.add('fm-cena--tecido');
  let raf = 0;
  let visivel = true;
  let ultimo = 0;
  const parado = quieto();
  const quadro = (ms) => {
    raf = requestAnimationFrame(quadro);
    if (document.hidden || !visivel || ms - ultimo < 33) return;
    ultimo = ms;
    desenhar(ms / 1000);
  };
  const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver((e) => { visivel = e.some((x) => x.isIntersecting); }) : null;
  io?.observe(cv);
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { medir(); if (parado) desenhar(1.4); }) : null;
  ro?.observe(cv);
  if (parado) desenhar(1.4); else raf = requestAnimationFrame(quadro);
  caixa._tecido = {
    parar() { cancelAnimationFrame(raf); io?.disconnect(); ro?.disconnect(); },
    rajada() { rajadaT0 = performance.now() / 1000; rajadaF = 0.55 + Math.random() * 0.6; },
  };
}

/* ── o céu da cena ────────────────────────────────────────────
 * A cena da bandeira acompanha Praia D'El Rey a sério: a luz é a da hora que
 * é (a altura do sol em Óbidos, calculada aqui, sem serviço nenhum), o céu é
 * o do tempo que faz (o mesmo Open-Meteo das condições de jogo) e o vento
 * dá rajadas à bandeira de vez em quando, mais seguidas e mais fortes quando
 * sopra a sério. Os nomes têm de se ler sempre: a noite escurece o campo,
 * não a bandeira.
 *
 * `?ceu=noite,chuva,40,rajada` força um estado, para ver como fica: uma luz
 * (manha, dia, dourada, crepusculo, noite), um tempo (limpo, parcial,
 * nublado, nevoeiro, chuva, trovoada, neve), o vento em km/h e rajadas de
 * quatro em quatro segundos. */
const CEU_LUZES = ['manha', 'dia', 'dourada', 'crepusculo', 'noite'];
const CEU_TEMPOS = ['limpo', 'parcial', 'nublado', 'nevoeiro', 'chuva', 'trovoada', 'neve'];
const ceu = { luz: null, manha: true, tempo: null, kmh: null, rajadaKmh: null, agora: null };
let ceuForcado = null;
function forcado() {
  if (ceuForcado) return ceuForcado;
  ceuForcado = {};
  const q = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('ceu');
  for (const p of (q || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean)) {
    if (CEU_LUZES.includes(p)) ceuForcado.luz = p;
    else if (CEU_TEMPOS.includes(p)) ceuForcado.tempo = p;
    else if (p === 'rajada') ceuForcado.rajada = true;
    else if (/^\d{1,3}$/.test(p)) ceuForcado.kmh = Number(p);
  }
  return ceuForcado;
}

/** A altura do sol (graus acima do horizonte) num sítio e num instante, e se
 *  ainda é de manhã. A fórmula curta do almanaque: chega e sobra para saber
 *  se é noite, crepúsculo, hora dourada ou dia. */
function alturaSol(lat, lon, ms = Date.now()) {
  const r = Math.PI / 180;
  const n = ms / 86400000 - 10957.5; // dias desde 1 jan 2000, 12h UTC
  const g = (357.529 + 0.98560028 * n) * r;
  const q = 280.459 + 0.98564736 * n;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * r;
  const e = (23.439 - 0.00000036 * n) * r;
  const ar = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / r;
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const tsg = (18.697374558 + 24.06570982441908 * n) * 15; // tempo sideral, em graus
  const h = ((((tsg + lon - ar) % 360) + 540) % 360) - 180; // ângulo horário
  const alt = Math.asin(Math.sin(lat * r) * Math.sin(dec) + Math.cos(lat * r) * Math.cos(dec) * Math.cos(h * r)) / r;
  return { alt, manha: h < 0 };
}

function luzDoSol(lat, lon) {
  const { alt, manha } = alturaSol(lat, lon);
  if (alt < -6) return ['noite', manha];
  if (alt < 0) return ['crepusculo', manha];
  if (alt < 10) return ['dourada', manha];
  if (alt < 25 && manha) return ['manha', manha];
  return ['dia', manha];
}

function tempoDe(codigo) {
  const c = Number(codigo);
  if (!Number.isFinite(c)) return null;
  if (c <= 1) return 'limpo';
  if (c === 2) return 'parcial';
  if (c === 45 || c === 48) return 'nevoeiro';
  if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return 'chuva';
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return 'neve';
  if (c >= 95) return 'trovoada';
  return 'nublado';
}

/** Quanto a bandeira ondula: mais depressa com mais vento. */
const ventoDaBandeira = () => (ceu.kmh == null ? 1 : Math.max(0.7, Math.min(2.2, 0.6 + ceu.kmh / 22)));

/** Refaz o estado do céu (a luz pela hora; o tempo, se vier) e pinta as cenas. */
function atualizarCeu(d, atual = null) {
  const c = d?.evento?.coordenadas ?? { lat: 39.331, lon: -9.327 };
  const f = forcado();
  const [luz, manha] = luzDoSol(c.lat, c.lon);
  ceu.luz = f.luz || luz;
  ceu.manha = manha;
  if (atual) {
    ceu.agora = atual;
    ceu.tempo = tempoDe(atual.weather_code);
    ceu.kmh = Number.isFinite(atual.wind_speed_10m) ? atual.wind_speed_10m : null;
    ceu.rajadaKmh = Number.isFinite(atual.wind_gusts_10m) ? atual.wind_gusts_10m : null;
  }
  if (f.tempo) ceu.tempo = f.tempo;
  if (f.kmh != null) { ceu.kmh = f.kmh; ceu.rajadaKmh = f.kmh * 1.4; }
  if (typeof document !== 'undefined') document.querySelectorAll('.fm-cena').forEach(aplicarCeu);
}

function aplicarCeu(caixa) {
  if (!ceu.luz) return;
  caixa.dataset.luz = ceu.luz;
  if (ceu.tempo) caixa.dataset.tempo = ceu.tempo; else delete caixa.dataset.tempo;
  // o sol nasce do lado da vara e põe-se do lado da ponta do pano
  caixa.style.setProperty('--sol-x', ceu.manha ? '12%' : '88%');
  rajadas(caixa);
}

/* As rajadas: o pano dá um esticão a partir da vara, passam umas linhas de
   vento e, às vezes, uma folha. Mais seguidas e mais fortes com mais vento. */
const FOLHA = '<svg viewBox="0 0 24 24"><path d="M3.5 20.5C3.5 10 10 3.5 20.5 3.5c0 10.5-6.5 17-17 17Z" fill="#7F933F"/><path d="M3.5 20.5 15 9" stroke="#56662B" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>';
function rajada(caixa) {
  if (!caixa.isConnected) return;
  const forca = Math.min(1, Math.max(0.4, (ceu.rajadaKmh ?? ceu.kmh ?? 18) / 45));
  caixa.style.setProperty('--rajada', forca.toFixed(2));
  caixa.classList.remove('fm-cena--rajada');
  void caixa.offsetWidth;
  caixa.classList.add('fm-cena--rajada');
  caixa._tecido?.rajada();
  if (Math.random() < 0.3) {
    const folha = document.createElement('span');
    folha.className = 'fm-cena__folha';
    folha.setAttribute('aria-hidden', 'true');
    folha.style.top = `${22 + Math.random() * 45}%`;
    folha.innerHTML = FOLHA;
    caixa.append(folha);
    setTimeout(() => folha.remove(), 3400);
  }
  setTimeout(() => caixa.classList.remove('fm-cena--rajada'), 2300);
}
function rajadas(caixa) {
  if (caixa.dataset.rajadas || quieto()) return;
  caixa.dataset.rajadas = '1';
  const proxima = () => {
    if (!caixa.isConnected) return;
    const base = forcado().rajada ? 4 : Math.max(7, 30 - (ceu.kmh ?? 12) * 0.55);
    setTimeout(() => { rajada(caixa); proxima(); }, base * (0.7 + Math.random() * 0.6) * 1000);
  };
  proxima();
}

/** Na página: o tempo de agora em Praia D'El Rey, uma vez e depois de 15 em
 *  15 minutos, e a linha que o diz por baixo da bandeira. */
function ceuDaPagina(d, l) {
  const c = d.evento?.coordenadas ?? { lat: 39.331, lon: -9.327 };
  atualizarCeu(d);
  const pedir = async () => {
    try {
      const q = new URLSearchParams({
        latitude: c.lat, longitude: c.lon,
        current: 'temperature_2m,is_day,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
        timezone: 'Europe/Lisbon', wind_speed_unit: 'kmh',
      });
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`);
      const j = await r.json();
      if (!r.ok || !j.current) throw new Error('meteo');
      const antes = ceu.kmh;
      atualizarCeu(d, j.current);
      if (antes == null || Math.abs(antes - (ceu.kmh ?? 0)) > 6) bandeira(d, l);
      const a = j.current;
      const [ic, pt, en] = ceuAgora(a.weather_code, a.is_day);
      const r8 = rumo(a.wind_direction_10m);
      const linha = $('fmBandeiraAgora');
      linha.innerHTML = `${icone(ic)}<span>${l === 'en'
        ? `Right now at Praia D'El Rey: ${en.toLowerCase()}, ${Math.round(a.temperature_2m)}°, wind ${RUMOS_EN[r8]} at ${Math.round(a.wind_speed_10m)} km/h.`
        : `Agora em Praia D'El Rey: ${pt.toLowerCase()}, ${Math.round(a.temperature_2m)}°, vento ${RUMOS_PT[r8]} a ${Math.round(a.wind_speed_10m)} km/h.`}</span>`;
      linha.hidden = false;
    } catch { /* fica a luz da hora, sem o tempo */ }
  };
  pedir();
  setInterval(pedir, 15 * 60000);
  setInterval(() => atualizarCeu(d), 5 * 60000);
}

function bandeira(d, l) {
  const t = T[l];
  const nomes = unicos(d.mural);
  const caixa = $('fmBandeira');
  const estreita = caixa.clientWidth < 560;
  caixa.classList.add('fm-cena');
  const op = { W: 900, ondula: !quieto(), convite: !nomes.length, vento: ventoDaBandeira() };
  caixa.innerHTML = bandeiraCena(nomes, op);
  aplicarCeu(caixa);
  tecer(caixa, nomes, op);
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

/* ── a previsão para o Roll Up ───────────────────────────────
 * O mesmo cartão das condições de jogo do ecrã, na secção do evento: a
 * previsão para a manhã do Roll Up (9h–13h) em Praia D'El Rey, do
 * Open-Meteo, quando o dia está a 16 dias ou menos. Antes disso, diz quando
 * aparece; no dia seguinte ao evento, some. */
const maiuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

async function previsao(d, l) {
  const caixa = $('fmPrevisao');
  const ev = d.evento;
  if (!caixa) return;
  if (!ev?.data || !ev.mostrar) { caixa.hidden = true; return; }
  const en = l === 'en';
  const dias = diasEntre(diaLisboa(), ev.data);
  if (dias < 0) { caixa.hidden = true; return; }
  caixa.classList.toggle('fm-prev--en', en);
  const c = ev.coordenadas ?? { lat: 39.331, lon: -9.327 };
  const local = tx(ev.local, l) || "Praia D'El Rey";
  const cab = `<div class="fm-cond__cab"><b>${en ? 'Playing conditions' : 'Condições de jogo'}</b><span>${esc(local)}</span><span class="fm-prev__dia">${esc(maiuscula(dataLonga(ev.data, l)))} · ${en ? 'morning, 9am–1pm' : 'manhã, 9h–13h'}</span></div>`;
  const aviso = (txt) => { caixa.innerHTML = `${cab}<p class="fm-cond__sem">${txt}</p>`; };
  if (dias > 15) {
    const desde = new Date(ms(ev.data) - 15 * DIA).toISOString().slice(0, 10);
    aviso(en ? `The forecast for the morning of the Roll Up appears here from ${dataCurta(desde, l)}.` : `A previsão para a manhã do Roll Up aparece aqui a partir de ${dataCurta(desde, l)}.`);
    return;
  }
  aviso(en ? 'Fetching the forecast…' : 'A obter a previsão…');
  try {
    const q = new URLSearchParams({
      latitude: c.lat, longitude: c.lon, start_date: ev.data, end_date: ev.data,
      hourly: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation_probability',
      daily: 'sunrise,sunset', timezone: 'Europe/Lisbon', timeformat: 'unixtime', wind_speed_unit: 'kmh',
    });
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`, { cache: 'no-store' });
    const j = await r.json();
    if (!r.ok || !j.hourly?.time?.length) throw new Error('tempo');
    const h = j.hourly;
    const horaDe = (t) => Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Lisbon', hour: '2-digit', hourCycle: 'h23' }).format(t * 1000));
    const manha = h.time.map((t, i) => ({ t, i, hh: horaDe(t) })).filter((x) => x.hh >= 9 && x.hh <= 13);
    if (!manha.length) throw new Error('tempo');
    const meio = manha.find((x) => x.hh === 11) ?? manha[Math.floor(manha.length / 2)];
    const i = meio.i;
    const [ic, cpt, cen] = ceuAgora(h.weather_code[i], 1);
    const rr = rumo(h.wind_direction_10m[i]);
    const [ept, een] = efeitoVento(h.wind_speed_10m[i]);
    const chuva = Math.max(...manha.map((x) => h.precipitation_probability?.[x.i] ?? 0));
    const horas = manha.map((x) => {
      const [hic] = ceuAgora(h.weather_code[x.i], 1);
      return `<li><span class="fm-cond__h">${x.hh}h</span>${icone(hic)}<b>${Math.round(h.temperature_2m[x.i])}°</b>
        <span class="fm-cond__hv">${icone('seta', h.wind_direction_10m[x.i] || 0)}${Math.round(h.wind_speed_10m[x.i])}</span><small>${h.precipitation_probability?.[x.i] ?? 0}%</small></li>`;
    }).join('');
    const nascer = j.daily?.sunrise?.[0];
    const ocaso = j.daily?.sunset?.[0];
    caixa.innerHTML = `${cab}
      <div class="fm-cond__vento">
        ${rosa(h.wind_direction_10m[i], h.wind_speed_10m[i])}
        <div class="fm-cond__vt">
          <small>${en ? 'Wind at 11am' : 'Vento às 11h'}</small>
          <b>${en ? `from the ${RUMOS_LONGOS_EN[rr]}` : `de ${RUMOS_LONGOS_PT[rr]}`}</b>
          <span>${en ? 'gusts' : 'rajadas'} <b>${Math.round(h.wind_gusts_10m[i])}</b> km/h</span>
          <em>${en ? een : ept}</em>
        </div>
      </div>
      <div class="fm-cond__grelha">
        <div>${icone(ic)}<b>${Math.round(h.temperature_2m[i])}°</b><small>${en ? cen : cpt}</small></div>
        <div>${icone('gota')}<b>${chuva}%</b><small>${en ? 'rain, 9am–1pm' : 'chuva, 9h–13h'}</small></div>
      </div>
      <ul class="fm-cond__horas">${horas}</ul>
      <div class="fm-cond__sol">${nascer ? `<span>${icone('nascer')}${horaLisboa(nascer * 1000)}</span>` : ''}${ocaso ? `<span>${icone('ocaso')}${horaLisboa(ocaso * 1000)}</span>` : ''}</div>
      <p class="fm-prev__fonte">${en ? 'Forecast: Open-Meteo, updated on each visit.' : 'Previsão: Open-Meteo, atualizada a cada visita.'}</p>`;
  } catch {
    aviso(en ? 'The forecast is unavailable right now. Try again later.' : 'A previsão não está disponível de momento. Volte a tentar mais logo.');
  }
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

/* ── o ecrã: um quadro de resultados de golfe ────────────────
 * Claro (é de manhã, ao sol), como os quadros dos torneios: uma barra verde
 * com o dia e a hora, o total em placas, o cartão dos 18 buracos (a meta
 * dividida em 18; «buracos feitos» como nos quadros), a bandeira com as
 * assinaturas, o QR, e ao lado as condições de jogo em Praia D'El Rey.
 * A volta cresce em fases, e cada fase tem o seu momento em grande. */

const FASES = [
  { pt: 'No 1.º tee', en: 'On the 1st tee' },
  { pt: 'Na ida', en: 'Front nine', marco: 'Primeira pancada!', marcoEn: 'First shot!' },
  { pt: 'A caminho da volta', en: 'Heading to the turn', marco: 'Bom arranque!', marcoEn: 'Great start!' },
  { pt: 'Na volta', en: 'Back nine', marco: 'Na volta!', marcoEn: 'At the turn!' },
  { pt: 'Últimos buracos', en: 'Coming home', marco: 'A caminho do 18!', marcoEn: 'Heading for the 18th!' },
  { pt: 'Embocou! Meta atingida', en: 'Holed out!', marco: 'Embocou!', marcoEn: 'Holed out!' },
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

/** Na meta: confettis e bolas de golfe a cair, sem parar. */
function confettis(fase) {
  const cores = ['#1B5E3F', '#E07A1F', '#F2C14E', '#2E8B57', '#FFFFFF'];
  $('fmEcraConfettis').innerHTML = quieto() || fase < 5 ? '' : Array.from({ length: 80 }, (_, i) =>
    `<i class="${i % 4 ? 'fm-conf' : 'fm-conf fm-conf--bola'}" style="left:${acaso(0, 100).toFixed(1)}vw;--c:${cores[i % cores.length]};--dur:${acaso(6, 12).toFixed(1)}s;--atraso:-${acaso(0, 12).toFixed(1)}s;--r:${acaso(-360, 360).toFixed(0)}deg;--x:${acaso(-8, 8).toFixed(1)}vw"></i>`).join('');
}

/** O convite debaixo do QR vai mudando. */
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

/** O momento de passar de fase: uma bola rola até à bandeira e cai no buraco. */
function marco(caixa, m) {
  const f = FASES[m.marco];
  const en = linguaEcra() === 'en';
  const pct = m.marco >= 5 ? '100' : String([0, 0, 25, 50, 75][m.marco] || '');
  const falta = en ? `<b>${euros(m.falta, 'en')}</b> to go` : `Faltam <b>${euros(m.falta, 'pt')}</b>`;
  caixa.innerHTML = `<div class="fm-destaque__fundo"></div>
    <div class="fm-marco">
      <div class="fm-marco__green" aria-hidden="true"><span class="fm-marco__pino">${icone('bandeira')}</span><span class="fm-marco__copo"></span><span class="fm-marco__bola"></span></div>
      ${m.marco > 1 ? `<p class="fm-marco__p">${pct}<small>%</small></p>` : ''}
      <p class="fm-marco__t d">${esc(en ? f.marcoEn : f.marco)}</p>
      <p class="fm-marco__f">${m.falta > 0 ? falta : en ? 'Thank you, everyone' : 'Obrigada a todos'}</p>
    </div>`;
  caixa.className = 'fm-destaque fm-destaque--marco';
  void caixa.offsetWidth;
  caixa.classList.add('fm-destaque--on');
  setTimeout(() => bolas(caixa, '50vw', '45vh', 30 + m.marco * 10), 2300);
  setTimeout(() => {
    caixa.classList.add('fm-destaque--sai');
    setTimeout(proximoDestaque, 1000);
  }, (m.marco >= 5 ? 12000 : 8500) * pressa());
}

/** O total em placas, como os números pendurados num quadro de torneio. */
function placas(el, valor) {
  el.innerHTML = [...euros(valor, 'pt')].map((c) => (c === ' ' ? '<i class="fm-placa fm-placa--v"></i>'
    : `<i class="fm-placa${/[0-9]/.test(c) ? '' : c === '€' ? ' fm-placa--e' : ' fm-placa--s'}">${c}</i>`)).join('');
}
function contarPlacas(el, de, ate, dur = 1800) {
  if (quieto() || de === ate) { placas(el, ate); return; }
  const t0 = performance.now();
  const passo = (agora) => {
    const k = Math.min(1, (agora - t0) / dur);
    placas(el, Math.round(de + (ate - de) * (1 - (1 - k) ** 3)));
    if (k < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

/** O cartão dos 18 buracos: a meta dividida em 18. Os feitos ficam marcados,
 *  a bola está no buraco que se joga, e ao lado os «buracos feitos». */
function buracos(total, meta) {
  const porBuraco = meta / 18;
  const feitos = Math.min(18, Math.floor(total / porBuraco + 1e-9));
  const parte = feitos >= 18 ? 0 : (total - feitos * porBuraco) / porBuraco;
  const cel = (n) => {
    if (n <= feitos) return `<span class="fm-bur__c fm-bur__c--feito"><i class="fm-bur__ok"></i></span>`;
    if (n === feitos + 1 && total > 0) return `<span class="fm-bur__c fm-bur__c--agora" style="--f:${parte.toFixed(2)}"><i class="fm-bur__bola"></i></span>`;
    if (n === 1 && total <= 0) return `<span class="fm-bur__c fm-bur__c--agora fm-bur__c--tee" style="--f:0"><i class="fm-bur__bola"></i></span>`;
    return '<span class="fm-bur__c"></span>';
  };
  const num = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => `<span class="fm-bur__n">${a + i}</span>`).join('');
  const linha = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => cel(a + i)).join('');
  return `<div class="fm-bur">
      <span class="fm-bur__lab fm-bur__lab--h">${bi('Buraco', 'Hole')}</span>${num(1, 9)}<span class="fm-bur__t fm-bur__t--h">${bi('Ida', 'Out')}</span>${num(10, 18)}<span class="fm-bur__t fm-bur__t--h">${bi('Volta', 'In')}</span>
      <span class="fm-bur__lab">${bi('Feito', 'Done')}</span>${linha(1, 9)}<span class="fm-bur__t">${Math.min(9, feitos)}</span>${linha(10, 18)}<span class="fm-bur__t">${Math.max(0, feitos - 9)}</span>
    </div>
    <div class="fm-bur__thru"><small>${bi('Buracos feitos', 'Thru')}</small><b>${feitos >= 18 ? 'F' : feitos}</b><span>${bi(`1 buraco ≈ ${euros(porBuraco, 'pt')}`, `1 hole ≈ ${euros(porBuraco, 'en')}`)}</span></div>`;
}

let ecraAntes = null;
function ecra(d) {
  const total = d.total ?? 0;
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

  if (!antes || antes.fase !== fase) {
    faseAtual = fase;
    $('fmEcra').dataset.fase = String(fase);
    confettis(fase);
  }
  $('fmEcraFase').innerHTML = `<b>${bi(esc(FASES[fase].pt), esc(FASES[fase].en))}</b>`;

  contarPlacas($('fmEcraTotal'), antes ? antes.total : 0, total, antes ? 2200 : 2600);
  $('fmEcraMeta').innerHTML = bi(`de ${euros(d.meta, 'pt')}`, `of ${euros(d.meta, 'en')}`);
  const faltam = d.partida ? diasEntre(diaLisboa(), d.partida) : -1;
  const parte = d.meta > 0 ? total / d.meta : 0;
  $('fmEcraInfo').innerHTML = [
    `<div class="fm-num fm-num--meta"><b>${Math.round(parte * 100)}%</b><small>${bi('da meta', 'of the target')}</small><span class="fm-num__barra"><i style="width:${(Math.min(1, parte) * 100).toFixed(1)}%"></i></span></div>`,
    `<div class="fm-num"><b>${d.apoios ?? 0}</b><small>${bi(d.apoios === 1 ? 'apoio' : 'apoios', d.apoios === 1 ? 'gift' : 'gifts')}</small></div>`,
    `<div class="fm-num${d.hoje ? ' fm-num--hoje' : ''}"><b>${d.hoje ? `+${euros(d.hoje, 'pt')}` : euros(0, 'pt')}</b><small>${bi('hoje', 'today')}</small></div>`,
    faltam >= 0 ? `<div class="fm-num"><b>${faltam}</b><small>${bi(faltam === 1 ? 'dia para partir' : 'dias para partir', faltam === 1 ? 'day to go' : 'days to go')}</small></div>` : '',
  ].join('');
  $('fmEcraBuracos').innerHTML = buracos(total, d.meta);

  // a bandeira só se redesenha quando entra um nome novo (e ondula com o vento)
  const nomes = unicos(mural);
  if (!antes || antes.nomes !== ecraAntes.nomes) desenharBandeira(nomes);

  // os postais: um de cada vez, pousados na fotografia do campo ao lado da
  // bandeira; sem mensagens ainda, postais por escrever, a convidar
  const msgs = mural.filter((m) => tx(m.mensagem, 'pt') || m.foto).slice(0, 30);
  const caixaR = $('fmEcraFita');
  const chave = msgs.length ? msgs.map((m) => `${m.id}${m.foto ? 'f' : ''}`).join('|') : 'vazio';
  if (caixaR.dataset.chave !== chave) {
    caixaR.dataset.chave = chave;
    const um = msgs.length ? msgs.map((m, i) => postal(m, 'pt', i, true)).join('') : POR_ESCREVER.map(postalVazio).join('');
    caixaR.innerHTML = `<ul>${um}</ul>`;
    recadoN = -1;
    proximoRecado();
  }

  if (!antes) return;
  const novos = mural.filter((m) => !antes.ids.has(m.id));
  const fotosNovas = mural.filter((m) => m.foto && antes.ids.has(m.id) && !antes.fotos.has(m.id));
  [...novos, ...fotosNovas].reverse().forEach(destacar);
  if (total > antes.total && !novos.length) festa(total - antes.total);
  if (fase > antes.fase) destacar({ marco: fase, falta: Math.max(0, d.meta - total) });
}

/** Os postais rodam de 7 em 7 segundos: o que sai voa para trás, o seguinte
 *  pousa por cima. */
let recadoN = -1;
let recadoT = null;
function proximoRecado() {
  const lista = [...$('fmEcraFita').querySelectorAll('li')];
  clearTimeout(recadoT);
  if (!lista.length) return;
  const antes = lista[recadoN];
  recadoN = (recadoN + 1) % lista.length;
  lista.forEach((li, i) => li.classList.toggle('fm-postal--on', i === recadoN));
  if (antes && antes !== lista[recadoN]) {
    antes.classList.add('fm-postal--sai');
    setTimeout(() => antes.classList.remove('fm-postal--sai'), 900);
  }
  if (lista.length > 1) recadoT = setTimeout(proximoRecado, 7000);
}

let nomesBandeira = [];
function desenharBandeira(nomes = nomesBandeira) {
  nomesBandeira = nomes;
  // a bandeira ondula mais depressa quando há mais vento no campo
  const op = { W: 900, max: 70, ondula: true, convite: !nomes.length, vento: ventoDaBandeira(), varaAbaixo: 0.1 };
  $('fmEcraBandeira').innerHTML = bandeiraCena(nomes, op);
  aplicarCeu($('fmEcraBandeira'));
  tecer($('fmEcraBandeira'), nomes, op);
}

/* ── as condições de jogo em Praia D'El Rey ────────────────────
 * Do Open-Meteo (sem chave), pedido pelo browser do ecrã de 10 em 10 minutos,
 * para as coordenadas em data/fundme.json (evento.coordenadas). Se falhar,
 * ficam o dia e a hora. O efeito do vento é a regra dos jogadores: cerca de
 * um taco por cada 16 km/h (10 mph) de vento de frente. */

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
  termometro: '<path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0Z"/><path d="M12 9v7"/>',
  humidade: '<path d="M7 4c2.3 2.8 4 5 4 7a4 4 0 0 1-8 0c0-2 1.7-4.2 4-7ZM17 9c1.7 2 3 3.7 3 5.2a3 3 0 0 1-6 0c0-1.5 1.3-3.2 3-5.2Z"/>',
  nascer: '<path d="M3 17h18M6 21h12M7.8 17a4.2 4.2 0 0 1 8.4 0M12 11V6M9.5 8.5 12 6l2.5 2.5"/>',
  ocaso: '<path d="M3 17h18M6 21h12M7.8 17a4.2 4.2 0 0 1 8.4 0M12 6v5M9.5 8.5 12 11l2.5-2.5"/>',
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
const RUMOS_LONGOS_PT = ['norte', 'nordeste', 'leste', 'sueste', 'sul', 'sudoeste', 'oeste', 'noroeste'];
const RUMOS_LONGOS_EN = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
const rumo = (graus) => Math.round((((Number(graus) % 360) + 360) % 360) / 45) % 8;
const horaLisboa = (ms = Date.now()) => new Intl.DateTimeFormat('pt-PT', { timeZone: 'Europe/Lisbon', hour: '2-digit', minute: '2-digit' }).format(ms);
const diaPorExtenso = (l, ms = Date.now()) => {
  const t = new Intl.DateTimeFormat(l === 'en' ? 'en-GB' : 'pt-PT', { timeZone: 'Europe/Lisbon', weekday: 'long', day: 'numeric', month: 'long' }).format(ms);
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** Quantos tacos o vento vale, como se conta no campo. */
function efeitoVento(kmh) {
  const v = Number(kmh) || 0;
  if (v < 8) return ['Calmo · sem efeito', 'Calm · no effect'];
  const tacos = Math.max(0.5, Math.round((v / 16) * 2) / 2);
  const t = String(tacos).replace('.5', '½').replace(/^0½$/, '½');
  const forca = v < 16 ? ['Ligeiro', 'Light'] : v < 28 ? ['Moderado', 'Moderate'] : v < 40 ? ['Forte', 'Strong'] : ['Muito forte', 'Very strong'];
  return [`${forca[0]} · ±${t} ${tacos > 1 ? 'tacos' : 'taco'}`, `${forca[1]} · ±${t} ${tacos > 1 ? 'clubs' : 'club'}`];
}

/** A rosa dos ventos: a seta aponta para onde o vento vai. */
function rosa(graus, kmh) {
  const marcas = Array.from({ length: 16 }, (_, i) => {
    const a = (i * 22.5 * Math.PI) / 180;
    const r1 = i % 4 ? 84 : 78;
    return `<line x1="${(100 + Math.sin(a) * r1).toFixed(1)}" y1="${(100 - Math.cos(a) * r1).toFixed(1)}" x2="${(100 + Math.sin(a) * 92).toFixed(1)}" y2="${(100 - Math.cos(a) * 92).toFixed(1)}" class="${i % 4 ? 'fm-rosa__m' : 'fm-rosa__M'}"/>`;
  }).join('');
  const letra = (x, y, pt, en) => `<text x="${x}" y="${y}" class="fm-rosa__l"><tspan class="l-pt">${pt}</tspan></text><text x="${x}" y="${y}" class="fm-rosa__l l-en">${en}</text>`;
  return `<svg class="fm-rosa" viewBox="0 0 200 200" aria-hidden="true">
    <circle cx="100" cy="100" r="92" class="fm-rosa__o"/>${marcas}
    ${letra(100, 30, 'N', 'N')}${letra(172, 105, 'E', 'E')}${letra(100, 180, 'S', 'S')}${letra(28, 105, 'O', 'W')}
    <g class="fm-rosa__seta" style="--g:${(Number(graus) || 0).toFixed(0)}deg"><path d="M100 30 L100 160" /><path d="M100 172 L91 152 L109 152 Z" class="fm-rosa__ponta"/><circle cx="100" cy="30" r="5" class="fm-rosa__cauda"/></g>
    <circle cx="100" cy="100" r="34" class="fm-rosa__c"/>
    <text x="100" y="104" class="fm-rosa__v">${Math.round(kmh)}</text><text x="100" y="121" class="fm-rosa__u">km/h</text>
  </svg>`;
}

let meteo = null;
let meteoFalhou = false;
function pintarCondicoes(d) {
  $('fmEcraData').innerHTML = bi(diaPorExtenso('pt'), diaPorExtenso('en'));
  $('fmEcraHora').textContent = horaLisboa();
  const sitio = tx(d.evento?.local, 'pt') || "Praia D'El Rey, Óbidos";
  const cab = `<div class="fm-cond__cab"><b>${bi('Condições de jogo', 'Playing conditions')}</b><span>${esc(sitio)}</span></div>`;
  if (!meteo) {
    $('fmEcraCond').innerHTML = `${cab}<p class="fm-cond__sem">${meteoFalhou
      ? bi('O serviço do tempo não respondeu. Volta a tentar dentro de minutos.', 'The weather service did not respond. Trying again in a few minutes.')
      : bi('A obter as condições do campo…', 'Fetching course conditions…')}</p>`;
    return;
  }
  const a = meteo.current;
  const [ic, cpt, cen] = ceuAgora(a.weather_code, a.is_day);
  const r = rumo(a.wind_direction_10m);
  const [ept, een] = efeitoVento(a.wind_speed_10m);
  const agora = Date.now() / 1000;
  const h = meteo.hourly ?? {};
  const prox = (h.time ?? []).map((t, i) => ({ t, i })).filter(({ t }) => t > agora - 1800).slice(0, 3);
  const chuva3 = prox.map(({ i }) => h.precipitation_probability?.[i] ?? 0);
  /* Compacto: o que interessa a quem vai jogar (o vento e o que ele vale em
     tacos, a temperatura, a chuva). A coluna é da Francisca e do QR. */
  $('fmEcraCond').innerHTML = `${cab}
    <div class="fm-cond__vento">
      ${rosa(a.wind_direction_10m, a.wind_speed_10m)}
      <div class="fm-cond__vt">
        <b>${bi(`Vento de ${RUMOS_LONGOS_PT[r]}`, `Wind from the ${RUMOS_LONGOS_EN[r]}`)}</b>
        <span>${bi('rajadas', 'gusts')} <b>${Math.round(a.wind_gusts_10m)}</b> km/h</span>
        <em>${bi(ept, een)}</em>
      </div>
    </div>
    <div class="fm-cond__linha">
      <span>${icone(ic)}<b>${Math.round(a.temperature_2m)}°</b>${bi(cpt, cen)}</span>
      <span>${icone('gota')}<b>${chuva3.length ? Math.max(...chuva3) : 0}%</b>${bi('chuva, 3 h', 'rain, 3 h')}</span>
    </div>`;
}

function tempo(d) {
  const c = d.evento?.coordenadas ?? { lat: 39.331, lon: -9.327 };
  const pedir = async () => {
    try {
      const q = new URLSearchParams({
        latitude: c.lat, longitude: c.lon,
        current: 'temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
        hourly: 'temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation_probability',
        daily: 'sunrise,sunset',
        timezone: 'Europe/Lisbon', timeformat: 'unixtime', forecast_days: '2', wind_speed_unit: 'kmh',
      });
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`, { cache: 'no-store' });
      const j = await r.json();
      if (r.ok && j.current) {
        const antes = ceu.kmh;
        meteo = j;
        atualizarCeu(d, j.current);
        if (antes == null || Math.abs(antes - (ceu.kmh ?? 0)) > 6) desenharBandeira();
      } else meteoFalhou = true;
    } catch { meteoFalhou = true; /* ficam o dia e a hora */ }
    pintarCondicoes(d);
  };
  pintarCondicoes(d);
  atualizarCeu(d);
  setInterval(() => atualizarCeu(d), 5 * 60000);
  // de 10 em 10 minutos; enquanto o serviço não responde, de 3 em 3
  const vez = async () => { await pedir(); setTimeout(vez, (meteo ? 10 : 3) * 60000); };
  vez();
  setInterval(() => { $('fmEcraHora').textContent = horaLisboa(); }, 5000);
  setInterval(() => { $('fmEcraData').innerHTML = bi(diaPorExtenso('pt'), diaPorExtenso('en')); }, 10 * 60000);
}

/* ── o modo de demonstração (?ecra&demo) ─────────────────────
 * Para ver o ecrã a crescer sem apoios a sério: simula uma manhã de Roll Up
 * com uns 40 apoios, do zero à meta, e recomeça. `?ecra&demo=6` muda o
 * intervalo (segundos). */
const DEMO_NOMES = ['Rita M.', 'Joana P.', null, 'Grupo de quarta-feira', 'Peter & Claire', 'Avó Lena', null, 'Duarte', 'Luísa F.', 'Família Costa', 'Teresa C.', 'Zé Pedro', null, 'Inês', 'Carlos & Paula', 'Tio Manel', 'Os do Baleal', null, 'Gonçalo', 'Rui Bastos', 'Clara', 'The Thompsons', 'Beatriz V.', null, 'Helena & João', 'Pedro S.', 'Mariana', 'Francisco L.', 'Sara', 'Nuno', null, 'Vasco & Rita', 'Leonor', 'Tomás', 'Madalena', 'Henrique', 'Catarina M.', 'Diogo'];
const DEMO_MSGS = {
  'Rita M.': 'Vai com tudo, Francisca!', 'Grupo de quarta-feira': 'Do Vale de Janelas para a Florida.', 'Peter & Claire': 'Go get them, Francisca! The whole Wednesday group is behind you.',
  'Avó Lena': 'Já tens a mala feita?', 'Luísa F.': 'Que orgulho! Traz a bandeira de volta cheia de histórias.', 'Teresa C.': 'Biltmore, here she comes.',
  'Os do Baleal': 'Fairways e greens, campeã!', 'The Thompsons': 'All the best in Coral Gables!', 'Mariana': 'Um birdie por cada um de nós!', 'Henrique': 'Força, Francisca!',
};
const DEMO_FOTOS = { 'Rita M.': '/img/retrato.webp', 'Os do Baleal': '/img/taca-2026-saida.webp' };
const DEMO_VALORES = [150, 50, 25, 640, 300, 500, 25, 150, 300, 150, 150, 50, 25, 50, 150, 50, 300, 25, 150, 50, 50, 150, 50, 25, 300, 150, 50, 150, 50, 50, 25, 150, 50, 150, 300, 500, 150, 50];
function demo(d, passo) {
  $('fmEcraDemo').hidden = false;
  const vazio = () => ({ ...d, total: 0, apoios: 0, hoje: 0, mural: [] });
  let estado = vazio();
  let i = 0;
  ecra(estado);
  const seguinte = () => {
    if (i >= DEMO_VALORES.length) {
      i = 0;
      estado = vazio();
      fila.length = 0;
      ecraAntes = null;
      ecra(estado);
      setTimeout(seguinte, passo * 1000);
      return;
    }
    const nome = DEMO_NOMES[i];
    const valor = DEMO_VALORES[i++];
    estado = {
      ...estado,
      total: estado.total + valor,
      apoios: estado.apoios + 1,
      hoje: estado.hoje + valor,
      mural: nome ? [{ id: `demo${i}`, nome, mensagem: DEMO_MSGS[nome] ?? null, foto: DEMO_FOTOS[nome] ?? null, dia: diaLisboa(), origem: 'online' }, ...estado.mural] : estado.mural,
    };
    ecra(estado);
    setTimeout(seguinte, (i >= DEMO_VALORES.length ? 45 : passo) * 1000);
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
    vigiarVersao();
    return;
  }

  const pintar = (x) => { bilhete(x, l); grafico(x, l); fontes(x, l); bandeira(x, l); postais(x, l); };
  pintar(d);
  formulario(d, l);
  evento(d, l);
  previsao(d, l);
  ceuDaPagina(d, l);

  let largura = $('fmGrafico').clientWidth;
  addEventListener('resize', () => {
    const w = $('fmGrafico').clientWidth;
    if (Math.abs(w - largura) > 20) { largura = w; grafico(d, l); bandeira(d, l); }
  });

  /* A página atualiza-se sozinha: de 45 em 45 segundos, enquanto estiver à
     vista, pergunta os números outra vez e, se mudaram (um apoio novo, uma
     mensagem, uma fotografia), redesenha. Os dados novos entram no mesmo
     objeto, para o cartão de apoio e a bandeira usarem os de agora. */
  const chave = (x) => `${x.total}|${x.apoios}|${(x.mural ?? []).map((m) => `${m.id}${m.foto ? 'f' : ''}`).join(',')}`;
  let ultima = chave(d);
  const refrescar = async () => {
    if (document.hidden) return;
    const n = await carregar();
    if (!n || chave(n) === ultima) return;
    ultima = chave(n);
    Object.assign(d, n);
    pintar(d);
  };
  setInterval(refrescar, 45000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refrescar(); });

  // quem volta da Stripe: agradece, e quando o pagamento entrar refaz os números
  if (await obrigado(l)) {
    const n = await carregar();
    if (n) { ultima = chave(n); Object.assign(d, n); pintar(d); }
  }
}

/** O ecrã recarrega-se sozinho quando sai uma versão nova do sítio: de 5 em
 *  5 minutos compara as assinaturas (ETag) da página, do script e da folha de
 *  estilos com as que tinha. Assim uma TV ligada a manhã toda não fica com o
 *  ecrã de ontem, e ninguém tem de lhe mexer. */
function vigiarVersao() {
  const ficheiros = [location.pathname, '/js/fundme.js', '/css/site.css'];
  let antes = null;
  const ver = async () => {
    try {
      const marcas = await Promise.all(ficheiros.map(async (f) => {
        const r = await fetch(f, { method: 'HEAD', cache: 'no-store' });
        return r.ok ? r.headers.get('etag') || r.headers.get('last-modified') || '' : '';
      }));
      const agora = marcas.join('|');
      if (!marcas.every(Boolean)) return;
      if (antes && agora !== antes) location.reload();
      antes = agora;
    } catch { /* sem rede: tenta outra vez daqui a 5 minutos */ }
  };
  ver();
  setInterval(ver, 5 * 60000);
}
