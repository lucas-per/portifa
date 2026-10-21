import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const header = readFileSync(new URL('./HeaderMobile.astro', import.meta.url), 'utf-8');
const menu = readFileSync(new URL('./HeaderMobileMenu.astro', import.meta.url), 'utf-8');

describe('menu do cabeçalho mobile (disclosure)', () => {
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

  it('a barra não tem mais links de seção (Paletaria e UaiUI vivem no menu)', () => {
    expect(header).not.toMatch(/getHeaderSections|HeaderLink/);
    expect(menu).toMatch(/getHeaderSections\(\)/);
  });

  it('o painel começa fechado (hidden), com a navegação num <nav> rotulado', () => {
    expect(menu).toMatch(/<div id=\{id\} class="site-menu-mobile" hidden>/);
    expect(menu).toMatch(/<nav class="site-menu-mobile__links" aria-label="Menu do site">/);
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
