/* Consentimento de cookies e medição de tráfego.
 *
 * A regra do RGPD é simples e é esta: nada de medição antes de a pessoa dizer
 * que sim. Por isso o Consent Mode arranca com tudo `denied` e só passa a
 * `granted` depois do clique — e o script do Google só é sequer carregado
 * nesse momento. Enquanto ninguém consentir, este site não põe um único
 * cookie que não seja preciso para funcionar.
 *
 * A escolha fica em localStorage, e não num cookie: assim recusar não implica
 * escrever aquilo que a pessoa acabou de recusar.
 *
 * MEDICAO está vazio de propósito. Enquanto não houver propriedade do Google
 * Analytics para este sítio, o banner continua a perguntar e a guardar a
 * resposta, mas não há nada para carregar — e assim não se carrega. Basta pôr
 * aqui o identificador «G-…» no dia em que existir.
 */

const CHAVE = 'fs-consentimento-v1';
const MEDICAO = '';

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

function aplicar(consentimento) {
  const medir = Boolean(consentimento?.medicao);
  window.gtag('consent', 'update', {
    analytics_storage: medir ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  if (medir) carregarMedicao();
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
  if (guardado) aplicar(guardado);
  else banner(lingua);

  // o botão do rodapé deixa mudar de ideias a qualquer momento
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#abrirCookies')) return;
    document.getElementById('ck')?.remove();
    banner(document.documentElement.lang.startsWith('en') ? 'en' : 'pt');
  });

}
