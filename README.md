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
| Páginas | `index.html`, `resultados.html`, `imprensa.html`, `parcerias.html`, `fundme.html`, `privacidade.html`, `termos.html` |
| Em inglês | `en/` — **gerado**, não se mexe à mão: ver «Idiomas» |
| Estilo | `css/site.css` — um ficheiro, com as variáveis de tema no topo |
| Comportamento | `js/` — módulos ES, sem empacotador |
| Conteúdo | `data/*.json` — é aqui que se mexe no dia a dia |
| Funções | `api/` — `wagr.js`, `egr.js`, `instagram.js` e `fundme/` (a angariação) |
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
| `og.mjs` | refaz as imagens de partilha (a geral, a do saco e o cartaz do `/fundme` em cada língua) e carimba-lhes a versão; `node scripts/og.mjs fundme` refaz só as do `/fundme` |
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
| `resultados.html` | **época a época**: as contagens da carreira, e por ano o relato, os destaques, as provas e a imprensa |
| `imprensa.html` | kit: o comunicado mais recente, biografia curta, ficha, citações com fonte, fotografias em alta resolução e fichas oficiais |
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
- `selos` — `titulo`, `podio`, `wagr`, `selecao`. **O `wagr` não se põe à
  mão**: o vigia lê todos os dias a lista de provas que o WAGR conta e
  acrescenta-o sozinho (e a posição, se a prova ainda não a tiver). Nunca o
  tira — a janela do WAGR é de dois anos, e uma prova que sai dela não deixou
  de ter contado.
- `nacional` — `"campea"` ou `"vice"`. **É este campo, e não o nome da prova,
  que faz as contagens de campeã e vice-campeã nacional.** Pelo nome não dava:
  o Drive Tour também se chama «Campeonato Nacional de Jovens», e ganhar uma
  etapa não é ser campeã nacional. Uma prova sem este campo não entra nas
  contagens, o que é o comportamento certo por omissão. O vigia acerta
  sozinho o número de «Títulos nacionais» da ficha; as frases que o dizem por
  extenso (as perguntas frequentes e o relato de cada época) mudam-se à mão, e
  o vigia avisa enquanto alguma disser outro número.

Uma prova ganha (`pos: 1`) entra automaticamente no palmarès. Os contadores por
época, as contagens da carreira e os filtros atualizam-se sozinhos.

**O que fica à vista de cada ano são os destaques** — títulos nacionais,
vitórias, vice-campeonatos e internacionalizações —, e não o resultado de cada
volta. Uma época tem provas boas e provas más, e uma lista de todas as voltas
afoga as primeiras nas segundas. O registo inteiro continua lá, atrás de «as N
provas de AAAA», e é ele que alimenta os dados estruturados.

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

### Comunicados

Também em `data/imprensa.json`, na lista `comunicados`, o mais recente
primeiro. O primeiro aparece inteiro à cabeça do kit de imprensa — título,
entrada, texto, a citação dela e as fotografias com o original para
descarregar —, e os anteriores ficam por baixo, fechados. Sem nenhum, a
secção sai da página.

```json
{
  "id": "taca-fpg-2026",
  "data": "2026-10-13",
  "t": { "pt": "Título", "en": "Title" },
  "sub": { "pt": "Entrada", "en": "Standfirst" },
  "corpo": { "pt": ["parágrafo", "…"], "en": ["paragraph", "…"] },
  "citacao": { "t": { "pt": "…", "en": "…" }, "f": "Francisca Salgado" },
  "fotos": ["taca-2026-trofeu.webp", "taca-2026-saida.webp"]
}
```

- `id` é a âncora: `imprensa.html#taca-fpg-2026` vai direto ao comunicado. Uma
  citação em `citacoes` com `"url": "#taca-fpg-2026"` liga para ele sem abrir
  janela nova.
- `fotos` são nomes de ficheiro da galeria: a legenda, o texto alternativo e o
  original escrevem-se uma vez, em `data/galeria.json`, e o crédito vem de
  `creditos.json`.

### Galeria, vídeos e apoios

