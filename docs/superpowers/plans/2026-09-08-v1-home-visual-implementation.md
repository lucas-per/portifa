# Implementação visual da Home (V1) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar visualmente a Home (V1) a partir do frame `desktop-home` do Figma: corrigir bugs de token herdados da fundação, construir os componentes de seção que faltavam (Header, Footer, Hero, CasesPreview, CaseCard, SkillsExpertise, AboutMe), popular os 3 cases reais e aplicar hover/active nos botões.

**Architecture:** Componentes Astro props-driven (`ui/` reutiliza `Button`/`Tag` já existentes, `sections/` compõe as seções da Home), CSS vanilla via custom properties já definidas (`primitives.css`/`semantics.css`/`typography.css`), assets (avatar, logo, ícones) baixados do Figma e commitados como arquivos reais. Sem novas dependências.

**Tech Stack:** Astro (TypeScript strict), pnpm, Vitest (só para os arquivos CSS de token, testados como texto), CSS vanilla.

**Spec:** `docs/superpowers/specs/2026-09-08-v1-home-visual-design.md`

## Global Constraints

- **Figma é a fonte da verdade**: quando o Figma e a documentação escrita (PRD/design-notes/specs) divergirem, implementar conforme o Figma (spec desta etapa).
- CSS vanilla apenas — nenhum framework utilitário (herdado do PRD 6.5).
- Cores em OKLCH; proibido preto/branco absoluto (herdado do PRD 6.2).
- Assets (avatar, logo, ícones) são baixados do Figma e commitados como bytes reais — nunca redesenhados à mão.
- SVGs decorativos (logo, ícones de UI/ferramentas) são importados e renderizados via `<img>` com `width`/`height` explícitos, não via `<Image />` do `astro:assets` (exceção documentada na spec, seção 5). O avatar (foto) continua exclusivamente via `<Image />`.
- Os 3 cases desta etapa (Redesign, Jornada de Pagamentos, GoSafe DS) ficam `status: coming-soon` — nenhum tem CTA "Ler case" ativo nesta etapa. Quando `coming-soon`, a tag categórica é **substituída** por uma única `Tag variant="secondary"` "Em breve" (não removida) — métricas (`highlights`), quando existem, continuam aparecendo.
- Hover/active dos botões (design-notes): `transition: transform 0.1s ease`; hover `translate(-2px, -2px)`; active `translate(1px, 1px)` + `box-shadow: none`; `focus-visible` com `outline` próprio, separado do `box-shadow`.
- Header não renderiza lista de macro-seções nesta etapa (Figma não desenha isso com só 1 seção ativa) — `getEnabledSections()` de `src/config/navigation.ts` fica pronta, sem uso visual até o V2.

---

### Task 1: Corrigir `Button.astro`

**Files:**
- Modify: `src/components/ui/Button.astro`

**Interfaces:**
- Consumes: `--button-bg-accent-filled-regular`, `--button-border-neutral-strong`, `--text-label-on-bg-strong`, `--shadow-comp-neutral`, `--button-bg-accent-outline-regular`, `--button-border-accent-strong`, `--text-label-on-bg-accent`, `--shadow-comp-accent`, `--button-border-neutral-subtle`, `--border-accent-strong`, `--scale-x3`, `--scale-x6`, `--scale-none` (já existem em `semantics.css`/`primitives.css`); classe utilitária `.text-label-md` (já existe em `typography.css`)
- Produces: `<Button href? variant="filled-accent"|"outline-accent"|"ghost-accent" external? download? class?>` com slot padrão (label) e slot nomeado `icon` (ícone à direita) — consumido por `Header.astro`, `Footer.astro`, `CaseCard.astro` (Tarefas 8, 9, 10)

O `Button.astro` atual tem 3 bugs em relação ao Figma real (node `98:398`, `106:379`, `91:581`): `filled-accent` e `outline-accent` usam os tokens de borda/sombra trocados entre si, `border-width` é `2px` (deveria ser `3px`, padrão do sistema inteiro) e o padding não bate (`scale-x2 scale-x4` em vez de `scale-x3 scale-x6`). Falta também um terceiro variant (`ghost-accent`, usado pelo botão "sobre mim" do header — fundo quase idêntico ao `outline-accent` mas borda quase invisível, sem sombra, padding horizontal zero) e suporte a ícone à direita + classe extra (para as classes semânticas do design-notes, ex. `clickable-mailto-header`).

- [ ] **Step 1: Reescrever `src/components/ui/Button.astro`**

```astro
---
interface Props {
  href?: string;
  variant?: 'filled-accent' | 'outline-accent' | 'ghost-accent';
  external?: boolean;
  download?: boolean;
  class?: string;
}

const {
  href,
  variant = 'filled-accent',
  external = false,
  download = false,
  class: className,
} = Astro.props;
const Tag = href ? 'a' : 'button';
const hasIcon = Astro.slots.has('icon');
---

<Tag
  class={['button', `button--${variant}`, className].filter(Boolean).join(' ')}
  href={href}
  target={external ? '_blank' : undefined}
  rel={external ? 'noopener noreferrer' : undefined}
  download={download ? true : undefined}
  type={href ? undefined : 'button'}
>
  <span class="button__label text-label-md"><slot /></span>
  {hasIcon && (
    <span class="button__icon">
      <slot name="icon" />
    </span>
  )}
</Tag>

<style>
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--scale-x3);
    padding: var(--scale-x3) var(--scale-x6);
    border-width: 3px;
    border-style: solid;
    text-decoration: none;
    cursor: pointer;
    transition: transform 0.1s ease;
  }

  .button__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
  }

  .button--filled-accent {
    background-color: var(--button-bg-accent-filled-regular);
    border-color: var(--button-border-neutral-strong);
    color: var(--text-label-on-bg-strong);
    box-shadow: var(--shadow-comp-neutral);
  }

  .button--outline-accent {
    background-color: var(--button-bg-accent-outline-regular);
    border-color: var(--button-border-accent-strong);
    color: var(--text-label-on-bg-accent);
    box-shadow: var(--shadow-comp-accent);
  }

  .button--ghost-accent {
    background-color: var(--button-bg-accent-outline-regular);
    border-color: var(--button-border-neutral-subtle);
    color: var(--text-label-on-bg-accent);
    padding: var(--scale-x3) var(--scale-none);
  }

  .button:hover {
    transform: translate(-2px, -2px);
  }

  .button:active {
    transform: translate(1px, 1px);
    box-shadow: none;
  }

  .button:focus-visible {
    outline: 2px solid var(--border-accent-strong);
    outline-offset: 2px;
  }
</style>
```

