import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf-8');
const page = (name: string) => read(`../../pages/projetos/uaiui/componentes/${name}.astro`);
const script = read('./docs.ts');

describe('Toast: o anúncio vem da região viva, uma vez só', () => {
  const toast = page('toast');

  it('o toast não leva role (nem status nem alert): quem anuncia é a região', () => {
    const template = toast.match(/const toast = \([\s\S]*?<\/div>`;/)?.[0] ?? '';
    expect(template).toContain('class="uai-toast"');
    expect(template).not.toMatch(/role=/);
    expect(toast).not.toMatch(/class="uai-toast"[^>]*role=/);
  });

  it('o preview tem a região polite já na página, vazia, e o botão "Mostrar aviso"', () => {
    expect(toast).toMatch(/<button[^>]*data-toast-show>Mostrar aviso<\/button>/);
    expect(toast).toMatch(/<div aria-live="polite" aria-atomic="false"><\/div>/);
  });

  it('o código mostrado é a região polite com o mesmo toast que o preview insere', () => {
    expect(toast).toMatch(/const demoCode = `<div aria-live="polite" aria-atomic="false">\n\$\{withAction\}\n<\/div>`/);
    expect(toast).toMatch(/<template data-toast-template set:html=\{withAction\}>/);
  });

  it('as regiões do texto: polite para neutral, success e info; role="alert" para warning e error', () => {
    expect(toast).toMatch(/<div aria-live="polite" aria-atomic="false">\n {2}<!-- insira aqui os toasts neutral, success e info -->/);
    expect(toast).toMatch(/<div role="alert">\n {2}<!-- insira aqui os toasts warning e error -->/);
  });

  it('o fechar é um botão com nome acessível e o script o trata por clique e por Esc, devolvendo o foco', () => {
    expect(toast).toMatch(/data-toast-close aria-label="Fechar aviso"/);
    expect(script).toMatch(/event\.key !== 'Escape'/);
    expect(script).toMatch(/\[data-toast-show\]'\)\?\.focus\(\)/);
  });

  it('o preview não é posicionado sobre a página (nada de position fixed no toast)', () => {
    expect(read('../../styles/tools/uaiui-docs.css')).not.toMatch(/position:\s*fixed/);
  });
});

describe('Accordion: títulos do preview', () => {
  const accordion = page('accordion');

  it('o primeiro exemplo (logo abaixo do h1) usa h2; os de dentro de uma seção usam h3', () => {
    expect(accordion).toMatch(/\$\{item\('h2', 'a1'/);
    expect(accordion).toMatch(/\$\{item\('h3', 'd1'/);
    expect(accordion).toMatch(/const single = item\('h3'/);
  });

  it('os títulos do preview não têm id: "Nesta página" só monta com os h2 com id do corpo', () => {
    const template = accordion.match(/const item = [\s\S]*?<\/div>`;/)?.[0] ?? '';
    expect(template).toMatch(/<\$\{level\}>/);
    expect(template).not.toMatch(/<\$\{level\}[^>]*id=/);
    expect(script).toContain(`'.uaiui-docs__body > h2[id]'`);
  });

  it('botão com aria-expanded e aria-controls, painel com hidden quando fechado', () => {
    expect(accordion).toMatch(/aria-expanded="\$\{open\}" aria-controls="\$\{id\}-p"/);
    expect(accordion).toMatch(/\$\{open \? '' : ' hidden'\}/);
  });
});

describe('páginas de componente', () => {
  it.each(['accordion', 'button', 'toast'])('%s: o texto do DS que manda usar tokens.css ou data-theme foi trocado pelo uso por wrapper', (name) => {
    const text = page(name);
    expect(text).toContain('uaiui-ds/tokens-wrapper.css');
    expect(text).toContain(`O código abaixo é o conteúdo desse arquivo.`);
    expect(text).not.toMatch(/src\/styles\/tokens\.css|data-theme|Copie /);
  });

  it.each(['accordion', 'button', 'toast'])('%s: o bloco de CSS vem do pacote (?raw), sem cópia no portifa', (name) => {
    expect(page(name)).toMatch(new RegExp(`import css from 'uaiui-ds/components/${name}\\.css\\?raw'`));
    expect(page(name)).toMatch(/<CodeBlock code=\{css\} lang="css" \/>/);
  });

  it('os links internos apontam para as rotas do site, não para /docs', () => {
    for (const name of ['accordion', 'button', 'toast']) expect(page(name)).not.toContain('href="/docs');
    expect(page('toast')).toContain('href="/projetos/uaiui/componentes/button/"');
  });
});