| | |
|---|---|
| `data/galeria.json` | as fotografias e as legendas. O crédito **não** se escreve aqui — vem de `creditos.json`. `original` aponta o ficheiro a descarregar, em `img/kit/` (com `dim`, a largura e a altura); `pos` acerta o recorte quando a fotografia não cabe inteira no quadro |
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

## Rumo à Florida (/fundme)

A angariação para a viagem ao Junior Orange Bowl: `franciscasalgado.golf/fundme`
e `/en/fundme` (o `vercel.json` reescreve as duas para o `.html`). Quem apoia
segue um cartão de três passos numerados: **1** escolhe o valor (seis botões
grandes, cada um com o seu nome de golfe, e uma barra que mostra o que aquele
apoio faz à meta), **2** assina, se quiser (o nome vai para a bandeira; uma
mensagem de apoio e uma fotografia são botões à parte), **3** vê com que pode
apoiar e carrega em «Apoiar com 50 €» (o valor que escolheu: nenhum vem pré-escolhido). O apoio fecha-se na Stripe. O total, a
volta de 18 buracos, o gráfico dia a dia e a bandeira com os nomes
atualizam-se sozinhos.

**Os modos de pagamento que o cartão mostra são os que a Stripe tem ligados.**
A `/api/fundme` lê a configuração por omissão da conta (a que se edita em
dashboard.stripe.com/settings/payment_methods, e que o Checkout usa) e devolve
`pagamentos` — ligar ou desligar MB WAY, Multibanco, PayPal… no painel muda a
página sozinho, em dez minutos no máximo. Se a Stripe não responder, vale a
lista `pagamentos` do `data/fundme.json`; `pagamentosDe` diz de onde veio
(`stripe` ou `dados`). A página sabe desenhar MB WAY, Multibanco, cartão (Visa
e Mastercard), Apple Pay, Google Pay, PayPal e Revolut Pay; outros modos
ligados na Stripe aparecem no Checkout mas não no cartão.

A fotografia da Francisca (no bilhete, no retrato do cartão de apoio e no
polaroide do ecrã) é a da taça de campeã do clube:
`img/fundme/francisca-campea-clube*.webp` e `francisca-rosto.webp`.

**A bandeira é de pano** (canvas, `tecer()` em `js/fundme.js`). O desenho
da bandeira — a trama, a manga verde cosida à volta da vara, o nome dela
bordado, as assinaturas — pinta-se uma vez numa textura; cada quadro corta-a
em tiras verticais que sobem e descem numa onda que nasce quieta junto à
vara e cresce até à ponta, com luz e sombra conforme a inclinação do pano.
Os nomes deformam-se com as dobras. O vento manda na onda, e uma rajada faz
o pano estalar. Corre a 30 quadros por segundo e pára quando não está à
vista. Se o canvas falhar, fica o SVG de antes; com movimento reduzido, um
quadro parado.

**A bandeira no campo acompanha Praia D'El Rey a sério** (na página e no
ecrã). A luz é a da hora que é: a altura do sol em Óbidos, calculada no
próprio browser, dá manhã, dia, hora dourada, crepúsculo ou noite (com
estrelas, e a bandeira iluminada). O céu é o do tempo que faz, do Open-Meteo:
nublado, nevoeiro, chuva, trovoada. E de vez em quando há uma rajada — o pano
estica a partir da vara, passam linhas de vento e às vezes uma folha —, mais
seguidas e mais fortes quando o vento sopra a sério. Por baixo da bandeira,
na página, uma linha diz o tempo de agora. Com movimento reduzido, não há
rajadas nem chuva a cair. Para ver um estado sem esperar por ele:
`/fundme?ceu=noite,chuva,40,rajada` (uma luz, um tempo, o vento em km/h e
rajadas de quatro em quatro segundos; também com `?ecra`).

