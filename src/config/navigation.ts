export type MacroSection = {
  key: string;
  label: string;
  path: string;
  enabled: boolean;
};

/**
 * Lista extensível de macro-seções (PRD seção 2). Adicionar uma seção nova
 * (Artigos/Projetos entram no V2, Fotos no V3) é só acrescentar uma entrada
 * aqui — Header e Footer renderizam a partir desta lista, sem mudar layout.
 */
export const macroSections: MacroSection[] = [
  { key: 'portfolio', label: 'Portfólio', path: '/', enabled: true },
  { key: 'artigos', label: 'Artigos', path: '/artigos', enabled: false },
  { key: 'projetos', label: 'Projetos', path: '/projetos', enabled: false },
  { key: 'fotos', label: 'Fotos', path: '/fotos', enabled: false },
];

export function getEnabledSections(): MacroSection[] {
  return macroSections.filter((section) => section.enabled);
}
