import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const markup = readFileSync(new URL('./ColorDecomposer.astro', import.meta.url), 'utf-8');
const tag = (id: string) => markup.match(new RegExp(`<[a-z]+ [^>]*id="${id}"[^>]*>`))?.[0] ?? '';

describe('Auto e Cor viva: indisponíveis, mas acessíveis', () => {
  for (const id of ['auto', 'vivid']) {
    it(`#${id} usa aria-disabled (não disabled) e aponta para o motivo`, () => {
      const button = tag(id);
      expect(button).toContain('aria-disabled="true"');
      expect(button).not.toMatch(/\sdisabled[\s>]/);
      expect(button).toContain(`aria-describedby="${id}-why"`);
      expect(tag(`${id}-why`)).not.toBe('');
    });
  }

  it('o aviso da Intensidade é um role="status" sempre presente', () => {
    expect(tag('tune-note')).toContain('role="status"');
    expect(tag('tune-note')).not.toContain('hidden');
  });
});
