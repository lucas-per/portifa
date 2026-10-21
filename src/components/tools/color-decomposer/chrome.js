// Origem: lucas-per/color-decomposer@v0.2.0, app/chrome.js. Mudanças da integração ao site: import do pacote
// color-decomposer e applyChrome recebe o elemento raiz da ferramenta (no app era o <html>). Divergência da tag (2026-10-17):
// --edge é calculado contra o fundo e o painel, como o --muted (docs/design-notes.md). Sem os tokens do alternador ligado
// da Cor viva, que saiu (2026-10-19). PR 9 (2026-10-20): --active-bg e --active-fg, a opção e a aba ativas (nível 100 de
// Comportamento) e o aviso `weak` para quando essa cor não se separa do fundo.
// A própria interface usa a paleta gerada: fundo, texto e bordas saem dos neutros da cor escolhida.
import { contrastRatio } from 'color-decomposer';

// Primeiro neutro que chega ao contraste mínimo contra todos os fundos informados.
function firstLevelWith(scale, levels, bgs, min) {
  const list = Array.isArray(bgs) ? bgs : [bgs];
  for (const l of levels) if (list.every((bg) => contrastRatio(bg, scale[l]) >= min)) return scale[l];
  return scale[levels.at(-1)];
}

// Opção ativa dos seletores e aba ativa: o nível 100 de Comportamento, no par que o motor já calculou (no escuro, o espelhado de
// 100 é o próprio 100). O texto precisa de 4,5 para 1: se o do motor fica abaixo (o motor avisa "abaixo do AA"), vale o melhor
// entre o fundo e o texto da interface e, por fim, preto ou branco (um dos dois sempre passa de 4,5). `weak`: a cor ativa não
// chega a 3 para 1 contra o fundo (cor muito clara no claro, muito escura no escuro); o CSS então desenha um contorno.
export function activeTokens(theme, name, mode, bg, fg) {
  const behavior = theme.colors[name][mode].behavior;
  const key = Object.keys(behavior.level).find((k) => behavior.level[k] === 100);
  const active = behavior.surface[key];
  const own = behavior.txtOn[key];
  const text = [own, bg, fg, '#000000', '#ffffff'].find((c) => contrastRatio(active, c) >= 4.5);
  return { activeBg: active, activeFg: text, weak: contrastRatio(active, bg) < 3 };
}

export function chromeTokens(theme, name, mode, preset) {
  const levels = preset.neutrals.levels;
  const n = theme.colors[name][mode].neutrals;
  const bg = n.surface[levels[0]];
  const panel = n.surface[levels[1]] ?? bg;
  // as pontas da escala de neutros são sempre as de maior contraste, em qualquer modo
  const fg = n.surface[levels.at(-1)];
  const a = activeTokens(theme, name, mode, bg, fg);
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
    'active-bg': a.activeBg,
    'active-fg': a.activeFg,
    // não é uma variável de CSS: o applyChrome o grava em data-active-weak
    weak: a.weak,
    // faixa do cabeçalho: a cor da marca digitada, sem alteração
    band: theme.colors[name].base
  };
}

export function applyChrome(root, tokens, mode) {
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
  const { weak, ...vars } = tokens;
  root.dataset.activeWeak = weak ? '1' : '0';
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(`--${k}`, v);
}
