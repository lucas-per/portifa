import { describe, expect, it } from 'vitest';
import { getMenuCases, sortCasesForHome } from './cases';

const entry = (id: string, title: string, status: 'published' | 'coming-soon') => ({ id, data: { title, status } });
// Mesmos ids, títulos e status de src/content/cases/, em ordem alfabética (a do glob).
const entries = [
  entry('exemplo-case', 'Case de exemplo', 'coming-soon'),
  entry('gosafe-ds', 'Criando um design system', 'coming-soon'),
  entry('jornada-pagamentos', 'Área de pagamentos', 'published'),
  entry('redesign', 'Redesign de produto', 'published'),
];

describe('sortCasesForHome', () => {
  it('segue a ordem da Home e tira o case de exemplo', () => {
    expect(sortCasesForHome(entries).map((e) => e.id)).toEqual(['jornada-pagamentos', 'redesign', 'gosafe-ds']);
  });
});

describe('getMenuCases', () => {
  it('só os publicados, na ordem da Home, com o título do case e a rota dele', () => {
    expect(getMenuCases(entries)).toEqual([
      { key: 'jornada-pagamentos', label: 'Área de pagamentos', href: '/cases/jornada-pagamentos' },
      { key: 'redesign', label: 'Redesign de produto', href: '/cases/redesign' },
    ]);
  });

  it('"Criando um design system" fica de fora', () => {
    expect(getMenuCases(entries).some((c) => c.key === 'gosafe-ds')).toBe(false);
  });
});
