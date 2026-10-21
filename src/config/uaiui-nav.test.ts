import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { docsComponents, docsNav, docsNavFlat, docsNavGroups, getDocsPage } from './uaiui-nav';

const pagesDir = fileURLToPath(new URL('../pages/', import.meta.url));

/** Arquivo de página do Astro que serve o caminho (index.astro ou <nome>.astro). */
function pageFileFor(href: string) {
  const path = href.replace(/^\//, '').replace(/\/$/, '');
  return [`${pagesDir}${path}/index.astro`, `${pagesDir}${path}.astro`].find((file) => existsSync(file));
}

describe('uaiui-nav', () => {
  it('todo link fica sob /projetos/uaiui/ e termina em barra', () => {
    for (const item of docsNavFlat) expect(item.href).toMatch(/^\/projetos\/uaiui\/([a-z-]+\/)*$/);
  });

  it('as páginas de componente ficam em /projetos/uaiui/componentes/<nome>/', () => {
    expect(docsComponents.map((item) => item.href)).toEqual([
      '/projetos/uaiui/componentes/accordion/',
      '/projetos/uaiui/componentes/button/',
      '/projetos/uaiui/componentes/toast/',
    ]);
  });

  it('todo link tem uma página: o menu não lista página que ainda não existe', () => {
    for (const item of docsNavFlat) expect(pageFileFor(item.href), item.href).toBeDefined();
  });

  it('a Introdução é a raiz e vem primeiro', () => {
    expect(docsNavFlat[0]).toMatchObject({ title: 'Introdução', href: '/projetos/uaiui/' });
  });

  it('os grupos são Começar e Componentes, e o Toast é a novidade', () => {
    expect(docsNavGroups.map((group) => group.title)).toEqual(['Começar', 'Componentes']);
    expect(docsComponents.map((item) => item.title)).toEqual(['Accordion', 'Button', 'Toast']);
    expect(docsComponents.filter((item) => item.status === 'novo').map((item) => item.title)).toEqual(['Toast']);
  });

  it('grupo sem página não aparece no menu (docsNavGroups só traz grupos com itens)', () => {
    expect(docsNavGroups.every((group) => group.items.length > 0)).toBe(true);
    expect(docsNavGroups.length).toBeLessThanOrEqual(docsNav.length);
  });

  it('pager: anterior e próxima pela ordem do menu, com ou sem barra final', () => {
    expect(getDocsPage('/projetos/uaiui/')).toMatchObject({ current: { title: 'Introdução' }, prev: undefined, next: { title: 'Tokens e temas' } });
    expect(getDocsPage('/projetos/uaiui/tokens')).toMatchObject({ current: { title: 'Tokens e temas' }, prev: { title: 'Introdução' }, next: { title: 'Accordion' } });
    expect(getDocsPage('/projetos/uaiui/componentes/button/')).toMatchObject({ prev: { title: 'Accordion' }, next: { title: 'Toast' } });
    expect(getDocsPage('/projetos/uaiui/componentes/toast/')).toMatchObject({ prev: { title: 'Button' }, next: undefined });
    expect(getDocsPage('/cases/redesign/').current).toBeUndefined();
  });
});
