/**
 * Páginas da documentação do UaiUI (porte de src/data/nav.ts do uaiui-ds
 * v0.2.0). Alimenta o menu lateral, o botão "Páginas" no celular, a busca, o
 * pager e a seção "Componentes" da Introdução. Os caminhos já são os do site
 * (/projetos/uaiui/...), então o withBase do repositório do DS não veio junto.
 *
 * Só entra aqui página que existe: um grupo sem itens não aparece. Accordion,
 * Button e Toast entram no grupo "Componentes" junto com as páginas deles.
 */
export interface DocsNavItem {
  title: string;
  href: string;
  description: string;
  status?: 'novo';
}

export interface DocsNavGroup {
  title: string;
  items: DocsNavItem[];
}

export const docsNav: DocsNavGroup[] = [
  {
    title: 'Começar',
    items: [
      { title: 'Introdução', href: '/projetos/uaiui/', description: 'O que é o UaiUI e como a documentação está organizada.' },
      { title: 'Tokens e temas', href: '/projetos/uaiui/tokens/', description: 'Como as variables do Figma viram CSS, e como trocar tema e densidade.' },
    ],
  },
  {
    title: 'Componentes',
    items: [],
  },
];

export const docsNavGroups = docsNav.filter((group) => group.items.length > 0);

export const docsNavFlat = docsNav.flatMap((group) => group.items.map((item) => ({ ...item, group: group.title })));

export const docsComponents = docsNav.find((group) => group.title === 'Componentes')?.items ?? [];

function withTrailingSlash(path: string): string {
  return path.endsWith('/') ? path : `${path}/`;
}

/** Página atual (pelo caminho) e as vizinhas, para o pager. */
export function getDocsPage(pathname: string) {
  const index = docsNavFlat.findIndex((item) => item.href === withTrailingSlash(pathname));
  return {
    current: index >= 0 ? docsNavFlat[index] : undefined,
    prev: index > 0 ? docsNavFlat[index - 1] : undefined,
    next: index >= 0 && index < docsNavFlat.length - 1 ? docsNavFlat[index + 1] : undefined,
  };
}
