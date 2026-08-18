# Notas dos ficheiros de dados

Estas notas viviam num campo `_leia-me` dentro de cada ficheiro JSON. Como os
ficheiros de `data/` são servidos publicamente, as notas iam com eles — e são
instruções para quem mantém o sítio, não conteúdo para quem o lê. Passaram
para aqui, e `docs/` não é publicado (ver `.vercelignore`).

## `data/apoios.json`

Quem acompanha o percurso, por natureza da relação. Para acrescentar um logótipo: guarde o ficheiro em img/logos/ e ponha o nome em 'logo'; sem 'logo', entra o nome composto na tipografia do sítio, dentro do mesmo cartão, e a parede continua a ler-se como uma só. Um item com "fundo": "escuro" ganha placa escura — é para logótipos desenhados a branco, que numa placa branca desapareciam. Os créditos e a proveniência de cada logótipo vivem em data/creditos.json.

Num grupo com `forma: "linhas"` (os apoios tecnológicos), o `logo` entra **em
vez do nome**, à altura de uma linha de texto — o nome verdadeiro fica no
`alt`. Esses ficheiros são monocromáticos: o logótipo original é aparado e
pintado na tinta da casa (`#12281E`), e no tema escuro o CSS inverte-o. Cinco
identidades gráficas em cinco linhas seguidas eram um mercado; na mesma cor,
são uma lista. O `_origem` em creditos.json diz de onde veio cada original.

Atenção ao **Vertex Golf**: o tutor escreveu «GolfVertex», mas `golfvertex.com`
é um sítio de artigos sem relação nenhuma com golfe. A marca — sensor de
putting — chama-se Vertex Golf e vive em `vertex-golf.com`; o próprio logótipo
escreve «VERTEX GOLF».

## `data/creditos.json`

Créditos obrigatórios de imagem. A chave de porFicheiro é o nome do ficheiro tal como está em img/. Sempre que entrar uma fotografia nova, acrescenta-se aqui a linha correspondente — o js/creditos.js avisa na consola quando encontra uma imagem sem crédito. O campo _origem não é mostrado no site: fica só para se saber de onde veio cada ficheiro e se poder confirmar a autoria com quem a detém.

## `data/egr.json`

Instantâneo da ficha no European Golf Rankings. Recurso para quando /api/egr não está disponível. Refrescado pelo vigia; para o fazer à mão: node scripts/egr.mjs

## `data/handicap.json`

O handicap na lista de federados da FPG, mantido pelo vigia. Duas datas, que
respondem a perguntas diferentes e não se devem trocar:

- **`atualizado`** — quando fomos lá ver. Avança em todos os dias em que a
  federação responde. Serve para saber se a ligação ainda funciona, e é o que o
  vigia usa para avisar, ao fim de trinta dias parados, que alguém tem de ir
  confirmar à mão.
- **`desde`** — quando o valor mudou pela última vez. É o que diz alguma coisa
  sobre a jogadora: um handicap parado há meses lê-se de outra maneira do que um
  que baixou na semana passada. É esta a data que a página de recruiting mostra.

Enquanto as duas forem iguais — o que acontece na primeira leitura, quando ainda
não há leitura anterior com que comparar — a página não mostra `desde`, porque
«sem mexer desde hoje» lê-se como «mexeu hoje».

Ir buscá-lo exige três passos e uma sessão; está explicado em `api/_handicap.js`.

## `data/resultados.json`

As provas. Não se escreve nada aqui sem fonte: cada item leva `fonte`, com nome
e endereço, e é isso que a página mostra por baixo de cada linha.

De onde vêm os factos, como se confirmam, e o que já foi verificado e o que
não — em `docs/percurso.md`. Antes de acrescentar ou corrigir uma prova, leia-o:
poupa o trabalho de reler as 403 voltas do registo da FPG e as 176 notícias do
portal.

Duas armadilhas que já morderam:

- **A data da notícia não é a data da prova.** A FPG publica dias depois. O
  English Girls' Open esteve cinco dias fora do sítio por causa disto.
- **O registo da FPG não vê match play.** Provas por equipas em match play não
  contam para handicap e por isso não aparecem lá. Só as notícias as apanham.

## `data/perfil.json` — `terra`

Onde ela vive: **Algés** — nasceu e vive lá. O `concelho` («Óbidos») é o do
clube e fica nas descrições, ao lado do clube; a `terra` alimenta o
`homeLocation` dos dados estruturados e o rodapé.