- [ ] **Step 2: Verificar que o projeto ainda type-checka (não há teste automatizado pra estilo de componente Astro)**

```bash
pnpm check
```

Esperado: 0 erros (o `.astro` antigo que usa `Button` — `src/pages/index.astro`, `src/pages/cases/[slug].astro` — ainda compila, já que `variant` aceita os mesmos valores antigos mais um novo).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Button.astro
git commit -m "fix: corrige tokens, dimensoes e adiciona variant ghost-accent ao Button"
```

---

### Task 2: Corrigir `Tag.astro`

**Files:**
- Modify: `src/components/ui/Tag.astro`

**Interfaces:**
- Consumes: `--tag-bg-primary`, `--tag-border-subtle`, `--text-label-on-bg-strong`, `--tag-bg-secondary`, `--tag-border-strong`, `--text-label-on-bg-complementary` (já existem), `.text-label-sm` (já existe)
- Produces: `<Tag variant="primary"|"secondary">` (sem mudança de interface) — consumido por `CaseCard.astro` (Tarefa 10)

Bugs em relação ao Figma (node `31:704`): `border-width` é `2px` (deveria ser `3px`) e o variant `secondary` usa `--text-body-neutral-strong` para o texto, mas o Figma usa `--text-label-on-bg-complementary` (vermelho escuro). A tag também duplica `font-family`/`font-weight` que já existem em `.text-label-sm` — melhor reusar a classe utilitária (que ganha `uppercase`/tamanho/line-height corretos na Tarefa 3) do que manter valores soltos.

- [ ] **Step 1: Reescrever `src/components/ui/Tag.astro`**

```astro
---
interface Props {
  variant?: 'primary' | 'secondary';
}

const { variant = 'primary' } = Astro.props;
---

<span class={`tag tag--${variant} text-label-sm`}><slot /></span>

<style>
  .tag {
    display: inline-block;
    padding: var(--scale-base) var(--scale-x2);
    border-width: 3px;
    border-style: solid;
  }

  .tag--primary {
    background-color: var(--tag-bg-primary);
    border-color: var(--tag-border-subtle);
    color: var(--text-label-on-bg-strong);
  }

  .tag--secondary {
    background-color: var(--tag-bg-secondary);
    border-color: var(--tag-border-strong);
    color: var(--text-label-on-bg-complementary);
  }
