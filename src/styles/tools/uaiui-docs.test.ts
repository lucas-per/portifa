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
    // Os nomes dos tokens (var(--surface-bg-off-white-primary)) não contam como nome de cor.
    expect(colorProps.filter((d) => named.test(d.value.replace(/var\([^)]*\)/g, '')))).toEqual([]);
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
      if (value === 'none' || value === 'var(--uaiui-docs-layout-shadow)' || value === 'var(--uaiui-docs-pager-shadow-hover)' || /^var\(--shadow-(comp|layout)-[\w-]+\)$/.test(value)) continue;
      expect(value).toBe('var(--shadow-offset-layout) var(--shadow-offset-layout) 0 0 var(--ui-shadow-color)');
    }
  });

  it('a densidade (chrome) usa os tokens do site do botão ghost: texto, hover e sublinhado', () => {
    expect(chromeCss).toMatch(/\.uaiui-docs__segment-text \{[^}]*color: var\(--text-label-primary\);/);
    expect(chromeCss).toMatch(/__segment:not\(:has\(\.uaiui-docs__segment-input:checked\)\):hover \.uaiui-docs__segment-text \{\s*border-color: var\(--button-border-accent-medium\);\s*background-color: var\(--surface-bg-accent-medium\);/);
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

/** Corpo da primeira regra com este seletor (até a primeira chave que fecha). */
const block = (text: string, selector: string) => {
  const start = text.indexOf(`${selector} {`);
  expect(start, selector).toBeGreaterThanOrEqual(0);
  return text.slice(start, text.indexOf('}', start));
};
const forced = chromeCss.slice(chromeCss.lastIndexOf('@media (forced-colors: active)'));

describe('shell da documentação (PR O2, Figma 666:17)', () => {
  const layout = read('../../layouts/UaiuiDocsLayout.astro');
  const sidebar = read('../../components/uaiui/DocsSidebar.astro');
  const script = read('../../components/uaiui/docs.ts');
  it('cabeçalho da área: "UaiUI design system" e o subtítulo novo, sem busca e sem densidade', () => {
    expect(layout).toMatch(/<p class="uaiui-docs__brand">UaiUI design system<\/p>/);
    expect(layout).toContain('Meu sistema de design multitema e agnóstico para projetos pessoais, estudos e em breve disponível no GitHub.');
    expect(layout).not.toMatch(/data-search-open|DocsDensity|uaiui-docs__tools/);
    expect(layout).toMatch(/<div class="uaiui-docs__top-divider"><\/div>/);
  });

  it('o título da página termina em "· UaiUI DS"', () => {
    expect(layout).toMatch(/title=\{`\$\{current\.title\} · UaiUI DS`\}/);
  });

  it('o menu: aria-label "Documentação do UaiUI DS", busca como primeiro item, com aria-keyshortcuts, e o <kbd> oculto', () => {
    expect(sidebar).toContain('aria-label="Documentação do UaiUI DS"');
    const nav = sidebar.slice(sidebar.indexOf('<nav id={listId}'));
    expect(nav.indexOf('data-search-open')).toBeGreaterThan(-1);
    expect(nav.indexOf('data-search-open')).toBeLessThan(nav.indexOf('uaiui-docs__group'));
    expect(sidebar.match(/aria-keyshortcuts="Control\+K Meta\+K"/g)).toHaveLength(2);
    expect(nav).toMatch(/<kbd class="uaiui-docs__kbd" hidden>Ctrl K<\/kbd>/);
    expect(script).toMatch(/event\.ctrlKey \|\| event\.metaKey/);
  });

  it('a busca não aparece em dois lugares: o campo do menu só a partir de 768px, a lupa só abaixo disso', () => {
    expect(block(chromeCss, '.uaiui-docs .uaiui-docs__search-open--full')).toMatch(/display: none;/);
    const tablet = chromeCss.slice(chromeCss.indexOf('@media (min-width: 768px)'));
    expect(tablet).toMatch(/\.uaiui-docs__search-open--full \{\s*display: inline-flex;/);
    expect(tablet).toMatch(/\.uaiui-docs__search-open--icon,\s*\.uaiui-docs \.uaiui-docs__pages-row \{\s*display: none;/);
  });

  it('o "Nesta página" saiu: sem nav, script, CSS nem grade de três colunas', () => {
    expect(layout).not.toMatch(/toc|Nesta página/);
    expect(script).not.toMatch(/data-toc|Nesta página|IntersectionObserver/);
    expect(chromeCss).not.toMatch(/__toc|Nesta página|min-width: 1280px/);
    expect(chromeCss).not.toMatch(/728px|200px/);
  });

  it('os ids dos h2 continuam (âncoras #id) e o aviso role="status" também', () => {
    expect(layout).toMatch(/id="uaiui-docs-live"[^>]*role="status"/);
    for (const page of ['index', 'tokens', 'componentes/accordion', 'componentes/button', 'componentes/toast']) {
      expect(read(`../../pages/projetos/uaiui/${page}.astro`), page).toMatch(/<h2 id="[\w-]+">/);
    }
  });

  it('grade: menu de 288px (tablet) e 360px (1184px+), conteúdo até a borda direita, linha vertical de 3px', () => {
    expect(chromeCss).toMatch(/grid-template-columns: 0 288px minmax\(0, 1fr\);/);
    expect(chromeCss).toMatch(/grid-template-columns: max\(0px, calc\(\(100% - 1440px\) \/ 2\)\) 360px minmax\(0, 1fr\);/);
    expect(block(chromeCss, '.uaiui-docs .uaiui-docs__nav::after')).toMatch(/width: 3px;[\s\S]*background-color: var\(--surface-bg-accent-strong\);/);
    expect(block(chromeCss, '.uaiui-docs .uaiui-docs__content')).toMatch(/background-color: var\(--surface-bg-neutral-subtle\);/);
    expect(block(chromeCss, '.uaiui-docs .uaiui-docs__content')).not.toMatch(/max-width/);
  });

  it('divisores: 156×3 no h2::before, na borda esquerda da coluna do conteúdo; o de baixo do cabeçalho, de largura total', () => {
    const before = block(chromeCss, '.uaiui-docs .uaiui-docs__body > h2::before');
    expect(before).toMatch(/width: 156px;\s*height: 3px;/);
    expect(before).toMatch(/margin: 0 0 var\(--scale-x10\) calc\(-1 \* var\(--uaiui-docs-inset\)\);/);
    expect(before).toMatch(/background-color: var\(--surface-bg-accent-strong\);/);
    expect(chromeCss).not.toMatch(/border-top: var\(--border-width-default\) solid var\(--ui-border-divider\)/);
    expect(block(chromeCss, '.uaiui-docs .uaiui-docs__top-divider')).toMatch(/height: 3px;\s*background-color: var\(--surface-bg-accent-strong\);/);
  });

  it('forced-colors: os quatro fundos decorativos usam cor de sistema, e o indicador do item é uma borda', () => {
    expect(forced).toMatch(/\.uaiui-docs__top-divider,\s*\.uaiui-docs \.uaiui-docs__nav::after,\s*\.uaiui-docs \.uaiui-docs__body > h2::before \{\s*forced-color-adjust: none;\s*background-color: CanvasText;/);
    expect(block(chromeCss, ".uaiui-docs .uaiui-docs__nav-link[aria-current='page']")).toMatch(/border-left: 3px solid var\(--border-accent-subtle\);/);
    expect(forced).toMatch(/\.uaiui-docs__nav-link\[aria-current='page'\] \{\s*forced-color-adjust: none;\s*border-left-color: Highlight;/);
    expect(forced).toMatch(/\.uaiui-docs__nav-text \{\s*border-color: Canvas;/);
  });

  it('menu: itens em JetBrains Mono Bold 16 maiúsculas (--text-label-primary); o ativo em blue/6, sem hover próprio; hover blue-2 só com mouse', () => {
    const text = block(chromeCss, '.uaiui-docs .uaiui-docs__nav-text');
    expect(text).toMatch(/font-family: var\(--font-family-label\);[\s\S]*font-weight: var\(--weight-700\);[\s\S]*font-size: var\(--scale-x4\);[\s\S]*text-transform: uppercase;/);
    expect(block(chromeCss, '.uaiui-docs .uaiui-docs__nav-link')).toMatch(/color: var\(--text-label-primary\);/);
    expect(block(chromeCss, ".uaiui-docs .uaiui-docs__nav-link[aria-current='page']")).toMatch(/color: var\(--text-body-accent-strong\);/);
    expect(chromeCss).toMatch(/@media \(hover: hover\) \{\s*\.uaiui-docs \.uaiui-docs__nav-link:not\(\[aria-current='page'\]\):hover \.uaiui-docs__nav-text \{\s*border-color: var\(--button-border-accent-medium\);\s*background-color: var\(--surface-bg-accent-medium\);/);
  });

  it('tag "novo": a secondary outlined do site', () => {
    const badge = block(chromeCss, '.uaiui-docs .uaiui-docs__badge');
    expect(badge).toMatch(/border: var\(--border-width-default\) solid var\(--tag-border-subtle\);/);
    expect(badge).toMatch(/background-color: var\(--tag-bg-secondary\);/);
    expect(badge).toMatch(/color: var\(--text-label-extra-1\);/);
  });

  it('paginação: borda accent, sombra de 5px do site, rótulo e título em blue/6, hover accent/subtle e movimento dos botões só com mouse', () => {
    const link = block(chromeCss, '.uaiui-docs .uaiui-docs__pager-link');
    expect(link).toMatch(/border: var\(--border-width-default\) solid var\(--border-accent-subtle\);/);
    expect(link).toMatch(/background-color: var\(--surface-bg-off-white-primary\);/);
    expect(link).toMatch(/box-shadow: var\(--shadow-layout-accent\);/);
    expect(block(chromeCss, '.uaiui-docs .uaiui-docs__pager-kicker')).toMatch(/color: var\(--text-body-accent-strong\);/);
    expect(block(chromeCss, '.uaiui-docs .uaiui-docs__pager-title')).toMatch(/color: var\(--text-body-accent-strong\);/);
    expect(chromeCss).toMatch(/@media \(hover: hover\) \{\s*\.uaiui-docs \.uaiui-docs__pager-link:hover \{\s*background-color: var\(--surface-bg-accent-subtle\);/);
    expect(chromeCss).toMatch(/@media \(hover: hover\) \{\s*\.uaiui-docs \.uaiui-docs__pager-link:hover \{[^}]*box-shadow: var\(--uaiui-docs-pager-shadow-hover\);\s*transform: translate\(-2px, -2px\);/);
    expect(chromeCss).toMatch(/--uaiui-docs-pager-shadow-hover: 7px 7px 0 0 var\(--border-accent-strong\);/);
    expect(chromeCss).toMatch(/\.uaiui-docs__pager-link:active \{\s*box-shadow: none;\s*transform: translate\(1px, 1px\);/);
    expect(chromeCss).toMatch(/@media \(prefers-reduced-motion: no-preference\) \{\s*\.uaiui-docs \.uaiui-docs__pager-link \{\s*transition: transform var\(--motion-duration-press\) ease, box-shadow var\(--motion-duration-press\) ease;/);
    expect(chromeCss).toMatch(/\.uaiui-docs__pager-link \{\s*width: 240px;\s*max-width: 100%;/);
  });

  it('âncoras: até 887px (cabeçalho mobile, sticky) o h2 (com o divisor) não fica sob o cabeçalho do site', () => {
    expect(chromeCss).toMatch(/@media \(max-width: 887px\) \{\s*\.uaiui-docs \.uaiui-docs__body > h2 \{\s*scroll-margin-top: calc\(var\(--header-mobile-height\) \+ var\(--scale-x2\)\);/);
  });
});

describe('conteúdo das páginas (PR O3, Figma 666:17)', () => {
  const pages = ['index', 'tokens', 'componentes/accordion', 'componentes/button', 'componentes/toast'];
  const page = (name: string) => read(`../../pages/projetos/uaiui/${name}.astro`);
  const sidebar = read('../../components/uaiui/DocsSidebar.astro');

  it('callouts: "Quando usar" é --use e "Quando não usar" é --avoid, por modificador; os dois da Introdução e de Tokens ficam neutros', () => {
    for (const name of ['componentes/accordion', 'componentes/button', 'componentes/toast']) {
      const source = page(name);
      expect(source, name).toMatch(/class="uaiui-docs__callout uaiui-docs__callout--use"><p><strong>Quando usar\./);
      expect(source, name).toMatch(/class="uaiui-docs__callout uaiui-docs__callout--avoid"><p><strong>Quando não usar\./);
    }
    for (const name of ['index', 'tokens']) {
      expect(page(name), name).toMatch(/<div class="uaiui-docs__callout"><p>/);
      expect(page(name), name).not.toMatch(/callout--/);
    }
    // Todo callout de uma página tem um destes três rótulos: nenhum sem classe de significado.
    for (const name of pages) {
      for (const match of page(name).matchAll(/class="(uaiui-docs__callout[^"]*)"><p>(<strong>[^<]*<\/strong>)?/g)) {
        const [, cls, label] = match;
        if (label === '<strong>Quando usar.</strong>') expect(cls).toContain('--use');
        else if (label === '<strong>Quando não usar.</strong>') expect(cls).toContain('--avoid');
        else expect(cls).toBe('uaiui-docs__callout');
      }
    }
  });

  it('callouts: borda de 2px com 8px à esquerda em --border-neutral-strong; verde (quaternary/subtle), rosa (tertiary/subtle) e neutro (--ui-bg-panel)', () => {
    const base = block(chromeCss, '.uaiui-docs .uaiui-docs__callout');
    expect(base).toMatch(/border: var\(--border-width-default\) solid var\(--border-neutral-strong\);\s*border-left-width: var\(--scale-x2\);/);
    expect(base).toMatch(/background-color: var\(--ui-bg-panel\);/);
    expect(base).toMatch(/color: var\(--text-body-neutral-strong\);/);
    expect(block(chromeCss, '.uaiui-docs .uaiui-docs__callout--use')).toMatch(/background-color: var\(--surface-bg-quaternary-subtle\);/);
    expect(block(chromeCss, '.uaiui-docs .uaiui-docs__callout--avoid')).toMatch(/background-color: var\(--surface-bg-tertiary-subtle\);/);
  });

  it('forced-colors: a borda dos callouts (2px e 8px) fica em cor de sistema; o rótulo em texto leva o significado', () => {
    expect(forced).toMatch(/\.uaiui-docs__callout \{\s*border-color: CanvasText;/);
  });

  it('tabela: borda externa de 2px, cabeçalho com borda forte embaixo, linhas pela borda de campo, colunas fluidas, código sem espaçamento entre letras', () => {
    expect(block(dsCss, '.uaiui-docs .uaiui-docs__table-wrap')).toMatch(/overflow-x: auto;\s*border: var\(--border-width-default\) solid var\(--ui-border-strong\);/);
    expect(block(dsCss, '.uaiui-docs .uaiui-docs__table th,\n.uaiui-docs .uaiui-docs__table td')).toMatch(/border-bottom: var\(--border-width-default\) solid var\(--ui-border-field\);/);
    expect(block(dsCss, '.uaiui-docs .uaiui-docs__table th')).toMatch(/border-bottom-color: var\(--ui-border-strong\);\s*background-color: var\(--ui-bg-panel\);/);
    expect(block(dsCss, '.uaiui-docs .uaiui-docs__table tr:last-child td')).toMatch(/border-bottom: 0;/);
    expect(block(dsCss, '.uaiui-docs .uaiui-docs__table code')).toMatch(/letter-spacing: 0;/);
    // Sem larguras fixas nem percentuais nas colunas (o Figma tem 128/261/100/451).
    expect(dsCss).not.toMatch(/th:nth-child\(\d\)/);
    expect(block(dsCss, '.uaiui-docs .uaiui-docs__table--props')).not.toMatch(/(^|[\s;])width:/);
    expect(block(dsCss, '.uaiui-docs .uaiui-docs__table th')).not.toMatch(/(^|[\s;])width:/);
    expect(dsCss).not.toMatch(/table-layout: fixed/);
  });

  it('tabela: continua rolável e com foco (região com tabindex e rótulo) nas duas tabelas', () => {
    expect(read('../../components/uaiui/PropsTable.astro')).toMatch(/class="uaiui-docs__table-wrap" tabindex="0" role="region" aria-label=/);
    expect(page('tokens')).toMatch(/class="uaiui-docs__table-wrap" tabindex="0" role="region" aria-label="Camadas de tokens"/);
  });

  it('ritmo: 40px acima e abaixo do divisor, 24px do título ao primeiro bloco, 16px entre blocos; título da página a 24px do exemplo e a 40px do divisor', () => {
    const h2 = block(chromeCss, '.uaiui-docs .uaiui-docs__body > h2');
    expect(h2).toMatch(/margin-top: var\(--scale-x6\);\s*margin-bottom: var\(--scale-x2\);/);
    expect(block(chromeCss, '.uaiui-docs .uaiui-docs__body')).toMatch(/gap: var\(--scale-x4\);/);
    expect(block(chromeCss, '.uaiui-docs .uaiui-docs__body > h2:first-child')).toMatch(/margin-top: var\(--scale-x4\);/);
    expect(block(chromeCss, '.uaiui-docs .uaiui-docs__content')).toMatch(/gap: var\(--scale-x6\);/);
    expect(block(chromeCss, '.uaiui-docs .uaiui-docs__pager')).toMatch(/margin-top: var\(--scale-x4\);/);
    expect(block(chromeCss, '.uaiui-docs .uaiui-docs__pager')).not.toMatch(/padding-top/);
  });

  it('padding-bottom do conteúdo: 64px no celular e 88px (--scale-x20) a partir de 768px', () => {
    expect(block(chromeCss, '.uaiui-docs .uaiui-docs__content')).toMatch(/padding: var\(--scale-x8\) var\(--uaiui-docs-gutter\) var\(--scale-x16\) var\(--uaiui-docs-inset\);/);
    const tablet = chromeCss.slice(chromeCss.indexOf('@media (min-width: 768px)'));
    expect(tablet).toMatch(/\.uaiui-docs__content \{\s*grid-column: 3;\s*padding-top: var\(--scale-x10\);\s*padding-bottom: var\(--scale-x20\);/);
  });

  it('h3 dos exemplos: o estilo do h2 em escala menor (20px no celular, 24px a partir de 768px)', () => {
    const h3 = block(chromeCss, '.uaiui-docs .uaiui-docs__body h3');
    expect(h3).toMatch(/color: var\(--text-body-primary-strong\);\s*font-family: var\(--font-family-title\);\s*font-weight: var\(--weight-700\);\s*font-size: var\(--scale-x5\);/);
    expect(chromeCss).toMatch(/@media \(min-width: 768px\) \{[\s\S]*\.uaiui-docs \.uaiui-docs__body h3 \{\s*font-size: var\(--scale-x6\);/);
  });

  it('cards da Introdução: o visual dos cartões da paginação; hover só com mouse; nome em DM Sans SemiBold 20 em blue/6', () => {
    const card = block(chromeCss, '.uaiui-docs .uaiui-docs__card');
    expect(card).toMatch(/padding: var\(--scale-x4\);/);
    expect(card).toMatch(/border: var\(--border-width-default\) solid var\(--border-accent-subtle\);/);
    expect(card).toMatch(/background-color: var\(--surface-bg-off-white-primary\);/);
    expect(card).toMatch(/box-shadow: var\(--shadow-layout-accent\);/);
    expect(chromeCss).toMatch(/@media \(hover: hover\) \{\s*\.uaiui-docs \.uaiui-docs__card:hover \{\s*background-color: var\(--surface-bg-accent-subtle\);/);
    const name = block(chromeCss, '.uaiui-docs .uaiui-docs__body .uaiui-docs__card h3');
    expect(name).toMatch(/color: var\(--text-body-accent-strong\);\s*font-family: var\(--font-family-body\);\s*font-weight: var\(--weight-600\);\s*font-size: var\(--scale-x5\);/);
    expect(block(chromeCss, '.uaiui-docs .uaiui-docs__card p')).toMatch(/color: var\(--text-body-neutral-strong\);\s*font-size: var\(--scale-x4\);/);
  });

  it('busca do menu: texto visível "Buscar" e aria-label "Buscar na documentação" (o nome acessível começa pelo texto visível); a lupa do celular mantém o dela', () => {
    expect(sidebar).toMatch(/uaiui-docs__search-open--full"\s+aria-label="Buscar na documentação"/);
    expect(sidebar).toMatch(/<span class="uaiui-docs__search-text">Buscar<\/span>/);
    expect(sidebar).toMatch(/uaiui-docs__search-open--icon"\s+aria-label="Buscar na documentação"/);
    expect('Buscar na documentação'.startsWith('Buscar')).toBe(true);
  });

  it('a amostra de cores de Tokens e temas não muda de visual', () => {
    expect(block(chromeCss, '.uaiui-docs .uaiui-docs__swatch-color')).toMatch(/width: 72px;\s*height: 40px;\s*border: var\(--border-width-default\) solid var\(--ui-border-strong\);/);
  });
});

describe('contraste do shell, a partir dos primitivos (texto 4,5:1; borda e indicador 3:1)', () => {
  const semantics = read('../tokens/semantics.css');
  const primitives = read('../tokens/primitives.css');

  /** Resolve --token até o oklch() do primitivo. */
  function resolve(name: string): string {
    const source = new RegExp(`--${name}:\\s*([^;]+);`);
    const value = (semantics.match(source) ?? primitives.match(source))?.[1].trim();
    if (!value) throw new Error(`token sem valor: ${name}`);
    const ref = value.match(/^var\(--([\w-]+)\)$/);
    return ref ? resolve(ref[1]) : value;
  }

  function luminance(name: string) {
    const [, l, c, h] = resolve(name).match(/^oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)/)!.map(Number);
    const L = l / 100;
    const a = c * Math.cos((h * Math.PI) / 180);
    const b = c * Math.sin((h * Math.PI) / 180);
    const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const rgb = [
      4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
      -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
      -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
    ].map((v) => Math.min(1, Math.max(0, v)));
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }

  const ratio = (fg: string, bg: string) => {
    const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  const text: Array<[string, string, string]> = [
    ['item do menu', 'text-label-primary', 'surface-bg-off-white-primary'],
    ['item do menu no hover (blue-2)', 'text-label-primary', 'surface-bg-accent-medium'],
    ['item atual do menu (blue/6)', 'text-body-accent-strong', 'surface-bg-off-white-primary'],
    ['rótulo e título da paginação (blue/6)', 'text-body-accent-strong', 'surface-bg-off-white-primary'],
    ['rótulo e título da paginação no hover', 'text-body-accent-strong', 'surface-bg-accent-subtle'],
    ['rótulo de grupo do menu', 'text-body-neutral-subtle', 'surface-bg-off-white-primary'],
    ['busca (texto)', 'text-body-neutral-subtle', 'surface-bg-neutral-subtle'],
    ['busca no hover (blue-2)', 'text-body-neutral-strong', 'surface-bg-accent-medium'],
    ['ícone da busca no hover (blue-2)', 'icon-neutral-3', 'surface-bg-accent-medium'],
    ['tag "novo"', 'text-label-extra-1', 'tag-bg-secondary'],
    ['título da área', 'text-body-primary-strong', 'surface-bg-off-white-primary'],
    ['h1 e h2', 'text-body-primary-strong', 'surface-bg-neutral-subtle'],
    ['subtítulo da área', 'text-body-neutral-strong', 'surface-bg-off-white-primary'],
    ['linha de apoio', 'text-body-neutral-strong', 'surface-bg-neutral-subtle'],
    ['callout "Quando usar" (verde)', 'text-body-neutral-strong', 'surface-bg-quaternary-subtle'],
    ['callout "Quando não usar" (rosa)', 'text-body-neutral-strong', 'surface-bg-tertiary-subtle'],
    ['h3 dos exemplos', 'text-body-primary-strong', 'surface-bg-neutral-subtle'],
    ['nome do card (blue/6)', 'text-body-accent-strong', 'surface-bg-off-white-primary'],
    ['nome do card no hover', 'text-body-accent-strong', 'surface-bg-accent-subtle'],
    ['descrição do card', 'text-body-neutral-strong', 'surface-bg-off-white-primary'],
    ['descrição do card no hover', 'text-body-neutral-strong', 'surface-bg-accent-subtle'],
  ];
  it.each(text)('%s: %s sobre %s, ao menos 4,5:1', (_label, fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  const nonText: Array<[string, string, string]> = [
    ['indicador do item atual', 'border-accent-subtle', 'surface-bg-off-white-primary'],
    ['borda da paginação', 'border-accent-subtle', 'surface-bg-neutral-subtle'],
    ['borda da busca', 'border-neutral-strong', 'surface-bg-off-white-primary'],
    ['borda da tag "novo"', 'tag-border-subtle', 'surface-bg-off-white-primary'],
    ['borda do callout verde', 'border-neutral-strong', 'surface-bg-quaternary-subtle'],
    ['borda do callout rosa', 'border-neutral-strong', 'surface-bg-tertiary-subtle'],
    ['borda do card', 'border-accent-subtle', 'surface-bg-neutral-subtle'],
  ];
  it.each(nonText)('%s: %s sobre %s, ao menos 3:1', (_label, fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(3);
  });

  it('o item atual não muda no hover (blue/5 sobre blue-2 daria 3,19:1, menos de 4,5:1) e os divisores azuis ficam abaixo de 3:1 (decorativos, registrados no design-notes)', () => {
    expect(ratio('text-label-accent', 'surface-bg-accent-medium')).toBeLessThan(4.5);
    expect(ratio('surface-bg-accent-strong', 'surface-bg-off-white-primary')).toBeLessThan(3);
  });
});

describe('contraste da tabela, a partir dos tokens do wrapper (tema claro: texto 4,5:1; bordas 3:1)', () => {
  const wrapper = readFileSync(createRequire(import.meta.url).resolve('uaiui-ds/tokens-wrapper.css'), 'utf-8');
  const light = wrapper.slice(wrapper.indexOf('.uaiui {'), wrapper.indexOf('.uaiui[data-uaiui-theme="dark"]'));

  function hex(name: string): string {
    const value = light.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim();
    if (!value) throw new Error(`token do wrapper sem valor: ${name}`);
    const ref = value.match(/^var\(--([\w-]+)\)$/);
    return ref ? hex(ref[1]) : value;
  }

  function luminance(name: string) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex(name).slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  const ratio = (fg: string, bg: string) => {
    const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  it.each([
    ['texto das células', 'ui-fg-default', 'ui-bg-page'],
    ['texto do cabeçalho', 'ui-fg-default', 'ui-bg-panel'],
  ])('%s: %s sobre %s, ao menos 4,5:1', (_label, fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['linhas (--ui-border-field) sobre a página', 'ui-border-field', 'ui-bg-page'],
    ['borda externa e cabeçalho (--ui-border-strong)', 'ui-border-strong', 'ui-bg-page'],
  ])('%s: ao menos 3:1', (_label, fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(3);
  });
});

describe('chrome a texto ampliado (PR Q): respiro lateral e palco com min() em vw', () => {
  const primitives = read('../tokens/primitives.css');
  const tokenPx = (name: string) => parseFloat(primitives.match(new RegExp(`--${name}:\\s*([\\d.]+)rem`))![1]) * 16;
  const vwOf = (value: string) => parseFloat(value.match(/min\(var\(--[\w-]+\), ([\d.]+)vw\)/)![1]);

  it('o respiro lateral (gutter e recuo) é min(token de 20px, 6,25vw): 20px a 320px, então só atua com texto ampliado', () => {
    const root = block(chromeCss, '.uaiui-docs');
    expect(root).toMatch(/--uaiui-docs-gutter: min\(var\(--scale-x5\), 6\.25vw\);/);
    expect(root).toMatch(/--uaiui-docs-inset: min\(var\(--scale-x5\), 6\.25vw\);/);
    expect((vwOf('min(var(--scale-x5), 6.25vw)') * 320) / 100).toBe(tokenPx('scale-x5'));
  });

  it('a partir de 1184px o respiro continua o token de 88px, sem min()', () => {
    expect(chromeCss).toMatch(/@media \(min-width: 1184px\) \{\s*\.uaiui-docs \{\s*--uaiui-docs-gutter: var\(--scale-x20\);\s*--uaiui-docs-inset: var\(--scale-x12\);/);
  });

  it('o padding lateral do palco no celular é min(token de 16px, 5vw): 16px a 320px; a partir de 768px não muda', () => {
    const stage = block(dsCss, '.uaiui-docs .uaiui-docs__stage');
    expect(stage).toMatch(/padding: var\(--scale-x6\) min\(var\(--scale-x4\), 5vw\) var\(--scale-x8\);/);
    expect((vwOf('min(var(--scale-x4), 5vw)') * 320) / 100).toBe(tokenPx('scale-x4'));
    expect(dsCss).toMatch(/@media \(min-width: 768px\) \{\s*\.uaiui-docs \.uaiui-docs__stage \{\s*padding: var\(--scale-x8\) var\(--scale-x6\) var\(--scale-x12\);/);
  });

  it('nenhum valor em px solto no respiro nem no padding do palco (o limite é em vw)', () => {
    expect(block(chromeCss, '.uaiui-docs')).not.toMatch(/--uaiui-docs-(gutter|inset): [^;]*\d+px/);
    expect(block(dsCss, '.uaiui-docs .uaiui-docs__stage')).not.toMatch(/padding: [^;]*\d+px/);
  });
});
