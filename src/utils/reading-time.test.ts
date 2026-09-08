import { describe, expect, it } from 'vitest';
import { countWords, estimateReadingTime, extractText } from './reading-time';

describe('countWords', () => {
  it('conta palavras separadas por espaço', () => {
    expect(countWords('uma frase com cinco palavras aqui')).toBe(6);
  });

  it('retorna 0 para string vazia ou só espaços', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
  });
});

describe('extractText', () => {
  it('extrai texto de strings diretamente', () => {
    expect(extractText('olá mundo')).toBe('olá mundo');
  });

  it('concatena texto de arrays e objetos aninhados', () => {
    const input = {
      intro: 'introdução',
      phases: [
        { title: 'Fase 1', description: 'descrição da fase um' },
        { title: 'Fase 2', description: 'descrição da fase dois' },
      ],
    };
    const text = extractText(input);
    expect(text).toContain('introdução');
    expect(text).toContain('Fase 1');
    expect(text).toContain('descrição da fase dois');
  });

  it('ignora metadados de imagem resolvidos pelo astro:assets (não conta como texto)', () => {
    const input = {
      description: 'legenda real',
      image: { src: '/_astro/foto.abc123.webp', width: 800, height: 600, format: 'webp' },
    };
    const text = extractText(input);
    expect(text).toContain('legenda real');
    expect(text).not.toContain('_astro');
    expect(text).not.toContain('webp');
  });

  it('ignora valores não textuais (número, booleano, null, undefined)', () => {
    const input = { count: 3, active: true, missing: null, absent: undefined };
    expect(extractText(input).trim()).toBe('');
  });
});

describe('estimateReadingTime', () => {
  it('arredonda para cima (PRD 4.2: palavras / 200-238 wpm)', () => {
    // 201 palavras a 200 wpm = 1.005 -> arredonda para 2
    const text = Array.from({ length: 201 }, () => 'palavra').join(' ');
    expect(estimateReadingTime(text, 200)).toBe(2);
  });

  it('usa 200 wpm como padrão quando não informado', () => {
    const text = Array.from({ length: 400 }, () => 'palavra').join(' ');
    expect(estimateReadingTime(text)).toBe(2);
  });

  it('retorna 0 para conteúdo vazio', () => {
    expect(estimateReadingTime('')).toBe(0);
  });

  it('aceita um objeto de conteúdo estruturado (não só string)', () => {
    const content = {
      summary: Array.from({ length: 100 }, () => 'palavra').join(' '),
      problems: { description: Array.from({ length: 100 }, () => 'palavra').join(' ') },
    };
    expect(estimateReadingTime(content, 200)).toBe(1);
  });
});
