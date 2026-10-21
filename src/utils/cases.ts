/**
 * Ordem visual dos cases na Home no Figma (esquerda -> direita), não a ordem
 * alfabética dos arquivos: Área de pagamentos, Redesign, GoSafe DS. Vale também
 * para o menu do cabeçalho mobile.
 */
export const homeCaseOrder = ['jornada-pagamentos', 'redesign', 'gosafe-ds'];

/** Rota da página de um case (o card da Home e o menu mobile usam a mesma). */
export const caseHref = (id: string) => `/cases/${id}`;

type CaseLike = { id: string; data: { title: string; status: 'published' | 'coming-soon' } };

/** Cases da Home na ordem do Figma, sem o case de exemplo. */
export function sortCasesForHome<T extends CaseLike>(entries: T[]): T[] {
  return entries
    .filter((entry) => entry.id !== 'exemplo-case')
    .sort((a, b) => homeCaseOrder.indexOf(a.id) - homeCaseOrder.indexOf(b.id));
}

/** Links do menu mobile: só os cases publicados (os que a Home liga), na mesma ordem. */
export function getMenuCases(entries: CaseLike[]): { key: string; label: string; href: string }[] {
  return sortCasesForHome(entries)
    .filter((entry) => entry.data.status === 'published')
    .map((entry) => ({ key: entry.id, label: entry.data.title, href: caseHref(entry.id) }));
}
