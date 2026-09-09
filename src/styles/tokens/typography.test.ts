import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = readFileSync(fileURLToPath(new URL('./typography.css', import.meta.url)), 'utf-8');

describe('typography.css', () => {
  it.each([
    ['.text-title-display', 'var(--font-family-title)', 'var(--weight-700)', 'var(--scale-x16)', 'var(--line-height-compact)', 'var(--letter-spacing-compact)'],
    ['.text-title-h2', 'var(--font-family-title)', 'var(--weight-800)', 'var(--scale-x9)', 'var(--line-height-compact)', 'var(--letter-spacing-regular)'],
    ['.text-title-h3', 'var(--font-family-title)', 'var(--weight-800)', 'var(--scale-x8)', 'var(--line-height-compact)', 'var(--letter-spacing-regular)'],
    ['.text-body-md', 'var(--font-family-body)', 'var(--weight-400)', 'var(--scale-x5)', 'var(--line-height-regular)', 'var(--letter-spacing-regular)'],
    ['.text-body-lg-strong', 'var(--font-family-body)', 'var(--weight-600)', 'var(--scale-x6)', 'var(--line-height-regular)', 'var(--letter-spacing-regular)'],
    ['.text-body-sm', 'var(--font-family-body)', 'var(--weight-400)', 'var(--scale-x4)', 'var(--line-height-comfortable)', 'var(--letter-spacing-comfortable)'],
    ['.text-body-caption', 'var(--font-family-body)', 'var(--weight-500)', 'var(--scale-x3)', 'var(--line-height-regular)', 'var(--letter-spacing-comfortable)'],
    ['.text-label-md', 'var(--font-family-label)', 'var(--weight-700)', 'var(--scale-x5)', 'var(--line-height-none)', 'var(--letter-spacing-regular)'],
    ['.text-label-sm', 'var(--font-family-label)', 'var(--weight-700)', 'var(--scale-x4)', 'var(--line-height-none)', 'var(--letter-spacing-regular)'],
  ])('%s usa a família, peso, tamanho, line-height e letter-spacing corretos', (selector, family, weight, size, lineHeight, letterSpacing) => {
    const escapedSelector = selector.replace('.', '\\.');
    const blockMatch = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
    expect(blockMatch, `seletor ${selector} não encontrado`).not.toBeNull();
    const block = blockMatch![1];
    expect(block).toContain(`font-family: ${family}`);
    expect(block).toContain(`font-weight: ${weight}`);
    expect(block).toContain(`font-size: ${size}`);
    expect(block).toContain(`line-height: ${lineHeight}`);
    expect(block).toContain(`letter-spacing: ${letterSpacing}`);
  });

  describe('text-transform em labels e títulos H2', () => {
    it.each(['.text-label-md', '.text-label-sm', '.text-title-h2'])(
      '%s usa uppercase',
      (selector) => {
        const escapedSelector = selector.replace('.', '\\.');
        const blockMatch = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
        expect(blockMatch, `seletor ${selector} não encontrado`).not.toBeNull();
        expect(blockMatch![1]).toContain('text-transform: uppercase');
      }
    );

    it('.text-title-h3 não usa uppercase', () => {
      const blockMatch = css.match(/\.text-title-h3\s*\{([^}]*)\}/);
      expect(blockMatch).not.toBeNull();
      expect(blockMatch![1]).not.toContain('text-transform');
    });
  });
});
