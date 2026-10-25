import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { getHeaderSections } from '../config/navigation';
import { getHeaderLinkText } from './header-link';

const sections = getHeaderSections();
const uaiui = sections.find((section) => section.key === 'uaiui')!;
const decomposer = sections.find((section) => section.key === 'color-decomposer')!;

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf-8');

describe('getHeaderLinkText', () => {
  it('desktop: rótulo completo vindo de macroSections, sem aria-label na Paletaria', () => {
    expect(getHeaderLinkText(decomposer, false)).toEqual({ text: 'Paletaria' });
  });

  it('mobile: rótulo curto igual ao completo, então sem aria-label na Paletaria', () => {
    expect(getHeaderLinkText(decomposer, true)).toEqual({ text: 'Paletaria' });
  });

  it('UaiUI DS: texto "UaiUI DS" e nome acessível "UaiUI DS, design system" no desktop e no mobile', () => {
    const expected = { text: 'UaiUI DS', ariaLabel: 'UaiUI DS, design system' };
    expect(getHeaderLinkText(uaiui, false)).toEqual(expected);
    expect(getHeaderLinkText(uaiui, true)).toEqual(expected);
  });

  it('accessibleName vale também quando o rótulo curto é diferente do completo', () => {
    expect(
      getHeaderLinkText({ label: 'Nome completo', shortLabel: 'Nome', accessibleName: 'Nome, explicado' }, true),
    ).toEqual({ text: 'Nome', ariaLabel: 'Nome, explicado' });
  });

  it('mobile com rótulo curto diferente: texto curto e aria-label com o rótulo completo', () => {
    expect(getHeaderLinkText({ label: 'Nome completo', shortLabel: 'Nome' }, true)).toEqual({
      text: 'Nome',
      ariaLabel: 'Nome completo',
    });
  });

  it('mobile sem rótulo curto: usa o rótulo completo e não põe aria-label', () => {
    expect(getHeaderLinkText({ label: 'Ferramentas' }, true)).toEqual({ text: 'Ferramentas' });
  });
});

describe('nome acessível contém o texto visível (WCAG 2.5.3)', () => {
  it.each([false, true])(
    'para toda seção do cabeçalho, o nome começa pelo texto visível, sem diferença de caixa (compact=%s)',
    (compact) => {
      expect(sections.length).toBeGreaterThan(0);
      for (const section of sections) {
        const { text, ariaLabel } = getHeaderLinkText(section, compact);
        const name = ariaLabel ?? text;
        expect(name.toLowerCase().startsWith(text.toLowerCase()), `${section.key}: "${name}" vs "${text}"`).toBe(true);
      }
    },
  );
});

describe('caixa alta e ordem do cabeçalho', () => {
  it('a caixa alta vem do CSS: o link usa .text-label-md, que tem text-transform: uppercase', () => {
    expect(read('../components/layout/HeaderLink.astro')).toMatch(/class="header-link__text text-label-md"/);
    const rule = read('../styles/tokens/typography.css').match(/\.text-label-md \{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toMatch(/text-transform: uppercase;/);
  });

  it('o desktop e o menu mobile renderizam na ordem de getHeaderSections(), sem reordenar', () => {
    for (const file of ['Header.astro', 'HeaderMobileMenu.astro']) {
      const source = read(`../components/layout/${file}`);
      expect(source, file).toMatch(/const sections = getHeaderSections\(\);/);
      expect(source, file).toMatch(/sections\.map\(/);
      expect(source, file).not.toMatch(/sections\.(sort|reverse|toSorted|toReversed)\(/);
    }
  });

  it('o desktop passa o nome acessível ao link', () => {
    const header = read('../components/layout/Header.astro');
    expect(header).toMatch(/getHeaderLinkText\(section, false\)/);
    expect(header).toMatch(/ariaLabel=\{ariaLabel\}/);
  });
});
