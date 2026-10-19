import { describe, expect, it } from 'vitest';
import { DEFAULTS, parseHash, serialize } from './state.js';

// O hash é o formato de compartilhamento da ferramenta: um endereço salvo ou
// enviado antes da mudança para o site precisa abrir igual aqui.

describe('parseHash', () => {
  it('sem hash, usa os padrões e o modo do sistema', () => {
    expect(parseHash('', 'light')).toEqual({ ...DEFAULTS, mode: 'light' });
    expect(parseHash('', 'dark')).toEqual({ ...DEFAULTS, mode: 'dark' });
  });

  it('"Manter minha cor exata" começa desligado', () => {
    expect(DEFAULTS.exact).toBe(false);
  });

  it('lê um ajuste completo', () => {
    const s = parseHash(
      '#color=1a73e8&preset=aplica&strategy=brand-tint&level=AAA&mode=dark&tab=neutrals&exact=1&sel=300&view=ajuda',
      'light',
    );
    expect(s).toEqual({
      color: '#1a73e8',
      preset: 'aplica',
      strategy: 'brand-tint',
      level: 'AAA',
      mode: 'dark',
      tab: 'neutrals',
      exact: true,
      sel: '300',
      view: 'ajuda',
    });
  });

  it('ignora valores inválidos e mantém o padrão', () => {
    const s = parseHash('#color=zzzzzz&preset=outro&tab=cores&mode=sepia&exact=sim&view=config', 'light');
    expect(s).toEqual({ ...DEFAULTS, mode: 'light' });
  });

  // Ajustes que saíram da interface (2026-10-19): o endereço antigo abre, sem eles.
  it('ignora os ajustes que a interface não tem mais', () => {
    const s = parseHash(
      '#strategy=custom-tint&order=startLight&overlap=500&darkChroma=100&borderPalette=20&borderNeutrals=2' +
        '&failure=warn&customLight=111111&customDark=eeeeee&customFallback=brand-tint&neutralsOwn=1' +
        '&neutralsBase=445566&neutralsRef=200&txt=1&support=fcfbf2&normal=brand&vivid=1',
      'light',
    );
    expect(s).toEqual({ ...DEFAULTS, mode: 'light' });
  });

  // O Auto de antes mantinha a cor exata e mudava o nível (lvl): é o que o switch faz agora.
  it('um lvl antigo liga "Manter minha cor exata"', () => {
    expect(parseHash('#color=fcfbf2&lvl=20', 'light').exact).toBe(true);
    expect(parseHash('#lvl=abc', 'light').exact).toBe(false);
    expect(parseHash('#lvl=20&exact=0', 'light').exact).toBe(false);
  });

  it('corta a seleção em 40 caracteres', () => {
    expect(parseHash(`#sel=${'x'.repeat(60)}`, 'light').sel).toHaveLength(40);
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
    expect(serialize({ ...DEFAULTS, mode: 'light', color: '#1a73e8', exact: true }, 'light')).toBe(
      '#color=1a73e8&exact=1',
    );
  });

  it('volta ao mesmo hash depois de ler (ida e volta)', () => {
    const hash = '#color=1a73e8&preset=aplica&level=AAA&mode=dark&tab=behavior&exact=1&sel=normal&view=ajuda';
    expect(serialize(parseHash(hash, 'light'), 'light')).toBe(hash);
  });
});
