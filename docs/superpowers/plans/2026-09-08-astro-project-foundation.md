# Fundação do Projeto Astro — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Estruturar a fundação do site pessoal em Astro (stack, tokens de design derivados do Figma, componentes de UI reutilizáveis, content collection de cases, rotas, navegação extensível), pronta para receber a implementação visual do V1 em uma etapa seguinte.

**Architecture:** Astro + TypeScript strict, CSS vanilla com custom properties em duas camadas (`primitives.css` → `semantics.css`), componentes de UI atômicos e props-driven (`Tag`, `Button`, `TestResultBadge`) consumidos pelas rotas, content collection de dados (YAML) para cases validada por Zod usando o Content Layer API do Astro (`glob` loader), i18n nativo do Astro só com `pt` ativo, navegação centralizada em um único arquivo de config. Vitest para utilitários TypeScript puros (reading-time, navigation); componentes/rotas Astro são validados via `astro check` + `astro build`.

**Tech Stack:** Astro (latest), TypeScript (strict), pnpm, Vitest, CSS vanilla, Zod (via `astro:content`), GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-07-astro-project-foundation-design.md`

## Global Constraints

- CSS vanilla apenas — nenhum framework utilitário (Tailwind etc.) (PRD 6.5, spec seção 1)
- pnpm como gerenciador de pacotes (spec seção 1)
- TypeScript em modo strict (spec seção 1)
- Cores em **OKLCH**; proibido preto/branco absoluto (`#000000`/`#FFFFFF`) em qualquer token (PRD 6.2)
- Browserslist alvo: últimas 2 versões de Chrome/Edge, Firefox, Safari (PRD 6.3, spec seção 1)
- i18n nativo do Astro, só `pt` ativo, sem prefixo de locale padrão (PRD 6.4, spec seção 1)
- Tags de case: lista aberta (`string[]`), sem enum fechado (PRD seção 5, spec seção 3)
- Imagens: sempre via `astro:assets`/helper `image()`, nunca `<img>` cru para conteúdo do repositório (spec seção 7)
- Fontes: self-hospedadas (não Google Fonts CDN), `font-display: swap`, subset `latin` (spec seção 7)
- CV em PDF: servido cru de `public/`, fora do pipeline de imagens (PRD 4.4, spec seção 7)
- Sem telefone/WhatsApp em nenhum canal de contato (PRD 4.4)
- Sem animações de hover/active nesta etapa (fora de escopo — spec, "Objetivo")

---

## Nota sobre dados de origem

As tarefas de tokens (2 e 3) usam valores **já lidos do Figma** (`get_variable_defs`, node `31:690`, arquivo `VM0MVYSWiDbznuPZFRyArB`) e convertidos para OKLCH com a fórmula de referência de Björn Ottosson (sRGB → linear → OKLab → OKLCH). Os valores abaixo são finais, não precisam ser recalculados.

**Gap identificado durante este plano (não estava no spec):** `get_variable_defs` só devolveu um conjunto de valores de cor para o node consultado — não há evidência de um segundo modo (dark) nas variáveis do Figma lidas até agora. A Tarefa 3 monta a estrutura de tema claro/escuro (media query + atributo `data-theme`), mas só popula valores reais para o tema **claro**. O bloco de dark mode fica com a mesma paleta do claro até que o modo escuro seja desenhado no Figma — isso é um estado funcional válido (não quebra nada), não um placeholder de código quebrado. Registrado também em "Pontos em aberto" ao final do plano.

---

### Task 1: Bootstrap do projeto Astro

**Files:**
- Create: `astro.config.mjs`
- Create: `tsconfig.json` (gerado pelo scaffold, estende `astro/tsconfigs/strict`)
- Create: `.browserslistrc`
- Create: `vitest.config.ts`
- Modify: `package.json` (scripts `dev`, `build`, `check`, `test`)
- Modify: `.gitignore` (já existe — só confirmar que `dist/` e `node_modules/` estão cobertos; ambos já estão)

**Interfaces:**
- Consumes: nada (primeira tarefa)
- Produces: projeto Astro executável (`pnpm dev`, `pnpm build`, `pnpm check`), config de i18n (`locales: ['pt']`), Vitest configurado e pronto para receber testes nas próximas tarefas

- [ ] **Step 1: Rodar o scaffold do Astro na raiz do projeto (que já tem `docs/`, `README.md`, `.gitignore`, `.git`)**

```bash
pnpm create astro@latest . -- --yes --template minimal --typescript strict --no-git --install
```

Se o CLI cair em modo interativo (varia entre versões do Astro), responda:
- "Where should we create your new project?" → `.` (diretório atual)
- Template → `Empty`/`Minimal`
- TypeScript → `Strict`
- Instalar dependências → `Yes`
- Inicializar um novo repositório git → `No` (já existe um)

O CLI do Astro ignora arquivos "seguros" (`.git`, `.gitignore`, `README.md`) ao checar se o diretório está vazio, então rodar num repo com só esses arquivos + `docs/` funciona sem `--force`.

- [ ] **Step 2: Verificar que o scaffold criou a estrutura esperada**

```bash
ls src/pages src/env.d.ts astro.config.mjs tsconfig.json package.json
```

Esperado: todos os arquivos/pastas existem. `tsconfig.json` deve conter `"extends": "astro/tsconfigs/strict"`.

- [ ] **Step 3: Configurar i18n nativo no `astro.config.mjs`**

```js
// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  i18n: {
    locales: ['pt'],
    defaultLocale: 'pt',
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
```

- [ ] **Step 4: Criar `.browserslistrc` (PRD 6.3)**

```
last 2 Chrome versions
last 2 ChromeAndroid versions
last 2 Edge versions
last 2 Firefox versions
last 2 Safari versions
last 2 iOS versions
```

- [ ] **Step 5: Instalar `@astrojs/check` (necessário para `astro check`) e Vitest**

```bash
pnpm add -D @astrojs/check typescript vitest
```

- [ ] **Step 6: Criar `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 7: Adicionar scripts em `package.json`**

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run"
  }
}
```

- [ ] **Step 8: Verificar que o projeto builda e type-checka**

```bash
pnpm check
pnpm build
```

Esperado: ambos terminam sem erro (o `astro build` de um projeto `minimal` recém-criado gera `dist/index.html` a partir da página padrão do template).

- [ ] **Step 9: Commit**

```bash
git add astro.config.mjs tsconfig.json .browserslistrc vitest.config.ts package.json pnpm-lock.yaml src .gitignore
git commit -m "feat: bootstrap do projeto Astro com TypeScript strict, pnpm e Vitest"
```

---

### Task 2: Tokens de design — primitivos

**Files:**
- Create: `src/styles/tokens/primitives.css`
- Test: `src/styles/tokens/primitives.test.ts`

**Interfaces:**
- Consumes: nada
- Produces: custom properties CSS (`--neutral-*`, `--primary-*`, `--accent-*`, `--red-*`, `--yellow-100`, `--green-100`, `--scale-*`, `--weight-*`) consumidas por `semantics.css` e `typography.css` na Tarefa 3

- [ ] **Step 1: Escrever o teste que verifica as custom properties obrigatórias**