</style>
```

- [ ] **Step 2: Verificar type-check**

```bash
pnpm check
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Tag.astro
git commit -m "fix: corrige border-width e cor de texto do Tag secondary"
```

---

### Task 3: `text-transform: uppercase` em labels e títulos H2

**Files:**
- Modify: `src/styles/tokens/typography.css`
- Modify: `src/styles/tokens/typography.test.ts`

**Interfaces:**
- Consumes: nada
- Produces: `.text-label-md`, `.text-label-sm`, `.text-title-h2` com `text-transform: uppercase` — consumido por `Button`/`Tag` (já reescritos nas Tarefas 1/2) e pelos títulos de seção (`CasesPreview`, `SkillsExpertise`, `AboutMe`, Tarefas 11/13/14)

No Figma, todo botão/tag (estilo label) e os 3 títulos de seção H2 da Home ("Cases selecionados", "Skills & Expertise", "Sobre mim") são uppercase — mas nenhum título H3 é. `typography.css` hoje não declara `text-transform` em lugar nenhum.

- [ ] **Step 1: Escrever o teste que verifica o `text-transform`**

Adicionar ao final de `src/styles/tokens/typography.test.ts` (mantendo os testes existentes):

```ts
describe('text-transform em labels e títulos H2', () => {
  it.each(['.text-label-md', '.text-label-sm', '.text-title-h2'])(
    '%s usa uppercase',
    (selector) => {
      const escapedSelector = selector.replace('.', '\\.');
      const blockMatch = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
      expect(blockMatch, `seletor ${selector} não encontrado`).not.toBeNull();
      expect(blockMatch![1]).toContain('text-transform: uppercase');
    }
  );

  it('.text-title-h3 não usa uppercase', () => {
    const blockMatch = css.match(/\.text-title-h3\s*\{([^}]*)\}/);
    expect(blockMatch).not.toBeNull();
    expect(blockMatch![1]).not.toContain('text-transform');
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que a primeira parte falha**

```bash
pnpm test -- typography
```

Esperado: FAIL nos 3 casos de `.text-label-md`/`.text-label-sm`/`.text-title-h2` (ainda sem `text-transform`); PASS no caso do `.text-title-h3`.

- [ ] **Step 3: Adicionar `text-transform: uppercase` em `src/styles/tokens/typography.css`**

Em `.text-label-md` e `.text-label-sm`, adicionar a linha `text-transform: uppercase;` (em qualquer posição dentro do bloco). Em `.text-title-h2` (definido em `src/styles/tokens/semantics.css`? — não, título H2 é uma classe de `typography.css`; adicionar lá também, já que se refere ao mesmo arquivo):

```css
.text-title-h2 {
  font-family: var(--font-family-title);
  font-weight: var(--weight-800);
  font-size: var(--scale-x9);
  line-height: var(--line-height-compact);
  letter-spacing: var(--letter-spacing-regular);
  text-transform: uppercase;
}
```

(As classes `.text-label-md` e `.text-label-sm` recebem a mesma linha `text-transform: uppercase;` adicionada ao final de cada bloco existente, sem alterar o restante.)

- [ ] **Step 4: Rodar o teste e confirmar que passa**

```bash
pnpm test -- typography
```

Esperado: PASS em todos os casos.

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens/typography.css src/styles/tokens/typography.test.ts
git commit -m "feat: adiciona text-transform uppercase em labels e titulos H2"
```

---

### Task 4: Token de cor da moldura do avatar

**Files:**
- Modify: `src/styles/tokens/primitives.css`
- Modify: `src/styles/tokens/primitives.test.ts`
- Modify: `src/styles/tokens/semantics.css`
- Modify: `src/styles/tokens/semantics.test.ts`

**Interfaces:**
- Consumes: nada
- Produces: `--neutral-100` (primitivo), `--surface-bg-avatar-frame` (semântico) — consumido por `Hero.astro` (Tarefa 12)

O fundo da moldura do avatar no Figma (`wrap-avatar-frame`, node `149:536`) usa um hex literal (`#f5f0e8`) que não corresponde a nenhum token já lido (`get_variable_defs`) — não é uma variable no Figma, é um fill direto. Convertido pra OKLCH pela mesma fórmula usada nos demais primitivos (sRGB → linear → OKLab → OKLCH): `oklch(95.69% 0.0120 78.40)`.

- [ ] **Step 1: Escrever os testes**

Adicionar a `src/styles/tokens/primitives.test.ts`, dentro do `describe('primitives.css', ...)` já existente:

```ts
it('declara o primitivo da moldura do avatar em OKLCH', () => {
  expectDeclares('neutral-100', 'oklch(95.69% 0.0120 78.40)');
});
```

Adicionar a `src/styles/tokens/semantics.test.ts`, dentro do `describe('semantics.css', ...)` já existente:

```ts
it('mapeia a moldura do avatar pro primitivo correto', () => {
  expectDeclares('surface-bg-avatar-frame', 'var(--neutral-100)');
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

```bash
pnpm test -- primitives semantics
```

Esperado: FAIL nos 2 casos novos (tokens ainda não existem); os demais casos continuam passando.

- [ ] **Step 3: Adicionar o primitivo em `src/styles/tokens/primitives.css`**

No bloco "Neutros" (depois de `--neutral-0`):

```css
  --neutral-100: oklch(95.69% 0.0120 78.40); /* #f5f0e8 — não é variable no Figma, fill direto do wrap-avatar-frame */
```

- [ ] **Step 4: Adicionar o semântico em `src/styles/tokens/semantics.css`**

No bloco "Superfícies" (depois de `--surface-bg-tertiary-strong`):

```css
  --surface-bg-avatar-frame: var(--neutral-100);
```

- [ ] **Step 5: Rodar os testes e confirmar que passam**

```bash
pnpm test -- primitives semantics
```

Esperado: PASS em todos os casos.

- [ ] **Step 6: Commit**

```bash
git add src/styles/tokens/primitives.css src/styles/tokens/primitives.test.ts src/styles/tokens/semantics.css src/styles/tokens/semantics.test.ts
git commit -m "feat: adiciona token de cor da moldura do avatar (fill direto do Figma)"
```

---

### Task 5: Campo `highlights` no schema da content collection

**Files:**
- Modify: `src/content.config.ts`

**Interfaces:**
- Consumes: nada
- Produces: campo opcional `highlights?: { value: string; label: string }[]` no nível raiz do case (metadado de card) — consumido por `CasesPreview.astro`/`CaseCard.astro` (Tarefas 10/11) e pelos 3 YAMLs reais (Tarefa 7)

Não existe teste Vitest pro schema (nota já registrada na Tarefa 7 do plano da fundação: `astro:content` não roda fora do runtime do Astro) — a validação é via `pnpm check` + `pnpm build`, que falha com erro Zod se o YAML não bater com o schema.

- [ ] **Step 1: Adicionar o campo em `src/content.config.ts`**

Logo depois de `tags: z.array(z.string()),` e antes de `publishedDate: z.coerce.date(),`:

```ts
      tags: z.array(z.string()),
      // Métricas de resultado exibidas no card da Home (ex: "+15%" / "Boletos
      // pagos") — distinto de content.impact.highlights, que é o bloco da
      // página dedicada de case.
      highlights: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
      publishedDate: z.coerce.date(),
```

- [ ] **Step 2: Verificar type-check (o `exemplo-case.yaml` não tem `highlights` — precisa continuar válido por ser opcional)**

```bash
pnpm check
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add src/content.config.ts
git commit -m "feat: adiciona campo highlights ao schema de cases (metricas do card)"
```

---

### Task 6: Baixar e commitar os assets do Figma

**Files:**
- Create: `src/assets/home/avatar.png`
- Create: `src/assets/icons/logo.svg`
- Create: `src/assets/icons/mail.svg`
- Create: `src/assets/icons/download.svg`
- Create: `src/assets/icons/external-link.svg`
- Create: `src/assets/icons/arrow-right.svg`
- Create: `src/assets/icons/tools/figma.svg`
- Create: `src/assets/icons/tools/claude-code.svg`
- Create: `src/assets/icons/tools/claude.svg`
- Create: `src/assets/icons/tools/gemini.svg`
- Create: `src/assets/icons/tools/notebook.svg`
- Create: `src/assets/icons/tools/maze.svg`
- Create: `src/assets/icons/tools/ts.svg`
- Create: `src/assets/icons/tools/paper.svg`
- Create: `src/assets/icons/tools/sp.svg`
- Create: `src/assets/icons/tools/sb.svg`
- Create: `src/assets/icons/tools/github.svg`
- Create: `src/assets/icons/tools/or.svg`
- Create: `src/assets/icons/tools/jamovi.svg`

**Interfaces:**
- Consumes: nada
- Produces: arquivos de asset reais (não redesenhados) — consumidos por `Header.astro`, `Footer.astro`, `Hero.astro`, `SkillsExpertise.astro`, `CaseCard.astro` (Tarefas 8–14)

URLs exportadas do Figma (`get_design_context`, arquivo `VM0MVYSWiDbznuPZFRyArB`) — expiram em ~7 dias. Se algum `curl` abaixo retornar 403/404 por expiração, re-obtenha a URL chamando `get_design_context` no node indicado e repita só aquele download.

- [ ] **Step 1: Criar as pastas e baixar todos os assets**

```bash
mkdir -p src/assets/home src/assets/icons/tools

curl -sL -o src/assets/home/avatar.png "https://www.figma.com/api/mcp/asset/c28749da-0989-45be-a190-8f83c534a852.png"

curl -sL -o src/assets/icons/logo.svg "https://www.figma.com/api/mcp/asset/a40c4d6b-7927-4c66-973d-cf20d8e05d46.svg"
curl -sL -o src/assets/icons/mail.svg "https://www.figma.com/api/mcp/asset/f0022561-8a7b-4742-9a4f-1a7adb6b8d11.svg"
curl -sL -o src/assets/icons/download.svg "https://www.figma.com/api/mcp/asset/ea840f50-7ec8-431a-9822-925966f9b755.svg"
curl -sL -o src/assets/icons/external-link.svg "https://www.figma.com/api/mcp/asset/1680bee2-b9af-4949-998d-9c151dbc4f9c.svg"
curl -sL -o src/assets/icons/arrow-right.svg "https://www.figma.com/api/mcp/asset/900af8a0-1e93-4549-aad2-e0ff838021b7.svg"

curl -sL -o src/assets/icons/tools/figma.svg "https://www.figma.com/api/mcp/asset/79e2d20f-9046-421d-ab74-96f9cd0b2803.svg"
curl -sL -o src/assets/icons/tools/claude-code.svg "https://www.figma.com/api/mcp/asset/ae788fe2-7a47-46fd-9340-22abf96c1919.svg"
curl -sL -o src/assets/icons/tools/claude.svg "https://www.figma.com/api/mcp/asset/31053d72-f5f5-462f-9e54-e44e153a2b26.svg"
curl -sL -o src/assets/icons/tools/gemini.svg "https://www.figma.com/api/mcp/asset/46a2016a-ce27-4eea-8ef6-9f0a3e50c023.svg"
curl -sL -o src/assets/icons/tools/notebook.svg "https://www.figma.com/api/mcp/asset/d7380669-d0d6-490c-ad8d-3f55c94c1168.svg"
curl -sL -o src/assets/icons/tools/maze.svg "https://www.figma.com/api/mcp/asset/4fc87d0b-79f9-41c6-95d1-c8eedc89bc10.svg"
curl -sL -o src/assets/icons/tools/ts.svg "https://www.figma.com/api/mcp/asset/9764508f-1d70-42b0-9572-e23c3a64e3c6.svg"
curl -sL -o src/assets/icons/tools/paper.svg "https://www.figma.com/api/mcp/asset/d7177b79-1329-4cc3-9bee-700d9aca65ba.svg"
curl -sL -o src/assets/icons/tools/sp.svg "https://www.figma.com/api/mcp/asset/072eebf2-15d2-4918-9c94-a80139c6d591.svg"
curl -sL -o src/assets/icons/tools/sb.svg "https://www.figma.com/api/mcp/asset/39c3aa31-652c-4873-ac31-bbfa40535daf.svg"
curl -sL -o src/assets/icons/tools/github.svg "https://www.figma.com/api/mcp/asset/8a5ca2ed-026c-4517-96db-2f7c0c9c350c.svg"
curl -sL -o src/assets/icons/tools/or.svg "https://www.figma.com/api/mcp/asset/45d57445-19ef-4bbc-b01e-95592a42cd86.svg"
curl -sL -o src/assets/icons/tools/jamovi.svg "https://www.figma.com/api/mcp/asset/642cd2b2-0c96-4ddc-a0bf-742d32ce7e14.svg"
```

- [ ] **Step 2: Verificar que todos os 19 arquivos existem e não estão vazios**

```bash
find src/assets/home src/assets/icons -type f -size +0c | wc -l
```

Esperado: `19`. Se vier menos, algum `curl` falhou silenciosamente (URL expirada) — re-baixe o(s) arquivo(s) faltante(s) via `get_design_context` no node correspondente antes de seguir.

- [ ] **Step 3: Commit**

```bash
git add src/assets/home src/assets/icons
git commit -m "feat: adiciona avatar, logo e icones reais exportados do Figma"
```

---

### Task 7: Os 3 cases reais (YAML)

**Files:**
- Create: `src/content/cases/redesign.yaml`
- Create: `src/content/cases/jornada-pagamentos.yaml`
- Create: `src/content/cases/gosafe-ds.yaml`

**Interfaces:**
- Consumes: schema de `src/content.config.ts` (Tarefa 5)
- Produces: 3 entradas da collection `cases` (`published-date` provisória — ver nota) — consumidas por `CasesPreview.astro` (Tarefa 11)

Todos com `status: coming-soon` (decisão desta etapa — nenhum tem página dedicada ainda). `publishedDate` ainda não tem um valor real (o case não foi publicado) — usa a data desta implementação como placeholder, a corrigir quando o case virar `published` de verdade. `content.summary` é obrigatório no schema mesmo sem o resto da página dedicada — reaproveita o texto de `shortDescription` (mesma cópia já escrita pelo usuário no Figma, não é conteúdo inventado).

- [ ] **Step 1: Criar `src/content/cases/redesign.yaml`**

```yaml
title: "Redesign de produto"
shortDescription: "Como recriamos do zero um app de cibersegurança com código legado instável, mudamos o modelo de negócio e levamos a base de pagantes de zero a 24 mil em um ano."
status: "coming-soon"
tags:
  - "discovery"
  - "delivery"
  - "gestão"
  - "b2b"
  - "b2c"
publishedDate: "2026-09-08" # provisória — o case ainda não foi publicado

content:
  summary: "Como recriamos do zero um app de cibersegurança com código legado instável, mudamos o modelo de negócio e levamos a base de pagantes de zero a 24 mil em um ano."
```

- [ ] **Step 2: Criar `src/content/cases/jornada-pagamentos.yaml`**

```yaml
title: "Jornada de Pagamentos"
shortDescription: "Reestruturação da jornada e implementação de design system em um app com mais de 100 mil usuários."
status: "coming-soon"
tags: []
publishedDate: "2026-09-08" # provisória — o case ainda não foi publicado
highlights:
  - value: "+15%"
    label: "Boletos pagos"
  - value: "+20%"
    label: "Pagamentos"

content:
  summary: "Reestruturação da jornada e implementação de design system em um app com mais de 100 mil usuários."
```

- [ ] **Step 3: Criar `src/content/cases/gosafe-ds.yaml`**

```yaml
title: "GoSafe DS"
shortDescription: "Criação de um design system corporativo, com impacto direto na eficiência operacional e menos tempo para lançamentos de novos produtos."
status: "coming-soon"
tags: []
publishedDate: "2026-09-08" # provisória — o case ainda não foi publicado
highlights:
  - value: "-60%"
    label: "Time-to-market"

content:
  summary: "Criação de um design system corporativo, com impacto direto na eficiência operacional e menos tempo para lançamentos de novos produtos."
```

- [ ] **Step 4: Rodar `pnpm build` pra validar os 3 YAMLs contra o schema**

```bash
pnpm build
```

Esperado: build passa sem erro de validação Zod.

- [ ] **Step 5: Commit**

```bash
git add src/content/cases/redesign.yaml src/content/cases/jornada-pagamentos.yaml src/content/cases/gosafe-ds.yaml
git commit -m "feat: adiciona os 3 cases reais da Home (Redesign, Pagamentos, GoSafe DS)"
```

---

### Task 8: Reescrever `Header.astro`

**Files:**
- Modify: `src/components/layout/Header.astro`

**Interfaces:**
- Consumes: `Button` (Tarefa 1), `src/assets/icons/logo.svg`, `src/assets/icons/mail.svg` (Tarefa 6)
- Produces: header com logo + 2 botões — sem mudança de interface externa (`BaseLayout.astro` já importa `Header` sem props)

- [ ] **Step 1: Reescrever `src/components/layout/Header.astro`**

```astro
---
import Button from '../ui/Button.astro';
import logo from '../../assets/icons/logo.svg';
import mailIcon from '../../assets/icons/mail.svg';
---

<header class="site-header">
  <a href="/" class="site-header__logo clickable-link-internal-home">
    <img src={logo.src} width="304" height="54" alt="Lucas Pereira" />
  </a>
  <div class="site-header__cta">
    <Button href="#sobre-mim" variant="ghost-accent" class="clickable-anchor-aboutme">
      Sobre mim
    </Button>
    <Button href="mailto:oi@lpereira.me" variant="filled-accent" class="clickable-mailto-header">
      Contato
      <Fragment slot="icon">
        <img src={mailIcon.src} width="24" height="24" alt="" />
      </Fragment>
    </Button>
  </div>
</header>

<style>
  .site-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--scale-x8);
    padding: var(--scale-x8) var(--scale-x20);
  }

  .site-header__logo {
    display: inline-flex;
  }

  .site-header__cta {
    display: flex;
    gap: var(--scale-x12);
    align-items: center;
  }
</style>
```

- [ ] **Step 2: Verificar type-check**

```bash
pnpm check
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Header.astro
git commit -m "feat: implementa visual real do Header (logo, sobre mim, contato)"
```

---

### Task 9: Reescrever `Footer.astro`

**Files:**
- Modify: `src/components/layout/Footer.astro`

**Interfaces:**
- Consumes: `Button` (Tarefa 1), `src/assets/icons/{mail,download,external-link}.svg` (Tarefa 6)
- Produces: footer com 3 botões + copyright — sem mudança de interface externa

- [ ] **Step 1: Reescrever `src/components/layout/Footer.astro`**

```astro
---
import Button from '../ui/Button.astro';
import mailIcon from '../../assets/icons/mail.svg';
import downloadIcon from '../../assets/icons/download.svg';
import externalLinkIcon from '../../assets/icons/external-link.svg';

const currentYear = new Date().getFullYear();
---

<footer class="site-footer">
  <div class="site-footer__buttons">
    <div class="site-footer__divider" aria-hidden="true"></div>
    <Button href="mailto:oi@lpereira.me" variant="outline-accent" class="clickable-mailto-footer">
      oi@lpereira.me
      <Fragment slot="icon">
        <img src={mailIcon.src} width="24" height="24" alt="" />
      </Fragment>
    </Button>
    <div class="site-footer__divider" aria-hidden="true"></div>
    <Button
      href="/cv-lucas-pereira.pdf"
      variant="outline-accent"
      download
      class="clickable-download-cv"
    >
      Baixar CV
      <Fragment slot="icon">
        <img src={downloadIcon.src} width="24" height="24" alt="" />
      </Fragment>
    </Button>
    <div class="site-footer__divider" aria-hidden="true"></div>
    <Button
      href="https://www.linkedin.com/in/lucasvalimpereira/"
      variant="outline-accent"
      external
      class="clickable-link-external-linkedin"
    >
      LinkedIn
      <Fragment slot="icon">
        <img src={externalLinkIcon.src} width="24" height="24" alt="" />
      </Fragment>
    </Button>
    <div class="site-footer__divider" aria-hidden="true"></div>
  </div>
  <p class="site-footer__copyright text-body-caption">&copy; {currentYear} Lucas Pereira</p>
</footer>

<style>
  .site-footer {
    display: flex;
    flex-direction: column;
    border-top: 5px solid var(--border-accent-strong);
    background-color: var(--surface-bg-off-white-primary);
  }

  .site-footer__buttons {
    display: flex;
    align-items: center;
    gap: var(--scale-x6);
    padding: var(--scale-x4) var(--scale-x20);
    border-bottom: 5px solid var(--border-accent-subtle);
  }

  .site-footer__divider {
    flex: 1;
    height: 3px;
    background-color: var(--border-accent-strong);
  }

  .site-footer__copyright {
    text-align: center;
    padding: var(--scale-base) 0;
    color: var(--text-body-accent-regular);
  }
</style>
```

- [ ] **Step 2: Verificar type-check**

```bash
pnpm check
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Footer.astro
git commit -m "feat: implementa visual real do Footer (contato, CV, LinkedIn)"
```

---

### Task 10: Criar `CaseCard.astro`

**Files:**
- Create: `src/components/sections/CaseCard.astro`

**Interfaces:**
- Consumes: `Tag`, `Button` (Tarefas 1/2), `src/assets/icons/arrow-right.svg` (Tarefa 6)
- Produces: `<CaseCard title shortDescription status tags highlights? href? shadow?>` — consumido por `CasesPreview.astro` (Tarefa 11)

- [ ] **Step 1: Criar `src/components/sections/CaseCard.astro`**

```astro
---
import Tag from '../ui/Tag.astro';
import Button from '../ui/Button.astro';
import arrowRightIcon from '../../assets/icons/arrow-right.svg';

interface Highlight {
  value: string;
  label: string;
}

interface Props {
  title: string;
  shortDescription: string;
  status: 'published' | 'coming-soon';
  tags: string[];
  highlights?: Highlight[];
  href?: string;
  shadow?: 'accent' | 'neutral';
}

const {
  title,
  shortDescription,
  status,
  tags,
  highlights,
  href,
  shadow = 'neutral',
} = Astro.props;
---

<article class={`case-card case-card--shadow-${shadow}`}>
  <div class="case-card__content">
    <ul class="case-card__tags">
      {status === 'coming-soon' ? (
        <li><Tag variant="secondary">Em breve</Tag></li>
      ) : (
        tags.map((tag) => (
          <li><Tag variant="primary">{tag}</Tag></li>
        ))
      )}
    </ul>
    <div class="case-card__texts">
      <h3 class="text-title-h3">{title}</h3>
      <p class="text-body-md">{shortDescription}</p>
    </div>
  </div>
  {highlights && highlights.length > 0 && (
    <div class="case-card__highlights">
      {highlights.map((highlight) => (
        <div class="case-card__highlight">
          <p class="text-body-lg-strong">{highlight.value}</p>
          <p class="text-body-sm">{highlight.label}</p>
        </div>
      ))}
    </div>
  )}
  {href && (
    <Button href={href} variant="outline-accent" class="clickable-link-internal-case">
      Ler case
      <Fragment slot="icon">
        <img src={arrowRightIcon.src} width="24" height="24" alt="" />
      </Fragment>
    </Button>
  )}
</article>

<style>
  .case-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--scale-x6);
    padding: var(--scale-x6);
    background-color: var(--surface-bg-off-white-secondary);
    border: 3px solid var(--border-neutral-strong);
  }

  .case-card--shadow-neutral {
    box-shadow: var(--shadow-layout-neutral);
  }

  .case-card--shadow-accent {
    box-shadow: var(--shadow-layout-accent);
  }

  .case-card__content {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x6);
  }

  .case-card__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--scale-x3);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .case-card__texts {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x4);
    color: var(--text-body-neutral-strong);
  }

  .case-card__highlights {
    display: flex;
    border: 3px solid var(--border-neutral-medium);
    color: var(--text-body-neutral-strong);
  }

  .case-card__highlight {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--scale-base);
    padding: var(--scale-x2) var(--scale-x4);
  }

  .case-card__highlight:not(:last-child) {
    border-right: 3px solid var(--border-neutral-medium);
  }
