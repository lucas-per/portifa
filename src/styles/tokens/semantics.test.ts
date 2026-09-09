import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = readFileSync(fileURLToPath(new URL('./semantics.css', import.meta.url)), 'utf-8');

function expectDeclares(name: string, value: string) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`--${name}:\\s*${escaped}\\s*;`);
  expect(css, `esperava "--${name}: ${value};"`).toMatch(pattern);
}

describe('semantics.css', () => {
  it('só referencia primitivos via var(), nunca valores literais de cor', () => {
    const declarationLines = css
      .split('\n')
      .filter((line) => /^\s*--[\w-]+:/.test(line) && !/^\s*\/\*/.test(line));
    for (const line of declarationLines) {
      if (/box-shadow|font-family/.test(line)) continue; // compostos, checados em outros testes
      expect(line, `linha não usa var(): "${line.trim()}"`).toMatch(/var\(--|:\s*-?\d/);
    }
  });

  it('mapeia superfícies e cores de marca para os primitivos corretos', () => {
    expectDeclares('surface-bg-neutral-strong', 'var(--neutral-800)');
    expectDeclares('surface-bg-off-white-primary', 'var(--yellow-50)');
    expectDeclares('surface-bg-off-white-secondary', 'var(--neutral-25)');
    expectDeclares('surface-bg-off-white-tertiary', 'var(--yellow-200)');
    expectDeclares('surface-bg-neutral-subtle', 'var(--neutral-150)');
    expectDeclares('surface-bg-accent-strong', 'var(--accent-300)');
    expectDeclares('surface-bg-primary-subtle', 'var(--primary-100)');
    expectDeclares('surface-bg-complementary-subtle', 'var(--green-100)');
    expectDeclares('surface-bg-tertiary-subtle', 'var(--red-100)');
    expectDeclares('surface-bg-tertiary-strong', 'var(--red-500)');
  });

  it('mapeia bordas para os primitivos corretos', () => {
    expectDeclares('border-neutral-strong', 'var(--neutral-800)');
    expectDeclares('border-neutral-medium', 'var(--neutral-500)');
    expectDeclares('border-accent-strong', 'var(--accent-600)');
    expectDeclares('border-accent-subtle', 'var(--accent-300)');
  });

  it('mapeia surface-bg-neutral-medium (divisores de lista) pro primitivo correto', () => {
    expectDeclares('surface-bg-neutral-medium', 'var(--neutral-600)');
  });

  it('mapeia texto e ícones para os primitivos corretos', () => {
    expectDeclares('text-label-on-bg-accent', 'var(--accent-700)');
    expectDeclares('text-label-on-bg-strong', 'var(--neutral-50)');
    expectDeclares('text-label-on-bg-complementary', 'var(--red-900)');
    expectDeclares('text-body-primary-strong', 'var(--primary-800)');
    expectDeclares('text-body-accent-regular', 'var(--accent-700)');
    expectDeclares('text-body-neutral-strong', 'var(--neutral-900)');
    expectDeclares('icon-neutral-1', 'var(--neutral-50)');
    expectDeclares('icon-accent', 'var(--accent-700)');
  });

  it('mapeia botão e tag para os primitivos corretos', () => {
    expectDeclares('button-bg-primary-filled-pressed', 'var(--primary-800)');
    expectDeclares('button-bg-accent-filled-regular', 'var(--accent-700)');
    expectDeclares('button-bg-accent-outline-regular', 'var(--yellow-50)');
    expectDeclares('button-border-neutral-strong', 'var(--neutral-800)');
    expectDeclares('button-border-neutral-subtle', 'var(--neutral-50)');
    expectDeclares('button-border-accent-strong', 'var(--accent-600)');
    expectDeclares('tag-bg-primary', 'var(--red-700)');
    expectDeclares('tag-bg-secondary', 'var(--red-100)');
    expectDeclares('tag-border-subtle', 'var(--red-700)');
    expectDeclares('tag-border-strong', 'var(--red-300)');
  });

  it('declara as sombras duras (neo-brutalismo: sem blur, deslocadas)', () => {
    expect(css).toMatch(/--shadow-comp-neutral:\s*3px 3px 0 0 var\(--neutral-900\)\s*;/);
    expect(css).toMatch(/--shadow-layout-neutral:\s*5px 5px 0 0 var\(--neutral-900\)\s*;/);
    expect(css).toMatch(/--shadow-comp-accent:\s*3px 3px 0 0 var\(--accent-300\)\s*;/);
    expect(css).toMatch(/--shadow-layout-accent:\s*5px 5px 0 0 var\(--accent-600\)\s*;/);
    expect(css).toMatch(/--shadow-layout-img:\s*5px 5px 0 0 var\(--red-300\)\s*;/);
  });

  it('declara a escala de line-height em 4 níveis', () => {
    expectDeclares('line-height-none', '1');
    expectDeclares('line-height-compact', '1.24');
    expectDeclares('line-height-regular', '1.48');
    expectDeclares('line-height-comfortable', '1.72');
  });

  it('declara a escala de letter-spacing em 3 níveis', () => {
    expectDeclares('letter-spacing-compact', '-1px');
    expectDeclares('letter-spacing-regular', '0px');
    expectDeclares('letter-spacing-comfortable', '1px');
  });

  it('tem um bloco de dark mode (mesmo que ainda repita os valores do claro)', () => {
    expect(css).toMatch(/\[data-theme=["']dark["']\]|prefers-color-scheme:\s*dark/);
  });

  it('mapeia a moldura do avatar pro primitivo correto', () => {
    expectDeclares('surface-bg-avatar-frame', 'var(--neutral-100)');
  });
});