```ts
// src/styles/tokens/primitives.test.ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = readFileSync(fileURLToPath(new URL('./primitives.css', import.meta.url)), 'utf-8');

function expectDeclares(name: string, value: string) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`--${name}:\\s*${escaped}\\s*;`);
  expect(css, `esperava "--${name}: ${value};"`).toMatch(pattern);
}

describe('primitives.css', () => {
  it('declara a escala de neutros em OKLCH', () => {
    expectDeclares('neutral-900', 'oklch(25.11% 0.0046 17.46)');
    expectDeclares('neutral-800', 'oklch(29.23% 0.0044 17.41)');
    expectDeclares('neutral-500', 'oklch(52.00% 0.0038 17.28)');
    expectDeclares('neutral-200', 'oklch(89.30% 0.0022 17.20)');
    expectDeclares('neutral-50', 'oklch(98.74% 0.0032 17.21)');
    expectDeclares('neutral-25', 'oklch(99.14% 0.0044 359.99)');
    expectDeclares('neutral-0', 'oklch(99.65% 0.0170 106.70)');
  });

  it('não declara nenhuma cor em preto ou branco absoluto', () => {
    expect(css).not.toMatch(/#fff\b|#ffffff\b|#000\b|#000000\b/i);
    expect(css).not.toMatch(/oklch\(\s*100%/i);
    expect(css).not.toMatch(/oklch\(\s*0(\.0+)?%/i);
  });

  it('declara a escala primária (roxo/ameixa) em OKLCH', () => {
    expectDeclares('primary-800', 'oklch(32.54% 0.0336 315.88)');
    expectDeclares('primary-100', 'oklch(90.84% 0.0411 294.74)');
  });

  it('declara a escala de acento (azul) em OKLCH', () => {
    expectDeclares('accent-700', 'oklch(53.07% 0.1347 245.37)');
    expectDeclares('accent-600', 'oklch(55.82% 0.1361 243.96)');
    expectDeclares('accent-300', 'oklch(72.59% 0.1196 244.22)');
  });

  it('declara a escala vermelha (tags/status) em OKLCH', () => {
    expectDeclares('red-900', 'oklch(51.20% 0.2005 25.55)');
    expectDeclares('red-700', 'oklch(59.02% 0.2262 24.77)');
    expectDeclares('red-500', 'oklch(71.16% 0.1812 22.84)');
    expectDeclares('red-300', 'oklch(79.06% 0.0955 19.41)');
    expectDeclares('red-100', 'oklch(93.22% 0.0343 17.78)');
  });

  it('declara amarelo e verde de apoio em OKLCH', () => {
    expectDeclares('yellow-100', 'oklch(96.21% 0.0619 95.40)');
    expectDeclares('green-100', 'oklch(95.71% 0.0210 147.64)');
  });

  it('declara a escala numérica de tamanho em rem', () => {
    expectDeclares('scale-none', '0');
    expectDeclares('scale-base', '0.25rem');
    expectDeclares('scale-x2', '0.5rem');
    expectDeclares('scale-x3', '0.75rem');
    expectDeclares('scale-x4', '1rem');
    expectDeclares('scale-x5', '1.25rem');
    expectDeclares('scale-x6', '1.5rem');
    expectDeclares('scale-x8', '2rem');
    expectDeclares('scale-x9', '2.25rem');
    expectDeclares('scale-x10', '2.5rem');
    expectDeclares('scale-x11', '2.75rem');
    expectDeclares('scale-x12', '3rem');
    expectDeclares('scale-x16', '4rem');
    expectDeclares('scale-x20', '5.5rem');
  });

  it('declara os pesos de fonte usados no Figma', () => {
    expectDeclares('weight-400', '400');
    expectDeclares('weight-500', '500');
    expectDeclares('weight-600', '600');
    expectDeclares('weight-700', '700');
    expectDeclares('weight-800', '800');
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha (arquivo ainda não existe)**

```bash
pnpm test -- primitives
```

Esperado: FAIL — `ENOENT` ao tentar ler `primitives.css`.

- [ ] **Step 3: Criar `src/styles/tokens/primitives.css`**

```css
/*
  Primitivos: valores brutos, sem contexto de uso.
  Convertidos de hex (Figma, get_variable_defs) para OKLCH.
  Nunca referenciar semantics.css a partir daqui.
*/
:root {
  /* Neutros (inclui os dois "off-white" do Figma — hue instável por serem quase acromáticos, tratados como uma única escala) */
  --neutral-900: oklch(25.11% 0.0046 17.46); /* #242121 */
  --neutral-800: oklch(29.23% 0.0044 17.41); /* #2e2b2b */
  --neutral-500: oklch(52.00% 0.0038 17.28); /* #6b6868 */
  --neutral-200: oklch(89.30% 0.0022 17.20); /* #dddbdb */
  --neutral-50: oklch(98.74% 0.0032 17.21); /* #fdfafa */
  --neutral-25: oklch(99.14% 0.0044 359.99); /* #fffbfc */
  --neutral-0: oklch(99.65% 0.0170 106.70); /* #fffff2 */

  /* Primária (roxo/ameixa da marca) */
  --primary-800: oklch(32.54% 0.0336 315.88); /* #3b2f40 */
  --primary-100: oklch(90.84% 0.0411 294.74); /* #e2dcfa */

  /* Acento (azul) */
  --accent-700: oklch(53.07% 0.1347 245.37); /* #0071b4 */
  --accent-600: oklch(55.82% 0.1361 243.96); /* #057abd */
  --accent-300: oklch(72.59% 0.1196 244.22); /* #5faeec */

  /* Vermelho (tags, status, complementary) */
  --red-900: oklch(51.20% 0.2005 25.55); /* #bf1120 */
  --red-700: oklch(59.02% 0.2262 24.77); /* #e51e2f */
  --red-500: oklch(71.16% 0.1812 22.84); /* #ff6b6b */
  --red-300: oklch(79.06% 0.0955 19.41); /* #f2a2a2 */
  --red-100: oklch(93.22% 0.0343 17.78); /* #ffe0e0 */

  /* Cores de apoio (um único tom cada, sem escala) */
  --yellow-100: oklch(96.21% 0.0619 95.40); /* #fff3c4 */
  --green-100: oklch(95.71% 0.0210 147.64); /* #e8f5e9 */

  /* Escala numérica (espaçamento e tamanho de fonte), base 4px = 0.25rem */
  --scale-none: 0;
  --scale-base: 0.25rem; /* 4px */
  --scale-x2: 0.5rem; /* 8px */
  --scale-x3: 0.75rem; /* 12px */
  --scale-x4: 1rem; /* 16px */
  --scale-x5: 1.25rem; /* 20px */
  --scale-x6: 1.5rem; /* 24px */
  --scale-x8: 2rem; /* 32px */
  --scale-x9: 2.25rem; /* 36px */
  --scale-x10: 2.5rem; /* 40px */
  --scale-x11: 2.75rem; /* 44px */
  --scale-x12: 3rem; /* 48px */
  --scale-x16: 4rem; /* 64px */
  --scale-x20: 5.5rem; /* 88px */

  /* Pesos de fonte */
  --weight-400: 400;
  --weight-500: 500;
  --weight-600: 600;
  --weight-700: 700;
  --weight-800: 800;
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

```bash
pnpm test -- primitives
```

Esperado: PASS (9 testes).

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens/primitives.css src/styles/tokens/primitives.test.ts
git commit -m "feat: adiciona tokens primitivos (cores OKLCH, escala, pesos de fonte)"
```

---

### Task 3: Tokens de design — semânticos, tipografia e tema

**Files:**
- Create: `src/styles/tokens/semantics.css`
- Create: `src/styles/tokens/typography.css`
- Test: `src/styles/tokens/semantics.test.ts`
- Test: `src/styles/tokens/typography.test.ts`

**Interfaces:**
- Consumes: custom properties de `primitives.css` (Tarefa 2)
- Produces: custom properties semânticas (`--surface-*`, `--button-*`, `--text-*`, `--icon-*`, `--shadow-*`, `--tag-*`, `--border-*`) e classes utilitárias de texto (`.text-title-display`, `.text-title-h2`, `.text-title-h3`, `.text-body-md`, `.text-body-lg-strong`, `.text-body-sm`, `.text-body-caption`, `.text-label-md`, `.text-label-sm`) consumidas pelos componentes de UI (Tarefa 8) e pelo `BaseLayout.astro` (Tarefa 9)

- [ ] **Step 1: Escrever o teste de `semantics.css`**

```ts
// src/styles/tokens/semantics.test.ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = readFileSync(fileURLToPath(new URL('./semantics.css', import.meta.url)), 'utf-8');

function expectDeclares(name: string, value: string) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`--${name}:\\s*${escaped}\\s*;`);
  expect(css, `esperava "--${name}: ${value};"`).toMatch(pattern);
}

