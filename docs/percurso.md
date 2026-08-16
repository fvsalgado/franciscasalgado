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

### O quinto vice-campeonato nacional

Faltava um à conta que a frase de abertura promete. Está em 2023: vice-campeã
nacional de Sub-14 pelo segundo ano seguido. A notícia
`campeoes-nacionais-de-jovens-consagrados-no-montado`, de 5 de novembro de
2023, di-lo por palavras — «repetiu a posição de 2022» — e acrescenta que foi
segunda também na Final Nacional, com o prémio Medal Net.

Os cinco: Sub-10 2018, Sub-14 2022, Sub-14 2023, Sub-16 2024, Taça FPG–BPI 2025
(perdeu a final com Francisca Rocha por 4&3).

Os quatro títulos, para comparar: Sub-10 2019, Sub-12 2021, Pares Amador 2026,
Sub-18 2026.

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
é uma prova por equipas em match play, que o registo nunca vê. Fica na pergunta
8 do documento de dúvidas.

### 2020 não foi um ano parado

O registo tem, em 2020: Drive Challenge Sub-12, campeonato do clube do Paço do
Lumiar, Circuito Drive Tour em Amarante e no Montado, e o Campeonato Nacional de
Jovens a 29 e 30 de agosto, entre a Estela e Miramar. Aí ficou em nono na
classificação geral mista de Sub-12
(`campeonato-nacional-de-jovens-vento-sopra-e-concorrencia-aperta-na-estela-e-em-miramar`).

Como não houve pódio, 2020 continua sem prova em `data/resultados.json`. É uma
decisão, não um esquecimento: a página de épocas é de destaques.

### Uma prova trocada

O que estava como `nacional-amador-2026`, a 13 de junho, era o **Campeonato
Nacional de Profissionais**, onde ela entrou como amadora (+15, 157). O
campeonato nacional amador dela é o **Absoluto**, no Oporto, a 4–7 de junho:
80·80·77·79, entre 22 jogadoras quase todas mais velhas. Ficou este, com o id
`nacional-absoluto-2026`.

## O que continua por saber

Está tudo no documento de dúvidas (`perguntas-em-aberto.docx`), mas em resumo,
e só o que toca ao percurso:

- **O nono país.**
- **«European Lady Team Sub-16» e «Campeonato de Espanha Sub-12»** — duas provas
  que ela referiu e que não existem no registo nem em nenhuma notícia. Se forem
  match play, a explicação é a do Hexagonal.
- **O 93.º e o 94.º Internacional Amador de Portugal** (2023 e 2024) estão no
  registo e não no sítio. O 95.º e o 96.º entraram como convocatórias; se
  aqueles dois também o foram, as internacionalizações passam a dezanove.
- **Cinco campeonatos nacionais espanhóis** que estão no registo e não no sítio
  — Infantil 2023, FF.AA. Sub-16 2023, Sub-16 2024, Copa Andalucía 2025,
  Nacional Juvenil 2025. Decisão de conteúdo, não de facto.
- **As datas dos campeonatos do clube** saíram do registo (agosto de 2022, 2023,
  2024 e 2026, Praia D'El Rey no primeiro dia e West Cliffs no segundo), mas o
  registo distingue «net» de «gross» nalguns anos e o título que temos é
  «campeã do clube» sem mais. Ficam só com o ano até haver confirmação.

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
