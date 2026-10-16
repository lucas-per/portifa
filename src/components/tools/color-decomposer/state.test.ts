import { describe, expect, it } from 'vitest';
import { DEFAULTS, parseHash, serialize } from './state.js';

// O hash é o formato de compartilhamento da ferramenta: um endereço salvo ou
// enviado antes da mudança para o site precisa abrir igual aqui.

describe('parseHash', () => {
  it('sem hash, usa os padrões e o modo do sistema', () => {
    expect(parseHash('', 'light')).toEqual({ ...DEFAULTS, mode: 'light' });
    expect(parseHash('', 'dark')).toEqual({ ...DEFAULTS, mode: 'dark' });
  });

  it('lê um ajuste completo', () => {
    const s = parseHash(
      '#color=1a73e8&preset=aplica&strategy=custom-tint&level=AAA&mode=dark&tab=neutrals&order=startLight' +
        '&overlap=500&darkChroma=100&borderPalette=20&borderNeutrals=2&lvl=300&normal=brand&vivid=1' +
        '&support=fcfbf2&failure=warn&customLight=111111&customDark=eeeeee&customFallback=brand-tint' +
        '&neutralsOwn=1&neutralsBase=445566&neutralsRef=200&txt=1&sel=300&view=ajuda',
      'light',
    );
    expect(s).toEqual({
      color: '#1a73e8',
      preset: 'aplica',
      strategy: 'custom-tint',
      level: 'AAA',
      mode: 'dark',
      tab: 'neutrals',
      order: 'startLight',
      overlap: '500',
      darkChroma: 100,
      borderPalette: '20',
      borderNeutrals: '2',
      lvl: '300',
      normal: 'brand',
      vivid: true,
      support: '#fcfbf2',
      failure: 'warn',
      customLight: '#111111',
      customDark: '#eeeeee',
      customFallback: 'brand-tint',
      neutralsOwn: true,
      neutralsBase: '#445566',
      neutralsRef: '200',
      txt: true,
      sel: '300',
      view: 'ajuda',
    });
  });

  it('ignora valores inválidos e mantém o padrão', () => {
    const s = parseHash(
      '#color=zzzzzz&preset=outro&tab=cores&mode=sepia&darkChroma=999&vivid=sim&support=123&view=config&lvl=abc',
      'light',
    );
    expect(s).toEqual({ ...DEFAULTS, mode: 'light' });
  });

  it('corta a seleção em 40 caracteres', () => {
    expect(parseHash(`#sel=${'x'.repeat(60)}`, 'light').sel).toHaveLength(40);
  });

  it('aceita cor de apoio e textos próprios vazios', () => {
    const s = parseHash('#support=&customLight=&customDark=', 'light');
    expect([s.support, s.customLight, s.customDark]).toEqual(['', '', '']);
  });
});

describe('serialize', () => {
  it('no estado padrão, o hash fica vazio', () => {
    expect(serialize({ ...DEFAULTS, mode: 'dark' }, 'dark')).toBe('');
  });

  it('o modo só entra quando difere do sistema', () => {
    expect(serialize({ ...DEFAULTS, mode: 'dark' }, 'light')).toBe('#mode=dark');
    expect(serialize({ ...DEFAULTS, mode: 'light' }, 'dark')).toBe('#mode=light');
  });

  it('grava cores sem # e booleanos como 1 e 0', () => {
    expect(serialize({ ...DEFAULTS, mode: 'light', color: '#1a73e8', txt: true }, 'light')).toBe(
      '#color=1a73e8&txt=1',
    );
  });

  it('volta ao mesmo hash depois de ler (ida e volta)', () => {
    const hash =
      '#color=1a73e8&preset=aplica&level=AAA&mode=dark&tab=behavior&darkChroma=70&lvl=200&normal=brand&vivid=1&sel=normal&view=ajuda';
    expect(serialize(parseHash(hash, 'light'), 'light')).toBe(hash);
  });
});
