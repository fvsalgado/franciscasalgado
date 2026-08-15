# franciscasalgado.golf

Sítio da golfista amadora **Francisca Salgado**. HTML, CSS e JavaScript de
módulos, sem passo de compilação e sem dependências: abre-se um servidor
estático na raiz e está a funcionar.

Parte da arquitetura vem do sítio da Marta Rosa — a casca (cabeçalho, rodapé,
tema, língua, consentimento), o movimento e o sistema de créditos de imagem.
As cores, a tipografia, o fundo do hero e todo o modelo de conteúdo são
próprios: aquele é um sítio de música, este é de resultados.

```
npx serve .          # ou: python3 -m http.server
```

## Onde está o quê

| | |
|---|---|
| Páginas | `index.html`, `resultados.html`, `imprensa.html`, `parcerias.html`, `privacidade.html`, `termos.html` |
| Em inglês | `en/` — **gerado**, não se mexe à mão: ver «Idiomas» |
| Estilo | `css/site.css` — um ficheiro, com as variáveis de tema no topo |
| Comportamento | `js/` — módulos ES, sem empacotador |
| Conteúdo | `data/*.json` — é aqui que se mexe no dia a dia |
| Funções | `api/` — `wagr.js`, `egr.js` e `instagram.js` |
| Manutenção | `scripts/*.mjs` — correm à mão ou pelo GitHub Actions, e nunca chegam ao servidor (`.vercelignore`) |
| Tipos de letra | `fonts/` — Fraunces e Manrope, alojados aqui e não no Google |
| Fotografias | `img/` — ver «Fotografias», mais abaixo |

### Os módulos

| | |
|---|---|
| `base.js` | arranque partilhado: tema, consentimento, língua, casca, movimento |
| `casca.js` | cabeçalho, menu de telemóvel, rodapé e o botão de tema |
| `campo.js` | o fundo do hero — carta topográfica animada em WebGL |
| `resultados.js` | as épocas: o relato do ano, as provas, o marcador, os filtros e a imprensa desse ano |
| `conteudo.js` | números, factos, citações, ligações e as quatro portas |
| `media.js` | galeria, vídeos e a parede de apoios |
| `rankings.js` | os dois cartões de ranking, o mundial e o europeu |
| `instagram.js` | as publicações embutidas, ou o convite quando não há |
| `i18n.js` | qual é a língua da página e qual é o endereço da outra |
| `icones.js` | os desenhos, num sítio só |
| `movimento.js` | cursor, revelação ao rolar, barra de navegação |
| `creditos.js` | o crédito obrigatório por baixo de cada fotografia |
| `main.js` / `pagina.js` | pontos de entrada: a inicial e as interiores |

### Os scripts de manutenção

Correm com `node scripts/<nome>.mjs`, a partir da raiz.

| | |
|---|---|
| `vigia.mjs` | a ronda diária às fontes — ver «O que se atualiza sozinho» |
| `traduzir.mjs` | escreve o `en/` inteiro a partir do HTML português e de `en.mjs` |
| `seo.mjs` | dados estruturados, `sitemap.xml` e `llms.txt` |
| `en.mjs` | o dicionário inglês. É dado, não é script: só `traduzir.mjs` o lê |
| `og.mjs` | refaz a imagem de partilha e carimba-lhe a versão |
| `estatico.mjs` | escreve no HTML o que o JavaScript pinta — ver «Sem JavaScript» |
| `capas.mjs` | as miniaturas dos vídeos, guardadas cá |
| `capas-imprensa.mjs` / `logos-imprensa.mjs` | as fotografias e os símbolos da lista de imprensa |
| `wagr.mjs` / `egr.mjs` | refrescam à mão os instantâneos dos rankings |

### O handicap

Vem da lista de federados da FPG (n.º **43832**), e é o número que um treinador
universitário procura primeiro. O `api/_handicap.js` sabe lê-lo, mas **nunca foi
visto a funcionar**: o `scoring.fpg.pt` devolve 500 a esta caixa de
desenvolvimento. A primeira prova de vida é a ronda diária, que corre de uma
ligação normal. Se falhar lá também, não parte nada — `data/handicap.json`
serve o último valor confirmado à mão, com a data, e o vigia avisa quando esse
valor fizer mais de trinta dias.

### O gráfico dos rankings

`data/rankings-historico.json` ganha um ponto por cada dia em que o WAGR ou o
EGR mudem — dias iguais não deixam rasto. Começou a 15 de agosto de 2026, do
zero, porque ninguém guardava isto. **A curva só se desenha com três pontos ou
mais**; até lá a secção inteira sai da página, porque um cabeçalho com nada por
baixo lê-se como uma coisa que se partiu.

**Depois de mexer em HTML ou em `data/`**, corre-se, por esta ordem:

