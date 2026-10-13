const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Converte o texto dos YAMLs de case em HTML seguro: escapa tudo e só
 * transforma `**trecho**` em <strong>. É o único markup aceito — os
 * textos do Figma misturam Regular e SemiBold no mesmo parágrafo, e o
 * YAML precisava de um jeito de marcar isso sem aceitar HTML cru.
 */
export function inlineMarkup(text: string): string {
  const escaped = text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
