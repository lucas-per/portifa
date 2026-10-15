import { describe, expect, it } from 'vitest';
import { inlineMarkup, stripInlineMarkup } from './inline-markup';

describe('inlineMarkup', () => {
  it('transforma **trecho** em <strong>', () => {
    expect(inlineMarkup('um **trecho** em negrito')).toBe('um <strong>trecho</strong> em negrito');
  });

  it('aceita vários trechos em negrito no mesmo parágrafo', () => {
    expect(inlineMarkup('**a** e **b**')).toBe('<strong>a</strong> e <strong>b</strong>');
  });

  it('devolve o texto igual quando não há marcação', () => {
    expect(inlineMarkup('texto simples, sem negrito.')).toBe('texto simples, sem negrito.');
  });

  it('escapa HTML cru para não aceitar tags vindas do conteúdo', () => {
    expect(inlineMarkup('<script>alert(1)</script> & "aspas"')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;aspas&quot;'
    );
  });

  it('escapa o conteúdo dentro do negrito também', () => {
    expect(inlineMarkup('**<b>x</b>**')).toBe('<strong>&lt;b&gt;x&lt;/b&gt;</strong>');
  });

  it('deixa ** sem par como texto', () => {
    expect(inlineMarkup('sobrou ** solto')).toBe('sobrou ** solto');
  });
});

describe('stripInlineMarkup', () => {
  it('remove os asteriscos e mantém o texto', () => {
    expect(stripInlineMarkup('Projeção de **+15%** e **+20%** no volume.')).toBe('Projeção de +15% e +20% no volume.');
  });

  it('devolve o texto igual quando não há marcação', () => {
    expect(stripInlineMarkup('texto simples.')).toBe('texto simples.');
  });

  it('deixa ** sem par como texto', () => {
    expect(stripInlineMarkup('sobrou ** solto')).toBe('sobrou ** solto');
  });
});
