// src/styles/tokens/fonts.test.ts
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const cssPath = fileURLToPath(new URL('./fonts.css', import.meta.url));
const css = readFileSync(cssPath, 'utf-8');

const fontFiles = [
  '../../assets/fonts/plus-jakarta-sans-variable.woff2',
  '../../assets/fonts/dm-sans-variable.woff2',
  '../../assets/fonts/jetbrains-mono-700.woff2',
];

describe('fonts.css', () => {
  it('declara as 3 famílias com font-display', () => {
    const blocks = css.match(/@font-face\s*\{[^}]*\}/g) ?? [];
    expect(blocks.length).toBeGreaterThanOrEqual(3);
    for (const block of blocks) {
      expect(block).toMatch(/font-display:\s*(swap|optional);/);
    }
  });

  it('usa font-display: optional na fonte de título (evita reflow visível em h1/h2)', () => {
    const titleBlock = css.match(/@font-face\s*\{[^}]*Plus Jakarta Sans[^}]*\}/)?.[0];
    expect(titleBlock).toBeDefined();
    expect(titleBlock).toMatch(/font-display:\s*optional;/);
  });

  it('define as custom properties de família usadas por typography.css', () => {
    expect(css).toMatch(/--font-family-title:\s*['"]Plus Jakarta Sans['"]/);
    expect(css).toMatch(/--font-family-body:\s*['"]DM Sans['"]/);
    expect(css).toMatch(/--font-family-label:\s*['"]JetBrains Mono['"]/);
  });

  it('todos os arquivos de fonte referenciados existem e não estão vazios', () => {
    for (const relativePath of fontFiles) {
      const fullPath = fileURLToPath(new URL(relativePath, import.meta.url));
      expect(existsSync(fullPath), `arquivo não encontrado: ${relativePath}`).toBe(true);
      expect(statSync(fullPath).size).toBeGreaterThan(0);
    }
  });
});
