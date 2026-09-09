import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = readFileSync(fileURLToPath(new URL('./primitives.css', import.meta.url)), 'utf-8');

function expectDeclares(name: string, value: string) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`--${name}:\\s*${escaped}\\s*;`);
  expect(css, `esperava "--${name}: ${value};"`).toMatch(pattern);
}

describe('primitives.css', () => {
  it('declara a escala de neutros em OKLCH', () => {
    expectDeclares('neutral-900', 'oklch(25.11% 0.0046 17.46)');
    expectDeclares('neutral-800', 'oklch(29.23% 0.0044 17.41)');
    expectDeclares('neutral-500', 'oklch(52.00% 0.0038 17.28)');
    expectDeclares('neutral-200', 'oklch(89.30% 0.0022 17.20)');
    expectDeclares('neutral-150', 'oklch(94.16% 0.0021 15.19)');
    expectDeclares('neutral-50', 'oklch(98.74% 0.0032 17.21)');
    expectDeclares('neutral-25', 'oklch(99.14% 0.0044 359.99)');
    expectDeclares('neutral-0', 'oklch(99.65% 0.0170 106.70)');
  });

  it('não declara nenhuma cor em preto ou branco absoluto', () => {
    expect(css).not.toMatch(/#fff\b|#ffffff\b|#000\b|#000000\b/i);
    expect(css).not.toMatch(/oklch\(\s*100%/i);
    expect(css).not.toMatch(/oklch\(\s*0(\.0+)?%/i);
  });

  it('declara a escala primária (roxo/ameixa) em OKLCH', () => {
    expectDeclares('primary-800', 'oklch(32.54% 0.0336 315.88)');
    expectDeclares('primary-100', 'oklch(90.84% 0.0411 294.74)');
  });

  it('declara a escala de acento (azul) em OKLCH', () => {
    expectDeclares('accent-700', 'oklch(53.07% 0.1347 245.37)');
    expectDeclares('accent-600', 'oklch(55.82% 0.1361 243.96)');
    expectDeclares('accent-300', 'oklch(72.59% 0.1196 244.22)');
  });

  it('declara a escala vermelha (tags/status) em OKLCH', () => {
    expectDeclares('red-900', 'oklch(51.20% 0.2005 25.55)');
    expectDeclares('red-700', 'oklch(59.02% 0.2262 24.77)');
    expectDeclares('red-500', 'oklch(71.16% 0.1812 22.84)');
    expectDeclares('red-300', 'oklch(79.06% 0.0955 19.41)');
    expectDeclares('red-100', 'oklch(93.22% 0.0343 17.78)');
  });

  it('declara amarelo e verde de apoio em OKLCH', () => {
    expectDeclares('yellow-50', 'oklch(97.98% 0.0044 78.21)');
    expectDeclares('yellow-100', 'oklch(96.21% 0.0619 95.40)');
    expectDeclares('yellow-200', 'oklch(93.30% 0.1107 95.78)');
    expectDeclares('green-100', 'oklch(95.71% 0.0210 147.64)');
  });

  it('declara a escala numérica de tamanho em rem', () => {
    expectDeclares('scale-none', '0');
    expectDeclares('scale-base', '0.25rem');
    expectDeclares('scale-x2', '0.5rem');
    expectDeclares('scale-x3', '0.75rem');
    expectDeclares('scale-x4', '1rem');
    expectDeclares('scale-x5', '1.25rem');
    expectDeclares('scale-x6', '1.5rem');
    expectDeclares('scale-x7', '1.75rem');
    expectDeclares('scale-x8', '2rem');
    expectDeclares('scale-x9', '2.25rem');
    expectDeclares('scale-x10', '2.5rem');
    expectDeclares('scale-x11', '2.75rem');
    expectDeclares('scale-x12', '3rem');
    expectDeclares('scale-x16', '4rem');
    expectDeclares('scale-x20', '5.5rem');
  });

  it('declara os pesos de fonte usados no Figma', () => {
    expectDeclares('weight-400', '400');
    expectDeclares('weight-500', '500');
    expectDeclares('weight-600', '600');
    expectDeclares('weight-700', '700');
    expectDeclares('weight-800', '800');
  });

  it('declara o primitivo da moldura do avatar em OKLCH', () => {
    expectDeclares('neutral-100', 'oklch(95.69% 0.0120 78.40)');
  });
});
