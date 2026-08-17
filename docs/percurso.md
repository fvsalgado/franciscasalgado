# O percurso, apurado nas fontes

Estas são as notas de apuramento do que está em `data/resultados.json`. Não são
conteúdo do sítio: são o rasto de onde cada facto veio, para que ninguém tenha
de repetir o trabalho — e para que uma correcção futura saiba o que já foi
verificado e o que não.

`docs/` não é publicado (ver `.vercelignore`).

Feito em agosto de 2026.

## As duas fontes

**O registo de federada da FPG.** Lê-se com `node scripts/myfpg.mjs`, sem
credenciais nenhumas — os métodos respondem sem sessão. Tem **403 voltas**
contadas para handicap e **345 torneios distintos** desde fevereiro de 2018,
cada volta com campo, par e resultado bruto. É a fonte das datas e das voltas.

O que o registo **não** tem: classificações. Sabe que ela fez 78-85-81 na
Eslováquia; não sabe que isso foi um 49.º lugar. E não tem nada que seja match
play, porque match play não conta para handicap — foi por isso que o Match
Hexagonal de 2023 esteve invisível durante dois anos.

**As notícias do portal da FPG.** `https://portal.fpg.pt/?s=Francisca+Salgado`
dá **176 peças distintas**, em quinze páginas. Os endereços dos artigos estão
no HTML da busca; a expressão que os apanha é
`href="https://portal\.fpg\.pt/noticias/([^"#?/]+)/"`. É a fonte das
classificações, das convocatórias e de tudo o que é prosa.

## O que se descobriu

### Oito internacionalizações que faltavam

A página de épocas contava nove. São dezassete. Estavam todas no portal, com
notícia; nunca tinham entrado nos dados.

| Ano | Prova | Onde | Ela | Notícia |
|---|---|---|---|---|
| 2021 | Semana de Oro Joven | Real Aeroclub de Vigo, Espanha | 2.ª Sub-14 gross, 9.ª na geral | `saldo-muito-positivo-da-selecao-nacional-sub12-e-sub14-no-torneio-semana-de-oro-joven` |
| 2022 | Amundi Evian Juniors Cup | Evian Resort GC, França | 22.ª · 92·88·84 · Portugal 11.º de 14 | `portugal-termina-evian-juniors-cup-em-11-o` |
| 2023 | Match Hexagonal Feminino | Costa Ballena Ocean GC, Cádis | match play, 6 nações | `portugal-com-duas-vitorias-e-um-empate-no-primeiro-dia-do-match-hexagonal-feminino` |
| 2023 | Internacionais de França Sub-14 | Golf de Chantilly | 16.ª · 80·81·78 | `amelia-gabin-termina-no-5o-lugar-nos-internacionais-de-franca-sub-14` |
| 2023 | European Young Masters | Sedín, Eslováquia | 49.ª · 78·85·81 · Portugal 21.º de 28 | `portugal-conclui-european-young-masters-no-21o-lugar` |
| 2023 | Amundi Evian Juniors Cup | Evian Resort GC, França | 93·84·88 · Portugal 15.º | `portugal-termina-em-15o-lugar-a-amundi-evian-juniors-cup` |
| 2024 | Cognizant Cup — Int. Júnior da Finlândia | Kymen Golf, Kotka | 5.ª · 83·78·78 | `amelia-gabin-vence-internacional-junior-da-finlandia` |
| 2024 | European Young Masters | Penati, Eslováquia | 45.ª · 77·72·85 · Portugal 16.º de 29 | `portugal-termina-european-young-masters-no-16o-lugar` |

Duas destas mudam a leitura do percurso:

- **Vigo, julho de 2021, é a estreia dela pela Seleção.** A notícia diz que era
  «a primeira competição internacional ao serviço da Equipa das Quinas» para a
  maioria daqueles atletas. O sítio dizia que a estreia tinha sido na Bélgica,
  em julho de 2023 — dois anos depois. A nota de `belgica-2023` foi reescrita.
- **O 72 do European Young Masters de 2024** é a melhor volta dela em prova de
  seleção. Está na nota de `eym-2024` e no percurso de 2024.

### Um vice-campeonato que faltava

Está em 2023: vice-campeã nacional de Sub-14 pelo segundo ano seguido. A
notícia `campeoes-nacionais-de-jovens-consagrados-no-montado`, de 5 de novembro
de 2023, di-lo por palavras — «repetiu a posição de 2022» — e acrescenta que foi
segunda também na Final Nacional, com o prémio Medal Net.

Isto foi apurado antes de a atleta entregar o palmarés dela, que o confirma. A
lista completa e definitiva está mais abaixo, em «O palmarés, dado pela
própria» — é essa que manda, e é a que a página de épocas conta.

