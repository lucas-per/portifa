type ImageMetadataLike = {
  src: string;
  width: number;
  height: number;
  format: string;
};

function isImageMetadata(value: unknown): value is ImageMetadataLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'src' in value &&
    'width' in value &&
    'height' in value &&
    'format' in value
  );
}

/** Percorre um valor arbitrário (string, array ou objeto aninhado) e concatena todo texto encontrado, ignorando metadados de imagem resolvidos pelo astro:assets. */
export function extractText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(extractText).join(' ');
  if (isImageMetadata(value)) return '';
  if (value && typeof value === 'object') {
    return Object.values(value).map(extractText).join(' ');
  }
  return '';
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === '') return 0;
  return trimmed.split(/\s+/).length;
}

/** PRD 4.2: contagem de palavras ÷ 200-238 wpm, arredondado para cima. */
export function estimateReadingTime(content: unknown, wordsPerMinute = 200): number {
  const text = extractText(content);
  const wordCount = countWords(text);
  if (wordCount === 0) return 0;
  return Math.ceil(wordCount / wordsPerMinute);
}
