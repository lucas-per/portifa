import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const markup = readFileSync(new URL('./ColorDecomposer.astro', import.meta.url), 'utf-8');
const script = readFileSync(new URL('./main.js', import.meta.url), 'utf-8');
// só o HTML, sem o comentário do frontmatter
const html = markup.split('---')[2];
const tag = (id: string) => markup.match(new RegExp(`<[a-z]+ [^>]*id="${id}"[^>]*>`))?.[0] ?? '';

describe('Auto: indisponível, mas acessível', () => {
  it('usa aria-disabled (não disabled) e aponta para o motivo, em texto visível', () => {
    const button = tag('auto');
    expect(button).toContain('aria-disabled="true"');
    expect(button).not.toMatch(/\sdisabled[\s>]/);
    expect(button).toContain('aria-describedby="auto-why"');
    expect(button).toContain('class="btn btn--sm"');
    expect(tag('auto-why')).toContain('role="status"');
  });

  it('a Cor viva saiu', () => {
    expect(html).not.toMatch(/id="vivid"|Cor viva/);
    expect(script).not.toMatch(/vivid/i);
  });

  it('o aviso da Intensidade é um role="status" sempre presente', () => {
    expect(tag('tune-note')).toContain('role="status"');
    expect(tag('tune-note')).not.toContain('hidden');
  });
});

