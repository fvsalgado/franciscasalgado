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

**Não há fotografias neste repositório**, e isso é uma decisão, não um
esquecimento. As fotografias que existem online de Francisca Salgado
pertencem à Federação Portuguesa de Golfe e aos fotógrafos das provas;
descarregá-las e publicá-las aqui seria usar trabalho de outros sem licença.
Nos sítios onde entra uma fotografia está, em vez dela, um lugar marcado com
as dimensões certas.

Para as pôr:

1. Guarde os ficheiros em `img/` — em `.webp`, com estas medidas:
   - `retrato.webp` — 1080 × 1350 (retrato oficial, hero e percurso)
   - `retrato-quadrado.webp` — 1200 × 1200 (secção «Quem é»)
   - `jogo.webp` — 1200 × 1500 (em prova, página de imprensa)
2. Substitua o bloco `<div class="ph …">…</div>` pela imagem:
   ```html
   <img class="hero__img" src="img/retrato.webp" alt="Retrato de Francisca Salgado"
        width="1080" height="1350" fetchpriority="high" decoding="async" />
   ```
3. **Acrescente o crédito em `data/creditos.json`.** Sem isso o `creditos.js`
   deixa aviso na consola e a fotografia fica sem a autoria à vista — que é
   precisamente o que não se quer fazer a quem a tirou.

A imagem de partilha (`img/og.jpg`) é gerada e não tem fotografia: o desenho
está em `scripts/og.html`. Para a refazer depois de mudar alguma coisa, veja
`scripts/og.md`.

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
