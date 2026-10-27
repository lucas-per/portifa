import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf-8');
const styleOf = (file: string) => file.slice(file.indexOf('<style>'));

const hero = styleOf(read('./Hero.astro'));
const skills = styleOf(read('./SkillsExpertise.astro'));
const about = styleOf(read('./AboutMe.astro'));
const layout = styleOf(read('../../layouts/BaseLayout.astro'));
const typography = read('../../styles/tokens/typography.css');

/** O corpo do bloco `{ ... }` que abre em `start` (conta as chaves aninhadas). */
function block(css: string, start: string) {
  const from = css.indexOf(start);
  expect(from, `${start} não encontrado`).toBeGreaterThan(-1);
  const open = css.indexOf('{', from);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error(`${start} sem fechamento`);
}

describe('quebra de palavra a texto ampliado (break-word, nunca anywhere)', () => {
  it('corpo e listas dentro de <main> quebram a palavra que não cabe, com especificidade de seletor de tipo', () => {
    const rule = block(layout, ':global(main :where(p, li, figcaption, dd, dt))');
    expect(rule).toMatch(/overflow-wrap: break-word;/);
  });

  it('as classes de título continuam com break-word (anywhere mudava 24 de 224 configurações a 100%)', () => {
    for (const cls of ['.text-title-display {', '.text-title-h2 {', '.text-title-h3 {', '.text-title-h4 {']) {
      expect(block(typography, cls)).toMatch(/overflow-wrap: break-word;/);
    }
    expect(typography).not.toMatch(/overflow-wrap: anywhere/);
    expect(layout).not.toMatch(/overflow-wrap: anywhere/);
  });
});

describe('Hero a texto ampliado', () => {
  it('o título não passa da largura da linha', () => {
    expect(block(hero, '.hero__title {')).toMatch(/max-width: 100%;/);
  });

  it('a partir de 960px o avatar desce quando a palavra mais longa não cabe ao lado dele', () => {
    const wide = block(hero, '@media (min-width: 960px)');
    expect(block(wide, '.hero__headline {')).toMatch(/flex-wrap: wrap;/);
    const title = block(wide, '.hero__title {');
    expect(title).toMatch(/flex-basis: min-content;/);
    expect(title).toMatch(/min-width: 0;/);
  });

  it('abaixo de 960px o título e o avatar continuam em coluna (ponto de 959px intacto)', () => {
    expect(block(block(hero, '@media (max-width: 959px)'), '.hero__headline {')).toMatch(/flex-direction: column;/);
  });
});

describe('Skills a texto ampliado', () => {
  it('a linha de 4 colunas só quebra a partir de 1240px (antes disso o wrap mudava o layout a 100%)', () => {
    expect(block(skills, '.skills__grid {')).not.toMatch(/flex-wrap/);
    expect(block(block(skills, '@media (min-width: 1240px)'), '.skills__grid {')).toMatch(/flex-wrap: wrap;/);
    expect(skills.match(/@media \(min-width: 1240px\)/g)).toHaveLength(1);
  });

  it('o grid de 2 colunas abaixo de 1152px não mudou', () => {
    const grid = block(block(skills, '@media (max-width: 1151px)'), '.skills__grid {');
    expect(grid).toMatch(/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  });
});

describe('Sobre mim a texto ampliado', () => {
  it('o título acompanha a coluna do Skills e pode encolher até a palavra mais longa', () => {
    expect(block(about, '.about-me__title {')).toMatch(/flex: 0 1 var\(--grid-col-4-width\);/);
  });

  it('o texto ocupa o resto da linha, com piso de 20rem que nunca passa da linha', () => {
    const text = block(about, '.about-me__text {');
    expect(text).toMatch(/flex: 1 1 0;/);
    expect(text).toMatch(/min-width: min\(100%, 20rem\);/);
    expect(text).toMatch(/max-width: 1024px;/);
  });

  it('a partir de 768px a linha quebra (texto embaixo do título) quando título + gap + piso não cabem', () => {
    const row = block(block(about, '@media (min-width: 768px)'), '.about-me__inner {');
    expect(row).toMatch(/flex-direction: row;/);
    expect(row).toMatch(/flex-wrap: wrap;/);
  });
});
