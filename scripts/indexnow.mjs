/* Avisa os motores de busca de que o sítio mudou.
 *
 *   node scripts/indexnow.mjs           # avisa, com os endereços do sitemap
 *   node scripts/indexnow.mjs --seco    # diz o que enviaria e não envia
 *
 * ── porquê ───────────────────────────────────────────────────────────────
 * Um sítio novo é visitado quando calhar. O IndexNow inverte isso: em vez de
 * esperar que um motor volte, diz-se-lhe que há coisa nova e ele vem. É um
 * protocolo aberto, aceite pelo Bing, pelo Yandex, pelo Seznam e pelo Naver —
 * e o que se envia a um deles é partilhado com os outros.
 *
 * O Google **não** participa. Para o Google não há botão: há o sitemap, que já
 * é declarado no robots.txt, e a Search Console, que é onde uma pessoa pede a
 * indexação de um endereço. Este script não substitui isso; só cobre o resto
 * do mundo, que é metade das pesquisas em Portugal se contarmos o que o Bing
 * alimenta — incluindo os assistentes que respondem com resultados de busca.
 *
 * ── a chave ──────────────────────────────────────────────────────────────
 * A prova de que quem avisa é dono do sítio é um ficheiro com a chave lá
 * dentro, servido na raiz. Está em `/e8c639310874a6a21c0f35e534c16313.txt`, e
 * o conteúdo é o próprio nome. Não é segredo — é um par nome/conteúdo que só
 * quem publica no domínio consegue pôr lá. Se o ficheiro desaparecer, os
 * pedidos passam a ser recusados com 403, e é isso que se deve ir ver antes
 * de procurar outra coisa.
 *
 * ── o que se envia ───────────────────────────────────────────────────────
 * Os endereços saem do sitemap.xml, para não haver duas listas a divergir.
 * Enviam-se todos: são doze, e o protocolo aceita até dez mil de uma vez.
 * Avisar de mais do que mudou não é penalizado; o que é penalizado é avisar
 * de endereços que não respondem — por isso vale a pena correr isto depois de
 * o `scripts/seo.mjs`, que é quem escreve o sitemap.
 */

import { readFile } from 'node:fs/promises';

const RAIZ = new URL('../', import.meta.url);
const SECO = process.argv.includes('--seco');

const SITIO = 'https://franciscasalgado.golf';
const CHAVE = 'e8c639310874a6a21c0f35e534c16313';

/* Um só ponto de entrada: quem o recebe reencaminha para os outros motores.
   Ter uma lista de endpoints aqui era repetir o trabalho deles e arriscar
   avisos em duplicado. */
const ENDPOINT = 'https://api.indexnow.org/IndexNow';

const sitemap = await readFile(new URL('sitemap.xml', RAIZ), 'utf8');
const enderecos = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

if (!enderecos.length) {
  console.error('sitemap.xml sem <loc> — o scripts/seo.mjs correu?');
  process.exit(1);
}

const corpo = {
  host: new URL(SITIO).host,
  key: CHAVE,
  keyLocation: `${SITIO}/${CHAVE}.txt`,
  urlList: enderecos,
};

if (SECO) {
  console.log(`${enderecos.length} endereços para ${ENDPOINT}:`);
  enderecos.forEach((u) => console.log(`  ${u}`));
  process.exit(0);
}

/* Antes de avisar, confirmar que a chave está mesmo servida. Sem isto, um
   deploy que a deixasse cair dava 403 e a mensagem de erro do protocolo não
   diz qual das duas coisas falhou. */
const prova = await fetch(corpo.keyLocation).catch(() => null);
const lida = prova?.ok ? (await prova.text()).trim() : null;
if (lida !== CHAVE) {
  console.error(`a chave não está a ser servida em ${corpo.keyLocation}`);
  console.error(prova ? `  respondeu ${prova.status}, com «${lida ?? ''}»` : '  não respondeu');
  process.exit(1);
}

const r = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(corpo),
});

/* 200 e 202 são os dois «recebido». O 202 quer dizer que a chave ainda está a
   ser verificada, o que é normal na primeira vez e não é motivo para falhar. */
if (r.ok) console.log(`IndexNow: ${enderecos.length} endereços aceites (${r.status})`);
else {
  console.error(`IndexNow recusou: ${r.status} ${r.statusText}`);
  console.error((await r.text()).slice(0, 400));
  process.exit(1);
}
