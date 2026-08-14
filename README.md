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
| Páginas | `index.html`, `resultados.html`, `percurso.html`, `imprensa.html`, `apoiar.html`, `privacidade.html`, `termos.html` |
| Estilo | `css/site.css` — um ficheiro, com as variáveis de tema no topo |
| Comportamento | `js/` — módulos ES, sem empacotador |
| Conteúdo | `data/*.json` — é aqui que se mexe no dia a dia |
| Funções | `api/` — `wagr.js`, `egr.js` e `instagram.js` |
| Tipos de letra | `fonts/` — Fraunces e Manrope, alojados aqui e não no Google |
| Fotografias | `img/` — ver «Fotografias», mais abaixo |

### Os módulos

| | |
|---|---|
| `base.js` | arranque partilhado: tema, consentimento, língua, casca, movimento |
| `casca.js` | cabeçalho, menu de telemóvel, rodapé e o botão de tema |
| `campo.js` | o fundo do hero — carta topográfica animada em WebGL |
| `resultados.js` | a lista de provas, o marcador, os filtros e o palmarès |
| `conteudo.js` | números, factos, linha do tempo, imprensa, ligações |
| `media.js` | galeria, vídeos e a parede de apoios |
| `rankings.js` | os dois cartões de ranking, o mundial e o europeu |
| `instagram.js` | as publicações embutidas, ou o convite quando não há |
| `i18n.js` | português (lido do HTML) e inglês (escrito aqui) |
| `movimento.js` | cursor, revelação ao rolar, barra de navegação |
| `creditos.js` | o crédito obrigatório por baixo de cada fotografia |
| `main.js` / `pagina.js` | pontos de entrada: a inicial e as interiores |

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

### Números, factos, linha do tempo, escalões de apoio

Tudo em `data/perfil.json`. Os números da página inicial saem de `numeros`, a
ficha de `factos`, o «ano a ano» de `percurso`, as formas de apoiar de
`escadas`.

### Imprensa

`data/imprensa.json`: `citacoes` (com ligação à peça de onde saíram), `pecas`
(o clipping, 38 peças de 2019 a 2026) e `saiuEm` (os nomes das publicações).

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

**Os grupos estão separados de propósito.** «Apoio institucional» é quem
seleciona, forma e financia; «Equipamento» são as marcas que ela joga e veste.
Dizer que a Cobra e a Puma «apoiam» sem haver contrato seria afirmar o que não
se sabe — e isso pode dar problemas a quem tem o nome no site. Se algum deles
for mesmo um patrocínio, muda-se o item de grupo.

### Instagram

`data/instagram.json`. Enquanto a lista `publicacoes` estiver vazia, o sítio
mostra o convite a seguir a conta — e não uma caixa vazia, que é pior. Para
mostrar publicações, junte os códigos:

```json
{ "publicacoes": ["C8xYzAbCdEf", { "codigo": "D1a2B3c4D5e", "tipo": "reel" }] }
```

O código é o que vem depois de `/p/` ou `/reel/` no endereço da publicação.

## Fotografias

As fotografias são da **Federação Portuguesa de Golfe** e dos **clubes**, e
estão publicadas com autorização expressa para a Francisca as usar, desde que
creditadas. O crédito não é decorativo: é a condição.

| Ficheiro | O quê | Crédito | Onde aparece |
|---|---|---|---|
| `retrato.webp` | retrato oficial | Federação Portuguesa de Golfe | hero, imagem de partilha |
| `retrato-quadrado.webp` | retrato próximo | Federação Portuguesa de Golfe | «Quem é», na inicial |
| `avatar.webp` | rosto, para o cartão do WAGR | Praia D'El Rey Golf Course | cartão do ranking mundial |
| `jogo.webp` | em prova, taco na mão | Praia D'El Rey Golf Course | percurso |
| `trofeu.webp` | com o troféu da Taça da FPG | Federação Portuguesa de Golfe | galeria |
| `swing.webp` | swing, Drive Tour 2025 | Federação Portuguesa de Golfe | galeria |
| `seleccao.webp` | swing, estágio da Seleção | Federação Portuguesa de Golfe | galeria |
| `english.webp` | tee do English Girls' Open | Pedro Salgado / FPG | galeria |
| `franca.webp` | com o saco, em Saint-Cloud | Federação Portuguesa de Golfe | galeria |
| `pares.webp` | campeões nacionais de pares | Federação Portuguesa de Golfe | galeria |
| `aquapor.webp` | vitória no Circuito Aquapor | Federação Portuguesa de Golfe | galeria |
| `podio-2024.webp` | pódio do Aquapor de 2024 | Federação Portuguesa de Golfe | galeria |
| `sub10.webp` | campeã nacional Sub-10, 2019 | Filipe Guerra / GolfTattoo / FPG | galeria |