```
node scripts/traduzir.mjs && node scripts/seo.mjs && node scripts/estatico.mjs
```

A ordem importa: o inglês nasce do português, os dados estruturados escrevem-se
nas duas línguas, e o `estatico.mjs` fotografa o resultado final. É a mesma
sequência que a ação diária corre.

## Sem JavaScript

O sítio pinta quase tudo no navegador a partir dos `data/*.json`. Isso é bom
para manter — muda-se um ficheiro e o sítio muda — e era mau para quem lê sem
correr JavaScript. A página das épocas chegava a entregar **3 KB e zero
ligações**: nem menu, nem rodapé, nem uma única prova. Um navegador resolvia
aquilo em milissegundos; um assistente, um agregador ou uma pré-visualização
não resolvem nada.

Duas medidas, e nenhuma delas duplica código:

**1. `scripts/estatico.mjs`** abre cada página num Chromium, deixa o JavaScript
fazer o trabalho dele e guarda o resultado dentro do ficheiro. A alternativa
era escrever o mesmo HTML duas vezes, uma em `js/` para o navegador e outra em
`scripts/` para o ficheiro — e duas cópias da mesma coisa afastam-se sempre.
Ao abrir a página, o JavaScript repinta por cima: o que está no ficheiro é o
que era verdade quando aquilo correu, o que o visitante vê é o que é verdade
agora. Guarda uma lista explícita de contentores; fica de fora o que é de
terceiros (Instagram, YouTube) e o que tem estado (cookies, cursor, botão
flutuante).

**2. As animações de revelação passaram a depender de `html.js`,** marca que o
`js/base.js` põe ao arrancar. Antes, o texto começava a zero de opacidade à
espera de um observador; sem JavaScript ficava invisível para sempre — e a
cortina de carregamento da página inicial tapava tudo. Agora, sem JavaScript, o
texto fica simplesmente visível.

O teste é `javaScriptEnabled: false` no Playwright: as quatro páginas têm de
mostrar texto, ligações e zero elementos a opacidade zero.

## Quatro páginas

| | |
|---|---|
| `index.html` | quem é, os números, os rankings em direto, as portas para o resto, uma citação, o Instagram e as seis perguntas |
| `resultados.html` | **época a época**: cada ano com o relato, as provas e a imprensa desse ano |
| `imprensa.html` | kit: biografia curta, ficha, citações com fonte, fotografias em alta resolução e fichas oficiais |
| `recruiting.html` | para treinadores universitários: handicap, rankings, ano de conclusão, calendário e contacto |
| `parcerias.html` | quem apoia, o que um apoio cobre, e o contacto no fim |

Eram seis. O `percurso.html` e o `resultados.html` contavam a mesma carreira
por ordem cronológica, cada um à sua maneira, e o clipping da imprensa era uma
terceira lista pela mesma ordem — juntaram-se numa só, por ano. O
`contacto.html` era uma página inteira para um formulário, e o contacto passou
para o fim das parcerias, que é onde quem escreve chega depois de ler o que há
para apoiar. Os endereços antigos redirecionam, em `vercel.json`.

## Mexer no conteúdo

Quase tudo se faz em `data/`, sem tocar em HTML.

### Acrescentar uma prova

Em `data/resultados.json`, **no topo** da lista `provas` (a ordem do ficheiro é
a ordem no sítio — mais recente primeiro):

```json
{
  "id": "nome-curto-2026",
  "ano": 2026,
  "data": "2026-09-14",
  "torneio": { "pt": "Nome da prova", "en": "Event name" },
  "campo": "Nome do campo",
  "local": { "pt": "Cidade, País", "en": "City, Country" },
  "pos": 1,
  "voltas": [72, 70, 74],
  "total": 216,
  "par": 0,
  "escalao": { "pt": "Sub-18", "en": "U18" },
  "selos": ["titulo", "wagr"],
  "nota": { "pt": "…", "en": "…" },
  "fonte": { "nome": "FPG", "url": "https://…" }
}
```

- `pos` — a classificação. **Se ainda não foi publicada, ponha `null`**: a
  caixa passa a dizer que não sabe, em vez de inventar um lugar. Isto é de
  propósito e é a regra da casa.
- `posT: true` — empate (mostra `T3`).
- `posTexto` — quando a classificação não é um número («Campeã Nacional»,
  «Líder às 36 voltas»).
- `par` — inteiro: `-2` abaixo do par, `0` no par, `7` para `+7`. `null` se
  não se souber.
- `dataTexto` — quando só se sabe o mês, ou quando a prova durou vários dias
  («5–7 dezembro 2025»). Substitui a data formatada.
- `selos` — `titulo`, `podio`, `wagr`, `selecao`.

Uma prova ganha (`pos: 1`) entra automaticamente no palmarès da página
inicial. Os contadores por época e os filtros também se atualizam sozinhos.