</style>
```

- [ ] **Step 2: Verificar type-check**

```bash
pnpm check
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/CaseCard.astro
git commit -m "feat: adiciona componente CaseCard"
```

---

### Task 11: Criar `CasesPreview.astro`

**Files:**
- Create: `src/components/sections/CasesPreview.astro`

**Interfaces:**
- Consumes: `CaseCard` (Tarefa 10), collection `cases` (Tarefas 5/7)
- Produces: `<CasesPreview />` (sem props — busca a collection internamente) — consumido por `Hero.astro` (Tarefa 12)

Filtra o `exemplo-case` (fixture de teste do pipeline, não é conteúdo real da Home).

- [ ] **Step 1: Criar `src/components/sections/CasesPreview.astro`**

```astro
---
import { getCollection } from 'astro:content';
import CaseCard from './CaseCard.astro';

const cases = await getCollection('cases', (entry) => entry.id !== 'exemplo-case');
---

<div class="cases-preview">
  <h2 class="text-title-h2">Cases selecionados</h2>
  <div class="cases-preview__grid">
    {cases.map((caseEntry) => (
      <CaseCard
        title={caseEntry.data.title}
        shortDescription={caseEntry.data.shortDescription}
        status={caseEntry.data.status}
        tags={caseEntry.data.tags}
        highlights={caseEntry.data.highlights}
        shadow={caseEntry.id === 'redesign' ? 'accent' : 'neutral'}
      />
    ))}
  </div>
