/* A angariação «Rumo à Florida» (/fundme).
 *
 * Tudo o que mexe vem de /api/fundme: o total, o acumulado dia a dia, o mural
 * e o que está em data/fundme.json (meta, etapas, evento). Se a função não
 * responder, a página lê o data/fundme.json e mostra o que lá está, sem total.
 *
 * O formulário funciona sem JavaScript (é um POST para /api/fundme/apoiar,
 * que responde com um 303 para a Stripe). Com JavaScript, o botão diz o
 * valor, o «Outro» abre o seu campo, e o pedido vai em JSON.
 *
 * Com ?ecra na morada, a página passa a ser o ecrã da clubhouse: o total em
 * grande e o QR code, a atualizar-se sozinho de 30 em 30 segundos.
 */

const $ = (id) => document.getElementById(id);
const DIA = 86400000;

const T = {
  pt: {
    de: (m) => `angariados de ${m}`,
    apoios: (n, p) => `<b>${n}</b> ${n === 1 ? 'apoio' : 'apoios'} · ${p}% da meta`,
    dias: (n) => (n === 0 ? '<b>é hoje</b>' : `faltam <b>${n}</b> ${n === 1 ? 'dia' : 'dias'}`),
    bt: (v) => `Apoiar com ${v}`,
    btOutro: 'Apoiar',
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
    obrigado: (n) => `<strong>Obrigado${n ? `, ${n}` : ''}!</strong> O seu apoio já conta.`,
    aEntrar: '<strong>Obrigado!</strong> O pagamento está a ser confirmado. Com Multibanco, o apoio aparece aqui quando a referência for paga.',
    fontes: { online: 'online', clube: 'no clube', empresas: 'empresas, pela Fundação do Desporto' },
    hoje: 'hoje',
    semFontes: 'Ainda sem apoios. O primeiro pode ser o seu.',
    meta: 'Meta',
    roll: 'Roll Up no Vale de Janelas',
    partida: 'Florida',
    pago: '✓ Paga',
    caminho: 'A caminho',
    anonimo: 'Anónimo',
    quando: (d) => (d === 0 ? 'hoje' : d === 1 ? 'ontem' : `há ${d} dias`),
    noClube: 'no clube',
    muralVazio: 'O mural está à espera do primeiro nome.',
    eventoData: (d, l) => `${d} · ${l}`,
    eventoSemData: (l) => `Data a anunciar · ${l}`,
    tabela: ['Dia', 'Nesse dia', 'Acumulado'],
    ecraMeta: (m) => `de ${m}`,
    ecraInfo: (n, h) => `<span><b>${n}</b> apoios</span>${h ? `<span><b>+${h}</b> hoje</span>` : ''}`,
    ecraUlt: (n, m) => `Último apoio: <b>«${m}»</b> — ${n}`,
    desatualizado: 'O total pode estar uns minutos atrasado.',
    mil: 'mil',
  },
  en: {
    de: (m) => `raised of ${m}`,
    apoios: (n, p) => `<b>${n}</b> ${n === 1 ? 'gift' : 'gifts'} · ${p}% of the target`,
    dias: (n) => (n === 0 ? '<b>today</b>' : `<b>${n}</b> ${n === 1 ? 'day' : 'days'} to go`),
    bt: (v) => `Give ${v}`,
    btOutro: 'Give',
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
    obrigado: (n) => `<strong>Thank you${n ? `, ${n}` : ''}!</strong> Your gift already counts.`,
    aEntrar: '<strong>Thank you!</strong> Your payment is being confirmed. With Multibanco, it shows here once the reference is paid.',
    fontes: { online: 'online', clube: 'at the club', empresas: 'companies, via Fundação do Desporto' },
    hoje: 'today',
    semFontes: 'No gifts yet. The first one could be yours.',
    meta: 'Target',
    roll: 'Roll Up at Vale de Janelas',
    partida: 'Florida',
    pago: '✓ Paid',
    caminho: 'In progress',
    anonimo: 'Anonymous',
    quando: (d) => (d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`),
    noClube: 'at the club',
    muralVazio: 'The wall is waiting for its first name.',
    eventoData: (d, l) => `${d} · ${l}`,
    eventoSemData: (l) => `Date to be announced · ${l}`,
    tabela: ['Day', 'That day', 'Running total'],
    ecraMeta: (m) => `of ${m}`,
    ecraInfo: (n, h) => `<span><b>${n}</b> gifts</span>${h ? `<span><b>+${h}</b> today</span>` : ''}`,
    ecraUlt: (n, m) => `Latest: <b>«${m}»</b> — ${n}`,
    desatualizado: 'The total may be a few minutes behind.',
    mil: 'k',
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

/* ── o cartão ─────────────────────────────────────────────── */

function cartao(d, l) {
  const t = T[l];
  const total = d.total ?? 0;
  $('fmTotal').textContent = d.total == null ? '—' : euros(total, l);
  $('fmMeta').textContent = t.de(euros(d.meta, l));
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
  if (d.stripe === 'erro') $('fmApoios').insertAdjacentHTML('beforeend', ` <span class="fm-aviso">· ${t.desatualizado}</span>`);
}

/* ── o formulário ─────────────────────────────────────────── */

function formulario(d, l) {
  const t = T[l];
  const f = $('fmForm');
  $('fmLingua').value = l;
  const origem = new URLSearchParams(location.search).get('o');
  if (origem && /^[a-z0-9-]{1,20}$/.test(origem)) $('fmOrigem').value = origem;

  // os valores vêm dos dados, para se poderem mudar sem tocar no HTML
  const valores = d.valores?.length ? d.valores : [20, 50, 100, 250];
  const inicial = valores.includes(d.valorInicial) ? d.valorInicial : valores[1] ?? valores[0];
  $('fmValores').querySelectorAll('label:not(:last-of-type)').forEach((lb) => lb.remove());
  const outro = $('fmValores').querySelector('label');
  outro.insertAdjacentHTML('beforebegin', valores.map((v) =>
    `<label><input type="radio" name="valor" value="${v}"${v === inicial ? ' checked' : ''} /><span>${euros(v, l)}</span></label>`).join(''));
  const campo = $('fmOutro');
  campo.min = d.minimo ?? 5;
  campo.max = d.maximo ?? 5000;

  const escolhido = () => f.querySelector('input[name="valor"]:checked')?.value;
  const atualizar = () => {
    const v = escolhido();
    const eOutro = v === 'outro';
    $('fmOutroC').classList.toggle('fm-outro--on', eOutro);
    const n = eOutro ? Number(campo.value) : Number(v);
    $('fmBtT').textContent = !d.aberto ? t.fechado : n > 0 ? t.bt(euros(n, l)) : t.btOutro;
  };
  f.addEventListener('change', (e) => {
    if (e.target.name === 'valor' && e.target.value === 'outro') campo.focus();
    atualizar();
  });
  campo.addEventListener('input', atualizar);
  campo.addEventListener('focus', () => { f.querySelector('input[value="outro"]').checked = true; atualizar(); });

  // quem escreve o nome para o mural quer, em princípio, aparecer nele; quem
  // desmarca a caixa decide o contrário, e isso não se desfaz
  const mural = $('fmMural');
  let mexeu = false;
  mural.addEventListener('change', () => { mexeu = true; });
  $('fmNome').addEventListener('input', (e) => { if (!mexeu) mural.checked = e.target.value.trim().length > 0; });

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

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    $('fmErro').hidden = true;
    const dadosF = Object.fromEntries(new FormData(f));
    const v = dadosF.valor === 'outro' ? Number(dadosF.outro) : Number(dadosF.valor);
    if (!(v >= (d.minimo ?? 5) && v <= (d.maximo ?? 5000))) { erro('valor'); campo.focus(); return; }
    bt.disabled = true;
    $('fmBtT').textContent = t.aEnviar;
    try {
      const r = await fetch(f.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dadosF, mural: mural.checked ? '1' : '0' }),
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

/* ── a volta da Stripe ────────────────────────────────────── */

async function obrigado(l) {
  const q = new URLSearchParams(location.search);
  const sessao = q.get('obrigado');
  if (!sessao) return;
  const caixa = $('fmObrigado');
  // a morada fica limpa: recarregar ou partilhar não repete o agradecimento
  q.delete('obrigado');
  history.replaceState(null, '', `${location.pathname}${q.toString() ? `?${q}` : ''}#apoiar`);
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(`/api/fundme?sessao=${encodeURIComponent(sessao)}`, { cache: 'no-store' });
      const j = await r.json();
      if (j.pago) {
        caixa.innerHTML = T[l].obrigado(esc(j.nome || ''));
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

  const resumoTxt = `${t.de(euros(d.meta, l))}: ${euros(d.total ?? 0, l)}`;
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
    dica.innerHTML = `<span>${dataCurta(melhor.dia, l)}</span><b>${euros(melhor.total, l)}</b>${melhor.dia_valor ? `<span>+${euros(melhor.dia_valor, l)} ${t.hoje === 'hoje' ? 'nesse dia' : 'that day'}</span>` : ''}`;
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

/* ── as etapas ────────────────────────────────────────────── */

function etapas(d, l) {
  const t = T[l];
  const lista = d.etapas ?? [];
  if (!lista.length) { $('fmEtapasS').hidden = true; return; }
  let acc = 0;
  const total = d.total ?? 0;
  $('fmEtapas').innerHTML = lista.map((e) => {
    const ini = acc;
    acc += e.valor;
    const p = Math.max(0, Math.min(1, (total - ini) / e.valor));
    const cls = p >= 1 ? 'fm-etapa--feita' : p > 0 ? 'fm-etapa--agora' : '';
    const est = p >= 1 ? t.pago : p > 0 ? t.caminho : '';
    return `<li class="fm-etapa ${cls}">
      <span class="fm-etapa__e">${est}</span>
      <span class="fm-etapa__v num">${euros(e.valor, l)}</span>
      <span class="fm-etapa__t">${esc(tx(e.t, l))}</span>
      <span class="fm-etapa__x">${esc(tx(e.x, l))}</span>
      <span class="fm-etapa__b" aria-hidden="true"><i style="width:${p * 100}%"></i></span>
    </li>`;
  }).join('');
}

/* ── o mural ──────────────────────────────────────────────── */

function mural(d, l) {
  const t = T[l];
  const lista = d.mural ?? [];
  const ul = $('fmMuralL');
  if (!lista.length) { ul.innerHTML = `<li class="fm-msg fm-msg--vazio">${t.muralVazio}</li>`; return; }
  const hoje = diaLisboa();
  const cartaoMsg = (m) => {
    const msg = tx(m.mensagem, l);
    const quem = m.nome || t.anonimo;
    const quando = m.origem === 'clube' ? `${t.noClube}, ${dataCurta(m.dia, l)}` : t.quando(Math.max(0, diasEntre(m.dia, hoje)));
    return `<li class="fm-msg${m.origem === 'clube' ? ' fm-msg--clube' : ''}">
      ${msg ? `<p class="fm-msg__t">«${esc(msg)}»</p>` : ''}
      <p class="fm-msg__q"><b>${esc(quem)}</b><span>${esc(quando)}</span></p></li>`;
  };
  const POR = 8;
  let mostrados = POR;
  const pintar = () => {
    ul.innerHTML = lista.slice(0, mostrados).map(cartaoMsg).join('');
    $('fmMais').hidden = mostrados >= lista.length;
  };
  $('fmMais').onclick = () => { mostrados += POR * 2; pintar(); };
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

function ecra(d) {
  // bilingue de propósito: os sócios são de muitos sítios
  const pt = T.pt;
  $('fmEcraTotal').textContent = euros(d.total ?? 0, 'pt');
  $('fmEcraMeta').innerHTML = `${pt.ecraMeta(euros(d.meta, 'pt'))}<br />${T.en.ecraMeta(euros(d.meta, 'en'))}`;
  $('fmEcraBarra').style.width = `${Math.min(100, ((d.total ?? 0) / d.meta) * 100)}%`;
  $('fmEcraInfo').innerHTML = `<span><b>${d.apoios ?? 0}</b> apoios · gifts</span>${d.hoje ? `<span><b>+${euros(d.hoje, 'pt')}</b> hoje · today</span>` : ''}${d.partida ? `<span>Junior Orange Bowl · <b>${dataCurta(d.partida, 'pt')}</b></span>` : ''}`;
  const u = (d.mural ?? []).find((m) => m.mensagem);
  $('fmEcraUlt').innerHTML = u ? `<b>«${esc(tx(u.mensagem, 'pt'))}»</b> — ${esc(u.nome || 'Anónimo')}` : '';
}

/* ── tudo ─────────────────────────────────────────────────── */

export async function fundme(l) {
  const noEcra = document.documentElement.classList.contains('fm-ecra-on');
  const d = await carregar();
  if (!d) return;

  if (noEcra) {
    $('fmEcra').hidden = false;
    ecra(d);
    setInterval(async () => { const n = await carregar(); if (n) ecra(n); }, 30000);
    return;
  }

  cartao(d, l);
  formulario(d, l);
  grafico(d, l);
  fontes(d, l);
  etapas(d, l);
  mural(d, l);
  evento(d, l);

  let largura = $('fmGrafico').clientWidth;
  addEventListener('resize', () => {
    const w = $('fmGrafico').clientWidth;
    if (Math.abs(w - largura) > 20) { largura = w; grafico(d, l); }
  });

  // quem volta da Stripe: agradece, e quando o pagamento entrar refaz os números
  if (await obrigado(l)) {
    const n = await carregar();
    if (n) { cartao(n, l); grafico(n, l); fontes(n, l); etapas(n, l); mural(n, l); }
  }
}
