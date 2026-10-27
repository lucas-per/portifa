import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import pkg from '../../../package.json';

const strip = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '');
const toastCss = strip(readFileSync(createRequire(import.meta.url).resolve('uaiui-ds/components/toast.css'), 'utf-8'));
const rule = (selector: string) => toastCss.match(new RegExp(`${selector.replace(/[.>]/g, '\\$&')} \\{([^}]*)\\}`))?.[1] ?? '';

describe('uaiui-ds v0.3.4: o toast quebra linha com texto ampliado (reflow, WCAG 1.4.10)', () => {
  it('a dependência aponta para a tag v0.3.4', () => {
    expect(pkg.dependencies['uaiui-ds']).toBe('github:lucas-per/uaiui-ds#v0.3.4');
  });

  it('o corpo do toast quebra linha', () => {
    expect(rule('.uai-toast__body')).toMatch(/flex-wrap: wrap;/);
  });

  it('o conteúdo tem base de 4rem (largura mínima antes de a linha quebrar)', () => {
    expect(rule('.uai-toast__content')).toMatch(/flex: 1 1 4rem;/);
  });

  it('o botão de fechar desce para a linha de baixo alinhado ao fim', () => {
    expect(rule('.uai-toast__body > .uai-icon-button')).toMatch(/margin-inline-start: auto;/);
  });
});

describe('o site não sobrescreve o toast do pacote', () => {
  const srcDir = fileURLToPath(new URL('../../', import.meta.url));
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.(css|astro)$/.test(entry.name)) files.push(path);
    }
  };
  walk(srcDir);

  it('nenhum CSS do site tem regra para as partes do toast (.uai-toast__body, __content, __bar, __icon) nem para o fechar dentro dele', () => {
    const css = (file: string) =>
      file.endsWith('.astro')
        ? [...readFileSync(file, 'utf-8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
        : readFileSync(file, 'utf-8');
    const offenders = files.filter((file) => /\.uai-toast__(body|content|bar|icon|title|message)\b|\.uai-toast\s+\.uai-icon-button/.test(strip(css(file))));
    expect(offenders).toEqual([]);
  });
});
