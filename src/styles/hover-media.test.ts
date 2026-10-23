import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

/**
 * Regra de hover: todo `:hover` que muda o visual fica dentro de
 * `@media (hover: hover)`. No toque o navegador mantém o `:hover` no último
 * elemento tocado (sombra, deslocamento e cor ficam presos até outro toque), então
 * o hover só vale em aparelhos com mouse. Vale para o `:hover` em qualquer
 * posição do seletor, inclusive dentro de `:not()`, e para os resets que só
 * existem para anular um hover. Ver design-notes.md.
 */
const srcDir = fileURLToPath(new URL('../', import.meta.url));

/**
 * Seletores com `:hover` fora de `@media (hover: hover)` que já existiam quando a
 * regra entrou. A lista só pode encolher: uma entrada que deixa de violar faz o
 * teste falhar até ser removida. Formato: arquivo::seletor.
 */
const KNOWN_EXCEPTIONS: string[] = [];

function collectFiles(dir: string, files: string[] = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(path, files);
    else if (/\.(astro|css)$/.test(entry.name)) files.push(path);
  }
  return files;
}

/** Só o CSS: o arquivo inteiro num .css, os blocos <style> num .astro; sem comentários. */
function cssOf(file: string) {
  const text = readFileSync(file, 'utf-8');
  const css = file.endsWith('.astro')
    ? [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
    : text;
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

const HOVER_MEDIA = /^@media\b[^{]*\(\s*hover\s*:\s*hover\s*\)/;

/** Seletores com `:hover` que não estão dentro de um `@media (hover: hover)` (aninhado ou combinado com `and`). */
function unprotectedHoverSelectors(css: string, guarded = false, out: string[] = []) {
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open === -1) break;
    const prelude = css.slice(i, open).split(/[;}]/).pop()!.trim();
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth += 1;
      else if (css[j] === '}') depth -= 1;
      j += 1;
    }
    const body = css.slice(open + 1, j - 1);
    if (prelude.startsWith('@')) unprotectedHoverSelectors(body, guarded || HOVER_MEDIA.test(prelude), out);
    else if (!guarded) {
      for (const selector of prelude.split(',').map((s) => s.replace(/\s+/g, ' ').trim())) {
        if (/:hover\b/.test(selector)) out.push(selector);
      }
    }
    i = j;
  }
  return out;
}

describe('hover só com mouse', () => {
  const violations = collectFiles(srcDir)
    .sort()
    .flatMap((file) => unprotectedHoverSelectors(cssOf(file)).map((selector) => `${relative(srcDir, file)}::${selector}`));

  it('nenhum :hover fora de @media (hover: hover), além das exceções conhecidas', () => {
    const unexpected = violations.filter((v) => !KNOWN_EXCEPTIONS.includes(v));
    expect(unexpected).toEqual([]);
  });

  it('as exceções conhecidas continuam violando (a lista só encolhe)', () => {
    const stale = KNOWN_EXCEPTIONS.filter((e) => !violations.includes(e));
    expect(stale).toEqual([]);
  });

  describe('o parser', () => {
    it('acusa :hover solto, em grupo, dentro de :not() e dentro de outro @media', () => {
      const css = `
        .a:hover { color: red; }
        .b, .c:hover { color: red; }
        .d:not(:hover) { color: red; }
        @media (min-width: 768px) { .e:hover { color: red; } }
        @media (forced-colors: active) { .f:hover { color: red; } }
      `;
      expect(unprotectedHoverSelectors(css)).toEqual([
        '.a:hover',
        '.c:hover',
        '.d:not(:hover)',
        '.e:hover',
        '.f:hover',
      ]);
    });

    it('aceita :hover dentro de @media (hover: hover), aninhado ou combinado', () => {
      const css = `
        @media (hover: hover) { .a:hover { color: red; } }
        @media (min-width: 768px) { @media (hover: hover) { .b:hover { color: red; } } }
        @media (hover: hover) and (forced-colors: active) { .c:hover { color: red; } }
        @media (forced-colors: active) { @media (hover: hover) { .d:not([x]):hover { color: red; } } }
      `;
      expect(unprotectedHoverSelectors(css)).toEqual([]);
    });

    it('a regra seguinte à media não fica protegida por ela', () => {
      const css = `@media (hover: hover) { .a:hover { color: red; } } .b:hover { color: red; }`;
      expect(unprotectedHoverSelectors(css)).toEqual(['.b:hover']);
    });

    it('ignora comentários e classes que só contêm a palavra hover', () => {
      const css = `.a-hover, .hovered { color: red; } /* .b:hover {} */`.replace(/\/\*[\s\S]*?\*\//g, '');
      expect(unprotectedHoverSelectors(css)).toEqual([]);
    });
  });
});
