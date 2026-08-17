/* Créditos de imagem, sempre.
   Percorre as imagens da página e põe por baixo de cada uma de quem é. A
   tabela está em data/creditos.json; uma imagem que entre no site sem lá
   estar deixa aviso na consola, para não passar despercebida. */

let TABELA = null;

const ficheiro = (src) => src.split('/').pop().split('?')[0];
const dominio = (src) => { try { return new URL(src, location.href).hostname; } catch { return ''; } };

/** Onde é que o crédito entra: dentro de <figure>, ou logo a seguir à imagem.
    Vive sempre num <span> próprio, para poder ser reescrito ao mudar de
    língua sem apagar a legenda que veio na marcação. */
/* Uma licença que se nomeia mas não se aponta é meia atribuição. Quando o
   crédito traz `licenca` e `licencaUrl` — o caso das fotografias em Creative
   Commons —, a licença sai como ligação, que é o que a própria licença pede.
   Sem eles, o crédito continua a ser uma linha de texto como sempre foi. */
function comLicenca(alvo, texto, c) {
  alvo.textContent = texto;
  if (!c?.licenca || !c?.licencaUrl) return;
  alvo.append(' · ');
  const a = document.createElement('a');
  a.href = c.licencaUrl;
  a.target = '_blank';
  a.rel = 'noopener license';
  a.textContent = c.licenca;
  alvo.append(a);
}

/* Várias imagens a creditar no mesmo sítio, uma linha só, uma vez por origem.
 *
 * A fila do what's in the bag tem sete fotografias de três marcas. Uma legenda
 * por fotografia desalinhava a fila — a legenda ocupa altura, as imagens estão
 * alinhadas pela base e a base deixa de ser uma base — e escrevia «Cobra Golf»
 * cinco vezes seguidas, que é ruído a ler com os olhos e pior num leitor de
 * ecrã. Numa linha só, cada marca aparece uma vez.
 *
 * `data-credito-base` é o rótulo que já lá está («Imagens:»), escrito por quem
 * desenhou a linha; sem ele, a linha começa vazia — que é o caso do hero. */
function juntar(alvo, texto, c, juntos) {
  let vistos = juntos.get(alvo);
  if (!vistos) {
    /* Primeira desta passagem: a linha recomeça. Sem isto, mudar de língua
       acrescentava a versão inglesa a seguir à portuguesa. */
    vistos = new Set();
    juntos.set(alvo, vistos);
    alvo.textContent = alvo.dataset.creditoBase ? `${alvo.dataset.creditoBase} ` : '';
  }
  if (vistos.has(texto)) return;
  if (vistos.size) alvo.append(' · ');
  vistos.add(texto);

  const span = document.createElement('span');
  alvo.append(span);
  comLicenca(span, texto, c);
}

function colocar(img, texto, c, juntos) {
  /* `data-credito-em` aponta um elemento onde o crédito deve ir. Serve o hero
     da página inicial, onde a fotografia sangra por trás de tudo e o crédito
     tem de viver na fila de baixo, longe do resto — e a fila do WITB, onde
     sete imagens partilham a mesma linha. */
  if (img.dataset.creditoEm) {
    const alvo = document.getElementById(img.dataset.creditoEm);
    if (alvo) { juntar(alvo, texto, c, juntos); return; }
  }
  const fig = img.closest('figure');
  if (fig) {
    let leg = fig.querySelector('figcaption');
    if (!leg) { leg = document.createElement('figcaption'); fig.append(leg); }

    let cred = leg.querySelector('.credito-i');
    if (!cred) {
      cred = document.createElement('span');
      cred.className = 'credito-i';
      leg.append(cred);
    }
    // havia legenda escrita à mão? então o crédito vem a seguir, com separador
    const proprio = [...leg.childNodes].some((n) => n !== cred && n.textContent.trim());
    comLicenca(cred, proprio ? ` · ${texto}` : texto, c);
    return;
  }

  let p = img.nextElementSibling?.classList.contains('credito') ? img.nextElementSibling : null;
  if (!p) {
    p = document.createElement('p');
    p.className = 'credito';
    img.after(p);
  }
  comLicenca(p, texto, c);
}

export async function creditos(idioma = 'pt') {
  if (!TABELA) {
    try {
      TABELA = await (await fetch('/data/creditos.json', { cache: 'no-cache' })).json();
    } catch (e) {
      console.warn('créditos:', e.message);
      return;
    }
  }

  /* Vive uma passagem e morre. É o que faz a linha do WITB recomeçar do zero a
     cada mudança de língua em vez de ir crescendo. */
  const juntos = new Map();

  document.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (!src) return;

    // imagem já creditada na própria marcação
    if (img.dataset.creditoFeito === '1') return;

    const c = TABELA.porFicheiro?.[ficheiro(src)] || TABELA.porDominio?.[dominio(src)];
    if (!c) {
      console.warn('imagem sem crédito:', src, '— acrescenta em data/creditos.json');
      return;
    }
    /* Entrada com texto em branco: é uma decisão, não um esquecimento. Diz que
       a proveniência está registada no `_origem` mas a autoria ainda não se
       sabe — e enquanto não se souber, mais vale linha nenhuma do que um nome
       adivinhado. Nomear mal quem tirou uma fotografia é pior do que não a
       creditar; e um crédito vazio desenhado à mesma deixava uma legenda oca
       por baixo da imagem. */
    const texto = c[idioma] ?? c.pt;
    if (!String(texto || '').trim()) return;
    colocar(img, texto, c, juntos);
  });
}
