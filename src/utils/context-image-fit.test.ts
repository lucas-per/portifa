import { describe, expect, it } from 'vitest';
import {
  CONTEXT_IMAGE_MAX_ITERATIONS,
  contextImageWidth,
  fitContextImage,
} from './context-image-fit';

const RATIO = 1170 / 2532; // legacy-home.png (Pagamentos)

describe('contextImageWidth', () => {
  it('dá à imagem a altura do texto quando cabe na trava', () => {
    expect(contextImageWidth(372, RATIO)).toBeCloseTo(171.9, 1);
  });

  it('nunca passa de 120 nem de 240px', () => {
    expect(contextImageWidth(50, RATIO)).toBe(120);
    expect(contextImageWidth(20000, RATIO)).toBe(240);
  });
});

describe('fitContextImage', () => {
  // Texto que perde altura à medida que ganha largura (imagem menor).
  const layout = (state: { width: number }) => () => 300 + (240 - state.width) * 0.5;

  it('converge e aplica a largura final', () => {
    const state = { width: 172 };
    const result = fitContextImage({
      measureTextHeight: layout(state),
      applyWidth: (w) => (state.width = w),
      currentWidth: state.width,
      ratio: RATIO,
    });
    expect(state.width).toBe(result.width);
    expect(result.width).toBeGreaterThanOrEqual(120);
    expect(result.width).toBeLessThanOrEqual(240);
    expect(result.iterations).toBeLessThanOrEqual(CONTEXT_IMAGE_MAX_ITERATIONS);
  });

  it('não aplica nada quando a largura já está certa', () => {
    const applied: number[] = [];
    const result = fitContextImage({
      measureTextHeight: () => 372,
      applyWidth: (w) => applied.push(w),
      currentWidth: contextImageWidth(372, RATIO),
      ratio: RATIO,
    });
    expect(applied).toEqual([]);
    expect(result.iterations).toBe(0);
  });

  it('para em 3 iterações mesmo se o texto nunca estabilizar', () => {
    const applied: number[] = [];
    let flip = false;
    const result = fitContextImage({
      // Oscila entre duas alturas a cada medição (quebra de linha instável).
      measureTextHeight: () => ((flip = !flip) ? 300 : 400),
      applyWidth: (w) => applied.push(w),
      currentWidth: 172,
      ratio: RATIO,
    });
    expect(result.iterations).toBe(CONTEXT_IMAGE_MAX_ITERATIONS);
    expect(applied).toHaveLength(CONTEXT_IMAGE_MAX_ITERATIONS);
  });

  it('segura um texto que cresce sem parar na largura máxima', () => {
    const state = { width: 172 };
    const result = fitContextImage({
      measureTextHeight: () => 20000,
      applyWidth: (w) => (state.width = w),
      currentWidth: state.width,
      ratio: RATIO,
    });
    expect(result.width).toBe(240);
  });
});