**O selo no resto do sítio** (`js/selo.js`): um carimbo redondo com o
logótipo do Junior Orange Bowl, «Apoie a Francisca» e «Rumo à Florida · 2027»
à volta e uma patilha «Apoiar →», que leva ao `/fundme`. Na página inicial
está por cima da fotografia do hero; nas outras flutua no canto, com um × que
o fecha até ao fim da visita. Não aparece no `/fundme`. Lê o
`data/fundme.json` e só se mostra com `aberto: true` e até ao dia da
`partida`. A ligação leva `?o=site-inicio` ou `?o=site`, que segue para os
metadados do pagamento: fica-se a saber quantos apoios vieram do selo.

A página e o ecrã falam a mesma linguagem, a do golfe: os valores têm nomes
de golfe, a meta é uma volta de 18 buracos (com a ida e a volta no cartão
de embarque e no ecrã), as fases têm nomes de golfe, a bandeira está no campo
de Praia D'El Rey, e as condições de jogo aparecem no ecrã e, na secção do
evento, como previsão para a manhã do Roll Up (quando o dia está a 16 dias ou
menos). Os números usam sempre Manrope em negrito, que não confunde o 3 com o 5.

**A Stripe é o registo; não há base de dados.** `api/fundme/index.js` vai
buscar à Stripe os pagamentos do Checkout com `metadata.kind = 'fundme'` desde
`inicio`, junta o que está escrito à mão em `data/fundme.json` e devolve tudo
à página, com trinta segundos de cache. `api/fundme/apoiar.js` abre o
pagamento. As contas estão em `api/fundme/_comum.js`, separadas da rede.

### Ligar

1. Na Stripe, em *Developers → API keys*, criar uma chave restrita com
   *Checkout Sessions: Write* e guardá-la na Vercel como `STRIPE_SECRET_KEY`.
   Sem ela a página mostra os números escritos à mão e o botão diz «Os apoios
   abrem em breve».
2. Em *Settings → Payment methods*, ligar MB WAY e Multibanco (os cartões, o
   Apple Pay e o Google Pay vêm ligados).
3. Em *Settings → Customer emails*, ligar *Successful payments*: é a Stripe que
   manda o recibo.
4. Experimentar primeiro com uma chave de teste (`sk_test_…`) numa
   pré-visualização, com o cartão 4242 4242 4242 4242.
5. Para as fotografias: na Vercel, em *Storage → Create → Blob*, criar uma
   loja **pública** e ligá-la ao projeto (isso cria `BLOB_STORE_ID`; a
   função fala com a loja pelo token OIDC que a Vercel junta a cada pedido,
   sem chave. Uma loja antiga, com `BLOB_READ_WRITE_TOKEN`, também serve).
   Depois, em *Settings → Environment Variables*, criar `FUNDME_CHAVE` com uma
   frase comprida (12 caracteres ou mais): é a chave de `/fundme/gerir`. Sem
   o Blob, a página simplesmente não oferece a fotografia.

### `data/fundme.json`

| | |
|---|---|
| `aberto` | `false` fecha o botão, sem mexer em mais nada |
| `meta`, `inicio`, `partida` | a meta em euros, o primeiro dia do gráfico e o dia da partida (a contagem «faltam N dias») |
| `valores`, `valorInicial`, `minimo`, `maximo` | os botões de valor (até cinco, mais «Outro») e os limites de um apoio. `valorInicial: null` — nenhum vem escolhido, é quem apoia que escolhe (decisão da família); um número pré-escolhe esse |
| `pagamentos` | a lista de reserva dos modos de pagamento, só para quando a Stripe não responder (ver acima) |
| `fotos` | `aceitar: false` tira o campo da fotografia; `aprovar: true` faz cada fotografia esperar por aprovação em `/fundme/gerir` (como está, `false`, aparecem logo) |
| `evento` | `mostrar`, a `data` (`"2026-12-02"`, ou `null` para «a anunciar»), o `local` e as `coordenadas` (para o tempo no ecrã). Com data, o dia fica marcado no gráfico |
| `manuais` | o que não passa pela Stripe: `{ "data": "2026-12-02", "valor": 640, "origem": "clube", "nome": "Grupo de quarta-feira", "mensagem": { "pt": "…", "en": "…" } }`. `origem` é `clube` ou `empresas` (Fundação do Desporto). Com `nome`, fica escrito na bandeira; com `mensagem`, aparece num postal; com `foto` (um caminho em `/img/…`), o postal leva a fotografia; `"mural": false` tira-o dos dois |
| `excluir` | ids de sessões (`cs_…`) que não contam para o total: um reembolso, um teste |
| `ocultar` | ids que saem da bandeira e dos postais mas continuam a contar: uma mensagem que não deve ficar à vista |

