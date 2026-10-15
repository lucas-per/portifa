import { describe, expect, it } from 'vitest';
import {
  CONTEXT_IMAGE_MAX_ITERATIONS,
  contextImageMaxWidth,
  contextImageWidth,
  fitContextImage,
} from './context-image-fit';

const RATIO = 1170 / 2532; // legacy-home.png (Pagamentos)
// Larguras do bloco linha medidas no navegador (case Pagamentos). Em 768 o
// bloco é igual ao de 1024 porque a página não encolhe abaixo de ~1060px
// (colunas do Resumo).
const ROW_1440 = 929;
const ROW_1024 = 642;
const ROW_768 = 642;

describe('contextImageMaxWidth', () => {
  it('1440px: 26% do bloco passa de 240, então vale 240 (Figma)', () => {
    expect(contextImageMaxWidth(ROW_1440)).toBe(240);
  });

  it('1024px e 768px: 26% do bloco', () => {
    expect(contextImageMaxWidth(ROW_1024)).toBeCloseTo(166.9, 1);
    expect(contextImageMaxWidth(ROW_768)).toBeCloseTo(166.9, 1);
  });

  it('nunca fica abaixo do mínimo de 120px', () => {
    expect(contextImageMaxWidth(300)).toBe(120);
  });
});

describe('contextImageWidth', () => {
  it('1440px: dá à imagem a altura do texto (abaixo do máximo)', () => {
    expect(contextImageWidth(367.1, RATIO, ROW_1440)).toBeCloseTo(169.6, 1);
  });

  it('1440px: texto alto para em 240', () => {
    expect(contextImageWidth(800, RATIO, ROW_1440)).toBe(240);
  });

  it('1024px: texto alto para em 26% do bloco, não em 240', () => {
    expect(contextImageWidth(693, RATIO, ROW_1024)).toBeCloseTo(166.9, 1);
  });

  it('768px: mesma trava de 26% do bloco', () => {
    expect(contextImageWidth(693, RATIO, ROW_768)).toBeCloseTo(166.9, 1);
  });

  it('nunca passa de 120 nem do máximo', () => {
    expect(contextImageWidth(50, RATIO, ROW_1440)).toBe(120);
    expect(contextImageWidth(20000, RATIO, ROW_1440)).toBe(240);
    expect(contextImageWidth(20000, RATIO, ROW_1024)).toBeCloseTo(166.9, 1);
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
      rowWidth: ROW_1440,
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
      currentWidth: contextImageWidth(372, RATIO, ROW_1440),
      ratio: RATIO,
      rowWidth: ROW_1440,
    });
    expect(applied).toEqual([]);
    expect(result.iterations).toBe(0);
  });

  it('para em 3 iterações mesmo se o texto nunca estabilizar', () => {
    const applied: number[] = [];
    let flip = false;
    const result = fitContextImage({
      // Oscila entre duas alturas a cada medição (quebra de linha instável).
      measureTextHeight: () => ((flip = !flip) ? 300 : 340),
      applyWidth: (w) => applied.push(w),
      currentWidth: 172,
      ratio: RATIO,
      rowWidth: ROW_1440,
    });
    expect(result.iterations).toBe(CONTEXT_IMAGE_MAX_ITERATIONS);
    expect(applied).toHaveLength(CONTEXT_IMAGE_MAX_ITERATIONS);
  });

  it('1024px: segura um texto que cresce sem parar em 26% do bloco', () => {
    const state = { width: 172 };
    const result = fitContextImage({
      measureTextHeight: () => 20000,
      applyWidth: (w) => (state.width = w),
      currentWidth: state.width,
      ratio: RATIO,
      rowWidth: ROW_1024,
    });
    expect(result.width).toBeCloseTo(166.9, 1);
  });
});
