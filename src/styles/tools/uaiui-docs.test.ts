import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const strip = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '');
const srcDir = fileURLToPath(new URL('../../', import.meta.url));
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf-8');

// Duas zonas, em dois arquivos (só o UaiuiDocsLayout os importa):
// - chrome (uaiui-docs.css): cabeçalho da área, menu, títulos, divisores, callouts, paginação,
//   busca e o controle de densidade. Pode usar tokens do wrapper (--ui-*, --interface-function-*)
//   e tokens semânticos do site (--surface-*, --text-*, --border-*, --icon-*, --button-*, --tag-*,
//   --shadow-*); nunca primitivos de cor (--blue-5…).
// - DS (uaiui-docs-ds.css): exemplo, abas, palco, bloco de código e tabelas. Só tokens do wrapper.
const chromeCss = strip(read('./uaiui-docs.css'));
const dsCss = strip(read('./uaiui-docs-ds.css'));
const zones = { chrome: chromeCss, ds: dsCss };
const css = `${chromeCss}\n${dsCss}`;

/** Seletores de todas as regras, inclusive as de dentro de @media. */
function collectSelectors(text: string) {
  const selectors: string[] = [];
  let prelude = '';
  let skipDepth = 0;
  for (const ch of text) {
    if (skipDepth > 0) {
      if (ch === '{') skipDepth += 1;
      if (ch === '}') skipDepth -= 1;
      continue;
    }
    if (ch === '{') {
      const head = prelude.trim();
      prelude = '';
      if (head.startsWith('@')) continue;
      selectors.push(...head.split(',').map((s) => s.trim()));
      skipDepth = 1;
    } else if (ch === '}') {
      prelude = '';
    } else {
      prelude += ch;
    }
  }
  return selectors;
}

/** Declarações (propriedade e valor), sem os seletores. */
function collectDeclarations(text: string) {
  return [...text.matchAll(/([\w-]+)\s*:\s*([^;{}]+);/g)].map((m) => ({ prop: m[1], value: m[2].trim() }));
}

const declaredVars = (text: string) => new Set([...text.matchAll(/--([\w-]+)\s*:/g)].map((m) => m[1]));
const usedVars = (text: string) => new Set([...text.matchAll(/var\(\s*--([\w-]+)/g)].map((m) => m[1]));
const wrapperVars = declaredVars(readFileSync(createRequire(import.meta.url).resolve('uaiui-ds/tokens-wrapper.css'), 'utf-8'));
// Tokens semânticos do site (cor, forma e sombra): semantics.css, sem os de tipografia e de layout
// e sem os nomes que o wrapper também declara.
const siteSemanticVars = [...declaredVars(read('../tokens/semantics.css'))].filter(
  (name) => !/^(line-height|letter-spacing|grid-col|header-mobile)/.test(name) && !wrapperVars.has(name),
);
const colorPrimitiveVars = [...declaredVars(read('../tokens/primitives.css'))].filter((name) =>
  /^(grey|blue|red|green|yellow|purple|avatar-frame)/.test(name),
);

describe('CSS do shell do UaiUI fica restrito à área do DS (os dois arquivos)', () => {
  const selectors = collectSelectors(css);

  it('encontrou as regras do shell (sanity check do próprio teste)', () => {
    expect(selectors.length).toBeGreaterThan(80);
    expect(collectSelectors(chromeCss).length).toBeGreaterThan(60);
    expect(collectSelectors(dsCss).length).toBeGreaterThan(20);
    expect(siteSemanticVars).toContain('surface-bg-accent-subtle');
    expect(siteSemanticVars).not.toContain('line-height-regular');
    expect(colorPrimitiveVars).toContain('blue-5');
  });

  it('todo seletor começa por .uaiui-docs (o wrapper, junto com o .uaiui do DS)', () => {
    const unscoped = selectors.filter((s) => !/^\.uaiui-docs(?![\w-])/.test(s));
    expect(unscoped).toEqual([]);
  });

  it('não traz os globais do site de docs do DS (*, html, body, :root, a, h1–h4 soltos)', () => {
    const globals = selectors.filter((s) => /^(\*|html|body|:root|a|h[1-4]|:focus-visible)\b/.test(s));
    expect(globals).toEqual([]);
    expect(css).not.toMatch(/:root/);
  });

  it('sem cor fixa: nada de #hex, rgb(), hsl() ou nome de cor (só tokens, transparent, currentColor e cores de sistema em forced-colors)', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/\b(rgba?|hsla?|oklch|lab|lch)\(/i);
    const named = /\b(black|white|red|blue|green|gray|grey|yellow|purple|pink|orange)\b/i;
    const colorProps = collectDeclarations(css).filter((d) => /(^|-)color$|^background$|^border(-\w+)?$|^outline$|^box-shadow$/.test(d.prop));
    expect(colorProps.filter((d) => named.test(d.value))).toEqual([]);
  });

  it('não declara fontes e usa as famílias por token', () => {
    expect(css).not.toMatch(/@font-face/);
    const families = collectDeclarations(css).filter((d) => d.prop === 'font-family');
    expect(families.length).toBeGreaterThan(5);
    for (const { value } of families) expect(value).toMatch(/^var\(--font-family-(title|body|label)\)$/);
  });

  it('sem data-uaiui-theme: a área segue o tema claro do site', () => {
    expect(css).not.toMatch(/data-uaiui-theme/);
  });
});

