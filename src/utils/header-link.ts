import type { MacroSection } from '../config/navigation';

/**
 * Texto visível e nome acessível do link de uma macro-seção no cabeçalho.
 * No mobile o texto é o `shortLabel`; como ele abrevia o rótulo, o nome
 * acessível volta a ser o `label` completo (o texto visível continua contido
 * no nome, WCAG 2.5.3).
 */
export function getHeaderLinkText(
  section: Pick<MacroSection, 'label' | 'shortLabel'>,
  compact: boolean,
): { text: string; ariaLabel?: string } {
  if (compact && section.shortLabel && section.shortLabel !== section.label) {
    return { text: section.shortLabel, ariaLabel: section.label };
  }
  return { text: section.label };
}
