/* /fundme/gerir — o que quem apoia escreveu e juntou: o nome, a mensagem e a
 * fotografia.
 *
 * Só para a família, com a chave FUNDME_CHAVE (fica guardada neste
 * telemóvel). Como está (com `mural.aprovar`), nada aparece na página nem no
 * ecrã do clube antes de se carregar em «Mostrar». «Sem a fotografia» mostra
 * o nome e a mensagem e deixa a fotografia de fora; «Não mostrar» esconde
 * tudo (o apoio continua a contar). Pode mudar-se de ideias: vale a última
 * decisão. «Apagar a fotografia» é a única coisa que não volta atrás.
 * Atualiza-se sozinha de 20 em 20 segundos, para o dia do evento.
 */

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CHAVE = 'fm-chave';
const ESTADOS = { pendente: 'À espera', aprovado: 'Na página', escondido: 'Escondido' };
const FOTOS = { fora: 'A fotografia não está à vista.', apagada: 'A fotografia foi apagada.' };
const ERROS = {
  chave: 'A chave não está certa.',
  chave_por_ligar: 'Falta a variável FUNDME_CHAVE na Vercel.',
  blob_por_ligar: 'Falta ligar o Vercel Blob ao projeto.',
  stripe_por_ligar: 'Falta a chave da Stripe na Vercel.',
  demasiados: 'Demasiadas tentativas. Espere um pouco.',
  servico: 'A decisão não ficou guardada. Tente outra vez.',
};

let chave = '';
try { chave = localStorage.getItem(CHAVE) || ''; } catch { /* sem memória: pede sempre */ }
let filtro = 'pendente';
let ultimo = null;

const quando = (ms) => {
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(ms);
};

function erro(codigo) {
  $('grErro').textContent = ERROS[codigo] || 'Algo correu mal. Tente outra vez.';
  $('grErro').hidden = false;
}

async function pedir(metodo, corpo) {
  const r = await fetch('/api/fundme/gerir', {
    method: metodo,
    headers: { Authorization: `Bearer ${chave}`, ...(corpo && { 'Content-Type': 'application/json' }) },
    body: corpo ? JSON.stringify(corpo) : undefined,
    cache: 'no-store',
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.erro || 'servico'), { estado: r.status });
  return j;
}

const bt = (acao, texto, classe = 'gr-nao') => `<button type="button" class="${classe}" data-a="${acao}">${texto}</button>`;

/** Os botões de um apoio, conforme o que está decidido e a fotografia que tem. */
function botoes(a) {
  const temFoto = Boolean(a.foto);
  const lista = [];
  if (a.estado !== 'aprovado') {
    lista.push(bt('mostrar', 'Mostrar', 'gr-sim'));
    if (temFoto && (a.nome || a.mensagem)) lista.push(bt('mostrar_sem_foto', 'Sem a fotografia'));
  } else if (temFoto) {
    lista.push(a.fotoEstado === 'a_vista' ? bt('mostrar_sem_foto', 'Tirar a fotografia') : bt('mostrar', 'Mostrar a fotografia'));
  }
  if (a.estado !== 'escondido') lista.push(bt('esconder', 'Não mostrar'));
  if (temFoto) lista.push(bt('recusar', 'Apagar a fotografia', 'gr-apagar'));
  return lista.join('');
}

