import { describe, expect, it } from 'vitest';
// @ts-expect-error o motor é JavaScript sem tipos
import { PRESETS, deltaEOk, oklchToHex } from 'color-decomposer';
import { hasSimilarTones, suggestColor } from './auto.js';

// Mesma amostra do chrome.test.ts: matizes, claridades e intensidades, mais cores de referência.
const colors = new Set<string>(['#f3fff8', '#e7398a', '#ffffff', '#000000', '#fcfbf2', '#fff200', '#0a0a0a']);
for (let h = 0; h < 360; h += 30) {
  for (const L of [0.05, 0.3, 0.6, 0.9, 0.99]) {
    for (const C of [0, 0.03, 0.1, 0.3]) colors.add(oklchToHex(L, C, h).hex);
  }
}

describe('Auto: cor principal próxima, sem tons parecidos', () => {
  for (const presetId of ['standard', 'aplica'] as const) {
    it(`${presetId}: toda cor com tons parecidos ganha uma sugestão sem eles, perto da original`, () => {
      const preset = PRESETS[presetId];
      let conflicts = 0;
      for (const hex of colors) {
        if (!hasSimilarTones(hex, preset)) continue;
        conflicts += 1;
        const c = suggestColor(hex, preset);
        expect(c, hex).not.toBeNull();
        expect(hasSimilarTones(c, preset), `${hex} → ${c}`).toBe(false);
        expect(deltaEOk(hex, c), `${hex} → ${c}`).toBeLessThan(0.3);
      }
      expect(conflicts).toBeGreaterThan(20); // a amostra tem cores com o problema
    }, 60_000); // cada busca refaz a paleta até achar a cor
  }

  it('uma cor sem tons parecidos fica igual', () => {
    expect(hasSimilarTones('#e7398a', PRESETS.standard)).toBe(false);
    expect(suggestColor('#e7398a', PRESETS.standard)).toBe('#e7398a');
  });
});
