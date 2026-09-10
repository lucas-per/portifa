import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

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
  });

  for (const file of files) {
    const relative = file.slice(srcDir.length).replace(/\\/g, '/');
    it(`${relative} não referencia var(--token) indefinido`, () => {
      const content = readFileSync(file, 'utf-8');
      const used = collectUsedVars(content);
      const undeclared = [...used].filter((name) => !declared.has(name));
      expect(undeclared, `token(s) indefinido(s): ${undeclared.map((n) => `--${n}`).join(', ')}`).toEqual([]);
    });
  }
});
