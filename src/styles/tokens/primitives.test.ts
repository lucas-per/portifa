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
  it('declara a escala de cinzas do Figma em OKLCH', () => {
    expectDeclares('grey-1', 'oklch(99.58% 0.0025 228.78)');
    expectDeclares('grey-2', 'oklch(89.68% 0.0140 247.98)');
    expectDeclares('grey-3', 'oklch(79.77% 0.0144 248.01)');
    expectDeclares('grey-4', 'oklch(70.15% 0.0137 244.33)');
    expectDeclares('grey-5', 'oklch(60.23% 0.0143 244.38)');
    expectDeclares('grey-6', 'oklch(50.54% 0.0137 240.12)');
    expectDeclares('grey-7', 'oklch(40.50% 0.0136 243.94)');
    expectDeclares('grey-8', 'oklch(30.85% 0.0132 239.00)');
    expectDeclares('grey-9', 'oklch(20.96% 0.0134 243.58)');
    expectDeclares('grey-1-transparent', 'oklch(99.58% 0.0025 228.78 / 0)');
  });

  it('declara a escala de roxo (primária) do Figma em OKLCH', () => {
    expectDeclares('purple-1', 'oklch(97.88% 0.0126 306.03)');
    expectDeclares('purple-2', 'oklch(85.59% 0.0375 304.72)');
    expectDeclares('purple-3', 'oklch(73.25% 0.0362 306.15)');
    expectDeclares('purple-4', 'oklch(60.98% 0.0361 305.01)');
    expectDeclares('purple-5', 'oklch(48.52% 0.0367 305.66)');
    expectDeclares('purple-6', 'oklch(41.61% 0.0366 306.45)');
    expectDeclares('purple-7', 'oklch(34.68% 0.0362 305.09)');
    expectDeclares('purple-8', 'oklch(27.92% 0.0363 305.81)');
    expectDeclares('purple-9', 'oklch(21.05% 0.0364 303.88)');
  });

  it('declara a escala de azul (acento) do Figma em OKLCH', () => {
    expectDeclares('blue-1', 'oklch(99.58% 0.0025 228.78)');
    expectDeclares('blue-2', 'oklch(87.37% 0.0667 244.52)');
    expectDeclares('blue-3', 'oklch(76.82% 0.1281 243.85)');
    expectDeclares('blue-4', 'oklch(66.42% 0.1359 243.76)');
    expectDeclares('blue-5', 'oklch(55.82% 0.1361 243.96)');
    expectDeclares('blue-6', 'oklch(47.12% 0.1163 244.05)');
    expectDeclares('blue-7', 'oklch(38.37% 0.0953 244.34)');
    expectDeclares('blue-8', 'oklch(29.79% 0.0735 244.04)');
    expectDeclares('blue-9', 'oklch(20.98% 0.0518 244.04)');
  });

  it('declara a escala de vermelho (tags/status) do Figma em OKLCH', () => {
    expectDeclares('red-1', 'oklch(97.98% 0.0098 25.07)');
    expectDeclares('red-2', 'oklch(90.34% 0.0500 24.21)');
    expectDeclares('red-3', 'oklch(82.89% 0.0950 24.86)');
    expectDeclares('red-4', 'oklch(75.31% 0.1482 24.64)');
    expectDeclares('red-5', 'oklch(67.86% 0.2095 24.66)');
    expectDeclares('red-6', 'oklch(56.10% 0.2095 24.48)');
    expectDeclares('red-7', 'oklch(44.47% 0.1802 24.76)');
    expectDeclares('red-8', 'oklch(32.82% 0.1330 24.75)');
    expectDeclares('red-9', 'oklch(20.97% 0.0850 24.97)');
  });

  it('declara a escala de amarelo (fundos) do Figma em OKLCH', () => {
    expectDeclares('yellow-1', 'oklch(98.64% 0.0119 101.48)');
    expectDeclares('yellow-2', 'oklch(96.00% 0.0499 98.62)');
    expectDeclares('yellow-3', 'oklch(93.22% 0.0868 95.59)');
    expectDeclares('yellow-4', 'oklch(90.44% 0.1242 93.58)');
    expectDeclares('yellow-5', 'oklch(87.89% 0.1617 90.94)');
    expectDeclares('yellow-6', 'oklch(71.14% 0.1454 90.87)');
    expectDeclares('yellow-7', 'oklch(54.32% 0.1110 90.75)');
    expectDeclares('yellow-8', 'oklch(37.64% 0.0769 90.40)');
    expectDeclares('yellow-9', 'oklch(20.99% 0.0429 89.63)');
  });

  it('declara a escala de verde (feedback) do Figma em OKLCH', () => {
    expectDeclares('green-1', 'oklch(95.71% 0.0210 147.64)');
    expectDeclares('green-2', 'oklch(93.29% 0.0629 147.14)');
    expectDeclares('green-3', 'oklch(88.44% 0.1261 147.74)');
    expectDeclares('green-4', 'oklch(74.43% 0.1611 147.56)');
    expectDeclares('green-5', 'oklch(57.02% 0.1598 146.46)');
    expectDeclares('green-6', 'oklch(36.88% 0.0993 148.76)');
  });

  it('declara a escala de rosa do Figma em OKLCH', () => {
    expectDeclares('pink-1', 'oklch(95.09% 0.0259 2.76)');
    expectDeclares('pink-2', 'oklch(88.90% 0.0622 2.08)');
    expectDeclares('pink-3', 'oklch(59.73% 0.0996 1.70)');
    expectDeclares('pink-4', 'oklch(51.94% 0.1037 3.79)');
    expectDeclares('pink-5', 'oklch(33.96% 0.0968 2.91)');
  });

  it('não declara nenhuma cor em preto ou branco absoluto', () => {
    expect(css).not.toMatch(/#fff\b|#ffffff\b|#000\b|#000000\b/i);
    expect(css).not.toMatch(/oklch\(\s*100%/i);
    expect(css).not.toMatch(/oklch\(\s*0(\.0+)?%/i);
  });

  it('não mantém nomes da paleta antiga (neutral/primary/accent)', () => {
    expect(css).not.toMatch(/--(neutral|primary|accent)-\d/);
  });

  it('declara a escala numérica de tamanho em rem', () => {
    expectDeclares('scale-none', '0');
    expectDeclares('scale-half', '0.125rem');
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
    expectDeclares('scale-x14', '3.5rem');
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
    expectDeclares('avatar-frame-beige', 'oklch(95.69% 0.0120 78.40)');
  });
});
