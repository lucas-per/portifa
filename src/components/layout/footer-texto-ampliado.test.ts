import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const footer = readFileSync(new URL('./Footer.astro', import.meta.url), 'utf-8');
const css = footer.slice(footer.indexOf('<style>'));

/** O corpo do bloco `{ ... }` que abre em `start` (conta as chaves aninhadas). */
function block(source: string, start: string) {
  const from = source.indexOf(start);
  expect(from, `${start} não encontrado`).toBeGreaterThan(-1);
  const open = source.indexOf('{', from);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(open + 1, i);
  }
  throw new Error(`${start} sem fechamento`);
}

describe('rodapé a texto ampliado, de 992px em diante', () => {
  const wide = block(css, '@media (min-width: 992px)');

  it('os botões quebram em linhas só a partir de 992px (971px da linha + 17px de barra = 988px)', () => {
    expect(css.match(/@media \(min-width: 992px\)/g)).toHaveLength(1);
    expect(block(css, '.site-footer__buttons-content {')).not.toMatch(/flex-wrap/);
    const content = block(wide, '.site-footer__buttons-content {');
    expect(content).toMatch(/flex-wrap: wrap;/);
    expect(content).toMatch(/row-gap: var\(--scale-x4\);/);
  });

  it('os divisores fixos das pontas saem do fluxo e viram padding (64px + gap, 88px a 100%)', () => {
    expect(block(wide, '.site-footer__buttons-content {')).toMatch(/padding-inline: calc\(64px \+ var\(--scale-x6\)\);/);
    const fixed = block(wide, '.site-footer__dividers--fixed {');
    expect(fixed).toMatch(/position: absolute;/);
    expect(fixed).toMatch(/width: 64px;/);
  });
});

describe('rodapé a texto ampliado, de 768 a 959px (grade 2×2)', () => {
  const grid = block(css, '@media (min-width: 768px) and (max-width: 959px)');

  it('as colunas podem encolher e o respiro lateral é min(token, 11,5vw)', () => {
    const content = block(grid, '.site-footer__buttons-content {');
    expect(content).toMatch(/grid-template-columns: minmax\(0, auto\) minmax\(0, 1fr\) minmax\(0, auto\);/);
    expect(content).toMatch(/padding: 0 min\(var\(--scale-x20\), 11\.5vw\);/);
  });

  it('o rótulo do botão quebra a palavra que não cabe (o e-mail), sem mudar o DOM', () => {
    expect(block(grid, '.site-footer__buttons-content :global(.button__label) {')).toMatch(/overflow-wrap: anywhere;/);
  });

  it('os pontos de 768, 959 e 960px não mudaram', () => {
    expect(css).toMatch(/@media \(min-width: 768px\) and \(max-width: 959px\)/);
    expect(css).toMatch(/@media \(max-width: 767px\)/);
    expect(css).not.toMatch(/@media[^{]*960px/);
  });
});