### Duas datas erradas

- **English Girls' Open 2026.** O sítio tinha 28 de julho. A prova foi a 21, 22
  e 23, em Prestbury — 36 buracos no último dia, o que explica as quatro voltas
  em três dias. **28 de julho era a data da notícia**, não da prova. Esta
  confusão é fácil de repetir: a FPG publica dias depois.
- **Nacional de Jovens Sub-12 2021.** O sítio tinha junho. Foi a 20 e 21 de
  novembro, na Grande Final do Drive Tour, no Montado: 168 pancadas (84+84) e o
  primeiro lugar do ranking do escalão, com 1008 pontos.

### Um clube a faltar ao percurso

A FPG inscreve-a pela **Quinta do Peru** em julho e novembro de 2021. O Vale de
Janelas aparece pela primeira vez em 2022. O percurso de clubes é:

    Jamor → Paço do Lumiar → Quinta do Peru → Vale de Janelas

O sítio dizia que ela ganhara o Sub-12 de 2021 «já com as cores do Vale de
Janelas». Corrigido no `percurso` de `data/perfil.json` e na frase «Quem é».

### Os países são oito, não nove

Contados um a um, do registo e das notícias:

| País | Desde | Onde |
|---|---|---|
| Portugal | 2018 | toda a carreira nacional |
| Espanha | 2021 | Vigo, Cádis, Andaluzia, Astúrias, Galiza, Madrid, campeonatos de Espanha |
| França | 2022 | Evian (2022, 2023), Chantilly (2023, 2025), Saint-Cloud (2026) |
| Bélgica | 2023 | Royal Waterloo |
| Eslováquia | 2023 | European Young Masters (2023, 2024) |
| Finlândia | 2024 | Kymen Golf, Kotka |
| Irlanda | 2026 | Slieve Russell — Europeu por equipas |
| Inglaterra | 2026 | Prestbury — English Girls' Open |

A frase de abertura dizia nove e passou a dizer oito, nas duas línguas. Um nono
país, a existir, não está em nenhuma das duas fontes — o candidato mais provável
é uma prova por equipas em match play, que o registo nunca vê. Continua no
documento de dúvidas.

### 2020 não foi um ano parado

O registo tem, em 2020: Drive Challenge Sub-12, campeonato do clube do Paço do
Lumiar, Circuito Drive Tour em Amarante e no Montado, e o Campeonato Nacional de
Jovens a 29 e 30 de agosto, entre a Estela e Miramar.

A atleta conta um título nacional de Sub-12 nesse campeonato. A FPG não. É a
única divergência entre a lista dela e as fontes, e está tratada à parte, em
«O caso de 2020, por resolver». Até se esclarecer, 2020 fica sem prova em
`data/resultados.json`.

### Uma prova trocada

O que estava como `nacional-amador-2026`, a 13 de junho, era o **Campeonato
Nacional de Profissionais**, onde ela entrou como amadora (+15, 157). O
campeonato nacional amador dela é o **Absoluto**, no Oporto, a 4–7 de junho:
80·80·77·79, entre 22 jogadoras quase todas mais velhas. Ficou este, com o id
`nacional-absoluto-2026`.

## O palmarés, dado pela própria (agosto de 2026)

A atleta entregou a lista dela. Onde ela e as fontes divergem, manda ela —
excepto num ponto, assinalado a seguir, em que a FPG a contradiz por escrito.

**Campeonatos nacionais** — seis títulos e quatro vice-campeonatos, segundo ela:

| Ano | | Prova | Confirmado? |
|---|---|---|---|
| 2018 | vice | Sub-10 | sim |
| 2019 | campeã | Sub-10 | sim |
| 2020 | campeã | Sub-12 | **não — ver abaixo** |
| 2021 | campeã | Sub-12 | sim |
| 2021 | campeã | 3.ª Categoria | sim |
| 2022 | vice | Sub-14 | sim |
| 2023 | vice | Sub-14 | sim |
| 2024 | vice | Sub-16 | sim |
| 2026 | campeã | Pares, com Rodrigo Constantino | sim |
| 2026 | campeã | Sub-18 | sim |

Duas coisas a reter daqui:

- **A Taça da FPG–BPI não é um campeonato nacional.** Ela não a conta como
  vice-campeonato, e tinha razão: é uma taça em match play. Saiu do campo
  `nacional` em `data/resultados.json`; o segundo lugar de 2025 continua lá
  como resultado.
- **O Campeonato Nacional de 3.ª Categoria de 2021 faltava por completo.**
  26–27 de junho, Aroeira Challenge, 167 (+23), sete pancadas à frente de
  Rafaela Pinto — e o melhor resultado de todo o campeonato, categorias
  masculinas incluídas. Está na notícia
  `aroeira-challenge-recebeu-o-campeonato-nacional-de-3as-e-4os-categorias`.

