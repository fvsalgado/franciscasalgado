# Aparecer nas pesquisas

Notas do que se fez a 16 de agosto de 2026, e do que só uma pessoa com contas
de acesso pode fazer. `docs/` não é publicado (ver `.vercelignore`).

## O ponto de partida

O sítio nasceu a **14 de agosto de 2026**. Dois dias depois não aparecia em
nenhuma pesquisa — o que, num domínio novo, é o comportamento normal e não um
defeito. Um `.golf` acabado de registar não tem histórico, não tem ligações a
apontar-lhe, e o Google não sabe que existe até alguém lhe dizer ou até
tropeçar numa ligação.

Verificado nesse dia: o servidor responde 200 a toda a gente, incluindo ao
Googlebot e ao Bingbot; o `robots.txt` deixa entrar; o `sitemap.xml` responde;
as páginas trazem o conteúdo escrito no HTML e não só pintado por JavaScript
(18 mil caracteres de texto no `<main>` das épocas, sem correr uma linha de
script). Nada disto era o problema.

## O que estava mesmo mal

**A casa inglesa declarava um endereço que redirecciona.** O
`"trailingSlash": false` do `vercel.json` faz `/en/` responder 308 para `/en`.
E era `/en/` que estava escrito no `canonical` da página inglesa, nos três
`hreflang` de **todas** as páginas das duas línguas, e nas duas entradas do
sitemap.

Isto não é cosmético. Um canonical que aponta a um redireccionamento é um
sinal a contradizer-se, e um `hreflang` cujo alvo redirecciona invalida o par
inteiro — ou seja, a versão portuguesa também estava a declarar mal a irmã.
Corrigido para `/en` em `scripts/traduzir.mjs`, `scripts/seo.mjs`,
`js/casca.js` e `js/i18n.js`.

**O `www` servia o sítio inteiro em duplicado**, com 200 e não com um
redireccionamento. O `canonical` salvava a situação, mas mal. Passou a 308
para o domínio sem `www`, por regra em `vercel.json` — e não pelo painel da
Vercel, para a regra viver no repositório com o resto.

**O `lastmod` do sitemap mentia por atraso.** Saía do campo `atualizado` dos
dados, que é um mês, e um mês vira sempre dia 1: dizia 1 de agosto no dia 16,
com metade do percurso reescrito pelo meio. Passou a vir do `git log -1` dos
ficheiros que fazem cada página — uma data por página, para a que mexeu se
distinguir da que não mexeu.

**Três descrições estavam desactualizadas ou cortadas.** A das épocas prometia
resultados volta a volta que já lá não estão; as do recruiting e do saco
passavam dos 180 caracteres e apareciam truncadas.

## O que se acrescentou

- `max-image-preview:large` nas seis páginas indexáveis. Sem isto, um resultado
  de pesquisa sobre uma atleta leva uma miniatura; com isto, pode levar a
  fotografia grande. Numa pesquisa por nome de pessoa, é a diferença entre ser
  clicado e ser saltado.
- `X-Robots-Tag: noindex` em `/data/` e `/api/`. Continuam abertos e legíveis —
  é a razão de existirem, e o `llms.txt` aponta para lá —, mas deixam de poder
  aparecer como resultados de pesquisa. Ficheiros JSON no índice não servem
  ninguém e diluem o domínio.
- **IndexNow** (`scripts/indexnow.mjs`). Avisa o Bing, o Yandex, o Seznam e o
  Naver de que há coisa nova, em vez de esperar que passem por cá. A chave está
  em `/e8c639310874a6a21c0f35e534c16313.txt` — não é segredo, é a prova de que
  quem avisa publica no domínio. **Se esse ficheiro desaparecer, o protocolo
  passa a responder 403**, e é a primeira coisa a verificar.

  Corre sozinho no fim da ronda do vigia, e só quando houve mesmo alterações,
  com noventa segundos de espera para a Vercel publicar primeiro — avisar de um
  endereço que ainda serve a versão antiga é pior do que não avisar.

  **O Google não participa neste protocolo.** Para o Google não há botão: há o
  sitemap, já declarado no `robots.txt`, e a Search Console.

## O que depende de uma pessoa

Por ordem de efeito. Nenhuma destas se faz a partir do repositório.

1. **Search Console** (`search.google.com/search-console`). Verificar o domínio
   pelo método **DNS TXT**, e não pelo ficheiro HTML nem pela etiqueta: o TXT
   verifica o domínio inteiro de uma vez — com `www` e sem, http e https — e
   sobrevive a qualquer alteração no sítio. Depois: submeter
   `https://franciscasalgado.golf/sitemap.xml` e pedir a indexação da página
   inicial em «Inspeção de URL».

   É isto que tira o sítio da fila. Sem Search Console, esperam-se semanas;
   com, costumam ser dias.

2. **O domínio `.com`.** Serve hoje um sítio antigo — «Francisca — Golfe
   Performance» —, responde 200 e não tem `noindex`. Compete pelo mesmo nome e
   confunde quem procura. Redireccionar tudo para `franciscasalgado.golf` com
   301 é o melhor: passa a autoridade que tiver, em vez de a deitar fora.

3. **Ligações de fora.** É o factor que mais pesa e o único que não se resolve
   com código. Por ordem de credibilidade: a ficha dela no portal da FPG,
   a bio do Instagram, o European Golf Rankings, os clubes (Vale de Janelas,
   Praia D'El Rey, West Cliffs), os patrocinadores da página de parcerias, e a
   imprensa que já escreveu sobre ela — as 42 peças do arquivo são 42 sítios
   que a mencionam e nenhum liga para aqui.

4. **Bing Webmaster Tools** (`bing.com/webmasters`). Importa a verificação da
   Search Console num clique. Alimenta o Bing, o DuckDuckGo, o Ecosia — e os
   assistentes que respondem com resultados de busca.

5. **Google Business / Knowledge Panel.** Não se pede; ganha-se, quando o
   Google junta o `sameAs` da página com a FPG, o WAGR, o EGR e o Instagram.
   O que se faz do nosso lado já está feito.

## O que não vale a pena fazer

- **Reencaminhar por idioma do browser.** Já está decidido e documentado no
  `js/i18n.js`: quem indexa chega quase sempre sem preferência declarada, e um
  reencaminhamento esconde-lhe metade do sítio. Fica o convite, que se fecha.
- **Pedir indexação todos os dias.** A Search Console tem quota e o efeito não
  se acumula. Uma vez por página, e depois só quando a página mudar a sério.
- **Comprar ligações.** É o caminho mais rápido para uma penalização manual num
  domínio que ainda não tem nada a perder — excepto o nome dela.

## Como voltar a verificar isto

```sh
# o essencial, de uma vez
curl -sI https://franciscasalgado.golf/ | grep -i 'http/\|x-robots'
curl -s  https://franciscasalgado.golf/en | grep -o 'rel="canonical" href="[^"]*"'
curl -sI https://www.franciscasalgado.golf/ | grep -i 'http/\|location'
curl -s  https://franciscasalgado.golf/sitemap.xml | grep -c '<loc>'
node scripts/indexnow.mjs --seco
```

O canonical de `/en` tem de dizer `/en`, sem barra. O `www` tem de dar 308. E
o `--seco` do IndexNow tem de listar doze endereços, todos a responder 200 —
se um deles der 404, o protocolo desconfia de todos.
