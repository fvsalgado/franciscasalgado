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