As coordenadas do rodapé — **38°42′N 9°14′W** — não são o centro de Algés:
são a Marcolândia, a creche da Avenida dos Bombeiros Voluntários de Algés
(nó 1590594034 do OpenStreetMap). Escolha do tutor: perto de casa sem ser a
casa, e uma piscadela que só a família lê. **O nome não aparece no sítio** —
público é só «Algés» e os números.

## `data/perfil.json` — `espanha`

Idas a Espanha para competir, contadas por ano. A maioria foi por iniciativa
própria e não ao serviço da Seleção.

Os dois contadores da página «Época a época» — com os nomes que o tutor pediu —
não saem daqui, saem de `data/resultados.json`: **«Chamadas à Seleção
Nacional»** conta o selo `selecao` (convocatórias, esteja a prova onde estiver,
incluindo em Portugal) e **«Internacionalizações»** conta as provas com `pais`
diferente de `PT` (competições fora, convocada ou por iniciativa própria). Uma
ida a Espanha só entra nesse segundo contador se estiver registada como prova
em `resultados.json`; este ficheiro alimenta apenas o cartão «Idas a Espanha»
das parcerias.

O cartão «Idas a Espanha» na página de parcerias mostra a soma. O vigia
mantém-na certa a partir daqui, por isso acrescenta-se a viagem ao ano em que
aconteceu e o total acerta-se sozinho — nunca se escreve o total à mão.

## `data/galeria.json`

A galeria. Cada entrada aponta para um ficheiro em img/; o crédito não se escreve aqui — vem de data/creditos.json, para haver um sítio só onde a autoria vive. 'formato' escolhe a proporção do recorte: 'alto' (4:5) ou 'largo' (3:2).

Duas regras, e as duas são do tutor:

1. **Só fotografias em que a Francisca esteja identificada sem margem para
   dúvida.** As peças da FPG cobrem vários atletas e a foto de abertura pode
   ser de outra pessoa — já saíram duas por isso, mais o antigo avatar do
   Instagram (recortado de uma foto que não se conseguia confirmar; o atual,
   `cara.webp`, vem do retrato confirmado).
2. **Nenhuma fotografia com outras pessoas** (17-08-2026). Saíram `pares`,
   `aquapor`, `podio-2024` e `sub10` — ficheiros apagados, não só
   desreferenciados, porque um ficheiro em img/ continua servido mesmo sem
   ligação nenhuma. Antes de acrescentar uma foto nova, é ela, e é só ela.

## `img/campos/` — fotografias dos campos

O nome do ficheiro tem de coincidir com o campo `foto` do item, no grupo
`campos` de `data/apoios.json`. Um item sem `foto` mostra só o nome e a
localidade, e o cartão degrada-se sozinho se o ficheiro faltar — não fica
imagem partida.

| ficheiro | de onde vem |
|---|---|
| `praia-del-rey-9.webp` | buraco 9, escolhida pelo tutor (autoria por confirmar) |
| `west-cliffs.webp` | sítio do próprio clube |
| `quinta-do-peru.webp` | fornecida pelo tutor — autoria por confirmar, ver abaixo |
| `jamor.webp` | Federação Portuguesa de Golfe |

**Trocar uma imagem é trocar o nome do ficheiro.** Aprendeu-se à custa: as
fotografias dos tacos foram substituídas mantendo os nomes, e quem já tinha
visitado o sítio ficou uma semana a ver as antigas — o `vercel.json` mandava
guardar `/img/` por sete dias sem perguntar, e uma cache não revalida antes do
prazo só porque o servidor mudou de ideias. Duas defesas, e as duas ficaram:
o `/img/` passou a `max-age=0, must-revalidate` (o browser pergunta sempre e o
servidor responde 304 quando nada mudou — barato); e mesmo assim, quando o
conteúdo muda, muda-se o nome (`praia-del-rey.webp` → `praia-del-rey-lago.webp`,
`driver.webp` → `driver-hero.webp`), porque as caches que já existem por esse
mundo fora obedecem aos cabeçalhos com que guardaram, não aos novos.

Formato: `.webp`, recorte 3:2 na horizontal (1400×933). O cartão recorta ao
centro, por isso o assunto deve estar centrado. O `alt` descreve o campo para
quem não vê a imagem — é bilingue, e não é decorativo.

