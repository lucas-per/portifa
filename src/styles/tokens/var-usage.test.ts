import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';

const srcDir = fileURLToPath(new URL('../../', import.meta.url));
const tokensDir = dirname(fileURLToPath(import.meta.url));

function readTokenFile(name: string) {
  return readFileSync(join(tokensDir, name), 'utf-8');
}

function collectDeclaredVars(css: string) {
  const names = new Set<string>();
  for (const match of css.matchAll(/--([\w-]+):/g)) {
    names.add(match[1]);
  }
  return names;
}

function collectFiles(dir: string, extensions: string[], files: string[] = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(path, extensions, files);
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(path);
    }
  }
  return files;
}

function collectUsedVars(content: string) {
  const names = new Set<string>();
  for (const match of content.matchAll(/var\(\s*--([\w-]+)/g)) {
    names.add(match[1]);
  }
  return names;
}

/**
 * Ferramentas com tema próprio (src/styles/tools/): além dos tokens do site,
 * valem as variáveis declaradas no próprio arquivo (todas sob .cd) e as que o
 * JS da ferramenta define em tempo de execução, listadas aqui.
 */
const toolRuntimeVars: Record<string, string[]> = {
  // components/tools/color-decomposer/main.js: --s e --t (superfície e texto
  // de cada tom), --c (amostras de cor), --track (trilho dos controles) e
  // --on-bg e --on-fg (trilha e polegar do toggle "Texto com tom da cor" ligado).
  'styles/tools/color-decomposer.css': ['s', 't', 'c', 'track', 'on-bg', 'on-fg'],
};

/**
 * Área do UaiUI (/projetos/uaiui/): além dos tokens do site, valem os do
 * wrapper .uaiui do DS (lidos do pacote uaiui-ds, tokens-wrapper.css) e as
 * variáveis locais que o próprio arquivo declara. Fora destes caminhos, os
 * tokens do DS não resolvem (o wrapper só existe nessas páginas).
 */
const uaiuiPaths = [
  'styles/tools/uaiui-docs.css',
  'components/uaiui/',
  'layouts/UaiuiDocsLayout.astro',
  'pages/projetos/uaiui/',
];
const uaiuiWrapperVars = collectDeclaredVars(
  readFileSync(createRequire(import.meta.url).resolve('uaiui-ds/tokens-wrapper.css'), 'utf-8'),
);

describe('todo var(--token) usado em src/ resolve a um token declarado', () => {
  const declared = new Set([
    ...collectDeclaredVars(readTokenFile('primitives.css')),
    ...collectDeclaredVars(readTokenFile('semantics.css')),
    ...collectDeclaredVars(readTokenFile('typography.css')),
    ...collectDeclaredVars(readTokenFile('fonts.css')),
  ]);

  const files = collectFiles(srcDir, ['.astro', '.css']);

  it('encontrou arquivos .astro/.css pra checar (sanity check do próprio teste)', () => {
    expect(files.length).toBeGreaterThan(10);
    expect(uaiuiWrapperVars.has('ui-bg-page')).toBe(true);
  });

  for (const file of files) {
    const relative = file.slice(srcDir.length).replace(/\\/g, '/');
    it(`${relative} não referencia var(--token) indefinido`, () => {
      const content = readFileSync(file, 'utf-8');
      const used = collectUsedVars(content);
      const runtime = toolRuntimeVars[relative];
      const inUaiui = uaiuiPaths.some((path) => relative.startsWith(path));
      const allowed = runtime
        ? new Set([...declared, ...collectDeclaredVars(content), ...runtime])
        : inUaiui
          ? new Set([...declared, ...uaiuiWrapperVars, ...collectDeclaredVars(content)])
          : declared;
      const undeclared = [...used].filter((name) => !allowed.has(name));
      expect(undeclared, `token(s) indefinido(s): ${undeclared.map((n) => `--${n}`).join(', ')}`).toEqual([]);
    });
  }
});
