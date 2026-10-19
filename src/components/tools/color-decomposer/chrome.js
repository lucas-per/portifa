// Origem: lucas-per/color-decomposer@v0.2.0, app/chrome.js. Mudanças da integração ao site: import do pacote
// color-decomposer e applyChrome recebe o elemento raiz da ferramenta (no app era o <html>). Divergência da tag (2026-10-17):
// --edge é calculado contra o fundo e o painel, como o --muted (docs/design-notes.md). Sem os tokens do alternador ligado
// da Cor viva, que saiu (2026-10-19).
// A própria interface usa a paleta gerada: fundo, texto e bordas saem dos neutros da cor escolhida.
import { contrastRatio } from 'color-decomposer';

// Primeiro neutro que chega ao contraste mínimo contra todos os fundos informados.
function firstLevelWith(scale, levels, bgs, min) {
  const list = Array.isArray(bgs) ? bgs : [bgs];
  for (const l of levels) if (list.every((bg) => contrastRatio(bg, scale[l]) >= min)) return scale[l];
  return scale[levels.at(-1)];
}

export function chromeTokens(theme, name, mode, preset) {
  const levels = preset.neutrals.levels;
  const n = theme.colors[name][mode].neutrals;
  const bg = n.surface[levels[0]];
  const panel = n.surface[levels[1]] ?? bg;
  // as pontas da escala de neutros são sempre as de maior contraste, em qualquer modo
  const fg = n.surface[levels.at(-1)];
  return {
    bg,
    panel,
    fg,
    // texto secundário: o primeiro neutro que chega a 5 para 1 (passa no AA com folga) no fundo e no painel.
    // Em escalas com poucos neutros o painel é mais escuro, então o painel também conta.
    muted: firstLevelWith(n.surface, levels, [bg, panel], 5),
    // divisores precisam de 3 para 1 contra o fundo e contra o painel (WCAG 1.4.11); o painel é mais escuro e é onde ficam os divisores
    edge: firstLevelWith(n.surface, levels, [bg, panel], 3.2),
    // divisores decorativos
    line: n.border[levels[0]],
    ring: fg,
    // faixa do cabeçalho: a cor da marca digitada, sem alteração
    band: theme.colors[name].base
  };
}

export function applyChrome(root, tokens, mode) {
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
  for (const [k, v] of Object.entries(tokens)) root.style.setProperty(`--${k}`, v);
}
