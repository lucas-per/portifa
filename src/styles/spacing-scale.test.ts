import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/**
 * Regra de espaçamento: o que definimos (padding, margin, gap, width, height,
 * min-/max-) é múltiplo de 4px, com exceção de 0, 1 e 2 (em rem, múltiplos de
 * 0,25rem). Ficam fora: a escala de forma (bordas de 2 e 3px, dividers e
 * sombras de 3 e 5px), tipografia e dimensões que vêm do conteúdo. Valores com
 * calc(), clamp(), min() e max() não são avaliados. Ver design-notes.md.
 */
const srcDir = fileURLToPath(new URL('../', import.meta.url));

const DIMENSION =
  /^(padding|margin)(-(top|right|bottom|left|inline|block)(-(start|end))?)?$|^(row-|column-)?gap$|^(min-|max-)?(width|height)$/;

/** Dividers de 3px (escala de forma): a classe inteira fica fora da regra, para qualquer dimensão. */
const SHAPE_CLASSES = new Set([
  'site-footer__divider-line',
  'site-footer-mobile__divider-line',
  'case-accordion__divider',
  'case-discovery__timeline-line',
  'case-layout__divider',
]);

/**
 * Violações que já existiam quando a regra entrou. A lista só pode encolher:
 * uma entrada que deixa de violar faz o teste falhar até ser removida.
 * Formato: arquivo::propriedade: valor (uma linha por ocorrência).
 */
const KNOWN_EXCEPTIONS: string[] = [
  // Figma: 14px (size/scale-x3_5), sem token na escala (comentário em HeaderLink.astro)
  'components/layout/HeaderLink.astro::padding: 0.875rem 0',
  // Figma: largura do menu lateral (frame desktop-case)
  'components/sections/case/SideMenu.astro::width: 234px',
  // Figma: miniatura da imagem do tópico; o mesmo 107 está em width/widths/sizes do <CaseImage>
  'components/sections/case/CaseDiscoveryTopics.astro::width: 107px',
  // Figma: miolo do case, fecha os 1440px do frame (conta no comentário de [slug].astro)
  'pages/cases/[slug].astro::max-width: 977px',
  // App v0.2.0, ainda sem migrar para a escala do site (fase 2)
  'styles/tools/color-decomposer.css::gap: .625rem',
  'styles/tools/color-decomposer.css::padding: 0 .875rem',
  'styles/tools/color-decomposer.css::margin-left: .625rem',
  'styles/tools/color-decomposer.css::gap: .375rem',
  'styles/tools/color-decomposer.css::padding-left: .625rem',
  'styles/tools/color-decomposer.css::margin-top: -.625rem',
  'styles/tools/color-decomposer.css::padding: .875rem 1rem',
  'styles/tools/color-decomposer.css::gap: .375rem',
  'styles/tools/color-decomposer.css::gap: .375rem',
  'styles/tools/color-decomposer.css::width: .625rem',
  'styles/tools/color-decomposer.css::width: .875rem',
  'styles/tools/color-decomposer.css::height: .875rem',
  'styles/tools/color-decomposer.css::width: 1.125rem',
  'styles/tools/color-decomposer.css::height: 1.125rem',
  'styles/tools/color-decomposer.css::padding-top: .875rem',
  'styles/tools/color-decomposer.css::gap: .375rem',
  'styles/tools/color-decomposer.css::width: 1.125rem',
  'styles/tools/color-decomposer.css::height: 1.125rem',
  'styles/tools/color-decomposer.css::gap: 1.125rem',
  'styles/tools/color-decomposer.css::gap: .625rem',
  'styles/tools/color-decomposer.css::padding: .625rem 1rem',
  'styles/tools/color-decomposer.css::width: 1.125rem',
  'styles/tools/color-decomposer.css::height: 1.125rem',
];

function collectFiles(dir: string, files: string[] = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(path, files);
    else if (/\.(astro|css)$/.test(entry.name)) files.push(path);
  }
  return files;
}