**Créditos, e isto não é opcional.** Cada fotografia precisa de entrada em
`data/creditos.json`, em `porFicheiro`; sem ela o `js/creditos.js` avisa na
consola. Uma fotografia com licença Creative Commons leva também `licenca` e
`licencaUrl`, e o crédito mostra a licença como ligação — que é o que a
licença exige. Neste momento nenhuma das que cá estão é Creative Commons; a de
Praia D'El Rey era, e saiu.

O `_origem` de cada uma diz de onde saiu e em que condições foi publicada.
As de Praia D'El Rey, West Cliffs e Jamor estão aqui por autorização dos clubes
e dos campos, dada em agosto de 2026; a da Quinta do Peru veio do tutor. Se uma
autorização for retirada, tira-se o `foto` do item e o cartão volta ao nome sem
mais nada partir.

**Crédito não é licença.** Nomear o autor de uma fotografia não dá o direito de
a publicar: é a autorização que dá. Para uma fotografia nova sem autorização
declarada, pede-se primeiro.

**O caso de Praia D'El Rey, e o que ele ensina.** A primeira fotografia era uma
CC BY-SA do Vitor Oliveira, via Wikimedia Commons — legalmente a mais segura
das quatro, e a única que não dependia de autorização nenhuma. Foi recusada
pelo tutor, e com razão: é um instantâneo de turista, com estrada e candeeiro
em primeiro plano, ao lado de fotografia profissional de golfe do West Cliffs.
Trocada pela do próprio clube. A lição é que a licença resolve o direito de
publicar e não resolve o nível — numa parede onde as outras são fotografia de
marca, uma fotografia de amador destoa mais do que ajuda.

**A Quinta do Peru veio de fora da internet, e a busca automática explica
porquê.** O sítio oficial (`quintadoperugolf.com`) responde com captcha a
qualquer pedido automático; o `clubgolfquintadoperu.com` não serve fotografias
do campo; não há nada em Wikimedia Commons nem no Openverse; e as fotografias da
FPG desse campo são de jogadores em prova, não do campo. As que existem em
directórios de golfe são fotografias de imprensa do clube republicadas por
terceiros — crédito ao clube não é autorização do clube. Nenhuma servia, e o
cartão esteve alguns dias só com nome e localidade.

A que lá está agora foi mandada pelo tutor a 17 de agosto de 2026: uma vista
aérea da casa-clube entre os pinheiros, com o campo atrás. Chegou sem metadados
de autoria, e por isso **a entrada em `creditos.json` tem o crédito em branco de
propósito** — o `_origem` guarda o que se sabe, e o `js/creditos.js` aprendeu a
tratar texto vazio como decisão e não como esquecimento: não desenha linha
nenhuma nem avisa na consola. Falta só saber a quem creditar. Assim que se
souber, escreve-se o nome nos dois idiomas e o crédito aparece sozinho por baixo
da fotografia, sem mexer em mais nada.

## `data/instagram.json`

Instagram. O 'perfil' alimenta o cartão de seguidores; os números só aparecem quando estão preenchidos — mais vale não mostrar do que mostrar errado. Com um token da Graph API em IG_TOKEN (ver api/instagram.js) tudo isto passa a vir sozinho e em direto, e este ficheiro deixa de ser preciso. Os códigos são o que vem depois de /p/ ou /reel/ no endereço da publicação.

## `data/videos.json`

Vídeos no YouTube. O 'id' é o que vem depois de watch?v= ou de /shorts/ no endereço. O 'ano' é opcional: quando não se sabe a data de publicação, deixa-se vazio e o cartão sai sem o selo do ano, em vez de levar um ano inventado. A capa de cada vídeo está em img/videos/<id>.webp, copiada uma vez pelo scripts/capas.mjs — assim mostra-se a imagem verdadeira sem pedir nada ao YouTube antes de alguém carregar no botão.

## `data/vigia-vistas.json`

Endereços de peças que o vigia já mostrou em VIGIA-ATENCAO.md e não deve voltar a mostrar. Apagar uma linha faz a peça reaparecer no próximo aviso.

## `data/wagr.json`

Instantâneo da ficha no World Amateur Golf Ranking. Recurso para quando /api/wagr não está disponível. Refrescado pelo vigia; à mão: node scripts/wagr.mjs

## data/witb.json — «What's in the bag»

Os tacos que ela joga, a bola, a luva e o saco. Vazio como está, a secção não
aparece na página — um WITB com metade dos campos por preencher diz menos do
que nenhum.

```json
{
  "atualizado": "2026-08",
  "tacos": [
    { "t": "Driver", "m": "Cobra Darkspeed", "n": "9°, shaft X" },
    { "t": "Ferros", "m": "…", "n": "4–PW" }
  ],
  "bola": "…",
  "luva": "…",
  "saco": "…",
  "extras": [{ "t": "Marcador de bola", "m": "…" }]
}
```

