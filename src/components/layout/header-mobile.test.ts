import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const header = readFileSync(new URL('./HeaderMobile.astro', import.meta.url), 'utf-8');
const menu = readFileSync(new URL('./HeaderMobileMenu.astro', import.meta.url), 'utf-8');

describe('menu do cabeçalho mobile (painel de tela cheia)', () => {
  it('botão com aria-expanded, aria-controls e nome acessível "Abrir menu"', () => {
    const button = header.match(/<button[\s\S]*?>/)?.[0] ?? '';
    expect(button).toMatch(/type="button"/);
    expect(button).toMatch(/aria-expanded="false"/);
    expect(button).toMatch(/aria-controls=\{menuId\}/);
    expect(button).toMatch(/aria-label="Abrir menu"/);
  });

  it('o script alterna o nome entre "Abrir menu" e "Fechar menu" e só usa hidden', () => {
    expect(header).toMatch(/open \? 'Fechar menu' : 'Abrir menu'/);
    expect(header).toMatch(/panel\.hidden = !open/);
  });

  it('fecha com Esc (devolvendo o foco), ao escolher um link e ao passar para o cabeçalho desktop (768px)', () => {
    expect(header).toMatch(/event\.key !== 'Escape'/);
    expect(header).toMatch(/toggle\.focus\(\)/);
    expect(header).toMatch(/closest\('a'\)/);
    expect(header).toMatch(/matchMedia\('\(min-width: 768px\)'\)/);
  });

  it('com o menu aberto o resto da página fica inert (e volta ao fechar), sem prender o foco', () => {
    expect(header).toMatch(/element\.inert = true/);
    expect(header).toMatch(/element\.inert = false/);
    expect(header).toMatch(/!element\.contains\(header\)/);
    expect(header).not.toMatch(/key === 'Tab'|focusin|focustrap/i);
  });

  it('volta do cache do histórico com o menu fechado (pageshow)', () => {
    expect(header).toMatch(/addEventListener\('pageshow'[\s\S]*?event\.persisted[\s\S]*?setOpen\(false\)/);
  });

  it('aberto, a barra esconde o e-mail e o divisor de 5px (fora do Tab e da árvore de acessibilidade)', () => {
    expect(header).toMatch(/header\.toggleAttribute\('data-menu-open', open\)/);
    const rule = header.match(/\[data-menu-open\] \.site-header-mobile__divider,\s*\.site-header-mobile\[data-menu-open\] \.site-header-mobile__cta \{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toMatch(/display: none;/);
    expect(header).toMatch(/\[data-menu-open\] \.site-header-mobile__bar \{\s*gap: 0;/);
  });

  it('a barra não tem mais links de seção (Paletaria e UaiUI vivem no menu)', () => {
    expect(header).not.toMatch(/getHeaderSections|HeaderLink/);
    expect(menu).toMatch(/getHeaderSections\(\)/);
  });

  it('o painel começa fechado (hidden), com a navegação num <nav> rotulado', () => {
    expect(menu).toMatch(/<div id=\{id\} class="site-menu-mobile" hidden>/);
    expect(menu).toMatch(/<nav class="site-menu-mobile__links" aria-label="Menu do site">/);
  });

  it('grupos Cases e Projetos: o rótulo é o nome acessível da lista', () => {
    expect(menu).toMatch(/<p id=\{casesLabelId\} class="site-menu-mobile__label text-label-sm">Cases<\/p>/);
    expect(menu).toMatch(/<p id=\{projectsLabelId\} class="site-menu-mobile__label text-label-sm">Projetos<\/p>/);
    expect(menu).toMatch(/aria-labelledby=\{casesLabelId\}/);
    expect(menu).toMatch(/aria-labelledby=\{projectsLabelId\}/);
  });

  it('divisor entre os grupos: 156px, fora do padding lateral (o padding é de cada grupo)', () => {
    expect(menu).toMatch(/<Divider width="156px"/);
    const nav = menu.match(/\.site-menu-mobile__links \{([^}]*)\}/)?.[1] ?? '';
    expect(nav).toMatch(/padding: var\(--scale-x10\) 0;/);
    expect(nav).toMatch(/gap: var\(--scale-x6\);/);
    const group = menu.match(/\.site-menu-mobile__group \{([^}]*)\}/)?.[1] ?? '';
    expect(group).toMatch(/padding: 0 var\(--scale-x5\);/);
    expect(menu).toMatch(/__group--projects \{\s*padding-top: var\(--scale-x4\);/);
  });

  it('o painel termina no mini-rodapé: sem o divisor de 5px do fim', () => {
    expect(menu).not.toMatch(/site-menu-mobile__bottom|header-mobile-divider/);
  });

  it('altura: da tela menos a barra, com 100vh e depois 100dvh, rolando sozinho', () => {
    const rule = menu.match(/\.site-menu-mobile \{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toMatch(/height: calc\(100vh - 100%\);\s*height: calc\(100dvh - 100%\);/);
    expect(rule).toMatch(/position: absolute;/);
    expect(rule).toMatch(/overflow-y: auto;/);
  });

  it('mini-rodapé: ícones GitHub, LinkedIn, E-mail (sem CV) e © com ano e versão, sem o titular', () => {
    expect(menu).toMatch(/menuFooterLinks\.map/);
    expect(menu).not.toMatch(/contactLinks|copyrightHolder|download/);
    expect(menu).toMatch(/&copy; \{copyrightYear\} &middot; \{siteVersion\}/);
    expect(menu).toMatch(/\.site-menu-mobile__footer \{[^}]*background-color: var\(--surface-bg-tertiary-subtle\);/);
  });

  it('em forced-colors o divisor curto e o divider-trail usam a cor do texto', () => {
    const block = menu.match(/@media \(forced-colors: active\) \{([\s\S]*?)\n  \}/)?.[1] ?? '';
    expect(block).toMatch(/site-menu-mobile__divider/);
    expect(block).toMatch(/site-menu-mobile__trail/);
    expect(block).toMatch(/background-color: CanvasText !important;/);
  });

  it('o painel não depende de animação', () => {
    expect(menu).not.toMatch(/transition:(?!\s*(transform 0\.1s|none))/);
    expect(menu).not.toMatch(/@keyframes|animation/);
  });

  it('botões do mini-rodapé: nome acessível e ícone de 24px com 8px de padding e borda de 3px (46px)', () => {
    expect(menu).toMatch(/aria-label=\{link\.ariaLabel\}/);
    const rule = menu.match(/\.site-menu-mobile__icon-button \{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toMatch(/padding: var\(--scale-x2\);/);
    expect(rule).toMatch(/border: 3px solid/);
  });
});