### Números, factos, relato de cada época, escalões de apoio

Tudo em `data/perfil.json`. Os números da página inicial saem de `numeros`, a
ficha de `factos`, as formas de apoiar de `escadas`, e o relato de cada ano de
`percurso` — que é o parágrafo que aparece por baixo do número do ano, na
página das épocas. É o `ano` que o liga à época certa.

### Imprensa

`data/imprensa.json`: `citacoes` (com ligação à peça de onde saíram), `pecas`
(o clipping, 40 peças de 2019 a 2026) e `saiuEm` (as oito casas onde saiu).

As peças aparecem na página das épocas, por baixo do ano em que saíram — a
data (`"data": "2026-08"`) é o que as põe lá. Uma peça sem data não aparece.

A miniatura de cada peça (`capa`) e o símbolo de cada casa são descarregados
uma vez pelo `capas-imprensa.mjs` e pelo `logos-imprensa.mjs`, e ficam em
`img/imprensa/`. Guardados cá de propósito: pedi-los na hora seriam quarenta
pedidos a oito servidores de cada vez que a página abre, cada um a levar o
endereço de quem está a ler. Uma peça sem miniatura mostra na mesma o símbolo
da casa e o título.

### Galeria, vídeos e apoios

| | |
|---|---|
| `data/galeria.json` | as fotografias e as legendas. O crédito **não** se escreve aqui — vem de `creditos.json` |
| `data/videos.json` | vídeos do YouTube. O `id` é o que vem depois de `watch?v=` |
| `data/apoios.json` | a parede de apoios, em grupos |

Os vídeos não carregam nada do YouTube antes de alguém carregar no botão —
nem sequer a miniatura. Até lá é uma capa desenhada em CSS, e quem passa pela
página não é seguido por causa de um vídeo que não chegou a ver.

Na parede de apoios, um item com `logo` mostra o logótipo; sem `logo`, mostra
o nome na tipografia da casa, dentro do mesmo cartão. Assim a parede lê-se
como uma só coisa mesmo com logótipos a faltar, e um que chegue amanhã entra
sem mexer em mais nada. Os logótipos vivem numa placa branca de propósito:
quase todos são desenhados para fundo claro e desapareceriam no tema escuro.
Para os que são desenhados a branco — a Lusíadas Saúde só publica essa versão
— há `"fundo": "escuro"`, que dá àquele cartão uma placa escura, em vez de se
andar a recolorir o logótipo de outra gente.

**Os grupos são por natureza da relação**, e isso é uma escolha: patrocinador
principal, parceiro, apoio institucional e campo de casa não são a mesma
coisa, e uma parede que os misturasse dizia menos do que parece.

### Instagram

Três caminhos, por esta ordem, e o site usa o primeiro que funcionar:

1. **`/api/instagram`** — a Graph API da Meta, se houver token. Traz as
   publicações **e** as contas do perfil (seguidores, a seguir, publicações),
   e o cartão passa a dizer «Em direto».
2. **`data/instagram.json`** — os códigos das publicações e o bloco `perfil`,
   escritos à mão. É o que está a ser usado agora.
3. O convite a seguir a conta, quando não há nem um nem outro.

**A conta ser pública não chega para o caminho 1.** O Instagram deixou de
servir o conteúdo do perfil a quem não tem sessão: a página devolve 600 KB de
JavaScript sem uma publicação lá dentro, e a API de perfil responde
`require_login` a pedidos vindos de servidores. Para ter isto automático, a
conta é dela, por isso pode emitir um token de longa duração na Graph API e
guardá-lo na Vercel como `IG_TOKEN`. Sem token, `api/instagram.js` responde
501 — não finge.

**O cartão de seguidores** só mostra números quando os sabe. Com token vêm da
Graph API; sem token vêm do bloco `perfil` de `data/instagram.json`, que está
com `null` à espera de serem preenchidos:

```json
"perfil": { "seguidores": 1440, "aSeguir": 320, "publicacoes": 180 }
```

Enquanto estiverem a `null` o cartão desenha-se na mesma, com a fotografia, o
arroba e o botão — só sem contas. Um número de seguidores inventado seria pior
do que número nenhum. Nota: `followers_count` só existe em contas Business ou
Creator; numa conta pessoal a Graph API dá as publicações mas não as contas.

**As parcerias em vídeo** (`parcerias`, em `data/instagram.json`) são os reels
de marca, e aparecem na página de apoios. Mostram o trabalho de patrocínio já
feito, que é o argumento mais concreto para quem está a pensar entrar.

## Ligar as coisas que faltam

Cada ponta por atar tem uma variável vazia e um comentário no sítio certo, e
nenhuma delas parte o sítio enquanto estiver por ligar:

