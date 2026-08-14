/* Páginas interiores. Um ficheiro só, que olha para o data-pagina do <script>
   e pinta o que essa página precisa. Assim há um ponto de entrada por página
   sem haver um ficheiro de arranque por página. */

import { iniciar } from './base.js';
import { iniciarCampo } from './campo.js';
import { reduzido } from './movimento.js';
import { porEpoca, carregar, proximas } from './resultados.js';
import { factos, citacoes, escadas, ligacoes, numeros } from './conteudo.js';
import { galeria, videos, apoios } from './media.js';
import { reels } from './instagram.js';
import { rankings } from './rankings.js';

const $ = (id) => document.getElementById(id);
const qual = document.currentScript?.dataset.pagina
  || document.querySelector('script[data-pagina]')?.dataset.pagina
  || '';

/* ── formulário ───────────────────────────────────────────── */
/* Envia por /api/contacto, que entrega em birdie@franciscasalgado.golf.
   Enquanto essa função não tiver chave de envio configurada responde 501, e
   aí o formulário abre o email do próprio já preenchido: quem escreve nunca
   fica sem caminho por causa de uma configuração que ainda não foi feita. */
const ENTREGA = '/api/contacto';
const EMAIL = 'birdie@franciscasalgado.golf';
const INSTAGRAM = 'https://www.instagram.com/francisca_salgado_/';

function porEmail(form, en) {
  const d = new FormData(form);
  const corpo = en
    ? `Name: ${d.get('nome')}\nEmail: ${d.get('email')}\nOrganisation: ${d.get('organizacao') || '—'}\n\n${d.get('mensagem')}`
    : `Nome: ${d.get('nome')}\nEmail: ${d.get('email')}\nOrganização: ${d.get('organizacao') || '—'}\n\n${d.get('mensagem')}`;
  location.href = `mailto:${EMAIL}?subject=${
    encodeURIComponent(String(d.get('assunto') || 'Contacto'))}&body=${encodeURIComponent(corpo)}`;
}

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

    const bt = form.querySelector('button[type=submit]');
    if (bt) bt.disabled = true;
    msg.textContent = en ? 'Sending…' : 'A enviar…';

    try {
      const r = await fetch(ENTREGA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });

      if (r.ok) {
        form.reset();
        msg.textContent = en
          ? 'Received. You will get an answer shortly.'
          : 'Recebido. A resposta não deve demorar.';
        return;
      }

      // 501: a função existe e ainda não tem por onde enviar
      if (r.status === 501) {
        msg.innerHTML = en
          ? `Opening your email app. If nothing happens, write to <a class="lig" href="mailto:${EMAIL}">${EMAIL}</a>.`
          : `A abrir o seu email. Se não acontecer nada, escreva para <a class="lig" href="mailto:${EMAIL}">${EMAIL}</a>.`;
        porEmail(form, en);
        return;
      }
      throw new Error(`HTTP ${r.status}`);
    } catch {
      msg.classList.add('erro');
      msg.innerHTML = en
        ? `Could not send. Write to <a class="lig" href="mailto:${EMAIL}">${EMAIL}</a> or message her on <a class="lig" href="${INSTAGRAM}" target="_blank" rel="noopener">Instagram</a>.`
        : `Não foi possível enviar. Escreva para <a class="lig" href="mailto:${EMAIL}">${EMAIL}</a> ou mande mensagem no <a class="lig" href="${INSTAGRAM}" target="_blank" rel="noopener">Instagram</a>.`;
    } finally {
      if (bt) bt.disabled = false;
    }
  });
}

/* ── o que cada página pinta ──────────────────────────────── */
const PINTAR = {
  async resultados(l) {
    await Promise.all([porEpoca($('epocas'), $('filtros'), l), rankings($('rankings'), l),
                       proximas($('proximas'), l), videos($('videos'), l)]);
    const d = await carregar();
    const nota = $('notaFonte');
    if (nota && d.nota) nota.textContent = d.nota[l] || d.nota.pt;
  },

  async imprensa(l) {
    await Promise.all([
      factos($('factos'), l),
      citacoes($('citacoes'), l),
      ligacoes($('plats'), l, 'ficha'),
      galeria($('gal'), l),
    ]);
  },

  async parcerias(l) {
    await Promise.all([escadas($('escadas'), l), apoios($('apoios'), l),
                       numeros($('numsApoio'), l, 'apoioNumeros'),
                       reels($('reels'), l)]);
  },

  async legal() { /* as páginas legais são só texto */ },
};

const { i18n } = iniciar(async (l) => { await PINTAR[qual]?.(l); });

/* O mapa de curvas, onde a página o tiver. Fica fora do ciclo da língua: não
   tem texto nenhum, e recriá-lo seria deitar fora o contexto de WebGL por
   nada. */
const campos = [$('campo'), $('campo2')].filter(Boolean).map((c) => iniciarCampo(c, { reduzido }));
document.addEventListener('fs:tema', () => campos.forEach((c) => c?.tema?.()));

formulario(() => i18n.lingua());
