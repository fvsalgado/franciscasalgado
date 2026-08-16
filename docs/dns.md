# O DNS deste domínio, explicado

O que é, onde se mexe, o que lá está hoje, o que falta — e como criar um
subdomínio, com o `tracker` como exemplo. `docs/` não é publicado.

## O que o DNS faz, em duas frases

Um domínio é um nome; a internet trabalha com números e com outros nomes. O
DNS é a lista telefónica que traduz uma coisa na outra: `franciscasalgado.golf`
→ `216.150.1.129`. Cada linha dessa lista chama-se **registo**, e um registo
tem sempre quatro coisas:

| | o que é | exemplo |
|---|---|---|
| **nome** | o que fica à esquerda do domínio | `tracker`, `www`, ou `@` para o domínio em si |
| **tipo** | que espécie de resposta é | `A`, `CNAME`, `TXT`, `MX` |
| **valor** | a resposta | `216.150.1.129`, `custom.plausible.io` |
| **TTL** | quantos segundos os outros podem guardar a resposta antes de voltar a perguntar | `60`, `1800` |

O `@` é o próprio domínio, sem nada à frente — diz-se **apex** ou raiz. É a
única parte do domínio onde certos tipos de registo não podem existir, e já lá
vamos.

## Os tipos que vai encontrar

- **A** — aponta um nome a um endereço IPv4. `AAAA` é o mesmo para IPv6.
- **CNAME** — «este nome é um apelido de outro». Em vez de um número, dá outro
  nome, e quem pergunta segue-o. É o que se usa para apontar um subdomínio a um
  serviço de outra empresa, porque o IP deles pode mudar e o nome não.
  **Um CNAME não pode coexistir com mais nada no mesmo nome** — nem com um TXT,
  nem com um MX. E, pela regra original, não pode estar no apex; por isso é que
  o apex leva `A` e o `www` leva `CNAME`.
- **TXT** — texto livre. Serve para provar a quem controla o domínio: é assim
  que a Search Console foi verificada, e é assim que se configura o SPF e o
  DMARC do correio.
- **MX** — para onde vai o correio deste domínio. Sem MX, o correio não chega:
  quem enviar recebe de volta um erro.
- **NS** — quem manda neste domínio. É o registo que diz em que servidor a
  lista telefónica é editada.
- **CAA** — que autoridades de certificação podem emitir certificados HTTPS
  para este domínio. É uma tranca, e sabe morder — ver mais abaixo.

## Onde se mexe neste caso

Os `NS` do `.golf` são `ns1.vercel-dns.com` e `ns2.vercel-dns.com`. Isso quer
dizer que **quem manda no DNS é a Vercel**, e não o registador onde o domínio
foi comprado. Portanto:

> Vercel → Domains → `franciscasalgado.golf` → **DNS Records**

É lá que se acrescenta, edita e apaga. O registador só volta a interessar se um
dia quiser mudar os nameservers para outro sítio.

O `.com` é diferente: os `NS` dele estão na **Porkbun**. São duas listas
telefónicas independentes, e o que se escreve numa não tem efeito na outra.

## O que lá está hoje

| nome | tipo | valor | para quê |
|---|---|---|---|
| `@` | A | `216.150.1.129`, `216.150.1.193` | o sítio, na Vercel |
| `@` | TXT | `google-site-verification=xLmbUb58gO54…` | prova para a Search Console |
| `@` | CAA | `letsencrypt.org`, `pki.goog`, `sectigo.com` | só estas podem emitir certificados |
| `*` | A | Vercel | **wildcard** — ver a seguir |
| `@` | MX | **não existe** | e por isso o `birdie@` não recebe correio |

## O wildcard, e porque é que o `tracker` já responde

Há um registo com o nome `*`. Um asterisco significa «qualquer nome que eu não
tenha declarado explicitamente». É por isso que isto responde:

```
tracker.franciscasalgado.golf        → responde
zzz-nao-existe-1234.….golf           → responde na mesma
```

Nenhum dos dois está declarado. Estão os dois a ser apanhados pelo asterisco.
No `.com`, que não tem wildcard, o mesmo nome inventado dá **NXDOMAIN** — «esse
nome não existe», que é a resposta honesta.

Duas consequências:

1. **Resolver não é servir.** O nome chega à Vercel, mas a Vercel só tem
   certificado e projeto para os domínios que estão configurados; por isso
   `tracker.franciscasalgado.golf` dá hoje um 404 e não o sítio.
2. **Um registo específico ganha sempre ao wildcard.** Quando criar `tracker`
   como registo próprio, o asterisco deixa de contar para esse nome. Não é
   preciso apagar nada nem há conflito.

Vale a pena perguntar se o wildcard é para ficar. Ele faz com que qualquer
subdomínio aponte para aqui, incluindo os que ninguém criou — não é perigoso,
mas é uma porta aberta que não está a servir nada.

## Criar o subdomínio `tracker`

O procedimento é sempre o mesmo e tem três decisões: nome, tipo, valor.

