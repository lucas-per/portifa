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

  // Decisões registradas no design-notes.md: os textos de título da ferramenta usam DM Sans (--font-title) e só o título da
  // página, "Ajustes" e "Paletas" usam a Plus Jakarta Sans (--font-heading).
  it('--font-title em DM Sans; --font-heading em Plus Jakarta Sans, só nos três títulos da página', () => {
    const first = (name: string) => css.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].split(',')[0].trim();
    expect(first('--font-title')).toBe('"DM Sans"');
    expect(first('--font-heading')).toBe('"Plus Jakarta Sans"');
    expect(css.match(/Plus Jakarta Sans/g)).toHaveLength(1); // só a declaração (o teste lê o CSS sem comentários)
    const users = [...css.matchAll(/([^{}]*)\{[^{}]*font-family:\s*var\(--font-heading\)/g)].map((m) => m[1].trim());
    expect(users).toEqual(['.cd .brand', '.cd .rail__title', '.cd .stage__label', '.cd .stage__toggle']);
  });

  it('o rodapé da ferramenta saiu', () => {
    expect(css).not.toMatch(/\.cd \.foot/);
  });

  // Botões ghost: no celular o :hover fica preso depois do toque, então só vale em aparelhos com hover.
  it('hover dos botões ghost só dentro de @media (hover: hover)', () => {
    const outside = css.replace(/@media \(hover: hover\) \{[^{}]*\{[^{}]*\}\s*\}/g, '');
    expect(css).toMatch(/@media \(hover: hover\)[^{]*\{\s*\.cd \.btn--quiet:hover \{ color: var\(--muted\); \}/);
    // fora da media query, o hover do ghost só repete a cor base (reset de estado), nunca a troca
    const hoverRules = outside.match(/[^{}]*\.btn--quiet:hover[^{}]*\{[^}]*\}/g) ?? [];
    for (const rule of hoverRules) {
      for (const [, value] of rule.matchAll(/(?<![-\w])color:\s*([^;]+);/g)) expect(value.trim()).toBe('var(--fg)');
    }
  });

  it('botão ghost: sem padding lateral nem fundo, altura tocável de 44 px', () => {
    const rule = css.match(/\.cd \.btn--quiet,[^{]*\{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toMatch(/padding:\s*\.5rem 0;/);
    expect(rule).toMatch(/min-height:\s*var\(--control\)/);
    expect(rule).toMatch(/background:\s*transparent/);
    expect(css).toMatch(/--control:\s*2\.75rem/);
  });

  it('cabeçalho sem divider colorido abaixo do título', () => {
    expect(css).not.toMatch(/\.cd \.top\s*\{[^}]*border/);
    expect(css).not.toMatch(/--band-w/);
  });
});