describe('semantics.css', () => {
  it('só referencia primitivos via var(), nunca valores literais de cor', () => {
    const declarationLines = css
      .split('\n')
      .filter((line) => /^\s*--[\w-]+:/.test(line) && !/^\s*\/\*/.test(line));
    for (const line of declarationLines) {
      if (/box-shadow|font-family/.test(line)) continue; // compostos, checados em outros testes
      expect(line, `linha não usa var(): "${line.trim()}"`).toMatch(/var\(--|:\s*\d/);
    }
  });

  it('mapeia superfícies e cores de marca para os primitivos corretos', () => {
    expectDeclares('surface-bg-neutral-strong', 'var(--neutral-800)');
    expectDeclares('surface-bg-off-white-primary', 'var(--neutral-0)');
    expectDeclares('surface-bg-off-white-secondary', 'var(--neutral-25)');
    expectDeclares('surface-bg-off-white-tertiary', 'var(--yellow-100)');
    expectDeclares('surface-bg-neutral-subtle', 'var(--neutral-200)');
    expectDeclares('surface-bg-accent-strong', 'var(--accent-300)');
    expectDeclares('surface-bg-primary-subtle', 'var(--primary-100)');
    expectDeclares('surface-bg-complementary-subtle', 'var(--green-100)');
    expectDeclares('surface-bg-tertiary-subtle', 'var(--red-100)');
    expectDeclares('surface-bg-tertiary-strong', 'var(--red-500)');
  });

  it('mapeia bordas para os primitivos corretos', () => {
    expectDeclares('border-neutral-strong', 'var(--neutral-800)');
    expectDeclares('border-neutral-medium', 'var(--neutral-500)');
    expectDeclares('border-accent-strong', 'var(--accent-600)');
    expectDeclares('border-accent-subtle', 'var(--accent-300)');
  });

  it('mapeia texto e ícones para os primitivos corretos', () => {
    expectDeclares('text-label-on-bg-accent', 'var(--accent-700)');
    expectDeclares('text-label-on-bg-strong', 'var(--neutral-50)');
    expectDeclares('text-label-on-bg-complementary', 'var(--red-900)');
    expectDeclares('text-body-primary-strong', 'var(--primary-800)');
    expectDeclares('text-body-accent-regular', 'var(--accent-700)');
    expectDeclares('text-body-neutral-strong', 'var(--neutral-900)');
    expectDeclares('icon-neutral-1', 'var(--neutral-50)');
    expectDeclares('icon-accent', 'var(--accent-700)');
  });

  it('mapeia botão e tag para os primitivos corretos', () => {
    expectDeclares('button-bg-primary-filled-pressed', 'var(--primary-800)');
    expectDeclares('button-bg-accent-filled-regular', 'var(--accent-700)');
    expectDeclares('button-bg-accent-outline-regular', 'var(--neutral-0)');
    expectDeclares('button-border-neutral-strong', 'var(--neutral-800)');
    expectDeclares('button-border-neutral-subtle', 'var(--neutral-50)');
    expectDeclares('button-border-accent-strong', 'var(--accent-600)');
    expectDeclares('tag-bg-primary', 'var(--red-700)');
    expectDeclares('tag-bg-secondary', 'var(--red-100)');
    expectDeclares('tag-border-subtle', 'var(--red-700)');
    expectDeclares('tag-border-strong', 'var(--red-300)');
  });

  it('declara as sombras duras (neo-brutalismo: sem blur, deslocadas)', () => {
    expect(css).toMatch(/--shadow-comp-neutral:\s*3px 3px 0 0 var\(--neutral-900\)\s*;/);
    expect(css).toMatch(/--shadow-layout-neutral:\s*5px 5px 0 0 var\(--neutral-900\)\s*;/);
    expect(css).toMatch(/--shadow-comp-accent:\s*3px 3px 0 0 var\(--accent-300\)\s*;/);
    expect(css).toMatch(/--shadow-layout-accent:\s*5px 5px 0 0 var\(--accent-600\)\s*;/);
    expect(css).toMatch(/--shadow-layout-img:\s*5px 5px 0 0 var\(--red-300\)\s*;/);
  });

  it('declara a escala de line-height em 4 níveis', () => {
    expectDeclares('line-height-none', '1');
    expectDeclares('line-height-compact', '1.24');
    expectDeclares('line-height-regular', '1.48');
    expectDeclares('line-height-comfortable', '1.72');
  });

  it('declara a escala de letter-spacing em 3 níveis', () => {
    expectDeclares('letter-spacing-compact', '-1px');
    expectDeclares('letter-spacing-regular', '0px');
    expectDeclares('letter-spacing-comfortable', '1px');
  });

  it('tem um bloco de dark mode (mesmo que ainda repita os valores do claro)', () => {
    expect(css).toMatch(/\[data-theme=["']dark["']\]|prefers-color-scheme:\s*dark/);
  });
});
```

- [ ] **Step 2: Escrever o teste de `typography.css`**

```ts
// src/styles/tokens/typography.test.ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = readFileSync(fileURLToPath(new URL('./typography.css', import.meta.url)), 'utf-8');

describe('typography.css', () => {
  it.each([
    ['.text-title-display', 'var(--font-family-title)', 'var(--weight-700)', 'var(--scale-x16)', 'var(--line-height-compact)', 'var(--letter-spacing-compact)'],
    ['.text-title-h2', 'var(--font-family-title)', 'var(--weight-800)', 'var(--scale-x9)', 'var(--line-height-compact)', 'var(--letter-spacing-regular)'],
    ['.text-title-h3', 'var(--font-family-title)', 'var(--weight-800)', 'var(--scale-x8)', 'var(--line-height-compact)', 'var(--letter-spacing-regular)'],
    ['.text-body-md', 'var(--font-family-body)', 'var(--weight-400)', 'var(--scale-x5)', 'var(--line-height-regular)', 'var(--letter-spacing-regular)'],
    ['.text-body-lg-strong', 'var(--font-family-body)', 'var(--weight-600)', 'var(--scale-x6)', 'var(--line-height-regular)', 'var(--letter-spacing-regular)'],
    ['.text-body-sm', 'var(--font-family-body)', 'var(--weight-400)', 'var(--scale-x4)', 'var(--line-height-comfortable)', 'var(--letter-spacing-comfortable)'],
    ['.text-body-caption', 'var(--font-family-body)', 'var(--weight-500)', 'var(--scale-x3)', 'var(--line-height-regular)', 'var(--letter-spacing-comfortable)'],
    ['.text-label-md', 'var(--font-family-label)', 'var(--weight-700)', 'var(--scale-x5)', 'var(--line-height-none)', 'var(--letter-spacing-regular)'],
    ['.text-label-sm', 'var(--font-family-label)', 'var(--weight-700)', 'var(--scale-x4)', 'var(--line-height-none)', 'var(--letter-spacing-regular)'],
  ])('%s usa a família, peso, tamanho, line-height e letter-spacing corretos', (selector, family, weight, size, lineHeight, letterSpacing) => {
    const escapedSelector = selector.replace('.', '\\.');
    const blockMatch = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
    expect(blockMatch, `seletor ${selector} não encontrado`).not.toBeNull();
    const block = blockMatch![1];
    expect(block).toContain(`font-family: ${family}`);
    expect(block).toContain(`font-weight: ${weight}`);
    expect(block).toContain(`font-size: ${size}`);
    expect(block).toContain(`line-height: ${lineHeight}`);
    expect(block).toContain(`letter-spacing: ${letterSpacing}`);
  });
});
```

- [ ] **Step 3: Rodar os dois testes e confirmar que falham**

```bash
pnpm test -- semantics typography
```

Esperado: FAIL — `ENOENT` (arquivos ainda não existem).

- [ ] **Step 4: Criar `src/styles/tokens/semantics.css`**

```css
/*
  Semânticos: nomenclatura idêntica à das variables do Figma
  (layout/surface/bg/... -> --surface-bg-...). Só referenciam
  primitives.css via var() — nunca o contrário.

  Nota: get_variable_defs só devolveu um conjunto de valores (claro) para
  o node lido. O bloco de dark mode existe mas ainda repete os valores do
  claro — repovoar quando o modo escuro for desenhado no Figma.
*/
:root {
  /* Superfícies */
  --surface-bg-neutral-strong: var(--neutral-800);
  --surface-bg-neutral-subtle: var(--neutral-200);
  --surface-bg-off-white-primary: var(--neutral-0);
  --surface-bg-off-white-secondary: var(--neutral-25);
  --surface-bg-off-white-tertiary: var(--yellow-100);
  --surface-bg-primary-subtle: var(--primary-100);
  --surface-bg-accent-strong: var(--accent-300);
  --surface-bg-complementary-subtle: var(--green-100);
  --surface-bg-tertiary-subtle: var(--red-100);
  --surface-bg-tertiary-strong: var(--red-500);

  /* Bordas */
  --border-neutral-strong: var(--neutral-800);
  --border-neutral-medium: var(--neutral-500);
  --border-accent-strong: var(--accent-600);
  --border-accent-subtle: var(--accent-300);

  /* Texto */
  --text-label-on-bg-accent: var(--accent-700);
  --text-label-on-bg-strong: var(--neutral-50);
  --text-label-on-bg-complementary: var(--red-900);
  --text-body-primary-strong: var(--primary-800);
  --text-body-accent-regular: var(--accent-700);
  --text-body-neutral-strong: var(--neutral-900);

  /* Ícones */
  --icon-neutral-1: var(--neutral-50);
  --icon-accent: var(--accent-700);

  /* Botão */
  --button-bg-primary-filled-pressed: var(--primary-800);
  --button-bg-accent-filled-regular: var(--accent-700);
  --button-bg-accent-outline-regular: var(--neutral-0);
  --button-border-neutral-strong: var(--neutral-800);
  --button-border-neutral-subtle: var(--neutral-50);
  --button-border-accent-strong: var(--accent-600);

  /* Tag */
  --tag-bg-primary: var(--red-700);
  --tag-bg-secondary: var(--red-100);
  --tag-border-subtle: var(--red-700);
  --tag-border-strong: var(--red-300);

  /* Sombras duras (neo-brutalismo — sem blur, deslocadas) */
  --shadow-comp-neutral: 3px 3px 0 0 var(--neutral-900);
  --shadow-layout-neutral: 5px 5px 0 0 var(--neutral-900);
  --shadow-comp-accent: 3px 3px 0 0 var(--accent-300);
  --shadow-layout-accent: 5px 5px 0 0 var(--accent-600);
  --shadow-layout-img: 5px 5px 0 0 var(--red-300);

  /* Line-height (escala do design-notes: none/compact/regular/comfortable).
     "none" aqui representa razão 1 (sem espaçamento extra sobre a caixa da
     fonte) — não zero literal, que não faz sentido para line-height de texto. */
  --line-height-none: 1;
  --line-height-compact: 1.24;
  --line-height-regular: 1.48;
  --line-height-comfortable: 1.72;

  /* Letter-spacing (assumido em px — o Figma não expôs a unidade explicitamente) */
  --letter-spacing-compact: -1px;
  --letter-spacing-regular: 0px;
  --letter-spacing-comfortable: 1px;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    /* TODO(design): repovoar com os valores reais do modo escuro assim que
       existirem no Figma. Por ora, mantém a paleta do claro. */
  }
}

:root[data-theme='dark'] {
  /* TODO(design): mesmo valor do bloco acima. */
}
```

- [ ] **Step 5: Criar `src/styles/tokens/typography.css`**

```css
/*
  Classes utilitárias de texto — uma para cada estilo "Desktop/*" lido do
  Figma. Nomes de família em src/styles/tokens/fonts.css (Tarefa 4).
*/
.text-title-display {
  font-family: var(--font-family-title);
  font-weight: var(--weight-700);
  font-size: var(--scale-x16);
  line-height: var(--line-height-compact);
  letter-spacing: var(--letter-spacing-compact);
}

.text-title-h2 {
  font-family: var(--font-family-title);
  font-weight: var(--weight-800);
  font-size: var(--scale-x9);
  line-height: var(--line-height-compact);
  letter-spacing: var(--letter-spacing-regular);
}

.text-title-h3 {
  font-family: var(--font-family-title);
  font-weight: var(--weight-800);
  font-size: var(--scale-x8);
  line-height: var(--line-height-compact);
  letter-spacing: var(--letter-spacing-regular);
}

.text-body-md {
  font-family: var(--font-family-body);
  font-weight: var(--weight-400);
  font-size: var(--scale-x5);
  line-height: var(--line-height-regular);
  letter-spacing: var(--letter-spacing-regular);
}

.text-body-lg-strong {
  font-family: var(--font-family-body);
  font-weight: var(--weight-600);
  font-size: var(--scale-x6);
  line-height: var(--line-height-regular);
  letter-spacing: var(--letter-spacing-regular);
}

.text-body-sm {
  font-family: var(--font-family-body);
  font-weight: var(--weight-400);
  font-size: var(--scale-x4);
  line-height: var(--line-height-comfortable);
  letter-spacing: var(--letter-spacing-comfortable);
}

.text-body-caption {
  font-family: var(--font-family-body);
  font-weight: var(--weight-500);
  font-size: var(--scale-x3);
  line-height: var(--line-height-regular);
  letter-spacing: var(--letter-spacing-comfortable);
}

.text-label-md {
  font-family: var(--font-family-label);
  font-weight: var(--weight-700);
  font-size: var(--scale-x5);
  line-height: var(--line-height-none);
  letter-spacing: var(--letter-spacing-regular);
}

.text-label-sm {
  font-family: var(--font-family-label);
  font-weight: var(--weight-700);
  font-size: var(--scale-x4);
  line-height: var(--line-height-none);
  letter-spacing: var(--letter-spacing-regular);
}
```

- [ ] **Step 6: Rodar os testes e confirmar que passam**

```bash
pnpm test -- semantics typography
```

Esperado: PASS (todos os casos).

- [ ] **Step 7: Commit**

```bash
git add src/styles/tokens/semantics.css src/styles/tokens/typography.css src/styles/tokens/semantics.test.ts src/styles/tokens/typography.test.ts
git commit -m "feat: adiciona tokens semanticos, tipografia e estrutura de tema claro/escuro"
```

---

### Task 4: Fontes self-hospedadas

**Files:**
- Create: `src/assets/fonts/plus-jakarta-sans-variable.woff2`
- Create: `src/assets/fonts/dm-sans-variable.woff2`
- Create: `src/assets/fonts/jetbrains-mono-700.woff2`
- Create: `src/styles/tokens/fonts.css`
- Test: `src/styles/tokens/fonts.test.ts`

**Interfaces:**
- Consumes: nada
- Produces: `--font-family-title`, `--font-family-body`, `--font-family-label` (consumidas por `typography.css`, Tarefa 3) e as declarações `@font-face`

- [ ] **Step 1: Escrever o teste**

```ts
// src/styles/tokens/fonts.test.ts
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const cssPath = fileURLToPath(new URL('./fonts.css', import.meta.url));
const css = readFileSync(cssPath, 'utf-8');

const fontFiles = [
  '../../assets/fonts/plus-jakarta-sans-variable.woff2',
  '../../assets/fonts/dm-sans-variable.woff2',
  '../../assets/fonts/jetbrains-mono-700.woff2',
];

describe('fonts.css', () => {
  it('declara as 3 famílias com font-display: swap', () => {
    const blocks = css.match(/@font-face\s*\{[^}]*\}/g) ?? [];
    expect(blocks.length).toBeGreaterThanOrEqual(3);
    for (const block of blocks) {
      expect(block).toMatch(/font-display:\s*swap;/);
    }
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
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
pnpm test -- fonts
```

Esperado: FAIL (arquivo `fonts.css` e os `.woff2` ainda não existem).

- [ ] **Step 3: Baixar os arquivos de fonte variáveis/estáticos, já restritos aos pesos usados (Tarefa 2/3)**

```bash
mkdir -p src/assets/fonts

# Plus Jakarta Sans — pesos 700 e 800 usados (título): faixa variável 700..800
curl -sA "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700..800&display=swap" \
  | grep -o 'https://fonts.gstatic.com/[^)]*\.woff2' | head -1 \
  | xargs curl -sL -o src/assets/fonts/plus-jakarta-sans-variable.woff2

# DM Sans — pesos 400/500/600 usados (corpo): faixa variável 400..600
curl -sA "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400..600&display=swap" \
  | grep -o 'https://fonts.gstatic.com/[^)]*\.woff2' | head -1 \
  | xargs curl -sL -o src/assets/fonts/dm-sans-variable.woff2

# JetBrains Mono — só o peso 700 é usado (labels): arquivo estático, não variável
curl -sA "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@700&display=swap" \
  | grep -o 'https://fonts.gstatic.com/[^)]*\.woff2' | head -1 \
  | xargs curl -sL -o src/assets/fonts/jetbrains-mono-700.woff2
```

Se o `grep`/`curl` falhar (rede indisponível no ambiente de execução), baixe manualmente os 3 arquivos em https://fonts.google.com/specimen/Plus+Jakarta+Sans, .../DM+Sans, .../JetBrains+Mono (botão "Download family", pegar o `.woff2` da faixa de peso indicada) e salve nos mesmos caminhos antes de seguir pro próximo step.

- [ ] **Step 4: Criar `src/styles/tokens/fonts.css`**

```css
@font-face {
  font-family: 'Plus Jakarta Sans';
  src: url('../../assets/fonts/plus-jakarta-sans-variable.woff2') format('woff2-variations');
  font-weight: 700 800;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'DM Sans';
  src: url('../../assets/fonts/dm-sans-variable.woff2') format('woff2-variations');
  font-weight: 400 600;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'JetBrains Mono';
  src: url('../../assets/fonts/jetbrains-mono-700.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

:root {
  --font-family-title: 'Plus Jakarta Sans';
  --font-family-body: 'DM Sans';
  --font-family-label: 'JetBrains Mono';
}
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

```bash
pnpm test -- fonts
```

Esperado: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/styles/tokens/fonts.css src/styles/tokens/fonts.test.ts src/assets/fonts
git commit -m "feat: self-hospeda as 3 familias tipograficas em variable/static woff2"
```

---

### Task 5: Utilitário de tempo de leitura

**Files:**
- Create: `src/utils/reading-time.ts`
- Test: `src/utils/reading-time.test.ts`

**Interfaces:**
- Consumes: nada
- Produces: `estimateReadingTime(content: unknown, wordsPerMinute?: number): number` — consumida por `src/pages/cases/[slug].astro` (Tarefa 10)

- [ ] **Step 1: Escrever os testes**

```ts
// src/utils/reading-time.test.ts
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
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

```bash
pnpm test -- reading-time
```

Esperado: FAIL — `reading-time.ts` não existe.

- [ ] **Step 3: Implementar `src/utils/reading-time.ts`**

```ts
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
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

```bash
pnpm test -- reading-time
```

Esperado: PASS (10 testes).

- [ ] **Step 5: Commit**

```bash
git add src/utils/reading-time.ts src/utils/reading-time.test.ts
git commit -m "feat: adiciona utilitario de tempo de leitura (PRD 4.2)"
```

---

### Task 6: Navegação extensível

**Files:**
- Create: `src/config/navigation.ts`
- Test: `src/config/navigation.test.ts`

**Interfaces:**
- Consumes: nada
- Produces: `type MacroSection = { key: string; label: string; path: string; enabled: boolean }`, `macroSections: MacroSection[]`, `getEnabledSections(): MacroSection[]` — consumidos por `Header.astro`/`Footer.astro` (Tarefa 9)

- [ ] **Step 1: Escrever os testes**

```ts
// src/config/navigation.test.ts
import { describe, expect, it } from 'vitest';
import { getEnabledSections, macroSections } from './navigation';

describe('macroSections', () => {
  it('lista as 4 macro-seções previstas no PRD (seção 2), na ordem da arquitetura de informação', () => {
    expect(macroSections.map((section) => section.key)).toEqual([
      'portfolio',
      'artigos',
      'projetos',
      'fotos',
    ]);
  });

  it('só "portfolio" está habilitado no V1', () => {
    expect(macroSections.find((section) => section.key === 'portfolio')?.enabled).toBe(true);
    expect(macroSections.find((section) => section.key === 'artigos')?.enabled).toBe(false);
    expect(macroSections.find((section) => section.key === 'projetos')?.enabled).toBe(false);
    expect(macroSections.find((section) => section.key === 'fotos')?.enabled).toBe(false);
  });
});

describe('getEnabledSections', () => {
  it('retorna só as seções habilitadas', () => {
    const enabled = getEnabledSections();
    expect(enabled).toHaveLength(1);
    expect(enabled[0].key).toBe('portfolio');
    expect(enabled[0].path).toBe('/');
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

```bash
pnpm test -- navigation
```

Esperado: FAIL — `navigation.ts` não existe.

- [ ] **Step 3: Implementar `src/config/navigation.ts`**

```ts
export type MacroSection = {
  key: string;
  label: string;
  path: string;
  enabled: boolean;
};

/**
 * Lista extensível de macro-seções (PRD seção 2). Adicionar uma seção nova
 * (Artigos/Projetos entram no V2, Fotos no V3) é só acrescentar uma entrada
 * aqui — Header e Footer renderizam a partir desta lista, sem mudar layout.
 */
export const macroSections: MacroSection[] = [
  { key: 'portfolio', label: 'Portfólio', path: '/', enabled: true },
  { key: 'artigos', label: 'Artigos', path: '/artigos', enabled: false },
  { key: 'projetos', label: 'Projetos', path: '/projetos', enabled: false },
  { key: 'fotos', label: 'Fotos', path: '/fotos', enabled: false },
];

export function getEnabledSections(): MacroSection[] {
  return macroSections.filter((section) => section.enabled);
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

```bash
pnpm test -- navigation
```

Esperado: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add src/config/navigation.ts src/config/navigation.test.ts
git commit -m "feat: adiciona config de navegacao extensivel (PRD secao 2)"
```

---

### Task 7: Content collection de Cases

**Files:**
- Create: `src/content/config.ts`
- Create: `src/content/cases/exemplo-case.yaml`
- Create: `src/assets/cases/placeholder.png`
- Test: `src/content/config.test.ts`

**Interfaces:**
- Consumes: nada (schema Zod é auto-contido; o loader lê `src/content/cases/*.yaml`)
- Produces: collection `cases` (via `astro:content`) — consumida por `src/pages/cases/[slug].astro` (Tarefa 10)

- [ ] **Step 1: Criar o asset de imagem placeholder (PNG 1x1 válido, reutilizado nos 3 slots de imagem do case de exemplo)**

```bash
mkdir -p src/assets/cases
node -e "
const fs = require('fs');
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);
fs.writeFileSync('src/assets/cases/placeholder.png', png);
"
```

- [ ] **Step 2: Escrever o teste do schema**

```ts
// src/content/config.test.ts
import { describe, expect, it } from 'vitest';
import { getCollection } from 'astro:content';

describe('collection cases', () => {
  it('carrega o case de exemplo e valida o schema completo', async () => {
    const cases = await getCollection('cases');
    expect(cases.length).toBeGreaterThanOrEqual(1);

    const example = cases.find((entry) => entry.id === 'exemplo-case');
    expect(example, 'exemplo-case.yaml não encontrado ou não passou no schema').toBeDefined();

    const data = example!.data;
    expect(data.title).toBeTypeOf('string');
    expect(['published', 'coming-soon']).toContain(data.status);
    expect(Array.isArray(data.tags)).toBe(true);
    expect(data.publishedDate).toBeInstanceOf(Date);

    expect(data.content.summary).toBeTypeOf('string');
    expect(data.content.discovery?.phases).toHaveLength(4);
    expect(data.content.tests?.groups[0].results[0].status).toMatch(
      /^(verified|warning|unavailable)$/
    );
    expect(data.content.context?.image.src).toContain('placeholder');
  });
});
```

**Nota:** este teste usa `astro:content`, que só existe dentro do runtime do Astro (não roda em Vitest puro sem configuração adicional). Rodar via `pnpm astro check` cobre a validação de tipos do schema; a validação de dados em runtime deste teste específico é exercida no Step 4, via `astro build` (que força o Astro a carregar e validar todas as collections). Se `pnpm test -- config` falhar com erro de resolução de `astro:content` fora do contexto do Astro, isso é esperado — trate o `astro build` do Step 4 como o teste real desta tarefa e remova este arquivo de teste do Vitest (ou ajuste para importar o schema diretamente, sem passar por `getCollection`, conforme o que a versão do Astro instalada suportar).

- [ ] **Step 3: Implementar `src/content/config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const testResultSchema = z.object({
  status: z.enum(['verified', 'warning', 'unavailable']),
  label: z.string(),
});

const highlightSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const titleDescriptionSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const cases = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/cases' }),
  schema: ({ image }) =>
    z.object({
      // Metadados de card/listagem (PRD 4.2, seção 5)
      title: z.string(),
      shortDescription: z.string(),
      status: z.enum(['published', 'coming-soon']),
      tags: z.array(z.string()),
      publishedDate: z.coerce.date(),

      // Conteúdo da página dedicada — espelha as seções do frame
      // desktop-case no Figma. Cada bloco (exceto summary) é opcional:
      // nem todo case precisa ter todas as seções.
      content: z.object({
        summary: z.string(),
        context: z
          .object({
            description: z.string(),
            image: image(),
            caption: z.string(),
          })
          .optional(),
        problems: z.object({ description: z.string() }).optional(),
        discovery: z
          .object({
            intro: z.string(),
            phases: z.array(
              z.object({
                title: z.string(),
                subtitle: z.string(),
                description: z.string(),
              })
            ),
          })
          .optional(),
        exploration: z
          .object({
            title: z.string(),
            description: z.string(),
            images: z.array(image()),
          })
          .optional(),
        pd: z
          .object({
            title: z.string(),
            description: z.string(),
            images: z.array(image()),
          })
          .optional(),
        tests: z
          .object({
            groups: z.array(
              z.object({
                title: z.string(),
                results: z.array(testResultSchema),
              })
            ),
          })
          .optional(),
        delivery: z
          .object({
            myRole: titleDescriptionSchema,
            designSystem: titleDescriptionSchema.extend({
              images: z.array(image()).optional(),
            }),
            home: titleDescriptionSchema.extend({
              images: z.array(image()).optional(),
            }),
          })
          .optional(),
        impact: z
          .object({
            highlights: z.array(highlightSchema),
            description: z.string(),
          })
          .optional(),
        plansAhead: z
          .object({
            privacy: titleDescriptionSchema,
            pains: titleDescriptionSchema,
          })
          .optional(),
      }),
    }),
});

export const collections = { cases };
```

- [ ] **Step 4: Criar o case de exemplo `src/content/cases/exemplo-case.yaml`**

```yaml
# Case de fixture/exemplo — valida o pipeline (schema + astro:assets) e
# exercita todas as seções opcionais. Substituir por cases reais quando o
# conteúdo estiver pronto; não faz parte do conteúdo final do site.
title: "Case de exemplo"
shortDescription: "Case fictício usado para validar o schema e o pipeline de imagens."
status: "coming-soon"
tags:
  - "Discovery"
  - "Delivery"
publishedDate: "2026-01-01"

content:
  summary: "Resumo fictício do case de exemplo, usado só para testar o pipeline de conteúdo."
  context:
    description: "Descrição de contexto fictícia para validar o bloco context."
    image: "../../assets/cases/placeholder.png"
    caption: "Legenda de exemplo da imagem de contexto."
  problems:
    description: "Descrição fictícia dos problemas e desafios do case de exemplo."
  discovery:
    intro: "Introdução fictícia da etapa de descoberta."
    phases:
      - title: "Fase 1"
        subtitle: "Levantamento"
        description: "Descrição fictícia da fase 1."
      - title: "Fase 2"
        subtitle: "Entrevistas"
        description: "Descrição fictícia da fase 2."
      - title: "Fase 3"
        subtitle: "Síntese"
        description: "Descrição fictícia da fase 3."
      - title: "Fase 4"
        subtitle: "Priorização"
        description: "Descrição fictícia da fase 4."
  exploration:
    title: "Exploração"
    description: "Descrição fictícia da etapa de exploração."
    images:
      - "../../assets/cases/placeholder.png"
  pd:
    title: "Prototipação"
    description: "Descrição fictícia da etapa de prototipação."
    images:
      - "../../assets/cases/placeholder.png"
  tests:
    groups:
      - title: "Teste comparativo"
        results:
          - status: "verified"
            label: "Resultado positivo de exemplo"
          - status: "warning"
            label: "Resultado de atenção de exemplo"
          - status: "unavailable"
            label: "Resultado indisponível de exemplo"
  delivery:
    myRole:
      title: "Meu papel"
      description: "Descrição fictícia do papel no case de exemplo."
    designSystem:
      title: "Design system"
      description: "Descrição fictícia da contribuição ao design system."
    home:
      title: "Tela inicial"
      description: "Descrição fictícia da entrega da tela inicial."
  impact:
    highlights:
      - title: "-00%"
        description: "Métrica fictícia de impacto."
    description: "Narrativa fictícia do impacto gerado pelo case de exemplo."
  plansAhead:
    privacy:
      title: "Privacidade"
      description: "Descrição fictícia dos próximos passos de privacidade."
    pains:
      title: "Dores remanescentes"
      description: "Descrição fictícia das dores que ainda restam."
```

- [ ] **Step 5: Rodar `astro check` e `astro build` para validar o schema fim-a-fim**

```bash
pnpm check
pnpm build
```

Esperado: ambos passam — `astro build` falha com erro de validação Zod se algum campo do YAML não bater com o schema, então isso já cobre a validação de dados mesmo se o teste Vitest do Step 2 não rodar fora do runtime do Astro.

- [ ] **Step 6: Commit**

```bash
git add src/content/config.ts src/content/config.test.ts src/content/cases/exemplo-case.yaml src/assets/cases/placeholder.png
git commit -m "feat: adiciona content collection de cases com schema estruturado"
```

---

### Task 8: Componentes de UI reutilizáveis

**Files:**
- Create: `src/components/ui/Tag.astro`
- Create: `src/components/ui/Button.astro`
- Create: `src/components/ui/TestResultBadge.astro`

**Interfaces:**
- Consumes: custom properties de `semantics.css`/`typography.css` (Tarefa 3)
- Produces: `<Tag variant="primary" | "secondary">`, `<Button href?: string, variant: "filled-accent" | "outline-accent", external?: boolean, download?: boolean>`, `<TestResultBadge status: "verified" | "warning" | "unavailable", label: string>` — consumidos pelas rotas (Tarefa 10)

Estes três cobrem os elementos concretamente reaproveitados nas rotas desta fundação (tag do card de case, CTA "Ler case"/download de CV, badge de resultado de teste). São propositalmente **estáticos** (sem hover/active) — a interação "levanta/afunda" do design-notes é uma tarefa de implementação visual, fora do escopo aprovado para esta fundação. `Card`/`Accordion` e as seções compostas (`Hero`, `CasesPreview`, `SkillsExpertise`, `AboutMe`, `SideMenu`) ficam para a próxima etapa, porque dependem de conteúdo real (bio, skills, cópia do hero) que ainda não existe — ver "Pontos em aberto".

- [ ] **Step 1: Criar `src/components/ui/Tag.astro`**

```astro
---
interface Props {
  variant?: 'primary' | 'secondary';
}

const { variant = 'primary' } = Astro.props;
---

<span class={`tag tag--${variant}`}><slot /></span>

<style>
  .tag {
    display: inline-block;
    padding: var(--scale-base) var(--scale-x2);
    border-width: 2px;
    border-style: solid;
    font-family: var(--font-family-label);
    font-weight: var(--weight-700);
  }

  .tag--primary {
    background-color: var(--tag-bg-primary);
    border-color: var(--tag-border-subtle);
    color: var(--text-label-on-bg-strong);
  }

  .tag--secondary {
    background-color: var(--tag-bg-secondary);
    border-color: var(--tag-border-strong);
    color: var(--text-body-neutral-strong);
  }
</style>
```

- [ ] **Step 2: Criar `src/components/ui/Button.astro`**

```astro
---
interface Props {
  href?: string;
  variant?: 'filled-accent' | 'outline-accent';
  external?: boolean;
  download?: boolean;
}

const { href, variant = 'filled-accent', external = false, download = false } = Astro.props;
const Tag = href ? 'a' : 'button';
---

<Tag
  class={`button button--${variant}`}
  href={href}
  target={external ? '_blank' : undefined}
  rel={external ? 'noopener noreferrer' : undefined}
  download={download ? true : undefined}
  type={href ? undefined : 'button'}
>
  <slot />
</Tag>

<style>
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--scale-x2) var(--scale-x4);
    border-width: 2px;
    border-style: solid;
    font-family: var(--font-family-label);
    font-weight: var(--weight-700);
    text-decoration: none;
    cursor: pointer;
  }

  .button--filled-accent {
    background-color: var(--button-bg-accent-filled-regular);
    border-color: var(--button-border-accent-strong);
    color: var(--text-label-on-bg-strong);
    box-shadow: var(--shadow-comp-accent);
  }

  .button--outline-accent {
    background-color: var(--button-bg-accent-outline-regular);
    border-color: var(--button-border-neutral-strong);
    color: var(--text-body-neutral-strong);
    box-shadow: var(--shadow-comp-neutral);
  }
</style>
```

- [ ] **Step 3: Criar `src/components/ui/TestResultBadge.astro`**

```astro
---
interface Props {
  status: 'verified' | 'warning' | 'unavailable';
  label: string;
}

const { status, label } = Astro.props;
const icon = { verified: '✓', warning: '△', unavailable: '—' }[status];
---

<span class={`test-result-badge test-result-badge--${status}`}>
  <span aria-hidden="true">{icon}</span>
  {label}
</span>

<style>
  .test-result-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--scale-base);
    font-family: var(--font-family-body);
  }

  .test-result-badge--verified {
    color: var(--text-body-accent-regular);
  }

  .test-result-badge--warning {
    color: var(--text-label-on-bg-complementary);
  }

  .test-result-badge--unavailable {
    color: var(--text-body-neutral-strong);
  }
</style>
```

- [ ] **Step 4: Rodar `astro check` para confirmar que os 3 componentes compilam sem erro de tipos**

```bash
pnpm check
```

Esperado: sem erros (os componentes ainda não são importados em nenhuma página, então isso só valida a sintaxe/tipagem dos próprios arquivos).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Tag.astro src/components/ui/Button.astro src/components/ui/TestResultBadge.astro
git commit -m "feat: adiciona componentes de UI reutilizaveis (Tag, Button, TestResultBadge)"
```

---

### Task 9: Layout base — BaseLayout, Header, Footer

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/layout/Header.astro`
- Create: `src/components/layout/Footer.astro`
- Create: `.env.example`
- Modify: `src/pages/index.astro` (usa `BaseLayout` no lugar do conteúdo padrão do scaffold, só para validar a integração — o conteúdo real da Home é da Tarefa 10)

**Interfaces:**
- Consumes: `getEnabledSections()` de `src/config/navigation.ts` (Tarefa 6); `Button` de `src/components/ui/Button.astro` (Tarefa 8); `primitives.css`, `semantics.css`, `typography.css`, `fonts.css` (Tarefas 2–4); variável de ambiente `PUBLIC_UMAMI_WEBSITE_ID` (PRD 6.7)
- Produces: `BaseLayout.astro` com prop `title: string` e slot padrão — consumido por `src/pages/index.astro` e `src/pages/cases/[slug].astro` (Tarefa 10)

- [ ] **Step 1: Criar `src/components/layout/Header.astro`**

```astro
---
import { getEnabledSections } from '../../config/navigation';

const sections = getEnabledSections();
---

<header>
  <a href="/" class="clickable-link-internal-home">Lucas Pereira</a>
  <nav>
    <ul>
      {sections.map((section) => (
        <li>
          <a href={section.path}>{section.label}</a>
        </li>
      ))}
    </ul>
  </nav>
  <a href="mailto:contato@lucaspereira.dev" class="clickable-mailto-header">Contato</a>
</header>
```

- [ ] **Step 2: Criar `src/components/layout/Footer.astro`**

```astro
---
import Button from '../ui/Button.astro';

const currentYear = new Date().getFullYear();
---

<footer>
  <a href="mailto:contato@lucaspereira.dev" class="clickable-mailto-footer">contato@lucaspereira.dev</a>
  <Button href="/cv-lucas-pereira.pdf" variant="outline-accent" download>
    Baixar CV
  </Button>
  <a
    href="https://www.linkedin.com/in/lucasvalimpereira/"
    target="_blank"
    rel="noopener noreferrer"
    class="clickable-link-external-linkedin"
  >
    LinkedIn
  </a>
  <p>&copy; {currentYear} Lucas Pereira</p>
</footer>
```

**Nota manual (fora do escopo automatizável desta tarefa):** o `Button` de download do CV aponta para `/cv-lucas-pereira.pdf`, mas o arquivo real do currículo precisa ser adicionado manualmente em `public/cv-lucas-pereira.pdf` antes do deploy (PRD 4.4) — é conteúdo pessoal, não algo que uma tarefa de fundação deveria inventar. Sem o arquivo, o link resulta em 404 até o PDF ser adicionado.

- [ ] **Step 3: Criar `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/tokens/primitives.css';
import '../styles/tokens/fonts.css';
import '../styles/tokens/semantics.css';
import '../styles/tokens/typography.css';
import Header from '../components/layout/Header.astro';
import Footer from '../components/layout/Footer.astro';

interface Props {
  title: string;
  description?: string;
}

const { title, description = 'Portfólio de Lucas Pereira, Product Designer.' } = Astro.props;
---

<!doctype html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    {import.meta.env.PUBLIC_UMAMI_WEBSITE_ID && (
      <script
        defer
        src="https://cloud.umami.is/script.js"
        data-website-id={import.meta.env.PUBLIC_UMAMI_WEBSITE_ID}
      ></script>
    )}
  </head>
  <body>
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

O script do Umami (PRD 6.7) só carrega se a variável de ambiente `PUBLIC_UMAMI_WEBSITE_ID` estiver definida — o ID real do site vem do painel do Umami Cloud (conta do usuário), então não é algo que esta fundação deveria inventar. Documentar isso num `.env.example`:

```
# ID do site no Umami Cloud (https://cloud.umami.is) — sem isso, o script de analytics não carrega.
PUBLIC_UMAMI_WEBSITE_ID=
```

- [ ] **Step 4: Criar `.env.example` com a variável documentada**

```bash
cat > .env.example << 'EOF'
# ID do site no Umami Cloud (https://cloud.umami.is) — sem isso, o script de analytics não carrega.
PUBLIC_UMAMI_WEBSITE_ID=
EOF
```

- [ ] **Step 5: Trocar o conteúdo padrão de `src/pages/index.astro` pelo `BaseLayout`, só para validar a integração**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Lucas Pereira — Product Designer">
  <p>Fundação do projeto em andamento.</p>
</BaseLayout>
```

- [ ] **Step 6: Rodar `astro check` e `astro build`, e conferir o HTML gerado**

```bash
pnpm check
pnpm build
grep -o '<header>' dist/index.html
grep -o '<footer>' dist/index.html
grep -o 'Fundação do projeto' dist/index.html
```

Esperado: os três `grep` encontram uma ocorrência cada.

- [ ] **Step 7: Commit**

```bash
git add src/layouts/BaseLayout.astro src/components/layout/Header.astro src/components/layout/Footer.astro src/pages/index.astro .env.example
git commit -m "feat: adiciona BaseLayout, Header e Footer ligados a navigation.ts"
```

---

### Task 10: Rotas — Home e página dedicada de case

**Files:**
- Modify: `src/pages/index.astro`
- Create: `src/pages/cases/[slug].astro`

**Interfaces:**
- Consumes: `BaseLayout` (Tarefa 9), `Tag`/`Button`/`TestResultBadge` (Tarefa 8), collection `cases` via `astro:content` (Tarefa 7), `estimateReadingTime` de `src/utils/reading-time.ts` (Tarefa 5)
- Produces: rotas HTTP `/` e `/cases/[slug]` navegáveis

- [ ] **Step 1: Atualizar `src/pages/index.astro` para listar os cases (versão skeleton, sem estilo visual final — isso é da próxima etapa)**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Tag from '../components/ui/Tag.astro';
import Button from '../components/ui/Button.astro';
import { getCollection } from 'astro:content';

const cases = await getCollection('cases');
---

<BaseLayout title="Lucas Pereira — Product Designer">
  <section aria-labelledby="cases-selecionados-title">
    <h2 id="cases-selecionados-title">Cases selecionados</h2>
    <ul>
      {cases.map((caseEntry) => (
        <li>
          {caseEntry.data.status === 'coming-soon' ? (
            <span>Em breve</span>
          ) : (
            <ul>
              {caseEntry.data.tags.map((tag) => (
                <li><Tag>{tag}</Tag></li>
              ))}
            </ul>
          )}
          <h3>{caseEntry.data.title}</h3>
          <p>{caseEntry.data.shortDescription}</p>
          <Button href={`/cases/${caseEntry.id}`}>Ler case</Button>
        </li>
      ))}
    </ul>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Criar `src/pages/cases/[slug].astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Tag from '../../components/ui/Tag.astro';
import TestResultBadge from '../../components/ui/TestResultBadge.astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { Image } from 'astro:assets';
import { estimateReadingTime } from '../../utils/reading-time';

export async function getStaticPaths() {
  const cases = await getCollection('cases');
  return cases.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}

interface Props {
  entry: CollectionEntry<'cases'>;
}

const { entry } = Astro.props;
const { data } = entry;
const readingTime = estimateReadingTime(data.content);
---

<BaseLayout title={`${data.title} — Lucas Pereira`} description={data.shortDescription}>
  <nav aria-label="breadcrumb">
    <a href="/" class="clickable-link-internal-previous-page-title">Início</a>
    <span aria-hidden="true">/</span>
    <span class="non-clickable-active-page-title">{data.title}</span>
  </nav>

  <header>
    {data.status === 'published' && (
      <ul>
        {data.tags.map((tag) => (
          <li><Tag>{tag}</Tag></li>
        ))}
      </ul>
    )}
    <h1>{data.title}</h1>
    <p>
      <time class="published-case-date" datetime={data.publishedDate.toISOString()}>
        {data.publishedDate.toLocaleDateString('pt-BR')}
      </time>
      <span class="estimated-time">{readingTime} min de leitura</span>
    </p>
  </header>

  <section>
    <h2>Resumo</h2>
    <p>{data.content.summary}</p>
  </section>

  {data.content.context && (
    <section id="context">
      <h2>Contexto</h2>
      <p>{data.content.context.description}</p>
      <Image src={data.content.context.image} alt={data.content.context.caption} />
      <figcaption>{data.content.context.caption}</figcaption>
    </section>
  )}

  {data.content.problems && (
    <section id="problems-challenges">
      <h2>Problemas e desafios</h2>
      <p>{data.content.problems.description}</p>
    </section>
  )}

  {data.content.discovery && (
    <section id="discovery">
      <h2>Descoberta</h2>
      <p>{data.content.discovery.intro}</p>
      <ol>
        {data.content.discovery.phases.map((phase) => (
          <li>
            <h3>{phase.title}</h3>
            <p>{phase.subtitle}</p>
            <p>{phase.description}</p>
          </li>
        ))}
      </ol>
    </section>
  )}

  {data.content.exploration && (
    <section id="exploration">
      <h2>{data.content.exploration.title}</h2>
      <p>{data.content.exploration.description}</p>
      <ul>
        {data.content.exploration.images.map((img) => (
          <li><Image src={img} alt={data.content.exploration!.title} /></li>
        ))}
      </ul>
    </section>
  )}

  {data.content.pd && (
    <section id="pd">
      <h2>{data.content.pd.title}</h2>
      <p>{data.content.pd.description}</p>
      <ul>
        {data.content.pd.images.map((img) => (
          <li><Image src={img} alt={data.content.pd!.title} /></li>
        ))}
      </ul>
    </section>
  )}

  {data.content.tests && (
    <section>
      <h2>Testes</h2>
      {data.content.tests.groups.map((group) => (
        <div>
          <h3>{group.title}</h3>
          <ul>
            {group.results.map((result) => (
              <li><TestResultBadge status={result.status} label={result.label} /></li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )}

  {data.content.delivery && (
    <section id="myrole">
      <h2>Entrega</h2>
      <h3>{data.content.delivery.myRole.title}</h3>
      <p>{data.content.delivery.myRole.description}</p>

      <h3>{data.content.delivery.designSystem.title}</h3>
      <p>{data.content.delivery.designSystem.description}</p>
      {data.content.delivery.designSystem.images && (
        <ul>
          {data.content.delivery.designSystem.images.map((img) => (
            <li><Image src={img} alt={data.content.delivery!.designSystem.title} /></li>
          ))}
        </ul>
      )}

      <h3>{data.content.delivery.home.title}</h3>
      <p>{data.content.delivery.home.description}</p>
      {data.content.delivery.home.images && (
        <ul>
          {data.content.delivery.home.images.map((img) => (
            <li><Image src={img} alt={data.content.delivery!.home.title} /></li>
          ))}
        </ul>
      )}
    </section>
  )}

  {data.content.impact && (
    <section id="impact">
      <h2>Impacto</h2>
      <ul>
        {data.content.impact.highlights.map((highlight) => (
          <li>
            <strong>{highlight.title}</strong>
            <span>{highlight.description}</span>
          </li>
        ))}
      </ul>
      <p>{data.content.impact.description}</p>
    </section>
  )}

  {data.content.plansAhead && (
    <section id="plans-ahead">
      <h2>Próximos passos</h2>
      <h3>{data.content.plansAhead.privacy.title}</h3>
      <p>{data.content.plansAhead.privacy.description}</p>
      <h3>{data.content.plansAhead.pains.title}</h3>
      <p>{data.content.plansAhead.pains.description}</p>
    </section>
  )}
</BaseLayout>
```

- [ ] **Step 3: Rodar `astro check` e `astro build`, e conferir a rota gerada**

```bash
pnpm check
pnpm build
ls dist/cases/exemplo-case/index.html
grep -o 'min de leitura' dist/cases/exemplo-case/index.html
grep -o 'Case de exemplo' dist/index.html
grep -o 'Exploração' dist/cases/exemplo-case/index.html
grep -o 'Prototipação' dist/cases/exemplo-case/index.html
grep -o 'Design system' dist/cases/exemplo-case/index.html
grep -o 'Tela inicial' dist/cases/exemplo-case/index.html
```

Esperado: o arquivo existe, e todos os `grep` encontram uma ocorrência (os últimos quatro confirmam que `exploration`, `pd`, `delivery.designSystem` e `delivery.home` — que o schema da Tarefa 7 permite mas uma versão anterior desta rota deixava de renderizar — estão de fato presentes no HTML).

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro "src/pages/cases/[slug].astro"
git commit -m "feat: adiciona rotas de Home e pagina dedicada de case"
```

---

### Task 11: CI (GitHub Actions)

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: scripts `check`, `test` e `build` do `package.json` (Tarefa 1)
- Produces: workflow de CI rodando em push/PR

- [ ] **Step 1: Criar `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type-check
        run: pnpm check

      - name: Run tests
        run: pnpm test

      - name: Build
        run: pnpm build
```

- [ ] **Step 2: Validar a sintaxe do YAML localmente**

```bash
node -e "require('node:fs').readFileSync('.github/workflows/ci.yml','utf-8')" && echo "arquivo legível"
```

(Sem um linter de YAML disponível no ambiente, uma leitura simples do arquivo já pega problemas grosseiros de encoding; a validação real acontece quando o workflow rodar no GitHub após o push.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: adiciona workflow de type-check, testes e build"
```

**Nota:** a conexão do Cloudflare Pages com este repositório (deploy de fato) é feita depois, no painel da Cloudflare, usando a integração nativa com GitHub (PRD 6.5/9) — fora do escopo desta fundação (spec, seção "Objetivo").

---

## Pontos em aberto ao final desta fundação

1. **Dark mode sem dados reais do Figma** (Tarefa 3): a estrutura está pronta, mas os valores ainda repetem o tema claro. Repovoar `semantics.css` quando o modo escuro for desenhado no Figma.
2. **Componentes de seção e SideMenu não criados nesta etapa** (Tarefa 8): `Hero`, `CasesPreview`, `SkillsExpertise`, `AboutMe` e `SideMenu` (spec, seção 6) dependem de conteúdo real (bio, skills, cópia do hero, estrutura de âncoras do case) que ainda não existe — construí-los agora exigiria inventar conteúdo profissional do usuário. Entram na próxima etapa (implementação visual), junto com a extração seção-a-seção via `get_design_context`.
3. **CV em PDF** (Tarefa 9): o botão do Footer aponta para `/cv-lucas-pereira.pdf`, mas o arquivo real precisa ser adicionado manualmente em `public/` antes do deploy.
4. **Conteúdo real dos cases**: `exemplo-case.yaml` é só fixture para validar o pipeline — os cases reais (Redesign, Payments, Design System, vistos na Home do Figma) entram depois, quando o conteúdo estiver pronto.
5. **Estilo visual final e microinterações**: as rotas e componentes desta fundação renderizam HTML funcional e sem preto/branco absoluto, mas sem bater pixel-a-pixel com o Figma e sem as animações de hover/active do design-notes — isso é implementação visual, seção a seção, via `get_design_context` (fora de escopo aqui, e indisponível nesta sessão porque o MCP do Figma está desconectado).
6. **Conexão Cloudflare Pages ↔ GitHub**: configurada manualmente no painel da Cloudflare, fora deste repositório.
7. **ID real do Umami** (Tarefa 9): o script só é injetado se `PUBLIC_UMAMI_WEBSITE_ID` estiver definida. Criar o site no painel do Umami Cloud e configurar essa variável nas env vars do projeto no Cloudflare Pages antes do deploy — sem isso, o site funciona normalmente, só sem analytics.
8. **TypeScript fixado em `^6.0.3`** (Tarefa 1): esta é a major exata que o `@astrojs/check`/Astro 7.3.1 trouxeram como compatível no momento da implementação; registrado aqui para que uma leitura futura não estranhe a versão não bater com o que o texto original do plano possa ter sugerido.
9. **Schema de content collection em `src/content.config.ts`, não `src/content/config.ts`** (Tarefa 7): o Astro 7.3.1 lança `LegacyContentConfigError` para o caminho antigo (mudança do content layer a partir da v6) e exige o novo arquivo no nível raiz de `src/`. O texto da Tarefa 7 ainda cita `src/content/config.ts` — está desatualizado; a própria collection (`getCollection('cases')`) não é afetada e funciona identicamente a partir do novo local.
10. **`sharp` adicionado como dependência direta** (Tarefa 10): o componente `<Image>` de `astro:assets` (exigido pelas Restrições Globais deste plano) fazia o `pnpm build` falhar com "Could not find Sharp", porque o layout estrito de `node_modules` do pnpm não expõe a dependência opcional `sharp` do próprio Astro para o pipeline de processamento de imagens. Adicionar `sharp` como `dependencies` direta (já feito, em `package.json`) é a correção; registrado aqui para que uma leitura futura entenda por que ela está lá.
11. **Gap honesto: `og:image` e `site` ausentes**: a seção 8 do spec pede uma imagem de social-preview (`og:image`), e o Astro precisa de um valor `site` em `astro.config.mjs` para gerar URLs canônicas/OG absolutas. Nenhum dos dois existe ainda — não há imagem de preview real para referenciar nem domínio de produção escolhido. Isso foi deliberadamente não simulado (uma imagem placeholder ou um domínio falso seriam piores que a lacuna honesta, mesma categoria de decisão já adiada em outros pontos deste plano para o PDF do CV e o ID do Umami). Ambos precisam de decisões reais de assets/domínio durante a etapa de implementação visual — não fabricados aqui.