</div>

<style>
  .cases-preview {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x11);
    width: 100%;
    color: var(--text-body-primary-strong);
  }

  .cases-preview__grid {
    display: flex;
    gap: var(--scale-x10);
    align-items: stretch;
  }

  .cases-preview__grid > :global(.case-card) {
    flex: 1;
  }
</style>
```

- [ ] **Step 2: Verificar type-check**

```bash
pnpm check
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/CasesPreview.astro
git commit -m "feat: adiciona componente CasesPreview"
```

---

### Task 12: Criar `Hero.astro`

**Files:**
- Create: `src/components/sections/Hero.astro`

**Interfaces:**
- Consumes: `CasesPreview` (Tarefa 11), `src/assets/home/avatar.png` (Tarefa 6), `--surface-bg-avatar-frame` (Tarefa 4)
- Produces: `<Hero />` — consumido por `src/pages/index.astro` (Tarefa 15)

- [ ] **Step 1: Criar `src/components/sections/Hero.astro`**

```astro
---
import { Image } from 'astro:assets';
import CasesPreview from './CasesPreview.astro';
import avatar from '../../assets/home/avatar.png';
---

<section class="hero">
  <div class="hero__headline">
    <p class="hero__title text-title-display">
      Já há alguns anos transformando{' '}
      <span class="hero__title--accent">produtos complexos</span> em experiências
      de <span class="hero__title--accent">alto impacto</span>
    </p>
    <div class="hero__avatar-frame">
      <Image src={avatar} alt="Foto de Lucas Pereira" width={256} height={256} loading="eager" />
    </div>
  </div>
  <CasesPreview />
