import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const header = readFileSync(new URL('./Header.astro', import.meta.url), 'utf-8');
const style = header.slice(header.indexOf('<style>'));

const rule = (selector: string) =>
  style.match(new RegExp(`${selector.replace(/\./g, '\\.')} \\{([^}]*)\\}`))?.[1] ?? '';

describe('cabeçalho desktop (folga com Cases, UaiUI DS e Paletaria)', () => {
  it('o gap entre o logo e as ações é 16px (var(--scale-x4)), nas duas faixas', () => {
    const inner = rule('.site-header__inner');
    expect(inner).toMatch(/gap: var\(--scale-x4\);/);
    expect(inner).toMatch(/justify-content: space-between;/);
    // Sem gap próprio no @media de 1304px: o mesmo valor vale para as duas faixas.
    const wide = style.slice(style.indexOf('@media (min-width: 1304px)'), style.indexOf('@media (max-width: 887px)'));
    expect(wide.length).toBeGreaterThan(0);
    expect(wide).toMatch(/\.site-header__inner \{/);
    expect(wide).not.toMatch(/\.site-header__inner \{[^}]*gap:/);
  });

  it('o resto do espaçamento do Figma segue: 32px entre links e entre botões, 56px (1304px+) ou 32px entre links e botões', () => {
    expect(rule('.site-header__pages')).toMatch(/gap: var\(--scale-x8\);/);
    expect(rule('.site-header__cta')).toMatch(/gap: var\(--scale-x8\);/);
    expect(rule('.site-header__actions')).toMatch(/gap: var\(--scale-x8\);/);
    expect(style).toMatch(/\.site-header__actions \{\s*gap: var\(--scale-x14\);/);
  });

  it('padding de 20px no tablet e de 88px a partir de 1304px (logo completo); abaixo de 888px vale o mobile', () => {
    expect(rule('.site-header__inner')).toMatch(/padding: var\(--scale-x8\) var\(--scale-x5\);/);
    expect(style).toMatch(/@media \(min-width: 1304px\) \{\s*\.site-header__inner \{\s*padding: var\(--scale-x8\) var\(--scale-x20\);/);
    expect(style).toMatch(/@media \(max-width: 887px\) \{\s*\.site-header \{\s*display: none;/);
    expect(style).not.toMatch(/1184px\)|767px\)/);
  });

  it('o logo não encolhe e a borda de 5px do cabeçalho continua', () => {
    expect(rule('.site-header__logo')).toMatch(/flex-shrink: 0;/);
    expect(rule('.site-header')).toMatch(/border-bottom: 5px solid var\(--border-accent-strong\);/);
  });

  it('o gap não usa valor em px solto (escala de 4 via token)', () => {
    expect(rule('.site-header__inner')).not.toMatch(/gap: \d+px/);
  });
});

describe('cabeçalho desktop a texto ampliado (200%): quebra só quando falta espaço', () => {
  it('o contêiner e os três grupos (ações, links, botões) quebram linha', () => {
    for (const selector of ['.site-header__inner', '.site-header__actions', '.site-header__pages', '.site-header__cta']) {
      expect(rule(selector), selector).toMatch(/flex-wrap: wrap;/);
    }
  });

  it('entre linhas, 16px (var(--scale-x4)); os 32px e 56px de coluna continuam', () => {
    for (const selector of ['.site-header__actions', '.site-header__pages', '.site-header__cta']) {
      expect(rule(selector), selector).toMatch(/row-gap: var\(--scale-x4\);/);
    }
    // O gap do contêiner (16px) já vale nas duas direções: sem row-gap próprio.
    expect(rule('.site-header__inner')).not.toMatch(/row-gap/);
    expect(rule('.site-header__pages')).toMatch(/gap: var\(--scale-x8\);/);
  });

  it('o texto dos botões não quebra (quem quebra é a linha) e o do link também não', () => {
    expect(style).toMatch(/\.site-header__cta :global\(\.button\) \{\s*white-space: nowrap;\s*\}/);
    const link = readFileSync(new URL('./HeaderLink.astro', import.meta.url), 'utf-8');
    expect(link).toMatch(/white-space: nowrap;/);
  });

  it('a ordem do DOM é a visual: logo, links, botões (a quebra não reordena nada)', () => {
    const markup = header.slice(0, header.indexOf('<style>'));
    const at = (needle: string) => markup.indexOf(needle);
    expect(at('site-header__logo ')).toBeLessThan(at('site-header__pages'));
    expect(at('site-header__pages')).toBeLessThan(at('site-header__cta'));
    expect(style).not.toMatch(/\border:\s*-?\d/);
    expect(style).not.toMatch(/flex-direction:\s*(row|column)-reverse/);
  });

  it('o cabeçalho desktop não é sticky: rola com a página (só o mobile é)', () => {
    expect(rule('.site-header')).not.toMatch(/position:/);
    expect(style).not.toMatch(/position:\s*(sticky|fixed)/);
  });
});

describe('pontos de troca do cabeçalho (site 1.5.0): os mesmos valores em todos os lugares', () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf-8');
  const mobile = read('./HeaderMobile.astro');
  const cases = read('./HeaderCases.astro');
  const sideMenu = read('../sections/case/SideMenu.astro');
  const uaiui = read('../../styles/tools/uaiui-docs.css');
  const paletaria = read('../../pages/projetos/paletaria/index.astro');
  const home = read('../../pages/index.astro');

  it('o mobile vale até 887px e o desktop a partir de 888px (Header, HeaderMobile no CSS e no JS, HeaderCases)', () => {
    expect(style).toMatch(/@media \(max-width: 887px\)/);
    expect(mobile).toMatch(/@media \(max-width: 887px\)/);
    expect(mobile).toMatch(/matchMedia\('\(min-width: 888px\)'\)/);
    expect(cases).toMatch(/matchMedia\('\(max-width: 887px\)'\)/);
    for (const [name, source] of [['Header', header], ['HeaderMobile', mobile], ['HeaderCases', cases]]) {
      expect(source, name).not.toMatch(/(max-width: 767px|min-width: 768px)\)/);
    }
  });

  it('o logo completo vale a partir de 1304px (e só no Header)', () => {
    expect(style).toMatch(/@media \(min-width: 1304px\)/);
    expect(header).not.toMatch(/min-width: 1184px/);
  });

  it('na faixa de 768 a 887px (cabeçalho mobile, sticky), o que depende dele desconta a altura do cabeçalho', () => {
    const band = /@media \(min-width: 768px\) and \(max-width: 887px\)/;
    expect(sideMenu).toMatch(band);
    expect(sideMenu).toMatch(/\.side-menu \{\s*top: calc\(var\(--header-mobile-height\) \+ var\(--scale-x6\)\);/);
    expect(sideMenu).toMatch(/:global\(html\) \{\s*scroll-padding-top: calc\(var\(--header-mobile-height\) \+ var\(--scale-x2\)\);/);
    expect(uaiui).toMatch(band);
    expect(uaiui).toMatch(/top: calc\(var\(--header-mobile-height\) \+ var\(--scale-x10\)\);/);
    expect(home).toMatch(band);
    expect(home).toMatch(/scroll-padding-top: calc\(var\(--header-mobile-height\) \+ var\(--scale-x2\)\);/);
    // Até 887px: as regras que já existiam abaixo de 768px por causa do cabeçalho sticky.
    expect(uaiui).toMatch(/@media \(max-width: 887px\) \{\s*\.uaiui-docs \.uaiui-docs__body > h2 \{\s*scroll-margin-top/);
    expect(paletaria).toMatch(/@media \(max-width: 887px\) \{\s*html \{\s*scroll-padding-top/);
  });
});
