/* Consentimento de cookies e medição de tráfego.
 *
 * A regra do RGPD é simples e é esta: nada de medição antes de a pessoa dizer
 * que sim. O PostHog só é sequer descarregado depois do clique em «Aceitar», e
 * enquanto ninguém consentir este site não escreve um único cookie nem um
 * identificador que não seja preciso para funcionar.
 *
 * A escolha fica em localStorage, e não num cookie: assim recusar não implica
 * escrever aquilo que a pessoa acabou de recusar.
 *
 * A chave passou de v1 para v2 quando a medição passou a existir de facto. Até
 * outubro de 2026 o banner perguntava mas não havia nada para carregar; quem
 * disse que sim nessa altura disse-o a uma política que não nomeava o serviço.
 * Pergunta-se outra vez, já com o PostHog escrito na política.
 *
 * MEDICAO (Google Analytics) continua vazio, e assim fica: o Consent Mode do
 * Google mantém-se montado e inerte, para o dia em que se queira um «G-…».
 */

import { lePortugues } from './i18n.js';

const CHAVE = 'fs-consentimento-v2';
const MEDICAO = '';

/* ── PostHog ─────────────────────────────────────────────────
 *
 * O projeto «Franciscasalgado.golf», na região europeia do PostHog
 * (Frankfurt). Três escolhas, e a razão de cada uma:
 *
 *  · Passa pelo próprio domínio, em /bola — o vercel.json reencaminha para o
 *    PostHog do lado do servidor. O navegador de quem lê nunca fala com um
 *    servidor de fora, e os bloqueadores que cortam por domínio não cortam
 *    isto. O caminho não se chama «analytics» nem «posthog» de propósito: são
 *    as primeiras palavras que as listas de bloqueio procuram.
 *  · Só corre em franciscasalgado.golf. As pré-visualizações da Vercel e o
 *    servidor local do scripts/estatico.mjs ficam de fora, para não somarem
 *    visitas que não aconteceram.
 *  · Sem gravação de sessões e sem perfis de pessoa; o identificador vive em
 *    localStorage e não num cookie. O IP é descartado no próprio projeto
 *    (anonymize_ips) e não chega a ser guardado.
 *
 * A chave é pública por natureza — vai dentro de qualquer página que use o
 * PostHog — e só serve para enviar eventos, não para os ler. */
const POSTHOG = {
  chave: 'phc_vvD9GARvWfW5dRz45VzCMDJ3rZattXqSYDcqgUdfV8UL',
  via: '/bola',
  painel: 'https://eu.posthog.com',
  dominio: 'franciscasalgado.golf',
};

const T = {
  pt: {
    titulo: 'Cookies',
    texto: 'Este site usa cookies essenciais para funcionar. Com a sua autorização, passa também a medir o tráfego, para saber que páginas são lidas.',
    politica: 'Política de privacidade',
    aceitar: 'Aceitar', recusar: 'Recusar medição',
  },
  en: {
    titulo: 'Cookies',
    texto: 'This site uses essential cookies to work. With your permission, it will also measure traffic, to know which pages get read.',
    politica: 'Privacy policy',
    aceitar: 'Accept', recusar: 'Decline measurement',
  },
};

const ler = () => {
  try { return JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch { return null; }
};
const guardar = (v) => {
  try { localStorage.setItem(CHAVE, JSON.stringify({ ...v, quando: new Date().toISOString() })); } catch { /* modo privado */ }
};

/* O Consent Mode tem de existir antes de qualquer tag. Arranca negado. */
function arrancarConsentMode() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500,
  });
}

