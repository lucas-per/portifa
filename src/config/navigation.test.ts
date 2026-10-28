import { describe, expect, it } from 'vitest';
import { getAriaCurrent, getEnabledSections, getHeaderSections, macroSections } from './navigation';

describe('macroSections', () => {
  it('lista as 4 macro-seções previstas no PRD (seção 2), na ordem da arquitetura de informação', () => {
    expect(macroSections.map((section) => section.key)).toEqual([
      'portfolio',
      'uaiui',
      'color-decomposer',
      'artigos',
      'projetos',
      'fotos',
    ]);
  });

  it('só "portfolio", "color-decomposer" e "uaiui" estão habilitados', () => {
    expect(macroSections.find((section) => section.key === 'portfolio')?.enabled).toBe(true);
    expect(macroSections.find((section) => section.key === 'color-decomposer')?.enabled).toBe(true);
    expect(macroSections.find((section) => section.key === 'uaiui')?.enabled).toBe(true);
    expect(macroSections.find((section) => section.key === 'artigos')?.enabled).toBe(false);
    expect(macroSections.find((section) => section.key === 'projetos')?.enabled).toBe(false);
    expect(macroSections.find((section) => section.key === 'fotos')?.enabled).toBe(false);
  });
});

describe('getEnabledSections', () => {
  it('retorna só as seções habilitadas', () => {
    const enabled = getEnabledSections();
    expect(enabled.map((section) => section.key)).toEqual(['portfolio', 'uaiui', 'color-decomposer']);
    expect(enabled[0].path).toBe('/');
  });
});

describe('getHeaderSections', () => {
  it('traz o UaiUI DS e a Paletaria, nessa ordem, com rótulo completo, rótulo curto e caminho', () => {
    expect(getHeaderSections()).toEqual([
      expect.objectContaining({
        key: 'uaiui',
        label: 'UaiUI DS',
        shortLabel: 'UaiUI DS',
        path: '/projetos/uaiui/',
      }),
      expect.objectContaining({
        key: 'color-decomposer',
        label: 'Paletaria',
        shortLabel: 'Paletaria',
        path: '/projetos/paletaria/',
      }),
    ]);
  });

  it('guarda de ordem: UaiUI DS antes da Paletaria (Figma 98:398, 695:953 e 676:514)', () => {
    expect(getHeaderSections().map((section) => section.key)).toEqual(['uaiui', 'color-decomposer']);
  });

  it('só o UaiUI DS tem nome acessível próprio; a Paletaria segue sem aria-label', () => {
    const [uaiui, decomposer] = getHeaderSections();
    expect(uaiui.accessibleName).toBe('UaiUI DS, design system');
    expect(decomposer.accessibleName).toBeUndefined();
  });

  it('o rótulo não vem em caixa alta no texto: a caixa alta é do CSS', () => {
    for (const section of getHeaderSections()) {
      expect(section.label, section.key).not.toBe(section.label.toUpperCase());
      if (section.shortLabel) expect(section.shortLabel, section.key).not.toBe(section.shortLabel.toUpperCase());
    }
  });

  it('"Cases" não é macro-seção: o dropdown do desktop (HeaderCases.astro) não vira link no menu mobile, que tem o grupo próprio', () => {
    expect(macroSections.some((section) => /^cases?$/i.test(section.key) || /^cases$/i.test(section.label))).toBe(false);
    expect(getHeaderSections()).toHaveLength(2);
  });

  it('não repete a home, que já é o logo', () => {
    expect(getHeaderSections().some((section) => section.path === '/')).toBe(false);
  });
});

describe('getAriaCurrent', () => {
  const tool = '/projetos/paletaria/';

  it('"page" na página da ferramenta, com ou sem barra final', () => {
    expect(getAriaCurrent('/projetos/paletaria/', tool)).toBe('page');
    expect(getAriaCurrent('/projetos/paletaria', tool)).toBe('page');
  });

  it('nada na home nem em outras páginas', () => {
    expect(getAriaCurrent('/', tool)).toBeUndefined();
    expect(getAriaCurrent('/cases/pagamentos/', tool)).toBeUndefined();
  });

  it('"true" numa rota filha, para o dia em que o item virar "Projetos"', () => {
    expect(getAriaCurrent('/projetos/paletaria/', '/projetos/')).toBe('true');
    expect(getAriaCurrent('/projetos/', '/projetos/')).toBe('page');
  });

  it('"true" nas páginas internas do UaiUI', () => {
    expect(getAriaCurrent('/projetos/uaiui/', '/projetos/uaiui/')).toBe('page');
    expect(getAriaCurrent('/projetos/uaiui/tokens/', '/projetos/uaiui/')).toBe('true');
    expect(getAriaCurrent('/projetos/uaiui/tokens/', '/projetos/paletaria/')).toBeUndefined();
  });
});