</section>

<style>
  .hero {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x16);
    padding: var(--scale-x12) var(--scale-x20);
  }

  .hero__headline {
    display: flex;
    gap: var(--scale-x12);
    align-items: flex-start;
  }

  .hero__title {
    flex: 1;
    color: var(--text-body-primary-strong);
  }

  .hero__title--accent {
    color: var(--text-body-accent-regular);
  }

  .hero__avatar-frame {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background-color: var(--surface-bg-avatar-frame);
    border: 3px solid var(--border-neutral-strong);
    box-shadow: var(--shadow-layout-img);
  }
</style>
```

- [ ] **Step 2: Verificar type-check e build (a imagem precisa resolver via `astro:assets`)**

```bash
pnpm check
pnpm build
```

Esperado: 0 erros; build gera o avatar otimizado em `dist/_astro/`.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/Hero.astro
git commit -m "feat: adiciona componente Hero (headline, avatar, cases)"
```

---

### Task 13: Criar `SkillsExpertise.astro`

**Files:**
- Create: `src/components/sections/SkillsExpertise.astro`

**Interfaces:**
- Consumes: `src/assets/icons/tools/*.svg` (Tarefa 6)
- Produces: `<SkillsExpertise />` — consumido por `src/pages/index.astro` (Tarefa 15)