/** Só o CSS: o arquivo inteiro num .css, os blocos <style> num .astro; sem comentários. */
function cssOf(file: string) {
  const text = readFileSync(file, 'utf-8');
  const css = file.endsWith('.astro')
    ? [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
    : text;
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

const primitives = readFileSync(join(srcDir, 'styles/tokens/primitives.css'), 'utf-8');
const scale = new Map<string, number>();
for (const m of primitives.matchAll(/--(scale-[\w]+):\s*([\d.]+)rem/g)) scale.set(m[1], parseFloat(m[2]) * 16);

/** Cada token do valor em px, ou null quando não é uma medida que a regra avalie (%, em, auto, calc...). */
function toPx(token: string): number | null {
  let m = token.match(/^(-?[\d.]+)px$/);
  if (m) return parseFloat(m[1]);
  m = token.match(/^(-?[\d.]+)rem$/);
  if (m) return parseFloat(m[1]) * 16;
  m = token.match(/^var\(--(scale-[\w]+)\)$/);
  if (m) return scale.get(m[1]) ?? null;
  return /^-?0$/.test(token) ? 0 : null;
}

const isOnScale = (px: number) => {
  const abs = Math.abs(px);
  return abs === 0 || abs === 1 || abs === 2 || Math.abs(abs / 4 - Math.round(abs / 4)) < 1e-6;
};

/** Percorre as regras (inclusive dentro de @media) e devolve cada declaração com os seletores dela. */
function declarations(css: string, out: { selector: string; prop: string; value: string }[] = []) {
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open === -1) break;
    const prelude = css.slice(i, open).split(/[;}]/).pop()!.trim();
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth += 1;
      else if (css[j] === '}') depth -= 1;
      j += 1;
    }
    const body = css.slice(open + 1, j - 1);
    if (prelude.startsWith('@')) declarations(body, out);
    else {
      for (const decl of body.split(';')) {
        const colon = decl.indexOf(':');
        if (colon === -1) continue;
        out.push({ selector: prelude, prop: decl.slice(0, colon).trim(), value: decl.slice(colon + 1).trim() });
      }
    }
    i = j;
  }
  return out;
}

const classesOf = (selector: string) => [...selector.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);

function violations() {
  const found: string[] = [];
  for (const file of collectFiles(srcDir)) {
    const relative = file.slice(srcDir.length).replace(/\\/g, '/');
    for (const { selector, prop, value } of declarations(cssOf(file))) {
      if (!DIMENSION.test(prop)) continue;
      if (selector.split(',').every((s) => classesOf(s).some((c) => SHAPE_CLASSES.has(c)))) continue;
      const bad = value
        .replace(/!important/, '')
        .split(/\s+/)
        .some((token) => {
          const px = toPx(token);
          return px !== null && !isOnScale(px);
        });
      if (bad) found.push(`${relative}::${prop}: ${value}`);
    }
  }
  return found.sort();
}

describe('espaçamentos e dimensões em múltiplos de 4 (exceções: 0, 1 e 2)', () => {
  const found = violations();

  it('o teste enxerga o CSS do site (sanity check do próprio teste)', () => {
    expect(collectFiles(srcDir).length).toBeGreaterThan(20);
    expect(toPx('var(--scale-x3)')).toBe(12);
    expect(isOnScale(14)).toBe(false);
    expect(isOnScale(12)).toBe(true);
  });

  it('não há violação nova: o que não está em KNOWN_EXCEPTIONS segue a regra', () => {
    const remaining = [...KNOWN_EXCEPTIONS];
    const unexpected = found.filter((v) => {
      const at = remaining.indexOf(v);
      if (at === -1) return true;
      remaining.splice(at, 1);
      return false;
    });
    expect(unexpected, `fora da regra (corrija ou, só com motivo, acrescente a KNOWN_EXCEPTIONS):\n${unexpected.join('\n')}`).toEqual([]);
  });

  it('não há exceção obsoleta: a lista só encolhe', () => {
    const remaining = [...found];
    const stale = KNOWN_EXCEPTIONS.filter((e) => {
      const at = remaining.indexOf(e);
      if (at === -1) return true;
      remaining.splice(at, 1);
      return false;
    });
    expect(stale, `já seguem a regra, remova de KNOWN_EXCEPTIONS:\n${stale.join('\n')}`).toEqual([]);
  });
});