describe('as duas zonas do CSS: chrome (tokens do site permitidos) e DS (só o wrapper)', () => {
  // Classes de cada zona: o exemplo, o código e as tabelas são do DS; o resto é chrome.
  const dsClass = /\.uaiui-docs__(example|example-bar|tabs|tab|stage|stage--col|code|code-bar|code-lang|code--bare|copy|table|table-wrap|table--props|table-note)(?![\w-])/;

  it('o arquivo do DS só tem seletores do exemplo, do código e das tabelas; o chrome não tem nenhum deles', () => {
    const outsideDs = collectSelectors(dsCss).filter((s) => !dsClass.test(s) && s !== '.uaiui-docs');
    expect(outsideDs).toEqual([]);
    const insideChrome = collectSelectors(chromeCss).filter((s) => dsClass.test(s));
    expect(insideChrome).toEqual([]);
  });

  it('DS: nenhum token semântico do site (--surface-*, --text-*, --border-*, --icon-*, --button-*, --tag-*, --shadow-*)', () => {
    const forbidden = [...usedVars(dsCss)].filter((name) => siteSemanticVars.includes(name));
    expect(forbidden).toEqual([]);
  });

  it('chrome: pode usar tokens semânticos do site (a densidade usa) e os do wrapper, mas nenhum primitivo de cor', () => {
    const used = usedVars(chromeCss);
    expect([...used].filter((name) => colorPrimitiveVars.includes(name))).toEqual([]);
    expect([...used].some((name) => siteSemanticVars.includes(name))).toBe(true);
    expect([...used].some((name) => wrapperVars.has(name))).toBe(true);
  });

  it('as cores dos dois arquivos resolvem: só tokens do site, do wrapper ou declarados no próprio arquivo', () => {
    for (const [zone, text] of Object.entries(zones)) {
      const allowed = new Set([...declaredVars(read('../tokens/semantics.css')), ...declaredVars(read('../tokens/primitives.css')), ...declaredVars(read('../tokens/typography.css')), ...declaredVars(read('../tokens/fonts.css')), ...wrapperVars, ...declaredVars(text)]);
      expect([...usedVars(text)].filter((name) => !allowed.has(name)), zone).toEqual([]);
    }
  });

  it('DS: sombras na escala do DS (só --shadow-offset-layout e --ui-shadow-color, sem px fixo)', () => {
    const shadows = collectDeclarations(dsCss).filter((d) => d.prop === 'box-shadow' || d.prop.endsWith('-shadow'));
    expect(shadows.length).toBeGreaterThan(0);
    for (const { value } of shadows) {
      if (value === 'none' || value === 'var(--uaiui-docs-layout-shadow)') continue;
      expect(value).toBe('var(--shadow-offset-layout) var(--shadow-offset-layout) 0 0 var(--ui-shadow-color)');
    }
  });

  it('chrome: sombras do DS (--shadow-offset-layout) ou semânticas do site (--shadow-comp-*, --shadow-layout-*), sem px fixo', () => {
    const shadows = collectDeclarations(chromeCss).filter((d) => d.prop === 'box-shadow' || d.prop.endsWith('-shadow'));
    expect(shadows.length).toBeGreaterThan(0);
    for (const { value } of shadows) {
      if (value === 'none' || value === 'var(--uaiui-docs-layout-shadow)' || /^var\(--shadow-(comp|layout)-[\w-]+\)$/.test(value)) continue;
      expect(value).toBe('var(--shadow-offset-layout) var(--shadow-offset-layout) 0 0 var(--ui-shadow-color)');
    }
  });

  it('a densidade (chrome) usa os tokens do site do botão ghost: texto, hover e sublinhado', () => {
    expect(chromeCss).toMatch(/\.uaiui-docs__segment-text \{[^}]*color: var\(--text-label-primary\);/);
    expect(chromeCss).toMatch(/background-color: var\(--button-bg-primary-outline-hovered\);/);
    expect(chromeCss).toMatch(/\.uaiui-docs__segment:has\(\.uaiui-docs__segment-input:checked\) \{\s*border-bottom-color: var\(--border-accent-subtle\);/);
    expect(chromeCss).toMatch(/color: var\(--text-label-accent\);/);
  });

  it('a densidade em forced-colors: as bordas transparentes voltam a Canvas e a opção marcada usa Highlight', () => {
    const block = chromeCss.slice(chromeCss.lastIndexOf('@media (forced-colors: active)'));
    expect(block).toMatch(/\.uaiui-docs__segment-text \{\s*border-color: Canvas;/);
    expect(block).toMatch(/border-bottom-color: Highlight;/);
    expect(block).toMatch(/color: Highlight;/);
  });
});

describe('o CSS do DS só entra nas páginas do UaiUI', () => {
  // Únicos arquivos que podem importar o pacote do DS ou o CSS do shell e da fonte de código.
  const allowed = ['layouts/UaiuiDocsLayout.astro', 'pages/projetos/uaiui/'];

  function collect(dir: string, files: string[] = []) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) collect(path, files);
      else if (/\.(astro|ts|js|css)$/.test(entry.name) && !/\.test\.ts$/.test(entry.name)) files.push(path);
    }
    return files;
  }

  // Qualquer import do pacote: `import 'uaiui-ds/...'`, `import css from 'uaiui-ds/...?raw'` e `@import`.
  const importsDs = /(?:import|from)\s+['"][^'"]*(?:uaiui-ds|uaiui-docs(?:-ds)?\.css|uaiui-code-font\.css)[^'"]*['"]|@import\s+['"]uaiui-ds/;

  it('só o layout do UaiUI e as páginas dele importam uaiui-ds, uaiui-docs.css, uaiui-docs-ds.css e uaiui-code-font.css (inclusive com ?raw)', () => {
    const importers = collect(srcDir)
      .filter((file) => importsDs.test(readFileSync(file, 'utf-8')))
      .map((file) => file.slice(srcDir.length).replace(/\\/g, '/'));
    expect(importers.length).toBeGreaterThan(0);
    expect(importers.filter((file) => !allowed.some((path) => file.startsWith(path)))).toEqual([]);
  });

  it('os CSS do shell (chrome e DS) e o da fonte de código só são importados pelo UaiuiDocsLayout, e pelos dois', () => {
    const shellCss = /(?:import|from)\s+['"][^'"]*(?:uaiui-docs(?:-ds)?\.css|uaiui-code-font\.css)['"]/;
    const importers = collect(srcDir)
      .filter((file) => shellCss.test(readFileSync(file, 'utf-8')))
      .map((file) => file.slice(srcDir.length).replace(/\\/g, '/'));
    expect(importers).toEqual(['layouts/UaiuiDocsLayout.astro']);
    const layout = readFileSync(join(srcDir, 'layouts/UaiuiDocsLayout.astro'), 'utf-8');
    expect(layout).toMatch(/import '\.\.\/styles\/tools\/uaiui-docs\.css';\s*import '\.\.\/styles\/tools\/uaiui-docs-ds\.css';/);
  });

  it('o teste enxerga os dois jeitos de importar o pacote (sanity check do regex)', () => {
    expect(importsDs.test("import '../styles/tools/uaiui-docs-ds.css';")).toBe(true);
    expect(importsDs.test("import 'uaiui-ds/components/button.css';")).toBe(true);
    expect(importsDs.test("import css from 'uaiui-ds/components/button.css?raw';")).toBe(true);
    expect(importsDs.test("@import 'uaiui-ds/tokens-wrapper.css';")).toBe(true);
    expect(importsDs.test("import { x } from './outra-coisa';")).toBe(false);
  });

  // O CSS de cada componente entra só na página dele (e o do button também na do toast,
  // que usa a ação e o fechar do button): Introdução, Tokens e o layout não pesam com ele.
  const componentCssImports = (file: string) =>
    // Só linhas de import de verdade: a página de Tokens cita esses caminhos num exemplo de código.
    [...readFileSync(file, 'utf-8').matchAll(/^import\s+(?:\w+\s+from\s+)?['"]uaiui-ds\/components\/(\w+)\.css(\?raw)?['"]/gm)].map((m) => m[1] + (m[2] ?? ''));
  const pageDir = join(srcDir, 'pages/projetos/uaiui');

  it('cada página de componente importa o CSS dele (para estilizar e com ?raw para o código) e só o necessário', () => {
    const expected: Record<string, string[]> = {
      'accordion.astro': ['accordion', 'accordion?raw'],
      'button.astro': ['button', 'button?raw'],
      'toast.astro': ['button', 'toast', 'toast?raw'],
    };
    for (const [file, css] of Object.entries(expected)) {
      expect(componentCssImports(join(pageDir, 'componentes', file)).sort(), file).toEqual([...css].sort());
    }
  });

  it('nenhuma outra página nem o layout importa CSS de componente', () => {
    const others = [join(srcDir, 'layouts/UaiuiDocsLayout.astro'), join(pageDir, 'index.astro'), join(pageDir, 'tokens.astro')];
    for (const file of others) expect(componentCssImports(file), file).toEqual([]);
  });

  it('o BaseLayout (todas as páginas) não importa nada do UaiUI', () => {
    expect(readFileSync(join(srcDir, 'layouts/BaseLayout.astro'), 'utf-8')).not.toMatch(/uaiui/i);
  });
});