function pintar() {
  const j = ultimo;
  if (!j) return;
  const apoios = j.apoios || [];
  const pendentes = apoios.filter((a) => a.estado === 'pendente').length;
  document.title = `${pendentes ? `(${pendentes}) ` : ''}Por aprovar — Rumo à Florida`;
  $('grN').textContent = pendentes ? `(${pendentes})` : '';
  // sem aprovação nada fica à espera: mostra-se tudo, para esconder o que for preciso
  document.body.classList.toggle('gr--direto', !j.aprovar);
  const ver = j.aprovar ? filtro : 'todos';
  const lista = ver === 'pendente' ? apoios.filter((a) => a.estado === 'pendente') : apoios;
  $('grLista').innerHTML = lista.length ? lista.map((a) => `
    <li class="gr-f gr-f--${esc(a.estado)}${a.foto ? '' : ' gr-f--semfoto'}" data-id="${esc(a.id)}">
      ${a.foto ? `<img src="${esc(a.foto)}" alt="Fotografia de ${esc(a.nome || 'quem apoiou')}" loading="lazy" />` : ''}
      <div>
        <h2>${esc(a.nome || 'Sem nome')}<span class="gr-chip gr-chip--${esc(a.estado)}">${ESTADOS[a.estado] || ''}</span></h2>
        ${a.mensagem ? `<p class="gr-msg">«${esc(a.mensagem)}»</p>` : ''}
        <p>${quando(a.quando)}${a.estado === 'aprovado' && FOTOS[a.fotoEstado] ? ` · ${FOTOS[a.fotoEstado]}` : ''}</p>
        <div class="gr-bts">${botoes(a)}</div>
      </div>
    </li>`).join('') : `<li class="gr-vazio">${ver === 'pendente' ? 'Nada à espera.' : 'Ainda ninguém assinou, escreveu ou juntou uma fotografia.'}</li>`;
  $('grSoltas').hidden = !j.soltas;
  if (j.soltas) $('grSoltas').innerHTML = `${j.soltas} ${j.soltas === 1 ? 'fotografia enviada' : 'fotografias enviadas'} sem apoio pago, há mais de dois dias. <button type="button" id="grLimpar">Apagar</button>`;
  $('grTxt').textContent = j.aprovar
    ? 'Os nomes, as mensagens e as fotografias de quem apoia o «Rumo à Florida». Só aparecem na página e no ecrã do clube depois de carregar em «Mostrar». O apoio conta sempre.'
    : 'Os nomes, as mensagens e as fotografias de quem apoia o «Rumo à Florida». Aparecem logo na página e no ecrã do clube; o que não deve lá estar esconde-se aqui e sai em menos de um minuto.';
}

async function carregar() {
  try {
    ultimo = await pedir('GET');
    $('grErro').hidden = true;
    $('grLigar').hidden = true;
    $('grConteudo').hidden = false;
    $('grSair').hidden = false;
    pintar();
  } catch (e) {
    if (e.estado === 401) {
      chave = '';
      try { localStorage.removeItem(CHAVE); } catch { /* nada */ }
      $('grConteudo').hidden = true;
      $('grLigar').hidden = false;
    }
    erro(e.message);
  }
}

$('grLigar').addEventListener('submit', (e) => {
  e.preventDefault();
  chave = $('grChave').value.trim();
  try { localStorage.setItem(CHAVE, chave); } catch { /* fica só nesta visita */ }
  carregar();
});

$('grSair').addEventListener('click', () => {
  chave = '';
  try { localStorage.removeItem(CHAVE); } catch { /* nada */ }
  location.reload();
});

document.querySelector('.gr-filtro').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-f]');
  if (!b) return;
  filtro = b.dataset.f;
  document.querySelectorAll('.gr-filtro button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  pintar();
});

document.addEventListener('click', async (e) => {
  const img = e.target.closest('.gr-f img');
  if (img) {
    const g = document.createElement('div');
    g.className = 'gr-grande';
    g.innerHTML = `<img src="${esc(img.src)}" alt="" />`;
    g.addEventListener('click', () => g.remove());
    document.body.append(g);
    return;
  }
  if (e.target.id === 'grLimpar') {
    if (!confirm('Apagar as fotografias enviadas sem apoio pago?')) return;
    try { await pedir('POST', { acao: 'limpar' }); } catch (x) { erro(x.message); }
    carregar();
    return;
  }
  const b = e.target.closest('.gr-bts button');
  if (!b) return;
  const acao = b.dataset.a;
  if (acao === 'recusar' && !confirm('Apagar esta fotografia de vez? Não volta atrás.')) return;
  const id = b.closest('.gr-f').dataset.id;
  b.closest('.gr-bts').querySelectorAll('button').forEach((x) => { x.disabled = true; });
  let falhou = null;
  try {
    await pedir('POST', { id, acao });
  } catch (x) {
    falhou = x.message;
  }
  await carregar();
  // o erro de uma decisão fica à vista depois de a lista se refazer
  if (falhou) erro(falhou);
});

if (chave) carregar(); else $('grLigar').hidden = false;
setInterval(() => { if (chave && !document.hidden) carregar(); }, 20000);
