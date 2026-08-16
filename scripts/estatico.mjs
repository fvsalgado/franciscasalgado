/* Escreve no HTML o que hoje só existe depois do JavaScript.
 *
 *   node scripts/estatico.mjs            # escreve
 *   node scripts/estatico.mjs --seco     # só diz o que faria
 *
 * O sítio pinta quase tudo do lado do navegador a partir dos data/*.json: os
 * números, a ficha, os cartões de ranking, as épocas com as provas e a
 * imprensa, o menu e o rodapé. Num navegador isso resolve-se em milissegundos.
 * Mas nem tudo o que lê estas páginas corre JavaScript — assistentes,
 * agregadores, pré-visualizações, leitores de artigos —, e para esses a página
 * das épocas eram 3 KB com zero ligações e nenhuma prova lá dentro.
 *
 * A alternativa seria escrever o mesmo HTML duas vezes, uma em js/ para o
 * navegador e outra em scripts/ para o ficheiro. Duas cópias da mesma coisa
 * afastam-se sempre. Aqui abre-se a página a sério, deixa-se o JavaScript
 * fazer o trabalho dele, e guarda-se o resultado — a lógica continua a viver
 * num sítio só.
 *
 * O que se guarda é uma lista explícita de contentores, e não a página toda:
 *
 *   · fica de fora o que é de terceiros (Instagram, YouTube), que só carrega
 *     depois de consentimento e não deve ficar congelado no ficheiro;
 *   · fica de fora o que tem estado (banner dos cookies, cursor, botão
 *     flutuante, convite de língua), que o JavaScript volta a montar sempre;
 *   · fica dentro tudo o que é conteúdo, e o menu e o rodapé, que são as
 *     ligações internas do sítio.
 *
 * Ao abrir a página, o JavaScript repinta estes contentores por cima. O que
 * está no ficheiro é o que era verdade quando isto correu; o que o visitante
 * vê é o que é verdade agora.
 *
 * Corre depois do scripts/seo.mjs.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

/* O Playwright pode estar instalado no projeto ou no sistema, consoante isto
   corra na máquina de quem escreve ou no GitHub Actions. Tenta-se pelos dois
   caminhos em vez de fixar um. */
const { chromium } = await (async () => {
  const sitios = ['playwright', '/opt/node22/lib/node_modules/playwright/index.mjs'];
  for (const s of sitios) {
    try { return await import(s); } catch { /* segue */ }
  }
  throw new Error('playwright não encontrado. Instale com: npm install --no-save playwright');
})();

const RAIZ = new URL('../', import.meta.url);
const SECO = process.argv.includes('--seco');

const PAGINAS = ['index.html', 'resultados.html', 'recruiting.html', 'imprensa.html', 'parcerias.html'];

/* Os contentores que valem a pena guardar, por ordem de nada. Um id que não
   exista numa página é ignorado sem barulho — cada página tem os seus. */
const GUARDAR = [
  'nav', 'pe',                                        // menu e rodapé: as ligações
  'nums', 'citacoes', 'saiuEm', 'rankings', // inicial
  'proximas', 'contagens', 'filtros', 'epocas', 'videos', 'notaFonte', // épocas
  'factos', 'plats', 'gal',                           // imprensa
  'numsApoio', 'apoios', 'escadas',                   // parcerias
  'recNums', 'curva', 'curvaH', 'witbL', 'swingV',              // recruiting
];

/* Um servidor estático mínimo. O sítio não tem passo de compilação, por isso
   servir a raiz chega — e assim isto corre sem depender de nada instalado. */
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
};

function servir(porta) {
  const s = createServer(async (req, res) => {
    const caminho = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
    const ficheiro = join(RAIZ.pathname, caminho.endsWith('/') ? `${caminho}index.html` : caminho);
    try {
      const corpo = await readFile(ficheiro);
      res.writeHead(200, { 'Content-Type': TIPOS[extname(ficheiro)] || 'application/octet-stream' });
      res.end(corpo);
    } catch {
      res.writeHead(404).end('não há');
    }
  });
  return new Promise((ok) => s.listen(porta, () => ok(s)));
}

/* Trocar o conteúdo do elemento com este id, e acertar-lhe a classe — vários
   contentores só a ganham ao serem pintados.
 *
 * Conta a profundidade em vez de procurar o primeiro fecho. Na primeira vez
 * que isto correu, os contentores estavam vazios e um `</div>` não-guloso
 * acertava por acaso; na segunda, já com dezenas de divs lá dentro, fechava no
 * primeiro deles e partia a página. O ficheiro cresceu cinco kilobytes e a
 * marcação ficou com dois fechos a mais — que é o género de estrago que passa
 * despercebido porque o navegador o remenda em silêncio. */
function trocarDentro(html, id, dentro, classe) {
  const abre = new RegExp(`<(\\w+)[^>]*\\bid="${id}"[^>]*>`);
  const m = abre.exec(html);
  if (!m) return null;

  const etiqueta = m[1];
  const comeca = m.index + m[0].length;
  const varrer = new RegExp(`<(/?)${etiqueta}\\b[^>]*?(/?)>`, 'g');
  varrer.lastIndex = comeca;

  let fundo = 1;
  let fecha = -1;
  for (let t = varrer.exec(html); t; t = varrer.exec(html)) {
    if (t[2] === '/') continue;                       // <tag … /> fecha-se a si própria
    fundo += t[1] === '/' ? -1 : 1;
    if (fundo === 0) { fecha = t.index; break; }
  }
  if (fecha === -1) return null;

  let cabeca = m[0];
  if (classe) {
    cabeca = /\bclass="/.test(cabeca)
      ? cabeca.replace(/\bclass="[^"]*"/, `class="${classe}"`)
      : cabeca.replace(/^(<\w+)/, `$1 class="${classe}"`);
  }
  return html.slice(0, m.index) + cabeca + dentro + html.slice(fecha);
}