### As fotografias e /fundme/gerir

Quem apoia pode juntar uma fotografia (sua, ou com a Francisca), no próprio
cartão. A página reduz-na no telemóvel (1600 px, JPEG, sem a localização) e
manda-a para `api/fundme/foto.js`, que a guarda no Blob em
`fundme/pendentes/`; o endereço segue com o pagamento, nos metadados da
Stripe. Aparece logo com o postal, na página e no ecrã do clube.

`franciscasalgado.golf/fundme/gerir` (com a `FUNDME_CHAVE`, guardada no
telemóvel) mostra as fotografias dos apoios pagos; «Tirar da página e apagar»
tira a que não deva estar à vista, em menos de um minuto. Com
`fotos.aprovar: true`, as fotografias ficam à espera e a página passa a ter
«Mostrar» (copia para `fundme/aprovadas/`), «Recusar» e «Retirar». Atualiza-se
sozinha, para o dia do evento.

### O ecrã da clubhouse e os QR codes

`franciscasalgado.golf/fundme?ecra` é a página para o ecrã grande (16:9, e
também ao alto, num ecrã vertical ou num telemóvel). É claro, para a manhã ao
sol, e desenhado como um quadro de resultados de golfe:
- uma barra verde com o dia e a hora;
- à direita, uma coluna com a Francisca em grande (o polaroide), o QR em
  grande para apoiar e, em baixo, as condições de jogo compactas (o vento e
  o que vale em tacos, a temperatura, a chuva nas próximas 3 horas);
- o total em placas brancas, como as dos quadros dos torneios;
- o cartão dos 18 buracos: a meta dividida em 18 (cerca de 278 € cada), com
  os buracos feitos marcados, a bola no buraco que se joga e os «buracos
  feitos» ao lado;
- a bandeira do clube «no campo»: à frente da fotografia do buraco 9 de
  Praia D'El Rey, desfocada como numa fotografia tirada junto ao green, com
  a vara a sair da imagem. Tem a proporção de uma bandeira de green; com mais
  nomes, as assinaturas ficam mais pequenas e mais juntas (50 leem-se bem).
  Ondula mais ou menos com o vento que está no campo;
- os postais com as mensagens, pousados na fotografia ao lado da bandeira,
  um de cada vez (de 7 em 7 segundos);
- o QR e uma fotografia da Francisca;
- ao lado, as **condições de jogo** em Praia D'El Rey: rosa dos ventos com
  de onde vem o vento, velocidade, rajadas e quantos tacos contar
  (±1 taco por cada 16 km/h), temperatura e sensação, humidade, chuva nas
  próximas três horas, a previsão hora a hora e o nascer e pôr do sol;

O tempo vem do Open-Meteo, sem chave, pedido pelo browser do ecrã de 10 em 10
minutos, para as coordenadas em `evento.coordenadas` de `data/fundme.json`.
Se o serviço falhar, ficam o dia e a hora. Atualiza-se de 20 em 20 segundos.
Fala português e inglês, uma língua de cada vez, num esbatido lento de 12 em
12 segundos.

**A volta em fases.** No 1.º tee (sem apoios: a bola no tee, a bandeira à
espera do primeiro nome, postais por escrever e o QR a chamar); na ida; a
caminho da volta (25%); na volta (50%); últimos buracos (75%); embocou (100%,
confettis). Cada passagem tem um momento em grande, com a bola a rolar até ao
buraco. Um apoio com nome, mensagem ou fotografia entra em grande no meio do
ecrã; vários seguidos fazem fila, e encurtam. Um apoio sem nome dá só uma
faixa com o valor; o valor nunca aparece ao lado de um nome.

