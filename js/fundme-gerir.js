/* /fundme/gerir — as fotografias de quem apoia.
 *
 * Só para a família, com a chave FUNDME_CHAVE (fica guardada neste
 * telemóvel). Como está (sem `fotos.aprovar`), as fotografias aparecem logo
 * e aqui apaga-se a que não deve estar à vista. Com aprovação: «Mostrar» põe
 * a fotografia na página e no ecrã do clube; «Recusar» apaga-a; «Retirar»
 * tira de vista uma que já estava aprovada.
 * Atualiza-se sozinha de 20 em 20 segundos, para o dia do evento.
 */

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CHAVE = 'fm-chave';
const ESTADOS = { pendente: 'À espera', aprovada: 'Na página', recusada: 'Recusada' };
const ERROS = {
  chave: 'A chave não está certa.',
  chave_por_ligar: 'Falta a variável FUNDME_CHAVE na Vercel.',
  blob_por_ligar: 'Falta ligar o Vercel Blob ao projeto.',
  stripe_por_ligar: 'Falta a chave da Stripe na Vercel.',
  demasiados: 'Demasiadas tentativas. Espere um pouco.',
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

function pintar() {
  const j = ultimo;
  if (!j) return;
  // sem aprovação, «pendente» quer dizer «à vista»: não há nada à espera
  document.body.classList.toggle('gr--direto', !j.aprovar);
  const pendentes = j.aprovar ? j.fotos.filter((f) => f.estado === 'pendente').length : 0;
  document.title = `${pendentes ? `(${pendentes}) ` : ''}Fotografias — Rumo à Florida`;
  $('grN').textContent = pendentes ? `(${pendentes})` : '';
  const ver = j.aprovar ? filtro : 'todas';
  const lista = ver === 'pendente' ? j.fotos.filter((f) => f.estado === 'pendente') : j.fotos;
  const nome = (e) => (!j.aprovar && e === 'pendente' ? 'Na página' : ESTADOS[e]);
  const classe = (e) => (!j.aprovar && e === 'pendente' ? 'aprovada' : e);
  $('grLista').innerHTML = lista.length ? lista.map((f) => `
    <li class="gr-f gr-f--${classe(f.estado)}" data-id="${esc(f.id)}">
      <img src="${esc(f.foto)}" alt="Fotografia de ${esc(f.nome || 'quem apoiou')}" loading="lazy" />
      <div>
        <h2>${esc(f.nome || 'Sem nome')}<span class="gr-chip gr-chip--${classe(f.estado)}">${nome(f.estado)}</span></h2>
        ${f.mensagem ? `<p class="gr-msg">«${esc(f.mensagem)}»</p>` : ''}
        <p>${quando(f.quando)}</p>
        <div class="gr-bts">
          ${f.estado === 'pendente' && j.aprovar ? '<button type="button" class="gr-sim" data-a="aprovar">Mostrar</button><button type="button" class="gr-nao" data-a="recusar">Recusar</button>' : ''}
          ${f.estado === 'pendente' && !j.aprovar ? '<button type="button" class="gr-nao" data-a="recusar">Tirar da página e apagar</button>' : ''}
          ${f.estado === 'aprovada' ? '<button type="button" class="gr-nao" data-a="retirar">Retirar da página</button>' : ''}
        </div>
      </div>
    </li>`).join('') : `<li class="gr-vazio">${ver === 'pendente' ? 'Nenhuma fotografia à espera.' : 'Ainda não chegaram fotografias.'}</li>`;
  $('grSoltas').hidden = !j.soltas;
  if (j.soltas) $('grSoltas').innerHTML = `${j.soltas} ${j.soltas === 1 ? 'fotografia enviada' : 'fotografias enviadas'} sem apoio pago, há mais de dois dias. <button type="button" id="grLimpar">Apagar</button>`;
  $('grTxt').textContent = j.aprovar
    ? 'As fotografias de quem apoia o «Rumo à Florida». Só aparecem na página e no ecrã do clube depois de carregar em «Mostrar».'
    : 'As fotografias de quem apoia o «Rumo à Florida». Aparecem logo na página e no ecrã do clube; se alguma não deve lá estar, apague-a aqui e sai em menos de um minuto.';
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
  if (acao === 'recusar' && !confirm('Apagar esta fotografia? Sai da página e do ecrã.')) return;
  const id = b.closest('.gr-f').dataset.id;
  b.closest('.gr-bts').querySelectorAll('button').forEach((x) => { x.disabled = true; });
  try {
    await pedir('POST', { id, acao });
  } catch (x) {
    erro(x.message);
  }
  carregar();
});

if (chave) carregar(); else $('grLigar').hidden = false;
setInterval(() => { if (chave && !document.hidden) carregar(); }, 20000);