**Nome:** `tracker`. Escreve-se só a parte da esquerda — a Vercel junta o resto.
Escrever `tracker.franciscasalgado.golf` no campo do nome cria
`tracker.franciscasalgado.golf.franciscasalgado.golf`, e é o erro número um.

**Tipo e valor:** dependem de para onde aponta, e **o valor vem sempre do
serviço de destino** — nunca se inventa. Os três casos realistas:

| destino | tipo | valor |
|---|---|---|
| um serviço externo de medição (Plausible, Umami, Fathom…) | `CNAME` | o nome que eles derem, ex. `custom.plausible.io` |
| um contentor Google Tag Manager server-side | `A` (ou `CNAME`) | os endereços que a consola do Google mostrar |
| uma aplicação na própria Vercel | `CNAME` | `cname.vercel-dns.com` |

**TTL:** deixe o valor por omissão (60 na Vercel). Um TTL baixo faz o mundo
voltar a perguntar depressa, o que é o que se quer enquanto se está a montar.
Sobe-se depois, se se quiser.

**Se o destino for a própria Vercel**, o registo DNS não chega: é preciso
também ir ao projeto → Settings → Domains e acrescentar
`tracker.franciscasalgado.golf`. É esse passo que faz a Vercel emitir o
certificado e servir alguma coisa. Sem ele, fica no 404 de agora.

### A armadilha do CAA

Este domínio tem CAA a limitar a emissão de certificados a três autoridades:
`letsencrypt.org`, `pki.goog` e `sectigo.com`. É boa higiene — impede que
qualquer outra autoridade emita um certificado para este nome.

Mas vale para os subdomínios todos. Se apontar o `tracker` a um serviço que
use outra autoridade — a Amazon, por exemplo, usa a Amazon Trust Services —,
**a emissão do certificado falha e o subdomínio fica sem HTTPS**, com uma
mensagem de erro que não diz «CAA» em lado nenhum. Se acontecer, é aqui que
se olha primeiro: acrescenta-se a autoridade deles à lista, ou não se usa
aquele serviço.

Let's Encrypt e Google já lá estão, que é o que a maior parte destes serviços
usa.

### Uma nota sobre o que um subdomínio destes faz e não faz

Pôr a medição num nome do próprio domínio, em vez de num domínio de terceiros,
tem um efeito prático conhecido: as listas de bloqueio de rastreadores e as
protecções dos navegadores deixam de a apanhar, porque deixa de parecer
terceira parte. Isso é legítimo — os dados são dela e do sítio dela —, mas não
muda nada quanto ao RGPD.

O que cumpre a lei continua a ser o que já está feito no `js/cookies.js`: nada
é carregado antes do clique, e a escolha fica em `localStorage` e não num
cookie. Se a medição passar por `tracker.`, essa regra tem de continuar a valer
exactamente igual — e a política de privacidade tem de dizer que a medição é
servida a partir do próprio domínio, senão a página passa a descrever mal o
que faz.

Note-se também que **hoje não há medição nenhuma**: o `MEDICAO` no
`js/cookies.js` está vazio de propósito, à espera de haver uma propriedade. O
subdomínio sozinho não mede nada.

## O que falta no DNS: o correio

`birdie@franciscasalgado.golf` está em todos os rodapés, no botão de contacto
de todas as páginas, no kit de imprensa e nos dados estruturados. **E não
recebe nada**, porque não há registos MX. Quem escrever recebe o email de
volta.

Para resolver, escolhe-se um serviço de correio — Google Workspace, Fastmail,
Zoho, ou o encaminhamento gratuito de quase todos os registadores, que reenvia
para uma caixa que já exista — e acrescentam-se os registos que **esse serviço
indicar**. São tipicamente três coisas:

1. os **MX**, com prioridades (o número mais baixo é o preferido);
2. um **TXT com o SPF**, a dizer que servidores podem enviar em nome deste
   domínio;
3. um **TXT com a chave DKIM**, que assina o correio que sai.

Sem SPF e DKIM o correio sai, mas cai em spam com frequência — o que, numa
caixa que existe para receber respostas de treinadores universitários, é o
mesmo que não existir.

Isto é a coisa mais valiosa que falta neste domínio, e é de longe a mais
barata.

## Como verificar, sem esperar por ninguém

Uma alteração de DNS não é instantânea: quem já perguntou guarda a resposta
antiga durante o TTL. Com TTL de 60 são segundos; com 1800, meia hora.

```sh
# um registo qualquer, lido a um servidor público
curl -s -H 'accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=tracker.franciscasalgado.golf&type=CNAME' \
  | python3 -m json.tool
```

No campo `Status`: **0** quer dizer que existe, **3** quer dizer NXDOMAIN — o
nome não existe. Cuidado que aqui, com o wildcard, um nome que não criou dá
`0` na mesma; o que distingue é o **valor** da resposta.

E depois de o nome responder, falta a outra metade:

```sh
curl -sI https://tracker.franciscasalgado.golf/   # 404 = DNS certo, serviço por configurar
```

DNS resolvido e serviço a responder são duas coisas, e falham em separado.
