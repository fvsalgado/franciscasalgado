/* O campo — fundo do hero, em WebGL puro, sem bibliotecas.
   Um terreno em ruído fractal lido como carta topográfica: curvas de nível
   a cada tantos metros de altura, relevo pintado por altitude e uma luz
   rasante que segue o rato. Anda muito devagar, de propósito: é um campo de
   golfe visto de cima, não um protetor de ecrã.
   Pausa quando sai do ecrã ou o separador fica escondido; se não houver
   WebGL, fica o gradiente de CSS e ninguém dá por nada. */

const VERT = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 cor;
uniform vec2  uTam;
uniform float uT;
uniform vec2  uRato;
uniform vec3  uBaixo;    // vale
uniform vec3  uAlto;     // cume
uniform vec3  uPapel;    // o fundo da página, para esbater em baixo
uniform vec3  uLinha;    // curvas de nível
uniform float uEscuro;

float ruido(vec2 x){
  vec2 i = floor(x), f = fract(x);
  float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
  float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
  float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 x){
  float v = 0.0, a = 0.5;
  mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
  for (int i = 0; i < 6; i++){
    v += a * ruido(x);
    x = rot * x * 2.02;
    a *= 0.5;
  }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uTam;
  float prop = uTam.x / max(uTam.y, 1.0);
  vec2 q = vec2(uv.x * prop, uv.y);

  // o terreno deriva devagar; a segunda camada faz as encostas mexerem-se
  // umas em relação às outras, e não o mapa inteiro a deslizar
  float t = uT * 0.010;
  float base = fbm(q * 1.9 + vec2(t, t * 0.32));
  float alt  = base + 0.34 * fbm(q * 4.1 - vec2(t * 0.7, t * 0.2));
  alt = alt / 1.34;

  // curvas de nível: uma linha a cada 1/N de altura, com espessura constante
  // no ecrã graças à derivada — sem isto ficam grossas no vale e sumidas no cume
  float passos = 13.0;
  float bandas = alt * passos;
  float d = abs(fract(bandas) - 0.5);
  float w = fwidth(bandas);
  float curva = 1.0 - smoothstep(0.0, w * 1.5, d);

  // a cada cinco curvas, uma mestra mais marcada — como nas cartas a sério
  float bandas5 = alt * passos / 5.0;
  float d5 = abs(fract(bandas5) - 0.5);
  float w5 = fwidth(bandas5);
  float mestra = 1.0 - smoothstep(0.0, w5 * 1.5, d5);

  // relevo pintado por altitude
  vec3 c = mix(uBaixo, uAlto, smoothstep(0.18, 0.82, alt));

  // luz rasante: acende o lado do declive virado para o rato
  vec2 luzP = vec2(uRato.x * prop, uRato.y);
  float dist = distance(q, luzP);
  float halo = exp(-dist * dist * 3.4);
  c += (uAlto - uBaixo) * halo * (0.22 + 0.30 * uEscuro);

  // as curvas por cima, mais presentes onde a luz bate
  float forca = 0.30 + 0.34 * halo;
  c = mix(c, uLinha, curva * forca);
  c = mix(c, uLinha, mestra * forca * 0.85);

  // esbatimento em baixo, para o conteúdo respirar por cima do mapa
  c = mix(c, uPapel, smoothstep(0.50, 0.0, uv.y) * 0.9);
  // e um véu no topo, para a barra de navegação não competir com o relevo
  c = mix(c, uPapel, smoothstep(0.80, 1.0, uv.y) * 0.45);

  // vinheta discreta
  float vin = smoothstep(1.25, 0.35, distance(uv, vec2(0.5)));
  c *= 0.88 + 0.12 * vin;

  cor = vec4(c, 1.0);
}`;

const hex = (s) => {
  const v = (s || '').trim().replace('#', '');
  if (v.length < 6) return [0, 0, 0];
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
};

function compilar(gl, tipo, fonte) {
  const s = gl.createShader(tipo);
  gl.shaderSource(s, fonte);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('shader:', gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

export function iniciarCampo(canvas, { reduzido = false } = {}) {
  if (!canvas) return { tema() {}, destruir() {} };

  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) {
    canvas.style.background = 'linear-gradient(180deg, var(--relva-clara), var(--papel))';
    return { tema() {}, destruir() {} };
  }

  const vs = compilar(gl, gl.VERTEX_SHADER, VERT);
  const fs = compilar(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) {
    canvas.style.background = 'linear-gradient(180deg, var(--relva-clara), var(--papel))';
    return { tema() {}, destruir() {} };
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = (n) => gl.getUniformLocation(prog, n);
  const uTam = u('uTam'), uT = u('uT'), uRato = u('uRato');
  const uBaixo = u('uBaixo'), uAlto = u('uAlto'), uPapel = u('uPapel'),
        uLinha = u('uLinha'), uEscuro = u('uEscuro');

  const rato = { x: 0.5, y: 0.62 };
  const alvo = { x: 0.5, y: 0.62 };
  let paleta = null;

  function lerPaleta() {
    const e = getComputedStyle(document.documentElement);
    const escuro = document.documentElement.dataset.tema === 'escuro';
    paleta = {
      baixo: hex(escuro ? '#0C1D17' : '#D9E5D6'),
      alto: hex(escuro ? '#1C4735' : '#A9C9A8'),
      papel: hex(e.getPropertyValue('--papel') || (escuro ? '#091411' : '#F7F5EE')),
      linha: hex(escuro ? '#4FC28B' : '#1B6B47'),
      escuro: escuro ? 1 : 0,
    };
  }
  lerPaleta();

  let larg = 0, altura = 0;
  function medir() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const r = canvas.getBoundingClientRect();
    larg = Math.max(1, Math.round(r.width * dpr));
    altura = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== larg || canvas.height !== altura) {
      canvas.width = larg;
      canvas.height = altura;
      gl.viewport(0, 0, larg, altura);
    }
  }

  const aoRato = (e) => {
    alvo.x = e.clientX / window.innerWidth;
    alvo.y = 1 - e.clientY / window.innerHeight;
  };
  window.addEventListener('pointermove', aoRato, { passive: true });

  let visivel = true;
  const obs = new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }, { threshold: 0 });
  obs.observe(canvas);

  let corre = true;
  const inicio = performance.now();
  let pedido = 0;

  function quadro(agora) {
    pedido = requestAnimationFrame(quadro);
    if (!corre || !visivel || document.hidden) return;

    rato.x += (alvo.x - rato.x) * 0.04;
    rato.y += (alvo.y - rato.y) * 0.04;

    medir();
    gl.uniform2f(uTam, larg, altura);
    gl.uniform1f(uT, reduzido ? 0 : (agora - inicio) / 1000);
    gl.uniform2f(uRato, rato.x, rato.y);
    gl.uniform3fv(uBaixo, paleta.baixo);
    gl.uniform3fv(uAlto, paleta.alto);
    gl.uniform3fv(uPapel, paleta.papel);
    gl.uniform3fv(uLinha, paleta.linha);
    gl.uniform1f(uEscuro, paleta.escuro);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  pedido = requestAnimationFrame(quadro);

  return {
    tema: lerPaleta,
    destruir() {
      corre = false;
      cancelAnimationFrame(pedido);
      obs.disconnect();
      window.removeEventListener('pointermove', aoRato);
    },
  };
}
