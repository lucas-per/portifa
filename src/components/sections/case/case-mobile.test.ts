import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (name: string) => {
  const file = readFileSync(new URL(`./${name}`, import.meta.url), 'utf-8');
  return file.slice(file.indexOf('<style>'));
};

const topics = read('CaseDiscoveryTopics.astro');
const flows = read('CaseDeliveryFlows.astro');

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

describe('case Jornada abaixo de 360px (card de consolidação)', () => {
  it('o card tem 24px de padding por padrão e 20px (--scale-x5) só abaixo de 360px', () => {
    expect(block(topics, '.case-discovery-topics__consolidation {')).toMatch(/padding: var\(--scale-x6\);/);
    const narrow = block(topics, '@media (max-width: 359px)');
    expect(narrow).toMatch(/\.case-discovery-topics__consolidation \{\s*padding: var\(--scale-x5\);\s*\}/);
  });

  it('o ponto de 359px muda só o card (nenhuma outra regra, nenhum valor em px solto)', () => {
    const narrow = block(topics, '@media (max-width: 359px)');
    expect(narrow.match(/\{/g)).toHaveLength(1);
    expect(narrow).not.toMatch(/\d+px/);
    expect(topics.match(/max-width: 359px/g)).toHaveLength(1);
    expect(flows).not.toMatch(/max-width: 359px/);
  });
});

describe('imagens do case Jornada (a borda de 2px não soma à largura)', () => {
  it('no mobile (até 767px) as imagens dos tópicos e dos fluxos são border-box', () => {
    const mobileTopics = block(topics, '@media (max-width: 767px)');
    const mobileFlows = block(flows, '@media (max-width: 767px)');
    expect(block(mobileTopics, '.case-discovery-topics__figure :global(img) {')).toMatch(/box-sizing: border-box;/);
    expect(block(mobileFlows, '.case-delivery-flows__images :global(img) {')).toMatch(/box-sizing: border-box;/);
  });

  it('a partir de 768px nada muda: a regra base das imagens não tem box-sizing', () => {
    expect(block(topics, '.case-discovery-topics__figure :global(img) {')).not.toMatch(/box-sizing/);
    expect(block(flows, '.case-delivery-flows__images :global(img) {')).not.toMatch(/box-sizing/);
  });

  it('a borda de 2px e a largura de 100% continuam (a proporção vem do height: auto)', () => {
    for (const rule of [
      block(topics, '.case-discovery-topics__figure :global(img) {'),
      block(flows, '.case-delivery-flows__images :global(img) {'),
    ]) {
      expect(rule).toMatch(/width: 100%;/);
      expect(rule).toMatch(/height: auto;/);
      expect(rule).toMatch(/border: 2px solid var\(--tag-border-subtle\);/);
    }
  });
});
