import { describe, expect, it } from 'vitest';
// @ts-expect-error o motor é JavaScript sem tipos
import { PRESETS, contrastRatio, decomposeTheme, oklchToHex } from 'color-decomposer';
import { chromeTokens } from './chrome.js';

// Amostra de matizes, claridades e intensidades, mais as cores de referência da varredura de contraste.
const colors = new Set<string>(['#f3fff8', '#e7398a', '#ffffff', '#000000', '#fcfbf2']);
for (let h = 0; h < 360; h += 30) {
  for (const L of [0.05, 0.3, 0.6, 0.9, 0.99]) {
    for (const C of [0, 0.03, 0.1, 0.3]) colors.add(oklchToHex(L, C, h).hex);
  }
}

describe('tema derivado da interface (chrome.js)', () => {
  for (const presetId of ['standard', 'aplica'] as const) {
    for (const mode of ['light', 'dark'] as const) {
      it(`${presetId}, ${mode}: divisores com 3 para 1 sobre o fundo e sobre o painel, texto secundário com 4,5`, () => {
        const preset = PRESETS[presetId];
        for (const hex of colors) {
          const theme = decomposeTheme({ colors: { marca: hex }, preset });
          const t = chromeTokens(theme, 'marca', mode, preset);
          const at = `${hex}: --edge ${t.edge}, --bg ${t.bg}, --panel ${t.panel}`;
          expect(contrastRatio(t.edge, t.bg), at).toBeGreaterThanOrEqual(3);
          expect(contrastRatio(t.edge, t.panel), at).toBeGreaterThanOrEqual(3);
          expect(contrastRatio(t.muted, t.panel), at).toBeGreaterThanOrEqual(4.5);
        }
      });
    }
  }

  // PR 9: opção ativa e aba ativa (nível 100 de Comportamento)
  for (const presetId of ['standard', 'aplica'] as const) {
    for (const mode of ['light', 'dark'] as const) {
      it(`${presetId}, ${mode}: a cor ativa é o nível 100 de Comportamento, com texto de 4,5 para 1 e aviso de contraste fraco`, () => {
        const preset = PRESETS[presetId];
        for (const hex of colors) {
          const theme = decomposeTheme({ colors: { marca: hex }, preset });
          const t = chromeTokens(theme, 'marca', mode, preset);
          const b = theme.colors.marca[mode].behavior;
          expect(t['active-bg'], hex).toBe(b.surface.normal);
          expect(contrastRatio(t['active-bg'], t['active-fg']), `${hex}: ${t['active-bg']} / ${t['active-fg']}`).toBeGreaterThanOrEqual(4.5);
          expect(t.weak, hex).toBe(contrastRatio(t['active-bg'], t.bg) < 3);
        }
      });
    }
  }

  it('cores muito claras e muito escuras ficam com o aviso de contraste fraco (o contorno entra)', () => {
    const preset = PRESETS.standard;
    const weak = (hex: string, mode: 'light' | 'dark') =>
      chromeTokens(decomposeTheme({ colors: { marca: hex }, preset }), 'marca', mode, preset).weak;
    expect(weak('#fcfbf2', 'light')).toBe(true);
    expect(weak('#001018', 'dark')).toBe(true);
    expect(weak('#057abd', 'light')).toBe(false);
  });
});