| O quê | Onde | Como |
|---|---|---|
| Receção do correio | registos MX de `franciscasalgado.golf` | **é a única ponta que importa**: sem MX, `birdie@` não recebe nada, e o email é agora a via principal de contacto |
| Medição de tráfego | `js/cookies.js`, `const MEDICAO` | o identificador `G-…` do Google Analytics. Vazio significa que não há nada a carregar — e o banner continua a perguntar na mesma |
| Publicações do Instagram | `IG_TOKEN`, nas variáveis de ambiente | ver a secção «Instagram» |

### Não há formulário

Havia um, e uma função `api/contacto.js` que o entregava por Resend. Saíram os
dois. Um formulário é uma promessa de entrega que depende de três coisas a
funcionarem ao mesmo tempo — serviço de envio, chave válida, registos de
correio — e quando uma falha, quem escreveu não fica a saber que a mensagem
não chegou. O endereço e o Instagram não têm nada disso pelo meio: a mensagem
sai da caixa de quem a escreve, e fica lá a prova de que saiu.

Consequência prática: **os registos MX passaram de desejáveis a obrigatórios.**
Enquanto `franciscasalgado.golf` não tiver MX, o `birdie@` não recebe — e não
há segundo caminho para apanhar o que se perde.

## Idiomas

Português e inglês, cada um no seu endereço real: `/resultados.html` e
`/en/resultados.html`. Isto é preciso para o `hreflang` — uma página que
trocasse de língua no browser era, para um motor de busca, uma página só.

**O português é o que está escrito no HTML.** O inglês vive em
`scripts/en.mjs` e o `scripts/traduzir.mjs` escreve o `en/` inteiro a partir
dos dois. Um texto novo leva um `data-t="chave"` no HTML e a mesma chave no
dicionário; sem tradução fica o português, nunca fica vazio.

**O `en/` não se edita** — é gerado, e a próxima passagem do `traduzir.mjs`
apaga o que lá se escrever à mão.

## O que se atualiza sozinho

`scripts/vigia.mjs` corre todos os dias às 06:10 UTC pelo GitHub Actions
(`.github/workflows/vigia.yml`) e vai ver o WAGR, o European Golf Rankings e o
arquivo de notícias da FPG.

A regra é uma só: **o que é número entra sozinho, o que é texto espera por
uma pessoa.** Rankings e datas de provas são escritos nos `data/*.json` e
seguem para o sítio; uma notícia nova, uma prova que mude de sítio ou
qualquer coisa que precise de uma frase escrita fica anotada em
`VIGIA-ATENCAO.md`, que abre um *issue* no GitHub. Uma prova que entre por
esta via fica marcada `porRever` até alguém confirmar.

Uma notícia só entra sozinha na lista se o **título** trouxer o nome dela. Se
o nome aparecer apenas no corpo — o que acontece em quase todas as crónicas de
prova, que citam dezenas de jogadoras — fica para revisão e não entra.

## Privacidade

Nada de medição antes de consentimento — o Consent Mode arranca tudo negado e
o script do Google só é sequer descarregado depois do clique. A escolha fica
em `localStorage`, e não num cookie, para que recusar não implique escrever
aquilo que a pessoa acabou de recusar. Língua e tema também ficam só no
navegador de quem visita.

## De onde vêm os resultados

Sobretudo do arquivo de notícias da Federação Portuguesa de Golfe, que cobre
todas as provas dela desde 2019 — e é a razão de o histórico chegar aos nove
anos de idade. Também do European Golf Rankings, das federações organizadoras
e da imprensa desportiva. Cada prova em `data/resultados.json` traz o campo
`fonte` com a ligação, e a página das épocas mostra a nota de proveniência
no fim.

### Os dois rankings, e um erro que é fácil cometer

A ficha da jogadora no European Golf Rankings publica **um número só**, e esse
número é o lugar dela na lista feminina inteira — de Sub-14 a adultas. O
selector de escalão que está nessa página muda as provas que contam, não muda
o lugar: pedindo a ficha com U18 vem exactamente o mesmo número.

O ranking por escalão existe, mas noutro endereço: a lista feminina filtrada,
que traz uma coluna «EGR Ranking» própria. É de lá que `api/_egr.js` tira
`posicaoEscalao` — publicada pelo EGR, não calculada aqui. O cartão mostra
essa em grande, com o escalão no rótulo, e a geral ao lado. Quando a lista do
escalão não responde, mostra a geral **com o rótulo da geral**: o número de
uma coisa com o nome da outra é o único resultado que não é aceitável.

## Publicar

São ficheiros estáticos: serve qualquer alojamento. O domínio é
`franciscasalgado.golf` e está escrito nos `canonical`, nas etiquetas Open
Graph, no `robots.txt` e no `sitemap.xml` — se mudar, é nesses sítios que se
mexe.
