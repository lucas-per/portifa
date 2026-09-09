import { describe, expect, it } from 'vitest';
import { getEnabledSections, macroSections } from './navigation';

describe('macroSections', () => {
  it('lista as 4 macro-seções previstas no PRD (seção 2), na ordem da arquitetura de informação', () => {
    expect(macroSections.map((section) => section.key)).toEqual([
      'portfolio',
      'artigos',
      'projetos',
      'fotos',
    ]);
  });

  it('só "portfolio" está habilitado no V1', () => {
    expect(macroSections.find((section) => section.key === 'portfolio')?.enabled).toBe(true);
    expect(macroSections.find((section) => section.key === 'artigos')?.enabled).toBe(false);
    expect(macroSections.find((section) => section.key === 'projetos')?.enabled).toBe(false);
    expect(macroSections.find((section) => section.key === 'fotos')?.enabled).toBe(false);
  });
});

describe('getEnabledSections', () => {
  it('retorna só as seções habilitadas', () => {
    const enabled = getEnabledSections();
    expect(enabled).toHaveLength(1);
    expect(enabled[0].key).toBe('portfolio');
    expect(enabled[0].path).toBe('/');
  });
});
