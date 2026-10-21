import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { docsComponents, docsNavFlat, docsNavGroups, getDocsPage } from './uaiui-nav';

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

  it('todo link tem uma página: o menu não lista página que ainda não existe', () => {
    for (const item of docsNavFlat) expect(pageFileFor(item.href), item.href).toBeDefined();
  });

  it('a Introdução é a raiz e vem primeiro', () => {
    expect(docsNavFlat[0]).toMatchObject({ title: 'Introdução', href: '/projetos/uaiui/' });
  });

  it('grupo sem página não aparece (Componentes entra na PR B)', () => {
    expect(docsNavGroups.map((group) => group.title)).toEqual(['Começar']);
    expect(docsComponents).toEqual([]);
  });

  it('pager: anterior e próxima pela ordem do menu, com ou sem barra final', () => {
    expect(getDocsPage('/projetos/uaiui/')).toMatchObject({ current: { title: 'Introdução' }, prev: undefined, next: { title: 'Tokens e temas' } });
    expect(getDocsPage('/projetos/uaiui/tokens')).toMatchObject({ current: { title: 'Tokens e temas' }, prev: { title: 'Introdução' }, next: undefined });
    expect(getDocsPage('/cases/redesign/').current).toBeUndefined();
  });
});
