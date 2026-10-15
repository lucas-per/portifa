// src/styles/tokens/fonts.test.ts
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { brotliDecompressSync } from 'node:zlib';

const cssPath = fileURLToPath(new URL('./fonts.css', import.meta.url));
const css = readFileSync(cssPath, 'utf-8');

const fontFiles = [
  '../../assets/fonts/plus-jakarta-sans-variable.woff2',
  '../../assets/fonts/dm-sans-variable.woff2',
  '../../assets/fonts/jetbrains-mono-700.woff2',
];

// Tags conhecidas do diretório de tabelas WOFF2 (índices 0 a 62). Só precisamos
// chegar até a 'cmap' (índice 0), mas a lista completa é necessária para somar
// o tamanho das tabelas anteriores no stream descomprimido.
const WOFF2_KNOWN_TAGS = [
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm',
  'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern',
  'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC',
  'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar',
  'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty',
  'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat',
  'Gloc', 'Feat', 'Sill',
];

// Lê a tabela cmap de um .woff2 e devolve uma função que diz se o código existe
// na fonte. A cmap não passa por transformação no WOFF2, então basta
// descomprimir o stream (brotli) e localizar a tabela. Suporta os formatos 4 e 12.
function woff2HasCodepoint(file: Buffer): (codepoint: number) => boolean {
  expect(file.toString('latin1', 0, 4)).toBe('wOF2');
  const numTables = file.readUInt16BE(12);
  const compressedSize = file.readUInt32BE(20);
  let pos = 48;
  const readBase128 = () => {
    let value = 0;
    for (let i = 0; i < 5; i++) {
      const byte = file[pos++];
      value = value * 128 + (byte & 0x7f);
      if (!(byte & 0x80)) break;
    }
    return value;
  };
  let cmapOffset = -1;
  let streamOffset = 0;
  for (let i = 0; i < numTables; i++) {
    const flags = file[pos++];
    const tagIndex = flags & 0x3f;
    let tag: string;
    if (tagIndex === 0x3f) {
      tag = file.toString('latin1', pos, pos + 4);
      pos += 4;
    } else {
      tag = WOFF2_KNOWN_TAGS[tagIndex];
    }
    const origLength = readBase128();
    const transformVersion = flags >> 6;
    const transformed = tag === 'glyf' || tag === 'loca' ? transformVersion === 0 : transformVersion !== 0;
    const storedLength = transformed ? readBase128() : origLength;
    if (tag === 'cmap') cmapOffset = streamOffset;
    streamOffset += storedLength;
  }
  expect(cmapOffset, 'tabela cmap não encontrada').toBeGreaterThanOrEqual(0);
  const data = brotliDecompressSync(file.subarray(pos, pos + compressedSize));
  const cmap = data.subarray(cmapOffset);
  const subtables = Array.from({ length: cmap.readUInt16BE(2) }, (_, i) => cmap.readUInt32BE(4 + i * 8 + 4));
  return (codepoint) =>
    subtables.some((offset) => {
      const table = cmap.subarray(offset);
      const format = table.readUInt16BE(0);
      if (format === 12) {
        const groups = table.readUInt32BE(12);
        for (let g = 0; g < groups; g++) {
          const start = table.readUInt32BE(16 + g * 12);
          const end = table.readUInt32BE(16 + g * 12 + 4);
          if (codepoint >= start && codepoint <= end) return true;
        }
        return false;
      }
      if (format !== 4 || codepoint > 0xffff) return false;
      const segCount = table.readUInt16BE(6) / 2;
      for (let s = 0; s < segCount; s++) {
        const end = table.readUInt16BE(14 + s * 2);
        const start = table.readUInt16BE(16 + segCount * 2 + s * 2);
        if (codepoint < start || codepoint > end) continue;
        const rangeOffsetPos = 16 + segCount * 6 + s * 2;
        const rangeOffset = table.readUInt16BE(rangeOffsetPos);
        if (rangeOffset === 0) return true;
        return table.readUInt16BE(rangeOffsetPos + rangeOffset + (codepoint - start) * 2) !== 0;
      }
      return false;
    });
}

describe('fonts.css', () => {
  it('declara as 3 famílias com font-display', () => {
    const blocks = css.match(/@font-face\s*\{[^}]*\}/g) ?? [];
    expect(blocks.length).toBeGreaterThanOrEqual(3);
    for (const block of blocks) {
      expect(block).toMatch(/font-display:\s*(swap|optional);/);
    }
  });

  it('usa font-display: optional na fonte de título (evita reflow visível em h1/h2)', () => {
    const titleBlock = css.match(/@font-face\s*\{[^}]*Plus Jakarta Sans[^}]*\}/)?.[0];
    expect(titleBlock).toBeDefined();
    expect(titleBlock).toMatch(/font-display:\s*optional;/);
  });

  it('define as custom properties de família usadas por typography.css', () => {
    expect(css).toMatch(/--font-family-title:\s*['"]Plus Jakarta Sans['"]/);
    expect(css).toMatch(/--font-family-body:\s*['"]DM Sans['"]/);
    expect(css).toMatch(/--font-family-label:\s*['"]JetBrains Mono['"]/);
  });

  it('todos os arquivos de fonte referenciados existem e não estão vazios', () => {
    for (const relativePath of fontFiles) {
      const fullPath = fileURLToPath(new URL(relativePath, import.meta.url));
      expect(existsSync(fullPath), `arquivo não encontrado: ${relativePath}`).toBe(true);
      expect(statSync(fullPath).size).toBeGreaterThan(0);
    }
  });

  // Os woff2 são subsets: um caractere fora do recorte cai numa fonte do sistema
  // sem aviso (foi o que aconteceu com a seta "→" dos destaques de Impacto, que
  // aparecia mais fina e com a cabeça menor que a do Figma). Ao regerar o
  // subset, mantenha estes caracteres.
  it('a fonte de título tem os caracteres usados nos destaques (→, ←, ×) e ↑ ↓', () => {
    const path = fileURLToPath(new URL('../../assets/fonts/plus-jakarta-sans-variable.woff2', import.meta.url));
    const has = woff2HasCodepoint(readFileSync(path));
    expect(has(0x41), 'sanity check do leitor: "A" deveria existir').toBe(true);
    expect(has(0x20ff), 'sanity check do leitor: U+20FF não deveria existir').toBe(false);
    for (const [char, codepoint] of [['→', 0x2192], ['←', 0x2190], ['×', 0x00d7], ['↑', 0x2191], ['↓', 0x2193]] as const) {
      expect(has(codepoint), `plus-jakarta-sans-variable.woff2 não tem "${char}" (U+${codepoint.toString(16).toUpperCase().padStart(4, '0')})`).toBe(true);
    }
  });
});
