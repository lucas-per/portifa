export type MacroSection = {
  key: string;
  label: string;
  path: string;
  enabled: boolean;
  /**
   * Entra como link no cabeçalho do site: na barra do desktop e no menu do
   * mobile (a barra do mobile não tem links de seção). A home já é o logo.
   */
  inHeader?: boolean;
  /** Rótulo curto, usado no menu mobile; o nome acessível segue `label`. */
  shortLabel?: string;
};

/**
 * Lista extensível de macro-seções (PRD seção 2). Adicionar uma seção nova
 * (Artigos/Projetos entram no V2, Fotos no V3) é só acrescentar uma entrada
 * aqui — Header e Footer renderizam a partir desta lista, sem mudar layout.
 */
export const macroSections: MacroSection[] = [
  { key: 'portfolio', label: 'Portfólio', path: '/', enabled: true },
  // Trocar por "Projetos" (/projetos/) é só mudar label, shortLabel e path.
  {
    key: 'color-decomposer',
    label: 'Paletaria',
    shortLabel: 'Paletaria',
    path: '/projetos/paletaria/',
    enabled: true,
    inHeader: true,
  },
  {
    key: 'uaiui',
    label: 'UaiUI',
    shortLabel: 'UaiUI',
    path: '/projetos/uaiui/',
    enabled: true,
    inHeader: true,
  },
  { key: 'artigos', label: 'Artigos', path: '/artigos', enabled: false },
  { key: 'projetos', label: 'Projetos', path: '/projetos', enabled: false },
  { key: 'fotos', label: 'Fotos', path: '/fotos', enabled: false },
];

export function getEnabledSections(): MacroSection[] {
  return macroSections.filter((section) => section.enabled);
}

export function getHeaderSections(): MacroSection[] {
  return getEnabledSections().filter((section) => section.inHeader);
}

function withTrailingSlash(path: string): string {
  return path.endsWith('/') ? path : `${path}/`;
}

/**
 * `aria-current` do link do cabeçalho: "page" na própria rota, "true" numa
 * rota filha da seção (ex.: /projetos/ quando a página é um projeto).
 */
export function getAriaCurrent(pathname: string, sectionPath: string): 'page' | 'true' | undefined {
  const current = withTrailingSlash(pathname);
  const section = withTrailingSlash(sectionPath);
  if (current === section) return 'page';
  if (section !== '/' && current.startsWith(section)) return 'true';
  return undefined;
}
