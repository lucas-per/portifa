import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const css = readFileSync(new URL('./uaiui-docs.css', import.meta.url), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');
const srcDir = fileURLToPath(new URL('../../', import.meta.url));

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

describe('CSS do shell do UaiUI fica restrito à área do DS', () => {
  const selectors = collectSelectors(css);

  it('encontrou as regras do shell (sanity check do próprio teste)', () => {
    expect(selectors.length).toBeGreaterThan(80);
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

  it('sombras na escala do DS: só --shadow-offset-layout e --ui-shadow-color, sem px fixo', () => {
    const shadows = collectDeclarations(css).filter((d) => d.prop === 'box-shadow' || d.prop.endsWith('-shadow'));
    expect(shadows.length).toBeGreaterThan(0);
    for (const { value } of shadows) {
      if (value === 'none' || value === 'var(--uaiui-docs-layout-shadow)') continue;
      expect(value).toBe('var(--shadow-offset-layout) var(--shadow-offset-layout) 0 0 var(--ui-shadow-color)');
    }
  });

  it('sem data-uaiui-theme: a área segue o tema claro do site', () => {
    expect(css).not.toMatch(/data-uaiui-theme/);
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

  it('só o layout do UaiUI e as páginas dele importam uaiui-ds, uaiui-docs.css e uaiui-code-font.css', () => {
    const importers = collect(srcDir)
      .filter((file) => /import\s+['"][^'"]*(uaiui-ds|uaiui-docs\.css|uaiui-code-font\.css)['"]|@import\s+['"]uaiui-ds/.test(readFileSync(file, 'utf-8')))
      .map((file) => file.slice(srcDir.length).replace(/\\/g, '/'));
    expect(importers.length).toBeGreaterThan(0);
    expect(importers.filter((file) => !allowed.some((path) => file.startsWith(path)))).toEqual([]);
  });

  it('o BaseLayout (todas as páginas) não importa nada do UaiUI', () => {
    expect(readFileSync(join(srcDir, 'layouts/BaseLayout.astro'), 'utf-8')).not.toMatch(/uaiui/i);
  });
});
