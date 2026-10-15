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

  it('mapeia superfícies para os primitivos do Figma', () => {
    expectDeclares('surface-bg-neutral-subtle', 'var(--grey-1)');
    expectDeclares('surface-bg-neutral-medium', 'var(--grey-6)');
    expectDeclares('surface-bg-neutral-strong', 'var(--grey-8)');
    expectDeclares('surface-bg-neutral-extra', 'var(--grey-1)');
    expectDeclares('surface-bg-off-white-primary', 'var(--yellow-1)');
    expectDeclares('surface-bg-off-white-secondary', 'var(--yellow-2)');
    expectDeclares('surface-bg-off-white-tertiary', 'var(--yellow-3)');
    expectDeclares('surface-bg-off-white-extra', 'var(--yellow-4)');
    expectDeclares('surface-bg-accent-subtle', 'var(--blue-1)');
    expectDeclares('surface-bg-accent-medium', 'var(--blue-2)');
    expectDeclares('surface-bg-accent-strong', 'var(--blue-3)');
    expectDeclares('surface-bg-secondary-subtle', 'var(--purple-1)');
    expectDeclares('surface-bg-secondary-medium', 'var(--purple-2)');
    expectDeclares('surface-bg-secondary-strong', 'var(--purple-3)');
    expectDeclares('surface-bg-tertiary-subtle', 'var(--red-1)');
    expectDeclares('surface-bg-tertiary-medium', 'var(--red-2)');
    expectDeclares('surface-bg-tertiary-strong', 'var(--red-3)');
    expectDeclares('surface-bg-quaternary-subtle', 'var(--green-2)');
    expectDeclares('surface-bg-quaternary-strong', 'var(--green-3)');
    expectDeclares('surface-bg-avatar-frame', 'var(--avatar-frame-beige)');
  });

  it('mapeia bordas para os primitivos do Figma', () => {
    expectDeclares('border-neutral-subtle', 'var(--grey-3)');
    expectDeclares('border-neutral-medium', 'var(--grey-5)');
    expectDeclares('border-neutral-strong', 'var(--grey-8)');
    expectDeclares('border-accent-subtle', 'var(--blue-3)');
    expectDeclares('border-accent-strong', 'var(--blue-4)');
    expectDeclares('border-primary-subtle', 'var(--purple-3)');
    expectDeclares('border-primary-strong', 'var(--purple-6)');
    expectDeclares('border-focus-strong', 'var(--red-6)');
  });

  it('mapeia texto e ícones para os primitivos do Figma', () => {
    expectDeclares('text-label-neutral-1', 'var(--grey-1)');
    expectDeclares('text-label-neutral-2', 'var(--grey-5)');
    expectDeclares('text-label-neutral-3', 'var(--grey-9)');
    expectDeclares('text-label-accent', 'var(--blue-5)');
    expectDeclares('text-label-primary', 'var(--purple-7)');
    expectDeclares('text-label-extra-1', 'var(--red-7)');
    expectDeclares('text-body-neutral-subtle', 'var(--grey-6)');
    expectDeclares('text-body-neutral-medium', 'var(--grey-8)');
    expectDeclares('text-body-neutral-strong', 'var(--grey-9)');
    expectDeclares('text-body-accent-subtle', 'var(--blue-5)');
    expectDeclares('text-body-accent-strong', 'var(--blue-6)');
    expectDeclares('text-body-primary-strong', 'var(--purple-7)');
    expectDeclares('icon-neutral-1', 'var(--grey-1)');
    expectDeclares('icon-neutral-2', 'var(--grey-5)');
    expectDeclares('icon-neutral-3', 'var(--grey-9)');
    expectDeclares('icon-accent', 'var(--blue-5)');
    expectDeclares('icon-primary', 'var(--purple-7)');
    expectDeclares('icon-feedback-positive', 'var(--green-5)');
    expectDeclares('icon-feedback-warning', 'var(--yellow-7)');
  });

  it('mapeia botão e tag para os primitivos do Figma', () => {
    expectDeclares('button-bg-accent-filled-regular', 'var(--blue-5)');
    expectDeclares('button-bg-accent-filled-hovered', 'var(--blue-4)');
    expectDeclares('button-bg-accent-filled-pressed', 'var(--blue-6)');
    expectDeclares('button-bg-accent-outline-regular', 'var(--yellow-1)');
    expectDeclares('button-bg-accent-outline-hovered', 'var(--blue-1)');
    expectDeclares('button-bg-accent-outline-pressed', 'var(--blue-2)');
    expectDeclares('button-bg-primary-filled-regular', 'var(--purple-6)');
    expectDeclares('button-bg-primary-filled-hovered', 'var(--purple-3)');
    expectDeclares('button-bg-primary-filled-pressed', 'var(--purple-7)');
    expectDeclares('button-bg-primary-outline-regular', 'var(--yellow-1)');
    expectDeclares('button-bg-primary-outline-hovered', 'var(--purple-2)');
    expectDeclares('button-bg-primary-outline-pressed', 'var(--purple-5)');
    expectDeclares('button-border-accent-subtle', 'var(--blue-1)');
    expectDeclares('button-border-accent-medium', 'var(--blue-2)');
    expectDeclares('button-border-accent-strong', 'var(--blue-4)');
    expectDeclares('button-border-primary-subtle', 'var(--purple-2)');
    expectDeclares('button-border-primary-subtlest', 'var(--yellow-1)');
    expectDeclares('button-border-primary-medium', 'var(--purple-5)');
    expectDeclares('button-border-primary-strong', 'var(--purple-6)');
    expectDeclares('button-border-neutral-subtle', 'var(--grey-1)');
    expectDeclares('button-border-neutral-strong', 'var(--grey-8)');
    expectDeclares('button-border-neutral-invisible', 'var(--grey-1-transparent)');
    expectDeclares('tag-bg-primary', 'var(--red-6)');
    expectDeclares('tag-bg-secondary', 'var(--red-2)');
    expectDeclares('tag-border-subtle', 'var(--red-3)');
    expectDeclares('tag-border-strong', 'var(--red-5)');
  });

  it('declara as sombras duras (neo-brutalismo: sem blur, deslocadas)', () => {
    expect(css).toMatch(/--shadow-comp-neutral:\s*3px 3px 0 0 var\(--grey-9\)\s*;/);
    expect(css).toMatch(/--shadow-layout-neutral:\s*5px 5px 0 0 var\(--grey-9\)\s*;/);
    expect(css).toMatch(/--shadow-comp-accent:\s*3px 3px 0 0 var\(--blue-3\)\s*;/);
    expect(css).toMatch(/--shadow-comp-primary:\s*3px 3px 0 0 var\(--purple-3\)\s*;/);
    expect(css).toMatch(/--shadow-layout-accent:\s*5px 5px 0 0 var\(--blue-4\)\s*;/);
    expect(css).toMatch(/--shadow-layout-img:\s*5px 5px 0 0 var\(--red-3\)\s*;/);
  });

  it('declara a sombra de hover dos botões (offset base + deslocamento do hover)', () => {
    expect(css).toMatch(/--shadow-comp-neutral-hover:\s*5px 5px 0 0 var\(--grey-9\)\s*;/);
    expect(css).toMatch(/--shadow-comp-accent-hover:\s*5px 5px 0 0 var\(--blue-3\)\s*;/);
    expect(css).toMatch(/--shadow-comp-primary-hover:\s*5px 5px 0 0 var\(--purple-3\)\s*;/);
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
});
