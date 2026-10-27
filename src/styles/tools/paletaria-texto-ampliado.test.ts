import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('./color-decomposer.css', import.meta.url), 'utf-8');

/** O corpo da regra cujo seletor começa em `selector` (primeira ocorrência, no início de uma linha). */
function rule(selector: string) {
  const from = css.search(new RegExp(`^${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{`, 'm'));
  expect(from, `${selector} não encontrado`).toBeGreaterThan(-1);
  const open = css.indexOf('{', from);
  const close = css.indexOf('}', open);
  return css.slice(open + 1, close);
}

const ONE_COL = /grid-template-columns: minmax\(0, 1fr\);/;

describe('Paletaria a texto ampliado (site 1.4.7)', () => {
  it('os grids de coluna única não crescem até a palavra mais longa', () => {
    for (const sel of ['.cd .rail', '.cd .rail__body', '.cd .group', '.cd .field', '.cd .tune', '.cd .tune__body', '.cd .tune__row', '.cd .tune__actions', '.cd .dialog__body', '.cd .help__inner', '.cd .help__section', '.cd .help__toc', '.cd .help__faq', '.cd .help__list', '.cd .help__a', '.cd .code']) {
      expect(rule(sel), sel).toMatch(ONE_COL);
    }
  });

  it('HEX: mini paleta de 13rem que encolhe e campo que desce para a linha de baixo quando não cabe', () => {
    expect(rule('.cd .hexrow')).toMatch(/display: flex; flex-wrap: wrap;/);
    expect(rule('.cd .hexrow > .mini')).toMatch(/flex: 0 1 13rem;/);
    const input = rule('.cd .hexrow > .input');
    expect(input).toMatch(/flex: 1 1 3rem;/);
    expect(input).toMatch(/min-width: 3rem;/);
  });

  it('botões e alternadores crescem em altura (min-height com o mesmo valor) e o texto quebra', () => {
    const btn = rule('.cd .btn');
    expect(btn).toMatch(/min-height: var\(--control\);/);
    expect(btn).not.toMatch(/[^-]height: var\(--control\)/);
    expect(btn).toMatch(/white-space: normal;/);
    expect(btn).toMatch(/overflow-wrap: anywhere;/);
    expect(css).toMatch(/\.cd \.btn--sm \{[^}]*min-height: 2\.25rem;/);
    expect(rule('.cd .segmented')).toMatch(/min-height: var\(--control\);/);
    expect(rule('.cd .segmented__item span')).toMatch(/overflow-wrap: anywhere;/);
  });

  it('rótulos, valores e cabeçalho do detalhe quebram dentro do cartão', () => {
    for (const sel of ['.cd .field__label', '.cd .value__label', '.cd .value__hex', '.cd .switch__label', '.cd .dialog__title', '.cd .help__h2']) {
      expect(rule(sel), sel).toMatch(/overflow-wrap: anywhere;/);
    }
    expect(rule('.cd .tune__label')).toMatch(/flex-wrap: wrap;/);
    // detalhe e amostra não usam flex-wrap: o wrap descia a etiqueta a 100% em 320px (a página ficava até 59px mais alta)
    for (const sel of ['.cd .detail__head', '.cd .sample']) expect(rule(sel), sel).not.toMatch(/flex-wrap/);
  });

  it('painel de detalhes: empilha título/Fechar e amostra/etiqueta só quando tem menos de 14rem (consulta de contêiner em rem, nunca dispara a 100%)', () => {
    expect(css).toMatch(/\.cd \.detail \{ container-type: inline-size; \}/);
    const q = css.slice(css.indexOf('@container (max-width: 14rem)'));
    expect(q).toMatch(/\.cd \.detail__head, \.cd \.sample \{ flex-direction: column;/);
    expect(q).toMatch(/\.cd \.detail__close, \.cd \.sample__tag \{ white-space: normal; overflow-wrap: anywhere;/);
    expect(rule('.cd .detail__close')).toMatch(/white-space: nowrap;/);
    expect(rule('.cd .sample__tag')).toMatch(/white-space: nowrap;/);
    expect(q).toMatch(/\.cd \.values \{ grid-template-columns: minmax\(0, 1fr\); justify-items: start; \}/);
    // a consulta vem depois das regras-base que ela sobrescreve (mesma especificidade)
    expect(css.indexOf('@container (max-width: 14rem)')).toBeGreaterThan(css.indexOf('.cd .values {'));
  });

  it('lista de níveis: com menos de 16rem o botão de copiar vai para uma linha própria e o texto quebra (contêiner em rem, nunca dispara a 100%)', () => {
    expect(rule('.cd .cell')).toMatch(/container-type: inline-size;/);
    const q = css.slice(css.indexOf('@container (max-width: 16rem)'), css.indexOf('@container (max-width: 14rem)'));
    expect(q).toMatch(/\.cd \.swatch \{ flex-wrap: wrap;[^}]*padding-bottom: calc\(var\(--control\) \+ \.75rem\);/);
    expect(q).toMatch(/\.cd \.swatch__copy \{ align-self: end;/);
    expect(q).toMatch(/\.cd \.swatch__meta \{ align-items: flex-start;/);
    // padding e botão de copiar só mudam dentro da consulta
    expect(rule('.cd .swatch')).toMatch(/padding: \.5rem calc\(var\(--pr\) \+ var\(--control\) \+ \.75rem\) \.5rem \.75rem;/);
    expect(css.match(/@container/g)).toHaveLength(2);
  });

  it('nenhum ponto de quebra novo nem mudança no layout lado a lado (limite A ≥ 901px, família L2/S2/C2)', () => {
    expect(css.match(/@media \(min-width: 56\.3125rem\)/g)).toHaveLength(3);
    expect(css).toMatch(/\.cd \.stage \{ grid-template-columns: 24\.5rem minmax\(0, 1fr\);/);
    expect(css).not.toMatch(/\.cd \.detail \{[^}]*min-width: 0/);
  });
});
