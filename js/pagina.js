/* Páginas interiores. Um ficheiro só, que olha para o data-pagina do <script>
   e pinta o que essa página precisa. Assim há um ponto de entrada por página
   sem haver um ficheiro de arranque por página. */

import { iniciar } from './base.js';
import { iniciarCampo } from './campo.js';
import { reduzido } from './movimento.js';
import { porEpoca, carregar, proximas } from './resultados.js';
import { factos, percurso, citacoes, pecas, saiuEm, escadas, ligacoes, numeros,
         rankingsNaPergunta } from './conteudo.js';
import { galeria, videos, apoios } from './media.js';
import { reels } from './instagram.js';
import { rankings } from './rankings.js';

const $ = (id) => document.getElementById(id);
const qual = document.currentScript?.dataset.pagina
  || document.querySelector('script[data-pagina]')?.dataset.pagina
  || '';

/* ── formulário ───────────────────────────────────────────── */
/* ENTREGA está vazio enquanto não houver serviço de entrega escolhido —
   Formspree, Resend, uma função serverless, o que for. Até lá o formulário não
   finge que enviou: valida, compõe a mensagem e abre o email do próprio já
   preenchido para birdie@franciscasalgado.golf. É menos elegante do que um
   envio silencioso, e chega mesmo. Basta pôr aqui o endereço no dia em que
   houver serviço. */
const ENTREGA = '';
const EMAIL = 'birdie@franciscasalgado.golf';
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
      /* Sem serviço de entrega, o formulário não finge que enviou: abre o
         email do próprio com tudo já escrito. É menos elegante do que um
         envio silencioso e chega mesmo ao destino, que é o que interessa. */
      const d = new FormData(form);
      const corpo = en
        ? `Name: ${d.get('nome')}\nEmail: ${d.get('email')}\nOrganisation: ${d.get('organizacao') || '—'}\n\n${d.get('mensagem')}`
        : `Nome: ${d.get('nome')}\nEmail: ${d.get('email')}\nOrganização: ${d.get('organizacao') || '—'}\n\n${d.get('mensagem')}`;
      const url = `mailto:${EMAIL}?subject=${encodeURIComponent(String(d.get('assunto') || 'Contacto'))}&body=${encodeURIComponent(corpo)}`;
      msg.classList.remove('erro');
      msg.innerHTML = en
        ? `Opening your email app. If nothing happens, write to <a class="lig" href="mailto:${EMAIL}">${EMAIL}</a>.`
        : `A abrir o seu email. Se não acontecer nada, escreva para <a class="lig" href="mailto:${EMAIL}">${EMAIL}</a>.`;
      location.href = url;
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
    await Promise.all([porEpoca($('epocas'), $('filtros'), l), rankings($('rankings'), l),
                       proximas($('proximas'), l)]);
    const d = await carregar();
    const nota = $('notaFonte');
    if (nota && d.nota) nota.textContent = d.nota[l] || d.nota.pt;
  },

  async percurso(l) {
    await Promise.all([factos($('factos'), l), percurso($('percurso'), l), videos($('videos'), l),
                       rankingsNaPergunta(l)]);
  },

  async imprensa(l) {
    await Promise.all([
      factos($('factos'), l),
      citacoes($('citacoes'), l),
      pecas($('pecas'), l),
      saiuEm($('saiuEm'), l),
      ligacoes($('ligacoes'), l),
      galeria($('gal'), l),
    ]);
  },

  async parcerias(l) {
    await Promise.all([escadas($('escadas'), l), apoios($('apoios'), l),
                       numeros($('numsApoio'), l, 'apoioNumeros'),
                       reels($('reels'), l), ligacoes($('ligacoes'), l)]);
  },

  async legal() { /* as páginas legais são só texto */ },
};

const { i18n } = iniciar(async (l) => { await PINTAR[qual]?.(l); });

/* O mapa de curvas, onde a página o tiver. Fica fora do ciclo da língua: não
   tem texto nenhum, e recriá-lo seria deitar fora o contexto de WebGL por
   nada. */
const campo = iniciarCampo($('campo'), { reduzido });
document.addEventListener('fs:tema', () => campo?.tema?.());

formulario(() => i18n.lingua());
