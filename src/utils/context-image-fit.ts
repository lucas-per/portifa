/**
 * Imagem do Contexto com a altura do bloco de texto ao lado (Figma 452:290
 * / 222:413). As três regras se retroalimentam: a altura do texto depende
 * da largura dele, que depende da largura da imagem, que depende da altura
 * do texto. No Figma isso entrou em loop (imagem com quase 20 mil px), por
 * isso a largura sempre passa por uma trava (mínimo 120px; máximo de 240px
 * ou 26% do bloco linha, o que for menor) e o ajuste para em no máximo 3
 * iterações por ciclo.
 */

export const CONTEXT_IMAGE_MIN_WIDTH = 120;
export const CONTEXT_IMAGE_MAX_WIDTH = 240;
/** Fração máxima do bloco linha (texto + gap + imagem) que a imagem ocupa. */
export const CONTEXT_IMAGE_MAX_ROW_FRACTION = 0.26;
export const CONTEXT_IMAGE_MAX_ITERATIONS = 3;

/**
 * Largura máxima: o menor entre 240px e 26% do bloco linha. Em 1440px o
 * bloco mede ~929px (26% ≈ 242), então vale 240, como no Figma; em telas
 * menores, os 26% seguram a imagem para o texto não ficar estreito demais.
 * Nunca fica abaixo do mínimo de 120px.
 */
export function contextImageMaxWidth(rowWidth: number): number {
  const fromRow = rowWidth * CONTEXT_IMAGE_MAX_ROW_FRACTION;
  return Math.max(CONTEXT_IMAGE_MIN_WIDTH, Math.min(CONTEXT_IMAGE_MAX_WIDTH, fromRow));
}

/** Largura que dá à imagem a altura do texto, presa entre o mínimo e o máximo. */
export function contextImageWidth(textHeight: number, ratio: number, rowWidth: number): number {
  const width = textHeight * ratio;
  return Math.min(contextImageMaxWidth(rowWidth), Math.max(CONTEXT_IMAGE_MIN_WIDTH, width));
}

/**
 * Um ciclo de ajuste: mede o texto, aplica a largura e repete enquanto a
 * largura mudar mais que meio pixel, até `CONTEXT_IMAGE_MAX_ITERATIONS`.
 * Retorna a largura final e quantas larguras foram aplicadas.
 */
export function fitContextImage(options: {
  measureTextHeight: () => number;
  applyWidth: (width: number) => void;
  currentWidth: number;
  ratio: number;
  /** Largura do bloco linha; não depende da largura da imagem. */
  rowWidth: number;
}): { width: number; iterations: number } {
  const { measureTextHeight, applyWidth, ratio, rowWidth } = options;
  let width = options.currentWidth;
  let iterations = 0;
  while (iterations < CONTEXT_IMAGE_MAX_ITERATIONS) {
    const next = contextImageWidth(measureTextHeight(), ratio, rowWidth);
    if (Math.abs(next - width) < 0.5) break;
    width = next;
    applyWidth(width);
    iterations += 1;
  }
  return { width, iterations };
}
