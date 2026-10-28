import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { getMenuCases } from '../../utils/cases';

const source = readFileSync(new URL('./HeaderCases.astro', import.meta.url), 'utf-8');
const header = readFileSync(new URL('./Header.astro', import.meta.url), 'utf-8');
const markup = source.slice(source.indexOf('---', 3) + 3, source.indexOf('<script>'));
const script = source.slice(source.indexOf('<script>'), source.indexOf('</script>'));
const style = source.slice(source.indexOf('<style>')).replace(/\/\*[\s\S]*?\*\//g, '');

const rule = (selector: string) =>
  style.match(new RegExp(`${selector.replace(/[.[\]()]/g, '\\$&')} \\{([^}]*)\\}`))?.[1] ?? '';

describe('"Cases" no cabeçalho desktop (Figma 728:369): disclosure com details/summary', () => {
  it('fica antes de UaiUI DS e Paletaria, dentro dos links do cabeçalho', () => {
    const pages = header.slice(header.indexOf('site-header__pages'));
    expect(pages.indexOf('<HeaderCases />')).toBeGreaterThan(-1);
    expect(pages.indexOf('<HeaderCases />')).toBeLessThan(pages.indexOf('sections.map'));
  });

  it('o gatilho é um summary com o texto "Cases" e a seta escondida dos leitores de tela (nome acessível = texto visível)', () => {
    expect(markup).toMatch(/<details class="header-cases" data-header-cases>/);
    const summary = markup.match(/<summary[\s\S]*?<\/summary>/)?.[0] ?? '';
    expect(summary).toMatch(/clickable-menu-cases/);
    expect(summary).toMatch(/>Cases<\/span>/);
    expect(summary).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(summary).not.toMatch(/aria-label/);
    expect(summary).toMatch(/aria-current=\{triggerCurrent\}/);
    // Não é role="menu": é uma lista de links na ordem do DOM.
    expect(source).not.toMatch(/role="menu|menuitem/);
  });

  it('os itens são os cases publicados (getMenuCases, a fonte do menu mobile), como links com aria-current', () => {
    expect(source).toMatch(/getMenuCases\(await getCollection\('cases'\)\)/);
    expect(source).toMatch(/getAriaCurrent\(Astro\.url\.pathname, item\.href\)/);
    expect(markup).toMatch(/<ul class="header-cases__panel" role="list">/);
    expect(markup).toMatch(/<a\s+href=\{item\.href\}[\s\S]*?aria-current=\{item\.current\}/);
    expect(markup).toMatch(/clickable-link-internal-case-\$\{item\.key\}/);
    // Hoje: Área de pagamentos e Redesign de produto; GoSafe DS (coming-soon) fica de fora.
    const entries = [
      { id: 'gosafe-ds', data: { title: 'GoSafe DS', status: 'coming-soon' as const } },
      { id: 'redesign', data: { title: 'Redesign de produto', status: 'published' as const } },
      { id: 'jornada-pagamentos', data: { title: 'Área de pagamentos', status: 'published' as const } },
    ];
    expect(getMenuCases(entries).map((item) => item.label)).toEqual(['Área de pagamentos', 'Redesign de produto']);
  });

  it('o gatilho fica "true" quando a página é um case', () => {
    expect(source).toMatch(/items\.some\(\(item\) => item\.current\) \? 'true' : undefined/);
  });

  it('script: Esc fecha e devolve o foco, clique fora e saída do foco fecham, pageshow e a troca para o mobile também', () => {
    expect(script).toMatch(/event\.key !== 'Escape'/);
    expect(script).toMatch(/close\(true\)/);
    expect(script).toMatch(/if \(returnFocus\) summary\.focus\(\)/);
    expect(script).toMatch(/document\.addEventListener\('click'[\s\S]*?!details\.contains\(event\.target as Node\)/);
    expect(script).toMatch(/addEventListener\('focusout'[\s\S]*?!details\.contains\(next\)/);
    expect(script).toMatch(/addEventListener\('pageshow'[\s\S]*?event\.persisted/);
    expect(script).toMatch(/matchMedia\('\(max-width: 887px\)'\)/);
    // Nunca abre por hover nem por JS.
    expect(script).not.toMatch(/mouseenter|mouseover|pointerenter|\.open = true/);
  });

  it('gatilho: texto e seta de 20px com 8px entre eles, 24px de altura e área de clique de 44px; sem o marcador do details', () => {
    const trigger = rule('.header-cases__trigger');
    expect(trigger).toMatch(/gap: var\(--scale-x2\);/);
    expect(trigger).toMatch(/padding: var\(--scale-half\) 0;/);
    expect(trigger).toMatch(/color: var\(--text-label-accent\);/);
    expect(trigger).toMatch(/list-style: none;/);
    expect(style).toMatch(/\.header-cases__trigger::-webkit-details-marker \{\s*display: none;/);
    expect(style).toMatch(/\.header-cases__trigger::before \{[^}]*inset: -10px 0;/);
    expect(markup).toMatch(/<svg class="header-cases__chevron" width="20" height="20"/);
    expect(rule('.header-cases__chevron')).toMatch(/color: var\(--icon-accent\);/);
    expect(style).toMatch(/\.header-cases\[open\] \.header-cases__chevron \{\s*transform: rotate\(180deg\);/);
  });

  it('painel: 16px abaixo do gatilho, pela esquerda dele, largura pelo conteúdo, borda de 2px, sombra layout-accent, 8px na vertical', () => {
    const panel = rule('.header-cases__panel');
    expect(panel).toMatch(/position: absolute;/);
    expect(panel).toMatch(/top: calc\(100% \+ var\(--scale-x4\)\);/);
    expect(panel).toMatch(/left: 0;/);
    expect(panel).toMatch(/width: max-content;/);
    expect(panel).toMatch(/padding: var\(--scale-x2\) 0;/);
    expect(panel).toMatch(/border: 2px solid var\(--border-accent-subtle\);/);
    expect(panel).toMatch(/background-color: var\(--surface-bg-off-white-primary\);/);
    expect(panel).toMatch(/box-shadow: var\(--shadow-layout-accent\);/);
    expect(panel).toMatch(/z-index: 20;/);
  });

  it('itens: 44px de altura, 16px nas laterais, Desktop/Label/MD em text-label-accent; hover blue-2 com texto blue-6 só com mouse', () => {
    const link = rule('.header-cases__link');
    expect(link).toMatch(/min-height: var\(--scale-x11\);/);
    expect(link).toMatch(/padding: 0 var\(--scale-x4\);/);
    expect(link).toMatch(/color: var\(--text-label-accent\);/);
    expect(markup).toMatch(/header-cases__text text-label-md/);
    expect(style).toMatch(/@media \(hover: hover\) \{[\s\S]*?\.header-cases__link:hover \{\s*background-color: var\(--surface-bg-accent-medium\);\s*color: var\(--text-body-accent-strong\);/);
    // Fora do @media (hover: hover) não há :hover (no toque ficaria preso).
    const withoutHoverBlocks = style.replace(/@media[^{]*\(hover: hover\)[^{]*\{[\s\S]*?\n {2}\}/g, '');
    expect(withoutHoverBlocks).not.toMatch(/:hover/);
  });

  it('foco visível em vermelho (border-focus-strong): por fora no gatilho e por dentro dos itens', () => {
    expect(style).toMatch(/\.header-cases__trigger:focus-visible \{\s*outline: 2px solid var\(--border-focus-strong\);\s*outline-offset: 2px;/);
    expect(style).toMatch(/\.header-cases__link:focus-visible \{\s*outline: 2px solid var\(--border-focus-strong\);\s*outline-offset: -2px;/);
  });

  it('forced-colors: a borda do painel continua visível e o hover usa as cores do sistema', () => {
    expect(style).toMatch(/@media \(forced-colors: active\) \{\s*\.header-cases__panel \{\s*border-color: CanvasText;/);
    expect(style).toMatch(/@media \(forced-colors: active\) and \(hover: hover\) \{\s*\.header-cases__link:hover \{\s*background-color: Highlight;\s*color: HighlightText;/);
  });

  it('sem animação: nada de transition ou keyframes (prefers-reduced-motion não precisa de exceção)', () => {
    expect(style).not.toMatch(/transition|@keyframes|animation/);
  });
});