Os créditos vivem todos em `data/creditos.json`, num sítio só, e o
`js/creditos.js` põe-nos por baixo de cada imagem em português e em inglês.
Cada entrada tem um campo `_origem` — não é mostrado no site — a dizer de que
página veio o ficheiro, para se poder confirmar a autoria com quem a detém e
afinar o crédito se for caso disso.

Para trocar uma fotografia: guarde a nova em `img/` com o mesmo nome e as
mesmas medidas, e confirme a linha correspondente em `data/creditos.json`. Uma
imagem que entre sem crédito deixa aviso na consola — de propósito.

A imagem de partilha (`img/og.jpg`) é composta a partir do retrato oficial;
o desenho está em `scripts/og.html` e as instruções em `scripts/og.md`.

## Rankings (WAGR e EGR)

Os dois cartões leem as fichas oficiais na hora. Cada um tem dois caminhos:

1. **`/api/wagr` e `/api/egr`** — funções serverless. Têm de ser do lado do
   servidor, e por razões diferentes: o WAGR responde
   `access-control-allow-origin: https://www.wagr.com` e mais nenhum, e o EGR
   nem sequer manda cabeçalho de CORS — serve HTML. Nenhum dos dois exige
   chave. Seis horas de cache, mais um dia a servir enquanto revalida.
2. **`data/wagr.json` e `data/egr.json`** — instantâneos no repositório, para
   quando não há funções (alojamento estático, `npx serve`) ou a fonte está em
   baixo. Refrescam-se com `node scripts/wagr.mjs` e `node scripts/egr.mjs`.

O cartão diz sempre qual dos dois está a usar — «Em direto» ou «Instantâneo» —
a data dos dados, e a ligação para a ficha. Nenhum destes números é escrito à
mão em lado nenhum.

O EGR não tem API: `api/_egr.js` lê o HTML da ficha com expressões regulares.
Vive num ficheiro começado por `_` para a Vercel não o publicar como rota, e é
partilhado entre a função e o script do instantâneo, para os dois lerem a
página exactamente da mesma maneira. Se o EGR mudar de formato, o leitor
rebenta com uma mensagem clara em vez de devolver um cartão vazio — e o site
cai no instantâneo.

## Instagram

A conta ser pública **não chega**. O Instagram deixou de servir o conteúdo do
perfil a quem não tem sessão: a página devolve 600 KB de JavaScript sem uma
publicação lá dentro, e a API de perfil responde `require_login` a pedidos
vindos de servidores. Há duas maneiras de ter isto a funcionar:

**Com token, e fica resolvido para sempre.** A conta é dela, por isso pode
emitir um token de longa duração na Graph API da Meta e guardá-lo na Vercel
como variável de ambiente `IG_TOKEN`. A partir daí `api/instagram.js` traz as
publicações sozinho. Sem token, essa função responde 501 — não finge.

**À mão.** Pôr os códigos das publicações em `data/instagram.json`. O código é
o que vem depois de `/p/` ou `/reel/` no endereço:

```json
{ "publicacoes": ["C8xYzAbCdEf", { "codigo": "D1a2B3c4D5e", "tipo": "reel" }] }
```

Enquanto não houver nem um nem outro, a secção mostra o convite a seguir a
conta — e não uma caixa vazia, que é pior.

## Ligar as coisas que faltam

Três pontas ficaram deliberadamente por atar, cada uma com uma constante
vazia e um comentário no sítio certo:

| O quê | Onde | Como |
|---|---|---|
| Entrega do formulário | `js/pagina.js`, `const ENTREGA` | o endereço do serviço (Formspree, uma função serverless…). Enquanto estiver vazio, o formulário valida e encaminha para o Instagram, em vez de fingir que enviou |
| Medição de tráfego | `js/cookies.js`, `const MEDICAO` | o identificador `G-…` do Google Analytics. Vazio significa que não há nada a carregar — e o banner continua a perguntar na mesma |
| Publicações do Instagram | `IG_TOKEN`, nas variáveis de ambiente | ver a secção «Instagram» |
| Correio de contacto | `js/casca.js`, rodapé | não há endereço público conhecido; quando houver, entra ao lado das restantes ligações |

## Idiomas

Português e inglês. **O português é o que está escrito no HTML** — não se
repete em lado nenhum, é lido do DOM ao carregar. Só o inglês vive em
`js/i18n.js`. Um texto novo leva um `data-t="chave"` no HTML e a mesma chave
no dicionário `EN`. Se faltar a tradução, fica o português: nunca fica vazio.

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
`fonte` com a ligação, e a página de resultados mostra a nota de proveniência
no fim.

## Publicar

São ficheiros estáticos: serve qualquer alojamento. O domínio é
`franciscasalgado.golf` e está escrito nos `canonical`, nas etiquetas Open
Graph, no `robots.txt` e no `sitemap.xml` — se mudar, é nesses sítios que se
mexe.
