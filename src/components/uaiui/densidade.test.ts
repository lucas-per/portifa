import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf-8');
const example = read('./Example.astro');
const density = read('./DocsDensity.astro');
const layout = read('../../layouts/UaiuiDocsLayout.astro');
const script = read('./docs.ts');
const pages = ['index', 'tokens', 'componentes/accordion', 'componentes/button', 'componentes/toast'];

describe('densidade dentro de cada exemplo (Figma 704:751)', () => {
  it('o Example põe o controle no painel Preview, abaixo do palco, e some junto com ele na aba Código', () => {
    const preview = example.match(/<div role="tabpanel" id=\{`\$\{id\}-pp`\}[\s\S]*?<\/div>\n  <div role="tabpanel" id=\{`\$\{id\}-cp`\}/)?.[0] ?? '';
    expect(preview).toMatch(/uaiui-docs__stage/);
    expect(preview).toMatch(/<DocsDensity name=\{`\$\{id\}-densidade`\} \/>/);
    expect(preview.indexOf('uaiui-docs__stage')).toBeLessThan(preview.indexOf('<DocsDensity'));
    const code = example.slice(example.indexOf('id={`${id}-cp`}'));
    expect(code).not.toMatch(/DocsDensity/);
  });

  it('cada controle tem o name próprio (rádios de exemplos diferentes não podem formar um grupo só)', () => {
    expect(density).toMatch(/name=\{name\}/);
    expect(density).not.toMatch(/name="uaiui-density"/);
    expect(example).toMatch(/\$\{id\}-densidade/);
    expect(script).not.toMatch(/name="uaiui-density"/);
  });

  it('o fieldset tem legenda "Densidade" e as três opções do DS (Desktop, Mobile, Compacto), Desktop marcada', () => {
    expect(density).toMatch(/<legend[^>]*>Densidade<\/legend>/);
    expect(density).toMatch(/value: 'desktop', label: 'Desktop'/);
    expect(density).toMatch(/value: 'mobile', label: 'Mobile'/);
    expect(density).toMatch(/value: 'compact', label: 'Compacto'/);
    expect(density).toMatch(/checked=\{option\.value === 'desktop'\}/);
    expect(density).toMatch(/type="radio"/);
  });

  it('o cabeçalho da área não tem mais a densidade; a busca fica', () => {
    expect(layout).not.toMatch(/DocsDensity/);
    const tools = layout.match(/<div class="uaiui-docs__tools">[\s\S]*?\n {6}<\/div>/)?.[0] ?? '';
    expect(tools).toMatch(/data-search-open/);
    expect(tools).not.toMatch(/density|Densidade/i);
  });

  it('as páginas não trazem controle de densidade próprio: só o Example o tem, então Introdução e Tokens ficam sem', () => {
    for (const page of pages) {
      const text = read(`../../pages/projetos/uaiui/${page}.astro`);
      expect(text, page).not.toMatch(/DocsDensity|name="uaiui-density"/);
    }
    for (const page of ['index', 'tokens']) {
      expect(read(`../../pages/projetos/uaiui/${page}.astro`), page).not.toMatch(/<Example/);
    }
    for (const page of ['accordion', 'button', 'toast']) {
      expect(read(`../../pages/projetos/uaiui/componentes/${page}.astro`), page).toMatch(/<Example/);
    }
  });

  it('o script sincroniza todos os grupos, guarda a escolha (desktop remove a chave) e avisa no role="status"', () => {
    expect(script).toMatch(/input\[type="radio"\]\[name\$="-densidade"\]/);
    expect(script).toMatch(/for \(const other of densityInputs\) other\.checked = other\.value === input\.value;/);
    expect(script).toMatch(/store\.set\('uaiui-density', input\.value\)/);
    expect(script).toMatch(/store\.remove\('uaiui-density'\)/);
    expect(script).toMatch(/announce\(`Densidade da página: /);
    expect(layout).toMatch(/id="uaiui-docs-live" class="uaiui-docs__sr-only" role="status"/);
  });

  it('a escolha salva é aplicada antes da pintura: o atributo no início do wrapper e os rádios no fim', () => {
    expect(layout).toMatch(/localStorage\.getItem\('uaiui-density'\)/);
    expect(layout).toMatch(/querySelectorAll\('input\[name\$="-densidade"\]'\)/);
    expect(layout.indexOf("getItem('uaiui-density')")).toBeLessThan(layout.indexOf('<DocsSidebar'));
    expect(layout.lastIndexOf('<script is:inline>')).toBeGreaterThan(layout.indexOf('<DocsSearch />'));
  });
});
