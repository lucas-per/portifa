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

describe('Manter minha cor exata', () => {
  it('é um role="switch", desligado no markup, descrito pela linha de ajuda dinâmica', () => {
    const input = tag('exact');
    expect(input).toContain('type="checkbox"');
    expect(input).toContain('role="switch"');
    expect(input).not.toMatch(/\schecked/);
    expect(input).toContain('aria-describedby="exact-help"');
    expect(tag('exact-help')).toMatch(/role="status" aria-live="polite"/);
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

  it('o Exportar tokens vem depois do corpo da paleta no DOM: lista, painel, Exportar', () => {
    expect(html.indexOf('id="detail-host"')).toBeGreaterThan(-1);
    expect(html.indexOf('id="open-export"')).toBeGreaterThan(html.indexOf('id="detail-host"'));
    expect(html.indexOf('id="open-export"')).toBeGreaterThan(html.indexOf('id="ribbon-host"'));
  });

  it('abas: três dividem a largura e "Comportamento" fica com a do conteúdo', () => {
    expect(css).toMatch(/\.cd \.tab \{ flex: 1 1 0; min-width: 0; justify-content: center; \}/);
    expect(css).toMatch(/\.cd \.tab\[data-tab="behavior"\] \{ flex: none; \}/);
  });
});
