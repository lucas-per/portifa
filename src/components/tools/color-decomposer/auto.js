// Auto: sugere uma cor principal próxima da digitada quando ela gera tons parecidos na paleta (2026-10-19).
// A cor fica no nível 100; o que muda é a cor. Procura, em ordem de distância perceptual (ΔE em OKLab), a primeira cor
// com o mesmo matiz cuja paleta não tenha tons parecidos em nenhum dos dois modos. Varia a claridade (até 0,5 para
// cada lado, em passos de 0,005) e a intensidade (de 100% a 40% da original). Não é do motor: usa só o que ele exporta.
import { decompose, checkToneSeparation, hexToOklch, oklchToHex, deltaEOk } from 'color-decomposer';

const L_STEP = 0.005;
const L_STEPS = 100;
const CHROMA_FACTORS = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4];

/** Há tons parecidos na paleta desta cor, no nível 100, em algum dos dois modos? */
export function hasSimilarTones(hex, preset) {
  const r = decompose({ base: hex, preset });
  return ['light', 'dark'].some((mode) => checkToneSeparation(r[mode].palette.surface, hex).runs.length > 0);
}

/** A cor mais próxima de `hex` sem tons parecidos, ou null se nenhuma das candidatas servir. */
export function suggestColor(hex, preset) {
  const base = hexToOklch(hex);
  const candidates = [];
  for (let i = -L_STEPS; i <= L_STEPS; i++) {
    const L = base.L + i * L_STEP;
    if (L < 0.02 || L > 0.98) continue;
    for (const f of CHROMA_FACTORS) {
      const c = oklchToHex(L, base.C * f, base.h).hex;
      candidates.push({ hex: c, d: deltaEOk(hex, c) });
    }
  }
  candidates.sort((a, b) => a.d - b.d);
  const seen = new Set();
  for (const { hex: c } of candidates) {
    if (seen.has(c)) continue;
    seen.add(c);
    if (!hasSimilarTones(c, preset)) return c;
  }
  return null;
}
