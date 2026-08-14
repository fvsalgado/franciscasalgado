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
function colocar(img, texto) {
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
    cred.textContent = proprio ? ` · ${texto}` : texto;
    return;
  }

  let p = img.nextElementSibling?.classList.contains('credito') ? img.nextElementSibling : null;
  if (!p) {
    p = document.createElement('p');
    p.className = 'credito';
    img.after(p);
  }
  p.textContent = texto;
}

export async function creditos(idioma = 'pt') {
  if (!TABELA) {
    try {
      TABELA = await (await fetch('data/creditos.json', { cache: 'no-cache' })).json();
    } catch (e) {
      console.warn('créditos:', e.message);
      return;
    }
  }

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
    colocar(img, c[idioma] || c.pt);
  });
}