/* Esconde — ou volta a mostrar — a secção que declara depender de um
   contentor.
 *
 * Escondia-se apagando, e isso apagava-a do ficheiro de origem: a curva dos
 * rankings, o WITB e o coach's corner desapareceram do recruiting.html e não
 * voltariam no dia em que houvesse dados para eles. Um passo de geração não
 * pode destruir aquilo que gera. Agora mexe-se num atributo, e o ficheiro
 * guarda sempre a secção inteira. */
function esconderSeccao(html, id, esconder) {
  const re = new RegExp(`<section([^>]*\\bdata-se-vazio="${id}"[^>]*)>`);
  const m = re.exec(html);
  if (!m) return null;
  const tem = /\bhidden\b/.test(m[1]);
  if (tem === esconder) return html;
  const novo = esconder
    ? `<section${m[1]} hidden>`
    : `<section${m[1].replace(/\s*\bhidden\b/, '')}>`;
  return html.slice(0, m.index) + novo + html.slice(m.index + m[0].length);
}

const porta = 8123;
const servidor = await servir(porta);
const b = await chromium.launch({ args: ['--no-sandbox'] });

let mexidos = 0;
let avisos = 0;

for (const arv of ['', 'en/']) {
  for (const p of PAGINAS) {
    const caminho = `${arv}${p}`;
    const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'pt-PT' });
    const pag = await ctx.newPage();

    const erros = [];
    pag.on('pageerror', (e) => erros.push(e.message));
    await pag.goto(`http://localhost:${porta}/${caminho}`, { waitUntil: 'networkidle' });
    await pag.waitForTimeout(3500);

    /* Percorrer a página até ao fim revela tudo o que espera pelo observador,
       e é isso que faz o `epocas` chegar aqui inteiro. */
    await pag.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 25));
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 400));
    });

    const pedacos = await pag.evaluate((ids) => {
      const fora = {};
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const c = el.cloneNode(true);
        /* A classe de revelação não vai no ficheiro: quem não corre
           JavaScript não precisa dela, e quem corre volta a pô-la. */
        c.querySelectorAll('.vis').forEach((x) => x.classList.remove('vis'));
        c.querySelectorAll('[data-obs]').forEach((x) => x.removeAttribute('data-obs'));
        /* Nada de terceiros congelado no ficheiro. */
        c.querySelectorAll('iframe').forEach((x) => x.remove());
        fora[id] = { html: c.innerHTML.trim(), classe: el.className };
      }
      return fora;
    }, GUARDAR);

    if (erros.length) { console.error(`${caminho}: erro de JavaScript — ${erros[0]}`); avisos += 1; }

    let html = await readFile(new URL(caminho, RAIZ), 'utf8');
    let mudou = false;

    /* Uma secção marcada com `data-se-vazio="id"` sai do ficheiro quando esse
       contentor não trouxe nada. Serve a curva dos rankings, que só existe com
       histórico suficiente: sem isto, quem lê sem JavaScript ficava com um
       cabeçalho e nada por baixo — que se lê como uma coisa partida. */
    const seVazio = new Set([...html.matchAll(/data-se-vazio="([\w-]+)"/g)].map((m) => m[1]));
    for (const id of seVazio) {
      const novo = esconderSeccao(html, id, !pedacos[id]?.html);
      if (novo && novo !== html) { html = novo; mudou = true; }
    }

    for (const [id, { html: dentro, classe }] of Object.entries(pedacos)) {
      /* Um contentor que hoje não trouxe nada e que declara `data-se-vazio` é
         esvaziado, e não saltado.
       *
       * Saltar parecia o seguro — não se apaga o que não se sabe repor. Mas o
       * que lá está foi escrito por uma corrida anterior deste mesmo script, e
       * no dia em que os dados desaparecem o desenho antigo fica preso no
       * ficheiro: a secção esconde-se, o gráfico de ontem continua lá dentro, e
       * volta a ser capturado amanhã porque o navegador o encontra no sítio. Um
       * número que já não é verdade não pode sobreviver à fonte que o
       * sustentava.
       *
       * Só para estes contentores. Os outros podem trazer marcação escrita à
       * mão que o JavaScript nunca repinta, e essa não se toca. */
      if (!dentro && !seVazio.has(id)) continue;
      const trocado = trocarDentro(html, id, dentro, classe);
      if (!trocado) { console.error(`${caminho}: não encontrei #${id} no ficheiro`); avisos += 1; continue; }
      if (trocado === html) continue;
      html = trocado;
      mudou = true;
    }

    if (mudou) {
      if (!SECO) await writeFile(new URL(caminho, RAIZ), html);
      mexidos += 1;
      const kb = Math.round(html.length / 1024);
      console.log(`${caminho}: ${Object.keys(pedacos).length} contentores escritos, ${kb} KB`);
    } else {
      console.log(`${caminho}: já estava escrito`);
    }
    await ctx.close();
  }
}

await b.close();
servidor.close();
console.log(`\n${mexidos} página(s) mexida(s)${avisos ? `, ${avisos} aviso(s)` : ''}.`);
if (avisos) process.exitCode = 1;