Conteúdo real extraído do Figma (node `31:737`) — 4 colunas com cor de cabeçalho própria.

- [ ] **Step 1: Criar `src/components/sections/SkillsExpertise.astro`**

```astro
---
import figmaIcon from '../../assets/icons/tools/figma.svg';
import claudeCodeIcon from '../../assets/icons/tools/claude-code.svg';
import claudeIcon from '../../assets/icons/tools/claude.svg';
import geminiIcon from '../../assets/icons/tools/gemini.svg';
import notebookIcon from '../../assets/icons/tools/notebook.svg';
import mazeIcon from '../../assets/icons/tools/maze.svg';
import tsIcon from '../../assets/icons/tools/ts.svg';
import paperIcon from '../../assets/icons/tools/paper.svg';
import spIcon from '../../assets/icons/tools/sp.svg';
import sbIcon from '../../assets/icons/tools/sb.svg';
import githubIcon from '../../assets/icons/tools/github.svg';
import orIcon from '../../assets/icons/tools/or.svg';
import jamoviIcon from '../../assets/icons/tools/jamovi.svg';

const strategySkills = [
  'Product Strategy',
  'Product Discovery',
  'Product Research',
  'Prototipação',
  'Priorização',
];
const designSystemSkills = [
  'Design System Agêntico',
  'Design Tokens',
  'Governança de DS',
  'Documentações',
  'Acessibilidade (WCAG)',
];
const collabSkills = [
  'Design Ops',
  'Facilitação de workshops',
  'Metodologias Ágeis',
  'Design Handoff',
  'Design Systems',
];
const tools = [
  { icon: figmaIcon, width: 20, height: 32, alt: 'Figma' },
  { icon: claudeCodeIcon, width: 51, height: 32, alt: 'Claude Code' },
  { icon: claudeIcon, width: 32, height: 32, alt: 'Claude' },
  { icon: geminiIcon, width: 32, height: 32, alt: 'Gemini' },
  { icon: notebookIcon, width: 45, height: 32, alt: 'Notebook' },
  { icon: mazeIcon, width: 32, height: 30, alt: 'Maze' },
  { icon: tsIcon, width: 41, height: 32, alt: 'TypeScript' },
  { icon: paperIcon, width: 32, height: 32, alt: 'Paper' },
  { icon: spIcon, width: 32, height: 32, alt: 'SP' },
  { icon: sbIcon, width: 26, height: 32, alt: 'SB' },
  { icon: githubIcon, width: 32, height: 31, alt: 'GitHub' },
  { icon: orIcon, width: 45, height: 32, alt: 'OR' },
  { icon: jamoviIcon, width: 32, height: 32, alt: 'jamovi' },
];
---

<section class="skills">
  <h2 class="text-title-h2">Skills & Expertise</h2>
  <div class="skills__grid">
    <div class="skills__column">
      <h3 class="skills__column-title skills__column-title--strategy text-title-h3">
        Estratégia & Discovery
      </h3>
      <ul class="skills__list">
        {strategySkills.map((skill) => (
          <li class="text-body-md">{skill}</li>
        ))}
      </ul>
    </div>
    <div class="skills__column">
      <h3 class="skills__column-title skills__column-title--ds text-title-h3">
        Design Systems
      </h3>
      <ul class="skills__list">
        {designSystemSkills.map((skill) => (
          <li class="text-body-md">{skill}</li>
        ))}
      </ul>
    </div>
    <div class="skills__column">
      <h3 class="skills__column-title skills__column-title--colab text-title-h3">
        Execução e Colaboração
      </h3>
      <ul class="skills__list">
        {collabSkills.map((skill) => (
          <li class="text-body-md">{skill}</li>
        ))}
      </ul>
    </div>
    <div class="skills__column">
      <h3 class="skills__column-title skills__column-title--tools text-title-h3">
        Ferramentas que uso
      </h3>
      <div class="skills__tools">
        {tools.map((tool) => (
          <img src={tool.icon.src} width={tool.width} height={tool.height} alt={tool.alt} />
        ))}
      </div>
    </div>
  </div>
</section>

<style>
  .skills {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x11);
    padding: var(--scale-x12) var(--scale-x20);
    background-color: var(--surface-bg-off-white-secondary);
    color: var(--text-body-primary-strong);
  }

  .skills__grid {
    display: flex;
    gap: var(--scale-x10);
    align-items: stretch;
  }

  .skills__column {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: var(--surface-bg-off-white-primary);
    border: 3px solid var(--border-neutral-strong);
    box-shadow: var(--shadow-layout-neutral);
  }

  .skills__column-title {
    margin: 0;
    padding: var(--scale-x6);
    border-bottom: 3px solid var(--border-neutral-strong);
    color: var(--text-body-neutral-strong);
  }

  .skills__column-title--strategy {
    background-color: var(--surface-bg-tertiary-subtle);
  }

  .skills__column-title--ds {
    background-color: var(--surface-bg-off-white-tertiary);
  }

  .skills__column-title--colab {
    background-color: var(--surface-bg-primary-subtle);
  }

  .skills__column-title--tools {
    background-color: var(--surface-bg-complementary-subtle);
  }

  .skills__list {
    list-style: none;
    margin: 0;
    padding: var(--scale-x6);
    display: flex;
    flex-direction: column;
    gap: var(--scale-x2);
    color: var(--text-body-neutral-strong);
  }

  .skills__list li {
    padding-bottom: var(--scale-x2);
    border-bottom: 2px solid var(--surface-bg-neutral-subtle);
  }

  .skills__list li:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }

  .skills__tools {
    display: flex;
    flex-wrap: wrap;
    gap: var(--scale-x8);
    padding: var(--scale-x6);
    align-content: flex-start;
    flex: 1;
  }
</style>
```

