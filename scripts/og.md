# Refazer a imagem de partilha

`img/og.jpg` (1200 × 630) é gerada a partir de `scripts/og.html`, que usa os
mesmos tipos de letra do sítio. Não leva fotografia nenhuma — é composição.

Precisa de um Chromium e do Pillow. A janela é propositadamente mais alta do
que a imagem: assim o desenho não fica encostado ao fundo do ecrã, e corta-se
depois na medida certa. O `--force-device-scale-factor=2` serve para o texto
sair sem serrilhado.

```sh
chromium --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=1200,760 \
  --screenshot=/tmp/og-raw.png "file://$PWD/scripts/og.html"

python3 - <<'PY'
from PIL import Image
im = Image.open("/tmp/og-raw.png").crop((0, 0, 2400, 1260))
im.resize((1200, 630), Image.LANCZOS).convert("RGB").save(
    "img/og.jpg", quality=90, optimize=True)
PY
```

Se um dia houver fotografia com licença para isto, o melhor é pô-la como
fundo em `og.html`, com o texto por cima — a estrutura já lá está.