describe('Manter minha cor exata saiu; Texto com tom da cor (PR 8)', () => {
  const strings = readFileSync(new URL('./strings.js', import.meta.url), 'utf-8');

  it('o switch de Ajustes, a ajuda dele e os textos saíram', () => {
    expect(html).not.toMatch(/id="exact"|exact-help|cor exata/);
    expect(script).not.toMatch(/state\.exact|suggestBrandLevel|\$\('exact'\)/);
    expect(strings).not.toMatch(/autoExact|exact:|cor exata/);
  });

  it('o painel de detalhes tem um role="switch" nativo (sem aria-checked à mão), com o rótulo novo', () => {
    expect(script).toMatch(/<input type="checkbox" role="switch" name="strategy"/);
    expect(script).not.toMatch(/aria-checked="\$\{/);
    expect(strings).toContain("tintText: 'Texto com tom da cor'");
    expect(strings).not.toMatch(/textColor|Cor do texto|Preto ou branco/);
    expect(script).toContain("e.target.checked ? 'brand-tint' : 'high-contrast'");
  });

  it('a trilha ligada vem do primeiro nível de Comportamento no claro e do último no escuro', () => {
    expect(script).toContain("names[state.mode === 'dark' ? names.length - 1 : 0]");
    expect(script).toContain('--on-bg:${track};--on-fg:${thumb}');
  });

  it('o switch "Usar sua cor no estado normal" e a cor de apoio saíram', () => {
    expect(html).not.toMatch(/normal-switch|estado normal/);
    expect(script).not.toMatch(/support|behaviorFollowsBrand/);
  });
});

describe('Contraste mínimo', () => {
  it('tem a linha de ajuda dinâmica em role="status", ligada ao alternador', () => {
    expect(tag('level-help')).toMatch(/role="status" aria-live="polite"/);
    expect(tag('level')).toContain('aria-describedby="level-help"');
  });
});

describe('Cor principal (Figma 2026-10-19)', () => {
  it('o campo se chama Cor principal; sem "Cor da marca" nem "Cor de apoio" na tela', () => {
    expect(markup).toMatch(/<label class="field__label field__label--main" for="hex">Cor principal<\/label>/);
    expect(html).not.toMatch(/Cor da marca|cor de apoio/i);
  });

  it('a mini paleta é só imagem: sem seletor de cor nativo', () => {
    expect(markup).not.toMatch(/type="color"/);
    expect(script).not.toMatch(/picker/);
    expect(tag('mini')).toContain('aria-hidden="true"');
  });
});

describe('ícone de copiar', () => {
  const COPY_PATHS = ['M17 21H3V7H17V21ZM5 19H15V9H5V19Z', 'M21 18H19V5H6V3H21V18Z'];

  it('é um só, o do site (24 x 24, currentColor)', () => {
    const icons = [...script.matchAll(/<svg class="icon-copy"[^]*?<\/svg>/g)].map((m) => m[0]);
    expect(icons).toHaveLength(1);
    expect(icons[0]).toContain('width="24" height="24" viewBox="0 0 24 24"');
    for (const d of COPY_PATHS) expect(icons[0]).toContain(`d="${d}" fill="currentColor"`);
  });

  it('as linhas da lista e o painel de detalhes usam o mesmo ícone', () => {
    expect(script.match(/\$\{ICON_COPY\}|= ICON_COPY/g)).toHaveLength(2);
  });
});

describe('lista de níveis', () => {
  it('no celular cada linha abre o painel (aria-expanded e aria-controls); no computador é um radiogroup', () => {
    expect(script).toContain("b.setAttribute('aria-controls', 'detail')");
    expect(script).toContain("b.setAttribute('aria-expanded', String(on))");
    expect(script).toContain("b.setAttribute('aria-checked', String(on))");
  });

  // PR 7: o copiar existia só em Paleta e Neutros (COPYABLE); Comportamento e Cinzas ficavam sem ele
  it('toda linha de toda aba tem o botão de copiar (sem lista de abas que copiam)', () => {
    expect(script).not.toMatch(/COPYABLE/);
    expect(script).toMatch(/c\.className = 'swatch__copy'/);
    const build = script.slice(script.indexOf("b.className = 'swatch'; b.dataset.key"), script.indexOf("ribbon.append(cell)"));
    expect(build).toContain("cell.append(c)");
    expect(build.slice(build.indexOf('cell.append(b)'))).not.toMatch(/\bif \(/); // nada condiciona o copiar à aba
  });

  // PR 6: a tag "Sua cor" saiu; o nível da cor principal segue no nome acessível ("..., sua cor") e, para quem vê, no anel da mini paleta
  it('não há tag "Sua cor" na linha; hex em cima e razão embaixo', () => {
    expect(script).not.toMatch(/swatch__tag|swatch__line/);
    expect(script).toContain('<span class="swatch__hex">');
    expect(script).toContain('<span class="swatch__ratio">');
    expect(script).toContain("T.yourColor.toLowerCase()");
  });
});

describe('Paletas e Exportar tokens (PR 3)', () => {
  const css = readFileSync(new URL('../../../styles/tools/color-decomposer.css', import.meta.url), 'utf-8');

  it('"Paletas" tem o botão do celular e o texto do computador; só o botão tem aria-expanded e aria-controls', () => {
    expect(tag('stage-toggle')).toContain('aria-expanded="true"');
    expect(tag('stage-toggle')).toContain('aria-controls="stage-body"');
    expect(html).toMatch(/<span class="stage__label">Paletas<\/span>/);
    expect(html).not.toMatch(/<span class="stage__label"[^>]*aria-/);
  });

  it('no computador o botão fica em display: none (fora do foco e da árvore de acessibilidade) e o texto aparece', () => {
    const desktop = css.slice(css.indexOf('@media (min-width: 56.3125rem)'));
    expect(desktop).toMatch(/\.cd \.stage__toggle \{ display: none; \}/);
    expect(desktop).toMatch(/\.cd \.stage__label \{ display: flex; \}/);
  });

  it('o corpo da paleta só some no celular; no computador fica aberto', () => {
    expect(script).toMatch(/\$\('stage-body'\)\.hidden = narrow\(\) && !stageOpen/);
  });

  // PR 9: a coluna da esquerda (lista e avisos, Exportar) vem antes do painel de detalhes; no celular o host do detalhe fica vazio
  // (o detalhe abre dentro da lista) e o Exportar fica fora do corpo, que fecha com "Paletas"
  it('o Exportar tokens vem depois da lista e dos avisos e antes do painel de detalhes, fora do corpo', () => {
    const at = (id: string) => html.indexOf(`id="${id}"`);
    expect(at('ribbon-host')).toBeGreaterThan(-1);
    expect(at('alerts')).toBeGreaterThan(at('ribbon-host'));
    expect(at('open-export')).toBeGreaterThan(at('alerts'));
    expect(at('detail-host')).toBeGreaterThan(at('open-export'));
    expect(html.slice(html.indexOf('id="stage-body"'), at('open-export'))).toMatch(/<\/div>\s*<!--[^>]*-->\s*<button[^>]*$|<\/div>\s*<\/div>\s*<!--[\s\S]*$/);
  });

  it('Comportamento no computador: Exportar na linha do painel, com a base na dele e 32 px de reserva', () => {
    expect(css).toMatch(/\.cd \.stage\[data-tab="behavior"\] \.stage__panel \{ grid-row: 4; display: block; padding-bottom: 4\.75rem; \}/);
    expect(css).toMatch(/\.cd \.stage\[data-tab="behavior"\] \.stage__export \{ grid-row: 4; align-self: end; margin-top: 0; \}/);
    expect(script).toContain("$('tons').dataset.tab = state.tab");
  });

  it('o toggle "Texto com tom da cor" é o último bloco do painel de detalhes (depois dos valores)', () => {
    const detail = script.slice(script.indexOf('detail.innerHTML = `'));
    expect(detail.indexOf('class="values"')).toBeGreaterThan(-1);
    expect(detail.indexOf('class="switch switch--end"')).toBeGreaterThan(detail.indexOf('class="values"'));
  });

  it('opção ativa e aba ativa usam --active-bg e --active-fg, com contorno quando a cor é fraca', () => {
    expect(css).toMatch(/input:checked \+ span \{ background: var\(--active-bg\); color: var\(--active-fg\); \}/);
    expect(css).toMatch(/\.tab\[aria-selected="true"\] \{ background: var\(--active-bg\); color: var\(--active-fg\); \}/);
    expect(css).toMatch(/\[data-active-weak="1"\] \.tab\[aria-selected="true"\] \{ box-shadow: inset 0 0 0 var\(--bw\) var\(--fg\); \}/);
    expect(css).toMatch(/\[data-active-weak="1"\] \.segmented__item input:checked \+ span \{ box-shadow: inset 0 0 0 var\(--bw\) var\(--fg\); \}/);
  });

  it('abas: três dividem a largura e "Comportamento" fica com a do conteúdo', () => {
    expect(css).toMatch(/\.cd \.tab \{ flex: 1 1 0; min-width: 0; justify-content: center; \}/);
    expect(css).toMatch(/\.cd \.tab\[data-tab="behavior"\] \{ flex: none; \}/);
  });
});