### O caso de 2020, por resolver

Ela conta um título nacional de Sub-12 em 2020. A notícia de resultados da FPG
(`campeonato-nacional-de-jovens-estela-e-miramar-consagram-nove-novos-campeoes`,
30 de agosto de 2020) diz o contrário, e diz por escrito:

- abre a contar **nove** campeões — «seis no Estela Golf Club, nos escalões de
  sub-18, sub-16 e sub-14, e três no Club de Golf de Miramar, onde jogaram os
  sub-12 e sub-10»;
- lista nove nomes, e não há Sub-12 feminino entre eles;
- e explica porquê: **o Sub-12 foi disputado em prova mista**, com pódio único
  — Bernardo Ferreira da Costa, Gabriel Sardo, Luís António Silva.

O registo de federada tem as duas voltas dela nesse campeonato (Miramar, 29 e
30 de agosto, 106 e 101).

Enquanto isto não se esclarecer, o título **não está no site**: a página de
épocas conta cinco títulos nacionais e quatro vice-campeonatos. Se houver um
comunicado, um diploma ou uma classificação feminina separada, entra e passam
a seis.

## As internacionalizações, pela lista dela

Vinte e duas provas ao serviço da Seleção. As que a lista dela acrescentou ao
que já se tinha apurado nas fontes:

| Ano | Prova | Onde |
|---|---|---|
| 2024 | 94.º Internacional Amador de Portugal | Penina |
| 2024 | PT Tour · Penina Open | Penina |
| 2024 | PT Tour · Quinta do Peru Open | Sesimbra |
| 2024 | Campeonato de Espanha Feminino · Stroke Play | Espanha |
| 2024 | Campeonato Aberto de Madrid Feminino | Madrid |

As duas do PT Tour são provas do circuito profissional português em que ela
entrou como amadora, aos catorze anos.

Notar o que a lista dela **não** tem: o 93.º Internacional Amador de Portugal
(2023). Estava na pergunta 10 do documento de dúvidas como candidato a
convocatória; fica respondido que não.

A lista dela pára, em 2026, no Europeu por equipas da Irlanda. As outras três
de 2026 que o site conta como Seleção — o 96.º Internacional de Portugal, os
Internacionais Juniores de França e o Campeonato da Andaluzia — estão
confirmadas por notícias da FPG que a dão como convocada, e ficam.

## As respostas dela (16 de agosto de 2026)

O documento de dúvidas voltou respondido. Ficou tudo fechado menos uma coisa,
que está no fim.

**O Sub-12 de 2020 — resolvido, e não era o que nenhum dos dois lados pensava.**
Ela ganhou o escalão. O título não chegou a ser atribuído porque **não havia
inscritas que chegassem para o mínimo do regulamento** — e é por isso que a
notícia da FPG conta nove campeões e não dez, sem contradizer ninguém.

O ano entrou como `nacional-jovens-2020`, com `pos: 1` e `posTexto:
"Vencedora"`, mas **sem** `nacional: "campea"` e com um campo novo,
`semTitulo: true`. Esse campo tira a prova da lista `award` dos dados
estruturados: com o nome do campeonato nacional ao lado do ano, ali lia-se como
um título que não existe. São **cinco** títulos nacionais e quatro
vice-campeonatos, e as vitórias passam a dezoito.

**Oito países, confirmado.** O nono não existia.

**As duas provas fantasma.** A «European Lady Team Sub-16» é o European Ladies
Team Championship de 2025, que já estava no sítio — em Chantilly, e não num
escalão Sub-16. O «Campeonato de Espanha Sub-12» foi jogado a título
particular e não entra.

**Os cinco campeonatos espanhóis** foram por iniciativa própria, não por
convocatória. Ficam fora da página de épocas, que é de destaques, e nenhum
deles leva selo de Seleção. Se um dia se quiser a lista completa de provas, ela
está no registo de federada e sai com um comando.

**As provas sem classificação ficam sem classificação.** «Resultados pouco
relevantes porque o resultado foi mau» — palavras dela. Não se vai atrás dos
lugares que faltam.

**Os estudos saem da lista.** Foi decisão dela, depois de eu insistir uma vez
que é o primeiro filtro de um treinador americano. Está registado que insisti e
que a resposta foi «esquece isso»; não se volta ao assunto.

**Do saco não entra mais nada** — nem distâncias, nem lofts dos ferros, nem
modelo do punho, nem taco preferido. A escada continua com a faixa dos «6
ferros» e é assim que fica.

