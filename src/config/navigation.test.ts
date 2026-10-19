import { describe, expect, it } from 'vitest';
import { getAriaCurrent, getEnabledSections, getHeaderSections, macroSections } from './navigation';

describe('macroSections', () => {
  it('lista as 4 macro-seções previstas no PRD (seção 2), na ordem da arquitetura de informação', () => {
    expect(macroSections.map((section) => section.key)).toEqual([
      'portfolio',
      'color-decomposer',
      'artigos',
      'projetos',
      'fotos',
    ]);
  });

  it('só "portfolio" e "color-decomposer" estão habilitados', () => {
    expect(macroSections.find((section) => section.key === 'portfolio')?.enabled).toBe(true);
    expect(macroSections.find((section) => section.key === 'color-decomposer')?.enabled).toBe(true);
    expect(macroSections.find((section) => section.key === 'artigos')?.enabled).toBe(false);
    expect(macroSections.find((section) => section.key === 'projetos')?.enabled).toBe(false);
    expect(macroSections.find((section) => section.key === 'fotos')?.enabled).toBe(false);
  });
});

describe('getEnabledSections', () => {
  it('retorna só as seções habilitadas', () => {
    const enabled = getEnabledSections();
    expect(enabled.map((section) => section.key)).toEqual(['portfolio', 'color-decomposer']);
    expect(enabled[0].path).toBe('/');
  });
});

describe('getHeaderSections', () => {
  it('traz o Color Decomposer, com rótulo completo, rótulo curto e caminho da ferramenta', () => {
    expect(getHeaderSections()).toEqual([
      expect.objectContaining({
        key: 'color-decomposer',
        label: 'Color Decomposer',
        shortLabel: 'Decomposer',
        path: '/projetos/decomposer/',
      }),
    ]);
  });

  it('não repete a home, que já é o logo', () => {
    expect(getHeaderSections().some((section) => section.path === '/')).toBe(false);
  });
});

describe('getAriaCurrent', () => {
  const tool = '/projetos/decomposer/';

  it('"page" na página da ferramenta, com ou sem barra final', () => {
    expect(getAriaCurrent('/projetos/decomposer/', tool)).toBe('page');
    expect(getAriaCurrent('/projetos/decomposer', tool)).toBe('page');
  });

  it('nada na home nem em outras páginas', () => {
    expect(getAriaCurrent('/', tool)).toBeUndefined();
    expect(getAriaCurrent('/cases/pagamentos/', tool)).toBeUndefined();
  });

  it('"true" numa rota filha, para o dia em que o item virar "Projetos"', () => {
    expect(getAriaCurrent('/projetos/decomposer/', '/projetos/')).toBe('true');
    expect(getAriaCurrent('/projetos/', '/projetos/')).toBe('page');
  });
});
