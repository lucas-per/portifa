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

  it('o fieldset tem legenda "Densidade" e as três opções do DS (Confortável, Padrão, Compacto), Confortável marcada', () => {
    expect(density).toMatch(/<legend[^>]*>Densidade<\/legend>/);
    expect(density).toMatch(/value: 'comfortable', label: 'Confortável'/);
    expect(density).toMatch(/value: 'standard', label: 'Padrão'/);
    expect(density).toMatch(/value: 'compact', label: 'Compacto'/);
    expect(density).not.toMatch(/value: 'desktop'|value: 'mobile'/);
    expect(density).toMatch(/checked=\{option\.value === 'comfortable'\}/);
    expect(density).toMatch(/type="radio"/);
  });

  it('o cabeçalho da área não tem a densidade nem a busca (a busca vive no menu)', () => {
    expect(layout).not.toMatch(/DocsDensity/);
    expect(layout).not.toMatch(/data-search-open/);
    expect(layout).not.toMatch(/uaiui-docs__tools/);
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

  it('o script sincroniza todos os grupos, guarda a escolha (comfortable remove a atributo e a chave) e avisa no role="status"', () => {
    expect(script).toMatch(/input\[type="radio"\]\[name\$="-densidade"\]/);
    expect(script).toMatch(/for \(const other of densityInputs\) other\.checked = other\.value === input\.value;/);
    expect(script).toMatch(/store\.set\('uaiui-density', input\.value\)/);
    expect(script).toMatch(/store\.remove\('uaiui-density'\)/);
    expect(script).toMatch(/input\.value === 'comfortable'/);
    expect(script).toMatch(/announce\(`Densidade da página: /);
    expect(layout).toMatch(/id="uaiui-docs-live" class="uaiui-docs__sr-only" role="status"/);
  });

  it('o valor salvo "mobile" (v0.3.x do DS) vira standard e a chave é regravada dentro do try; qualquer outro valor fica sem atributo', () => {
    const inline = layout.match(/<script is:inline>[\s\S]*?<\/script>/)?.[0] ?? '';
    const tryBlock = inline.match(/try \{([\s\S]*?)\} catch/)?.[1] ?? '';
    expect(tryBlock).toMatch(/saved === 'mobile'/);
    expect(tryBlock).toMatch(/saved = 'standard';\s*localStorage\.setItem\('uaiui-density', saved\);/);
    expect(tryBlock).toMatch(/saved === 'standard' \|\| saved === 'compact'/);
    expect(tryBlock).not.toMatch(/desktop|comfortable/);
    // Roda o script com um armazenamento falso: o que fica no wrapper e na chave.
    const run = (initial: string | null) => {
      const store = new Map<string, string>(initial === null ? [] : [['uaiui-density', initial]]);
      const attrs = new Map<string, string>();
      const localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
      const document = { currentScript: { parentElement: { setAttribute: (k: string, v: string) => void attrs.set(k, v) } } };
      new Function('document', 'localStorage', inline.replace(/<\/?script[^>]*>/g, ''))(document, localStorage);
      return { attr: attrs.get('data-uaiui-density') ?? null, saved: store.get('uaiui-density') ?? null };
    };
    expect(run('mobile')).toEqual({ attr: 'standard', saved: 'standard' });
    expect(run('standard')).toEqual({ attr: 'standard', saved: 'standard' });
    expect(run('compact')).toEqual({ attr: 'compact', saved: 'compact' });
    expect(run('desktop')).toEqual({ attr: null, saved: 'desktop' });
    expect(run(null)).toEqual({ attr: null, saved: null });
  });

  it('a escolha salva é aplicada antes da pintura: o atributo no início do wrapper e os rádios no fim', () => {
    expect(layout).toMatch(/localStorage\.getItem\('uaiui-density'\)/);
    expect(layout).toMatch(/querySelectorAll\('input\[name\$="-densidade"\]'\)/);
    expect(layout.indexOf("getItem('uaiui-density')")).toBeLessThan(layout.indexOf('<DocsSidebar'));
    expect(layout.lastIndexOf('<script is:inline>')).toBeGreaterThan(layout.indexOf('<DocsSearch />'));
  });
});
