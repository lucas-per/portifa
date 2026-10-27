import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf-8');
const styleOf = (file: string) => file.slice(file.indexOf('<style>'));

/** O corpo do bloco `{ ... }` que abre em `start` (conta as chaves aninhadas). */
function block(css: string, start: string) {
  const from = css.indexOf(start);
  expect(from, `${start} não encontrado`).toBeGreaterThan(-1);
  const open = css.indexOf('{', from);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error(`${start} sem fechamento`);
}

const TABLET = '@media (min-width: 768px) and (max-width: 1087px)';
const layout = styleOf(read('../../../pages/cases/[slug].astro'));

describe('esqueleto do case a texto ampliado', () => {
  it('no celular a coluna estica (não encolhe ao conteúdo nem cresce até a palavra mais longa)', () => {
    const content = block(block(layout, '@media (max-width: 767px)'), '.case-layout__content {');
    expect(content).toMatch(/align-self: stretch;/);
    expect(content).toMatch(/min-width: 0;/);
  });

  it('no tablet (pontos de 768 e 1087px, que já existiam) a coluna encolhe e o respiro direito é min(88px, 11,5vw)', () => {
    const content = block(block(layout, TABLET), '.case-layout__content {');
    expect(content).toMatch(/min-width: 0;/);
    expect(content).toMatch(/padding-right: min\(var\(--scale-x20\), 11\.5vw\);/);
    expect(layout.match(/@media \(min-width: 768px\) and \(max-width: 1087px\)/g)).toHaveLength(1);
  });

  it('a margem do menu lateral no tablet é min(48px, 6,25vw)', () => {
    const menu = styleOf(read('./SideMenu.astro'));
    expect(block(block(menu, TABLET), '.side-menu {')).toMatch(/margin-right: min\(var\(--scale-x12\), 6\.25vw\);/);
  });

  it('as 10 seções recuam min(48px, 6,25vw) no tablet', () => {
    const sections: Record<string, string> = {
      'CaseSummary.astro': '.case-summary {',
      'CaseContext.astro': '.case-context {',
      'CaseProblems.astro': '.case-problems {',
      'CaseDiscovery.astro': '.case-discovery {',
      'CaseDiscoveryTopics.astro': '.case-discovery-topics {',
      'CaseDelivery.astro': '.case-delivery {',
      'CaseDeliveryFlows.astro': '.case-delivery-flows {',
      'CaseImpact.astro': '.case-impact {',
      'CasePlansAhead.astro': '.case-plans-ahead {',
      'BackToTopButton.astro': '.back-to-top {',
    };
    for (const [file, selector] of Object.entries(sections)) {
      const css = styleOf(read(`./${file}`));
      expect(block(block(css, TABLET), selector), file).toMatch(/padding-left: min\(var\(--scale-x12\), 6\.25vw\);/);
    }
  });
});

describe('componentes do case a texto ampliado', () => {
  it('Resumo: a coluna de cada card não cresce até a palavra mais longa (até 1087px); as 3 colunas de 1088px em diante não mudaram', () => {
    const css = styleOf(read('./CaseSummary.astro'));
    expect(block(block(css, '@media (max-width: 1087px)'), '.case-summary__col {')).toMatch(/grid-template-columns: minmax\(0, 1fr\);/);
    expect(block(css, '.case-summary__grid {')).toMatch(/grid-template-columns: repeat\(3, minmax\(min-content, 1fr\)\);/);
  });

  it('Discovery: o texto da fase pode encolher até 1087px', () => {
    const css = styleOf(read('./CaseDiscovery.astro'));
    expect(block(block(css, '@media (max-width: 1087px)'), '.case-discovery__phase-content {')).toMatch(/min-width: 0;/);
  });

  it('tópicos da Jornada e linha do Contexto esticam no celular', () => {
    const topics = styleOf(read('./CaseDiscoveryTopics.astro'));
    const context = styleOf(read('./CaseContext.astro'));
    expect(block(block(topics, '@media (max-width: 767px)'), '.case-discovery-topics__topic {')).toMatch(/align-items: stretch;/);
    expect(block(block(context, '@media (max-width: 767px)'), '.case-context__row {')).toMatch(/align-items: stretch;/);
  });

  it('selo LEGADA no tablet: afastamento min(8px, 1,05vw)', () => {
    const context = styleOf(read('./CaseContext.astro'));
    const tag = block(block(context, TABLET), '.case-context__tag {');
    expect(tag).toMatch(/top: min\(var\(--scale-x2\), 1\.05vw\);/);
    expect(tag).toMatch(/left: min\(var\(--scale-x2\), 1\.05vw\);/);
  });

  it('destaque do Impacto: 200px, mas nunca mais largo que a linha', () => {
    const css = styleOf(read('./CaseImpact.astro'));
    expect(block(css, '.case-impact__highlight {')).toMatch(/min-width: min\(200px, 100% - var\(--scale-x12\) - 4px\);/);
  });

  it('cabeçalho: breadcrumb e meta ("1 minuto") quebram linha', () => {
    const css = styleOf(read('./CaseHeader.astro'));
    expect(block(css, '.case-header__breadcrumb {')).toMatch(/flex-wrap: wrap;/);
    expect(block(css, '.case-header__meta {')).toMatch(/flex-wrap: wrap;/);
  });

  it('selo de teste: não passa da linha e o rótulo quebra dentro dele', () => {
    const css = styleOf(read('../../ui/TestResultBadge.astro'));
    const badge = block(css, '.test-result-badge {');
    expect(badge).toMatch(/max-width: 100%;/);
    expect(badge).toMatch(/overflow-wrap: anywhere;/);
  });

  it('títulos (h1 a h6) dentro de <main> também quebram a palavra que não cabe (break-word)', () => {
    const base = styleOf(read('../../../layouts/BaseLayout.astro'));
    expect(block(base, ':global(main :where(p, li, figcaption, dd, dt, h1, h2, h3, h4, h5, h6))')).toMatch(/overflow-wrap: break-word;/);
  });
});