**Demonstração.** `?ecra&demo` simula uma manhã com uns 40 apoios, do zero à
meta, e recomeça; `?ecra&demo=6` muda o intervalo, em segundos. Diz
«Demonstração» no canto.

Abrir no browser do ecrã em ecrã inteiro (F11). **O endereço curto é
`franciscasalgado.golf/tv`** (ou `/ecra`): redireciona para `/fundme?ecra`, e
escreve-se depressa com o comando de uma TV ou de uma box (`vercel.json`,
redireccionamento não permanente, para se poder mudar o destino). O QR
(`img/fundme/qr-ecra.svg`) leva a `/fundme?o=ecra`; o `o=` segue para os
metadados do pagamento, para se saber de onde veio cada apoio.

## Ligar as coisas que faltam

Cada ponta por atar tem uma variável vazia e um comentário no sítio certo, e
nenhuma delas parte o sítio enquanto estiver por ligar:

| O quê | Onde | Como |
|---|---|---|
| Receção do correio | registos MX de `franciscasalgado.golf` | **é a única ponta que importa**: sem MX, `birdie@` não recebe nada, e o email é agora a via principal de contacto |
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

Do WAGR vêm duas coisas: a posição mundial e a **lista das provas que
contam**. Cada prova dessa lista casa com uma nossa pela semana e pelo país
(uma a uma, a mais próxima primeiro) e ganha o selo `wagr`. Uma prova que o
WAGR conta e o sítio não tem vai para o `VIGIA-ATENCAO.md`, uma vez só: o
WAGR não diz o campo, as voltas nem o nome em português.

Uma notícia só entra sozinha na lista se o **título** trouxer o nome dela. Se
o nome aparecer apenas no corpo — o que acontece em quase todas as crónicas de
prova, que citam dezenas de jogadoras — fica para revisão e não entra.

## Privacidade

Nada de medição antes de consentimento — o PostHog só é sequer descarregado
depois do clique em «Aceitar». A escolha fica em `localStorage`, e não num
cookie, para que recusar não implique escrever aquilo que a pessoa acabou de
recusar. Língua e tema também ficam só no navegador de quem visita.

O tema é **claro por omissão**, seja qual for a preferência do sistema; quem
carrega no botão e escolhe o escuro fica com ele (guardado em `fs-tema`). A
escolha aplica-se num script de uma linha no `<head>` de cada página, antes do
primeiro desenho — se ficasse para o módulo, que corre depois, a página
nasceria com o tema do HTML e trocaria a seguir, e piscava em cada mudança de
página.

## Medição

É o PostHog, no projeto «Franciscasalgado.golf», na região europeia
(Frankfurt): `eu.posthog.com`, separador *Web analytics*. Começou a contar a
14 de outubro de 2026 — antes disso o sítio não media nada, e não há como
recuperar esses números.

- **Passa pelo próprio domínio, em `/bola`.** O `vercel.json` reencaminha
  `/bola/*` para `eu.i.posthog.com` e `/bola/static/*` para
  `eu-assets.i.posthog.com`. O navegador nunca fala com um servidor de fora, e
  os bloqueadores que cortam por domínio não cortam isto. Se o projeto mudar de
  região, são essas três linhas que mudam.
- **Um salto a mais, de propósito.** O PostHog envia para `/bola/e/`, com
  barra, e o `trailingSlash: false` do sítio responde 308 para `/bola/e`. O
  navegador repete o pedido sem barra — o `fetch` e o `sendBeacon` seguem o
  308 com o corpo intacto, e o PostHog aceita os dois endereços. Tirar o salto
  obrigava a mexer na regra das barras do sítio inteiro, de que os canónicos
  dependem; não compensa.
- **Só em `franciscasalgado.golf`.** As pré-visualizações da Vercel e o
  servidor local não carregam nada.
- **Sem gravação de sessões nem perfis de pessoa**, identificador em
  `localStorage`, e o IP descartado no próprio projeto (*Discard client IP
  data*). Retirar o consentimento apaga o identificador na visita seguinte.
- A configuração está toda em `js/cookies.js`, em `POSTHOG`. O Google
  Analytics (`MEDICAO`) continua montado e vazio.

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
