/* Páginas interiores. Um ficheiro só, que olha para o data-pagina do <script>
   e pinta o que essa página precisa. Assim há um ponto de entrada por página
   sem haver um ficheiro de arranque por página. */

import { iniciar } from './base.js';
import { porEpoca, carregar } from './resultados.js';
import { factos, percurso, citacoes, pecas, saiuEm, escadas, ligacoes } from './conteudo.js';
import { galeria, videos, apoios } from './media.js';
import { rankings } from './rankings.js';

const $ = (id) => document.getElementById(id);
const qual = document.currentScript?.dataset.pagina
  || document.querySelector('script[data-pagina]')?.dataset.pagina
  || '';

/* ── formulário ───────────────────────────────────────────── */
/* ENTREGA está vazio de propósito: enquanto não houver serviço de entrega
   escolhido (Formspree, Resend, uma função serverless — o que for), o
   formulário valida, não finge que enviou, e encaminha para o Instagram, que
   é o canal que existe mesmo. Basta pôr aqui o endereço no dia em que houver. */
const ENTREGA = '';
const INSTAGRAM = 'https://www.instagram.com/francisca_salgado_/';

function formulario(lingua) {
  const form = $('form');
  const msg = $('formMsg');
  if (!form || form.dataset.ligado === '1') return;
  form.dataset.ligado = '1';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const en = lingua() === 'en';
    msg.classList.remove('erro');

    if (!form.checkValidity()) {
      msg.textContent = en ? 'Fill in name, email and message.' : 'Falta o nome, o email ou a mensagem.';
      msg.classList.add('erro');
      form.reportValidity();
      return;
    }

    if (!ENTREGA) {
      msg.classList.add('erro');
      msg.innerHTML = en
        ? `This form is not connected yet — please send a direct message on <a class="lig" href="${INSTAGRAM}" target="_blank" rel="noopener">Instagram</a>.`
        : `Este formulário ainda não está ligado — envie mensagem direta no <a class="lig" href="${INSTAGRAM}" target="_blank" rel="noopener">Instagram</a>.`;
      return;
    }

    const bt = form.querySelector('button[type=submit]');
    if (bt) bt.disabled = true;
    msg.textContent = en ? 'Sending…' : 'A enviar…';

    try {
      const r = await fetch(ENTREGA, {
        method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      form.reset();
      msg.textContent = en ? 'Received. You will get an answer shortly.' : 'Recebido. A resposta não deve demorar.';
    } catch {
      msg.classList.add('erro');
      msg.innerHTML = en
        ? `Could not send. Please try <a class="lig" href="${INSTAGRAM}" target="_blank" rel="noopener">Instagram</a>.`
        : `Não foi possível enviar. Tente pelo <a class="lig" href="${INSTAGRAM}" target="_blank" rel="noopener">Instagram</a>.`;
    } finally {
      if (bt) bt.disabled = false;
    }
  });
}

/* ── o que cada página pinta ──────────────────────────────── */
const PINTAR = {
  async resultados(l) {
    await Promise.all([porEpoca($('epocas'), $('filtros'), l), rankings($('rankings'), l)]);
    const d = await carregar();
    const nota = $('notaFonte');
    if (nota && d.nota) nota.textContent = d.nota[l] || d.nota.pt;
  },

  async percurso(l) {
    await Promise.all([factos($('factos'), l), percurso($('percurso'), l), videos($('videos'), l)]);
  },

  async imprensa(l) {
    await Promise.all([
      factos($('factos'), l),
      citacoes($('citacoes'), l),
      pecas($('pecas'), l),
      saiuEm($('saiuEm')),
      ligacoes($('ligacoes'), l),
      galeria($('gal'), l),
    ]);
  },

  async apoiar(l) {
    await Promise.all([escadas($('escadas'), l), apoios($('apoios'), l), ligacoes($('ligacoes'), l)]);
  },

  async legal() { /* as páginas legais são só texto */ },
};

const { i18n } = iniciar(async (l) => { await PINTAR[qual]?.(l); });

formulario(() => i18n.lingua());
