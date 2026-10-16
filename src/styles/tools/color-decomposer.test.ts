import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('./color-decomposer.css', import.meta.url), 'utf-8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

/** Seletores de todas as regras, inclusive as de dentro de @media. */
function collectSelectors(text: string) {
  const selectors: string[] = [];
  let prelude = '';
  let skipDepth = 0; // > 0 dentro do corpo de uma regra comum
  for (const ch of text) {
    if (skipDepth > 0) {
      if (ch === '{') skipDepth += 1;
      if (ch === '}') skipDepth -= 1;
      continue;
    }
    if (ch === '{') {
      const head = prelude.trim();
      prelude = '';
      // @media e afins só agrupam regras: o conteúdo é lido normalmente.
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

describe('CSS do Color Decomposer fica restrito à área da ferramenta', () => {
  const selectors = collectSelectors(css);

  it('encontrou as regras do app (sanity check do próprio teste)', () => {
    expect(selectors.length).toBeGreaterThan(200);
  });

  it('todo seletor começa por .cd', () => {
    const unscoped = selectors.filter((s) => !/^\.cd(?![\w-])/.test(s));
    expect(unscoped).toEqual([]);
  });

  it('não declara fontes: usa as do site (fonts.css)', () => {
    expect(css).not.toMatch(/@font-face/);
  });
});
