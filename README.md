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
| Funções | `api/wagr.js` — a única, e serve o cartão do ranking mundial |
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
| `wagr.js` | o cartão do ranking mundial |
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
(o clipping) e `saiuEm` (os nomes das publicações).

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
| `retrato.webp` | retrato oficial, 1080×1350 | Federação Portuguesa de Golfe | hero, imprensa, imagem de partilha |
| `retrato-quadrado.webp` | retrato próximo, 596×596 | Federação Portuguesa de Golfe | «Quem é», na inicial |
| `jogo.webp` | em prova, 1068×1335 | Praia D'El Rey Golf Course | percurso, imprensa |
| `trofeu.webp` | com o troféu da Taça FPG, 880×1100 | Federação Portuguesa de Golfe | imprensa |

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

## Ranking mundial (WAGR)

O cartão do World Amateur Golf Ranking lê a ficha oficial dela na hora. O
caminho é este, e a razão de ser dele também:

1. **`/api/wagr`** — função serverless que chama a API do WAGR. Tem de ser do
   lado do servidor: a API responde
   `access-control-allow-origin: https://www.wagr.com` e mais nenhum, por isso
   o navegador nunca a conseguiria chamar a partir deste domínio. Não há chave
   nem segredo — é o mesmo pedido público que o sítio deles faz a si próprio.
   A resposta fica em cache seis horas, com mais um dia a servir enquanto
   revalida.
2. **`data/wagr.json`** — instantâneo guardado no repositório. Entra quando
   não há funções (alojamento estático, `npx serve` local) ou quando o WAGR
   está em baixo. Refresca-se com `node scripts/wagr.mjs`.

O cartão diz qual dos dois está a ser usado — «Em direto» ou «Instantâneo» —
e mostra sempre a data dos dados e a ligação para a ficha oficial. O número
nunca é escrito à mão em lado nenhum.

## Ligar as coisas que faltam

Três pontas ficaram deliberadamente por atar, cada uma com uma constante
vazia e um comentário no sítio certo:

| O quê | Onde | Como |
|---|---|---|
| Entrega do formulário | `js/pagina.js`, `const ENTREGA` | o endereço do serviço (Formspree, uma função serverless…). Enquanto estiver vazio, o formulário valida e encaminha para o Instagram, em vez de fingir que enviou |
| Medição de tráfego | `js/cookies.js`, `const MEDICAO` | o identificador `G-…` do Google Analytics. Vazio significa que não há nada a carregar — e o banner continua a perguntar na mesma |
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

Fichas oficiais da Federação Portuguesa de Golfe, European Golf Rankings,
federações organizadoras e imprensa desportiva. Cada prova em
`data/resultados.json` traz o campo `fonte` com a ligação, e a página de
resultados mostra a nota de proveniência no fim.

## Publicar

São ficheiros estáticos: serve qualquer alojamento. O domínio é
`franciscasalgado.golf` e está escrito nos `canonical`, nas etiquetas Open
Graph, no `robots.txt` e no `sitemap.xml` — se mudar, é nesses sítios que se
mexe.
