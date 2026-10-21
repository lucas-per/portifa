import { describe, expect, it } from 'vitest';
import { stableId } from './stable-id';

describe('stableId', () => {
  it('o mesmo texto dá o mesmo id', () => {
    expect(stableId('ex', 'Tipos', '<button>')).toBe(stableId('ex', 'Tipos', '<button>'));
  });

  it('textos diferentes dão ids diferentes, inclusive quando só a divisão entre as partes muda', () => {
    expect(stableId('ex', 'a', '<b>')).not.toBe(stableId('ex', 'a', '<c>'));
    expect(stableId('ex', 'ab', 'c')).not.toBe(stableId('ex', 'a', 'bc'));
  });

  it('serve de id de HTML: começa por letra e só tem letras, números e hífen', () => {
    expect(stableId('ex', 'Título com acento e espaço', '<p class="x">çã</p>')).toMatch(/^ex-[a-z0-9]+$/);
  });
});