- [ ] **Step 2: Verificar type-check**

```bash
pnpm check
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/SkillsExpertise.astro
git commit -m "feat: adiciona componente SkillsExpertise"
```

---

### Task 14: Criar `AboutMe.astro`

**Files:**
- Create: `src/components/sections/AboutMe.astro`

**Interfaces:**
- Consumes: nada
- Produces: `<AboutMe />` com `id="sobre-mim"` (âncora do botão "sobre mim" do Header, Tarefa 8) — consumido por `src/pages/index.astro` (Tarefa 15)

Bio real extraída do Figma (node `31:735`).

- [ ] **Step 1: Criar `src/components/sections/AboutMe.astro`**

```astro
---
---

<section class="about-me" id="sobre-mim">
  <h2 class="text-title-h2">Sobre mim</h2>
  <div class="about-me__text text-body-md">
    <p>
      Sou um Product Designer focado em viabilizar soluções digitais que
      equilibram estratégia de negócio, viabilidade técnica e usabilidade
      refinada. Ao longo de mais de 11 anos de carreira, consolidei minha
      experiência em mercados complexos, como o ecossistema financeiro,
      serviços transacionais, seguros e segurança digital, integrando times
      multidisciplinares para transformar problemas desafiadores em jornadas
      fluidas, consistentes e intuitivas para o usuário final.
    </p>
    <p>
      Tenho sólida bagagem na condução de processos de design de ponta a
      ponta (Discovery e Delivery), liderando e mentorando outros designers
      no desenvolvimento de projetos, além de contribuir ativamente na
      construção e governança de Design Systems corporativos escaláveis e
      acessíveis (WCAG).
    </p>
  </div>
</section>

<style>
  .about-me {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x11);
    padding: var(--scale-x12) var(--scale-x20) var(--scale-x20);
    background-color: var(--surface-bg-off-white-secondary);
    color: var(--text-body-primary-strong);
  }

  .about-me__text {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x3);
    max-width: 1024px;
    color: var(--text-body-neutral-strong);
  }
</style>
```

- [ ] **Step 2: Verificar type-check**

```bash
pnpm check
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/AboutMe.astro
git commit -m "feat: adiciona componente AboutMe"
```

---

### Task 15: Compor a Home em `src/pages/index.astro`

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `Hero` (Tarefa 12), `SkillsExpertise` (Tarefa 13), `AboutMe` (Tarefa 14)
- Produces: rota `/` renderizada com o visual real da Home

Substitui o skeleton da fundação (lista simples de cases) pela composição real.

- [ ] **Step 1: Reescrever `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/sections/Hero.astro';
import SkillsExpertise from '../components/sections/SkillsExpertise.astro';
import AboutMe from '../components/sections/AboutMe.astro';
---

<BaseLayout title="Lucas Pereira — Product Designer">
  <Hero />
  <SkillsExpertise />
  <AboutMe />
</BaseLayout>
```

- [ ] **Step 2: Verificar type-check e build**

```bash
pnpm check
pnpm build
```

Esperado: 0 erros; `dist/index.html` gerado.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: compoe a Home com Hero, SkillsExpertise e AboutMe"
```

---

### Task 16: Verificação final

**Files:** nenhum (só verificação)

**Interfaces:** nenhuma

- [ ] **Step 1: Rodar a suíte completa**

```bash
pnpm check
pnpm test
pnpm build
```

Esperado: 0 erros de tipo, todos os testes Vitest passando, build sem erro.

- [ ] **Step 2: Subir o servidor de dev e comparar visualmente com o Figma**

```bash
pnpm dev
```

Abrir `http://localhost:4321` no navegador e comparar lado a lado com o screenshot do frame `desktop-home` (node `31:690`, arquivo `VM0MVYSWiDbznuPZFRyArB`). Checar especialmente: os 3 cards de case (Redesign com sombra azul, Payments/DS com sombra escura, todos com badge "Em breve" e sem CTA), hover/active dos botões (Header, Footer, tags), avatar com moldura, 4 colunas de skills com cores de cabeçalho distintas.

Parar o servidor ao final:

```bash
pnpm astro dev stop
```

- [ ] **Step 3: Atualizar a spec com o resultado da verificação (se algo divergir do Figma, registrar em "Riscos e pontos em aberto" da spec, não deixar undocumented)**

Sem commit automático neste step — qualquer ajuste encontrado vira uma correção pontual nos componentes já commitados (task extra, fora deste plano, se necessário).
