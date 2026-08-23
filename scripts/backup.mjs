/* O manifesto que vai dentro de cada cópia de segurança.
 *
 *   node scripts/backup.mjs > MANIFESTO.md
 *
 * Um arquivo sem manifesto é uma caixa fechada: para saber o que lá está,
 * é preciso abri-lo todo. Este ficheiro diz, em texto simples, o que a cópia
 * contém e como se volta atrás a partir dela — porque quem for restaurar isto
 * pode ser alguém que nunca viu este repositório, daqui a anos, num dia mau.
 *
 * Só conta o que está; não inventa nem resume prosa. */

import { readFile, readdir, stat } from 'node:fs/promises';
import { execSync } from 'node:child_process';

const RAIZ = new URL('../', import.meta.url);
const hoje = new Date().toISOString().slice(0, 10);

const ler = async (p) => JSON.parse(await readFile(new URL(p, RAIZ), 'utf8')).valueOf();
const talvez = async (p, f, falha = '—') => { try { return f(await ler(p)); } catch { return falha; } };

/** Quantos ficheiros e quantos bytes há debaixo de uma pasta. */
async function pesar(dir) {
  let n = 0; let bytes = 0;
  const andar = async (d) => {
    let entradas = [];
    try { entradas = await readdir(new URL(d, RAIZ), { withFileTypes: true }); } catch { return; }
    for (const e of entradas) {
      const caminho = `${d}${e.name}${e.isDirectory() ? '/' : ''}`;
      if (e.isDirectory()) await andar(caminho);
      else { n += 1; bytes += (await stat(new URL(caminho, RAIZ))).size; }
    }
  };
  await andar(dir.endsWith('/') ? dir : `${dir}/`);
  return { n, mb: (bytes / 1048576).toFixed(1) };
}

const git = (cmd, falha = '—') => {
  try { return execSync(`git ${cmd}`, { cwd: new URL('.', RAIZ), encoding: 'utf8' }).trim(); }
  catch { return falha; }
};

const [imgs, dados] = await Promise.all([pesar('img'), pesar('data')]);

const provas = await talvez('data/resultados.json', (d) => d.provas.length);
const fpg = await talvez('data/provas-fpg.json', (d) => `${d.total} provas · ${d.voltas} voltas`);
const classif = await talvez('data/classificacoes-fpg.json', (d) => {
  const v = Object.values(d.provas || {});
  return `${v.filter((x) => x.vistas?.length).length} com classificação, de ${v.length}`;
});
const hcp = await talvez('data/handicap-historico.json', (d) => {
  const p = d.pontos || [];
  return p.length ? `${p.length} degraus · ${p[0].hcp} (${p[0].data}) → ${p[p.length - 1].hcp} (${p[p.length - 1].data})` : '—';
});
const creditos = await talvez('data/creditos.json', (d) => {
  const f = Object.values(d.porFicheiro || {});
  const porConfirmar = f.filter((c) => !c.pt).length;
  return `${f.length} ficheiros com proveniência registada${porConfirmar ? ` · ${porConfirmar} com autoria por confirmar` : ''}`;
});

process.stdout.write(`# Cópia de segurança — franciscasalgado.golf

Feita a ${hoje}, a partir do commit \`${git('rev-parse --short HEAD')}\`
(${git('log -1 --date=short --format=%ad')}: ${git('log -1 --format=%s').slice(0, 72)}).

## O que vem nesta cópia

| Ficheiro | O que é |
| --- | --- |
| \`sitio-${hoje}.tar.gz\` | O sítio como está: dados, imagens, páginas, folhas de estilo, guiões e notas. Abre-se com qualquer descompactador. |
| \`repositorio-${hoje}.bundle\` | O repositório inteiro, com **todo o histórico** de alterações. É o que permite voltar atrás a qualquer dia, não só a este. |

## Como se volta atrás

O repositório inteiro, com histórico:

    git clone repositorio-${hoje}.bundle franciscasalgado
    cd franciscasalgado

Só os ficheiros, sem git:

    tar -xzf sitio-${hoje}.tar.gz

Para voltar a publicar, o sítio é estático: qualquer alojamento que sirva
ficheiros serve. A configuração da Vercel vai no \`vercel.json\`, dentro da
cópia.

## O que lá está dentro

- **Imagens:** ${imgs.n} ficheiros, ${imgs.mb} MB — é o que não se recupera de mais lado nenhum.
- **Dados:** ${dados.n} ficheiros, ${dados.mb} MB.
- **Provas com cartão no sítio:** ${provas}
- **Registo federado:** ${fpg}
- **Classificações lidas do scoring da FPG:** ${classif}
- **Histórico de handicap:** ${hcp}
- **Créditos de imagem:** ${creditos}
- **Ramo:** \`${git('rev-parse --abbrev-ref HEAD')}\` · ${git('rev-list --count HEAD')} commits

## O que **não** vem aqui

- As contas: Vercel, GitHub, o domínio, o correio. Uma cópia de ficheiros não
  repõe acessos.
- Os segredos do repositório (chaves de API). Nenhum é preciso para o sítio
  funcionar — os leitores da federação e dos rankings dispensam credenciais.
- O que vive no Instagram. As publicações mostradas no sítio são embutidas: se
  a conta desaparecer, desaparecem com ela.

## Uma nota que convém não esquecer

Esta cópia está guardada no mesmo GitHub que aloja o repositório. Protege
contra apagar um ficheiro por engano, contra uma alteração má, contra uma
ronda automática que corra mal. **Não protege contra perder a conta.** Uma vez
por ano, vale a pena descarregar o \`.bundle\` mais recente para um disco que
não seja de ninguém na internet.
`);
