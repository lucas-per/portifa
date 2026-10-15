/**
 * Imagem do Contexto com a altura do bloco de texto ao lado (Figma 452:290
 * / 222:413). As três regras se retroalimentam: a altura do texto depende
 * da largura dele, que depende da largura da imagem, que depende da altura
 * do texto. No Figma isso entrou em loop (imagem com quase 20 mil px), por
 * isso a largura sempre passa pela trava de 120–240px e o ajuste para em
 * no máximo 3 iterações por ciclo.
 */

export const CONTEXT_IMAGE_MIN_WIDTH = 120;
export const CONTEXT_IMAGE_MAX_WIDTH = 240;
export const CONTEXT_IMAGE_MAX_ITERATIONS = 3;

/** Largura que dá à imagem a altura do texto, presa entre 120 e 240px. */
export function contextImageWidth(textHeight: number, ratio: number): number {
  const width = textHeight * ratio;
  return Math.min(CONTEXT_IMAGE_MAX_WIDTH, Math.max(CONTEXT_IMAGE_MIN_WIDTH, width));
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
}): { width: number; iterations: number } {
  const { measureTextHeight, applyWidth, ratio } = options;
  let width = options.currentWidth;
  let iterations = 0;
  while (iterations < CONTEXT_IMAGE_MAX_ITERATIONS) {
    const next = contextImageWidth(measureTextHeight(), ratio);
    if (Math.abs(next - width) < 0.5) break;
    width = next;
    applyWidth(width);
    iterations += 1;
  }
  return { width, iterations };
}