`t` é o tipo, `m` o modelo, `n` uma nota opcional. Um campo a `null` ou uma
lista vazia simplesmente não é desenhado.

## data/swing.json — o swing, para treinadores

Vídeos de swing para o «coach's corner» da página de recruiting. Vazio, a
secção não aparece.

```json
{
  "videos": [
    { "id": "ID_do_YouTube", "t": { "pt": "Driver, face-on", "en": "Driver, face-on" },
      "vista": "face-on", "ano": "2026" }
  ]
}
```

Vistas úteis para uma avaliação: `face-on`, `down-the-line`, `short-game`,
`putting`. O `id` é o que vem depois de `watch?v=`.

## Quantas provas ela jogou (agosto de 2026)

O `data/resultados.json` é uma lista escolhida — as provas com classificação
apurada, fonte e alguma coisa para dizer. São 57 em nove épocas, e a página
das épocas contava-as como se fossem a carreira toda: «7 provas» em 2023 dava
a impressão de quem joga meia dúzia de torneios por ano.

O registo federado dela na FPG tem **425 voltas em 257 provas**. O
`scripts/myfpg.mjs` passou a escrever também o `data/provas-fpg.json` — só
contagens, por ano, nunca a lista: publicar as 425 voltas com campo, par e
resultado bruto era o extrato de conta que já ficou decidido não publicar.

Quem manda em quê:

- **volume** (provas disputadas, provas de cada época) — registo federado;
- **resultados** (pódios, vitórias, títulos, chamadas) — a lista curada.

O agrupamento de voltas em provas é feito por nome e proximidade de datas.
A FPG corta o nome da prova aos 50 caracteres, e nalguns casos o corte cai em
cima do «Dia 2» — daí a terceira regra de aparo no `porProva`, que só actua
em nomes encostados ao limite. Sem ela contavam-se 261 em vez de 257.

Se o `provas-fpg.json` faltar, as contagens da lista voltam a servir: um
número a menos, nunca um número errado. A nota de fonte da página diz de onde
vem cada coisa.

## Subtítulos das secções (agosto de 2026)

Os grupos de apoios tinham uma frase debaixo do rótulo — «Os campos de casa,
no Oeste» debaixo de CAMPOS ONDE JOGA. Saíram todas, a pedido do tutor. O
`x` de um grupo em `data/apoios.json` continua a funcionar se algum dia fizer
falta; sem ele, não se escreve linha nenhuma.

## ECCO (agosto de 2026)

O reel do calçado ECCO é de abril de 2023 e a colaboração foi pontual — ela
não usa ECCO. A legenda dizia «Calçado de jogo», no presente, e lia-se como
patrocínio em vigor. Passou a «Calçado · parceria pontual, 2023».

A data saiu do próprio código do post: o `shortcode` do Instagram é o
identificador da publicação em base64 (alfabeto `A-Za-z0-9-_`), e os bits
acima do 23.º são o instante da publicação. Serve para datar um reel sem ter
de perguntar à API — e confere com a ordem dos códigos, que é cronológica.

Regra: uma marca que aparece nos reels e não está nos apoios da página é
passado, e a legenda tem de o dizer. Sem data, tudo se lê como agora.

## O aviso das provas em falta (agosto de 2026)

O vigia abria uma issue por dia com «246 provas no registo da FPG que não
estão no sítio». Estava errado de duas maneiras:

- comparava **voltas** com **provas** — um campeonato de quatro dias contava
  quatro vezes;
- casava por data exacta e pelos primeiros 18 caracteres do nome. A FPG
  escreve «96th Portuguese International Ladies Amateur Champ» e nós «96.º
  Campeonato Internacional Amador de Portugal Feminino»; a FPG data a primeira
  volta e nós às vezes o último dia. Resultado: dava como em falta provas que
  estavam no sítio há meses, incluindo o Europeu por Equipas de 2026.

Agora agrupa por prova, casa pelo arco da prova com cinco dias de folga de
cada lado, e só levanta a mão para o que tem nome de campeonato ou de prova
internacional. De 246 passou a 25 — e essas 25 são reais.

E o mais importante: desde que a contagem de provas passou a vir do registo
federado, uma prova sem cartão **não é um buraco nos números**. É só uma prova
de que não se sabe a classificação. O texto do aviso diz isso.
