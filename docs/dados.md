# Notas dos ficheiros de dados

Estas notas viviam num campo `_leia-me` dentro de cada ficheiro JSON. Como os
ficheiros de `data/` são servidos publicamente, as notas iam com eles — e são
instruções para quem mantém o sítio, não conteúdo para quem o lê. Passaram
para aqui, e `docs/` não é publicado (ver `.vercelignore`).

## `data/apoios.json`

Quem acompanha o percurso, por natureza da relação. Para acrescentar um logótipo: guarde o ficheiro em img/logos/ e ponha o nome em 'logo'; sem 'logo', entra o nome composto na tipografia do sítio, dentro do mesmo cartão, e a parede continua a ler-se como uma só. Um item com "fundo": "escuro" ganha placa escura — é para logótipos desenhados a branco, que numa placa branca desapareciam. Os créditos e a proveniência de cada logótipo vivem em data/creditos.json.

## `data/creditos.json`

Créditos obrigatórios de imagem. A chave de porFicheiro é o nome do ficheiro tal como está em img/. Sempre que entrar uma fotografia nova, acrescenta-se aqui a linha correspondente — o js/creditos.js avisa na consola quando encontra uma imagem sem crédito. O campo _origem não é mostrado no site: fica só para se saber de onde veio cada ficheiro e se poder confirmar a autoria com quem a detém.

## `data/egr.json`

Instantâneo da ficha no European Golf Rankings. Recurso para quando /api/egr não está disponível. Refrescado pelo vigia; para o fazer à mão: node scripts/egr.mjs

## `data/galeria.json`

A galeria. Cada entrada aponta para um ficheiro em img/; o crédito não se escreve aqui — vem de data/creditos.json, para haver um sítio só onde a autoria vive. 'formato' escolhe a proporção do recorte: 'alto' (4:5) ou 'largo' (3:2). ATENÇÃO: só entram aqui fotografias em que a Francisca esteja identificada sem margem para dúvida. As peças da FPG cobrem muitas vezes vários atletas, e a fotografia de abertura pode ser de outra pessoa — foi o que aconteceu com duas que tiveram de sair.

## `data/instagram.json`

Instagram. O 'perfil' alimenta o cartão de seguidores; os números só aparecem quando estão preenchidos — mais vale não mostrar do que mostrar errado. Com um token da Graph API em IG_TOKEN (ver api/instagram.js) tudo isto passa a vir sozinho e em direto, e este ficheiro deixa de ser preciso. Os códigos são o que vem depois de /p/ ou /reel/ no endereço da publicação.

## `data/videos.json`

Vídeos no YouTube. O 'id' é o que vem depois de watch?v= ou de /shorts/ no endereço. O 'ano' é opcional: quando não se sabe a data de publicação, deixa-se vazio e o cartão sai sem o selo do ano, em vez de levar um ano inventado. A capa de cada vídeo está em img/videos/<id>.webp, copiada uma vez pelo scripts/capas.mjs — assim mostra-se a imagem verdadeira sem pedir nada ao YouTube antes de alguém carregar no botão.

## `data/vigia-vistas.json`

Endereços de peças que o vigia já mostrou em VIGIA-ATENCAO.md e não deve voltar a mostrar. Apagar uma linha faz a peça reaparecer no próximo aviso.

## `data/wagr.json`

Instantâneo da ficha no World Amateur Golf Ranking. Recurso para quando /api/wagr não está disponível. Refrescado pelo vigia; à mão: node scripts/wagr.mjs