let carregado = false;
function carregarMedicao() {
  if (carregado || !MEDICAO) return;
  carregado = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${MEDICAO}`;
  document.head.append(s);
  window.gtag('js', new Date());
  window.gtag('config', MEDICAO, { anonymize_ip: true });
}

let phCarregado = false;
function ligarPostHog() {
  if (location.hostname !== POSTHOG.dominio) return;
  /* Já carregado nesta página: é alguém que recusou e voltou a aceitar sem
     sair dela. Volta a contar a partir daqui. */
  if (phCarregado) { window.posthog?.opt_in_capturing?.(); return; }
  phCarregado = true;

  /* O snippet oficial do PostHog, tal como vem na documentação: põe uma fila
     em window.posthog que guarda as chamadas até o /bola/static/array.js
     chegar. */
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],Object.defineProperty(u,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e}}),Object.defineProperty(u.people,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+".people (stub)"}}),o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  window.posthog.init(POSTHOG.chave, {
    api_host: POSTHOG.via,
    ui_host: POSTHOG.painel,
    defaults: '2026-05-30',
    persistence: 'localStorage',
    person_profiles: 'identified_only',
    disable_session_recording: true,
    /* Quem recusou noutra visita e aceita agora pode trazer a marca de recusa
       guardada pelo próprio PostHog. A resposta que vale é a de agora. */
    loaded: (ph) => { if (ph.has_opted_out_capturing()) ph.opt_in_capturing(); },
  });
}

/* Retirar o consentimento a meio da visita pára a contagem ali mesmo. Nas
   visitas seguintes o PostHog nem chega a carregar, e o que deixou guardado no
   navegador — o identificador e a marca de recusa — sai: retirar o
   consentimento é também não deixar rasto. Na mesma página não se apaga, porque
   é precisamente a marca de recusa que mantém o PostHog calado até sair dela. */
function desligarPostHog() {
  if (phCarregado) { window.posthog?.opt_out_capturing?.(); return; }
  try {
    Object.keys(localStorage)
      .filter((k) => k.includes(POSTHOG.chave))
      .forEach((k) => localStorage.removeItem(k));
  } catch { /* modo privado */ }
}

function aplicar(consentimento) {
  const medir = Boolean(consentimento?.medicao);
  window.gtag('consent', 'update', {
    analytics_storage: medir ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  if (medir) { carregarMedicao(); ligarPostHog(); } else desligarPostHog();
}

function banner(lingua) {
  const t = T[lingua] || T.pt;
  const cx = document.createElement('aside');
  cx.className = 'ck';
  cx.id = 'ck';
  cx.setAttribute('role', 'region');
  cx.setAttribute('aria-label', t.titulo);
  cx.innerHTML = `
    <p class="ck__t">${t.texto} <a href="${lingua === 'en' ? '/en/' : '/'}privacidade.html">${t.politica}</a>.</p>
    <div class="ck__b">
      <button class="cap" type="button" id="ckNao">${t.recusar}</button>
      <button class="cap cap--cheio" type="button" id="ckSim">${t.aceitar}</button>
    </div>`;
  document.body.append(cx);

  const decidir = (medicao) => {
    const c = { essenciais: true, medicao };
    guardar(c);
    aplicar(c);
    cx.remove();
  };
  cx.querySelector('#ckSim').addEventListener('click', () => decidir(true));
  cx.querySelector('#ckNao').addEventListener('click', () => decidir(false));
}

export function cookies(lingua = 'pt') {
  arrancarConsentMode();

  const guardado = ler();
  if (guardado) { aplicar(guardado); ligarBotao(); return; }

  /* Em que língua se pergunta.
   *
   * Não é a da página: é a de quem lê. Um visitante inglês que caia na versão
   * portuguesa via o aviso de privacidade em português — a decisão mais séria
   * que a página lhe pede, escrita numa língua que ele não pediu. Isso não é
   * consentimento informado, é um botão que se carrega para o muro sair. */
  const falo = lingua === 'pt' && !lePortugues() ? 'en' : lingua;

  /* O convite de língua deixou de existir — quem não lê português é
     reencaminhado para /en antes de isto correr — por isso o banner nasce
     logo, na língua de quem ficou. */
  banner(falo);
  ligarBotao();
}

/* O botão do rodapé deixa mudar de ideias a qualquer momento. */
function ligarBotao() {

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#abrirCookies')) return;
    document.getElementById('ck')?.remove();
    banner(document.documentElement.lang.startsWith('en') ? 'en' : 'pt');
  });
}