**As datas dos campeonatos do clube, confirmadas.** 6–7 de agosto de 2022,
5–6 de 2023, 3–4 de 2024, 8–9 de 2026 — Praia D'El Rey no primeiro dia e West
Cliffs no segundo. Substituíram o `YYYY-12-30` que só servia para ordenar.

**Os apoios tecnológicos ficam a marca e a ligação, e mais nada.** As
descrições que eu tinha escrito — «estatísticas de jogo», «treino de putting» —
saíram todas. As cinco ligações, verificadas uma a uma:

    UpGame      https://www.upgame.app/      (Upgame Golf, by Trackman)
    WellPutt    https://wellputt.com/
    GolfVertex  https://golfvertex.com/
    Hole19      https://www.hole19golf.com/
    HackMotion  https://hackmotion.com/

## A média de voltas — para memória, não para publicar

Decidido não publicar. Fica aqui porque a pergunta há-de voltar, e para não se
recalcular do zero. Sai das voltas que estão em `data/resultados.json`:

| Época | Voltas | Média | Melhor | Que calendário |
|---|---|---|---|---|
| 2021 | 4 | 83,8 | 82 | Estreia pela Seleção, em Espanha |
| 2022 | 5 | 83,4 | 76 | França pela primeira vez |
| 2023 | 14 | 80,3 | 73 | Cinco convocatórias, quatro países |
| 2024 | 39 | 77,6 | 70 | Nacional, o circuito profissional, Finlândia e Eslováquia |
| 2025 | 13 | 78,0 | 72 | Primeiras provas europeias absolutas |
| 2026 | 28 | 78,8 | 71 | Europeus, English Girls' Open, Andaluzia |

A leitura, que é o que importa e não os números: **não é uma regressão**. É o
calendário a endurecer — campos e adversárias de outro nível a partir de 2025.
O índice de handicap já faz esta correcção sozinho, porque o WHS pesa a
dificuldade do campo, e é por isso que ela tem 0,3 e a média sobe ao mesmo
tempo. As duas coisas são verdade, e uma média publicada sozinha só conta a
pior.

## A equipa técnica

Chegou a 16 de agosto, e o grupo `equipa` de `data/apoios.json` deixou de
estar vazio:

| | |
|---|---|
| Tiago Osório | Treinador principal |
| Ana Monteiro | Preparação física |
| Luis Almeida | Treino mental |
| Nelson Ribeiro | Selecionador nacional |

Os nomes vieram dela e é essa a fonte — não se inventou nem se corrigiu
nenhum. Duas notas para quem vier a mexer:

- **Nelson Ribeiro é da Federação, não dela.** É o director técnico nacional,
  e já orientava a selecção nas provas de 2023 que estão no percurso. Fica no
  grupo com o rótulo «Selecionador nacional» precisamente para não se ler como
  treinador pessoal.
- **A acentuação está por confirmar.** Ela escreveu «Luis» e «Nelson»; em
  português seria «Luís», e a FPG escreve «Nélson» numa notícia e «Nelson»
  noutras — o Record e o Golftattoo escrevem sem acento. Um nome é de quem o
  tem, por isso ficou como ela o deu. Se vier correcção, é uma linha.

Não se puseram contactos. Uma ficha de recruiting costuma levar o contacto do
treinador principal, porque é a quem o treinador universitário liga a seguir —
mas isso é um dado de outra pessoa, e publica-se com autorização dela e não por
iniciativa de quem faz o sítio.

## Como refazer isto

```sh
node -e "import('./scripts/myfpg.mjs').then(async m => \
  console.log(JSON.stringify(await m.buscarRegisto(), null, 1)))" > /tmp/registo.json

for p in $(seq 1 15); do
  curl -s "https://portal.fpg.pt/page/$p/?s=Francisca+Salgado" -o "/tmp/fpg-$p.html"
done
```

Depois agrupar as linhas de `provas` por `torneio` e comparar com os `id` de
`data/resultados.json`. As provas internacionais aparecem no registo com o
torneio a dizer **`International Away`** e o campo a dizer o nome verdadeiro —
é aí que estão a Bélgica, a França de 2023, a Finlândia e o English Girls'
Open. Foi essa linha que escondeu metade das internacionalizações.

## Correção de 17-08-2026 — selos da Seleção

A família confirmou que **Madrid 2024** e o **Campeonato de Espanha 2024**
foram por iniciativa própria, não ao serviço da Seleção — os selos `selecao`
saíram (as notas idem). Chamadas à Seleção: 22 → 20.

E entrou o **Campeonato da Extremadura 2022** (campeã Sub-14 **e** Absoluta,
por iniciativa própria) — dado direto da família, sem peça de imprensa
conhecida; a fonte no registo diz «Dados da família». Vitórias: 18 → 19.
