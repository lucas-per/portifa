# Implementação visual da página de Case (Redesign) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar visualmente a página dedicada de case a partir do frame `desktop-case` do Figma, populando com o conteúdo real do case "Redesign de produto" — ao final, o case sai de `coming-soon` e ganha CTA "Ler case" ativo na Home.

**Architecture:** Um componente Astro por seção de conteúdo (`src/components/sections/case/`), compostos em `src/pages/cases/[slug].astro`. Schema de `content.config.ts` corrigido pra bater com a estrutura real do Figma (era especulativo, escrito antes do `desktop-case` existir). Primeiro JS client-side do projeto: um `<script>` vanilla com `IntersectionObserver` no menu lateral pra scroll-spy. CSS vanilla, tokens já existentes (nenhum token novo necessário).

**Tech Stack:** Astro (TypeScript strict), pnpm, Vitest (só arquivos de token/schema, como já estabelecido), CSS vanilla, `IntersectionObserver` nativo (sem framework/hidratação).

**Spec:** `docs/superpowers/specs/2026-09-09-case-detail-visual-design.md`

## Global Constraints

- **Figma é a fonte da verdade**: quando o Figma e a documentação escrita (PRD/design-notes/schema anterior) divergirem, implementar conforme o Figma.
- CSS vanilla apenas — nenhum framework utilitário.
- Cores em OKLCH; proibido preto/branco absoluto. Nenhum token novo é necessário nesta etapa — tudo já existe em `primitives.css`/`semantics.css`.
- Assets (fotos, ilustrações, ícones) são baixados do Figma e commitados como bytes reais — nunca redesenhados à mão. Ilustrações compostas por múltiplas camadas vetoriais mascaradas (não uma imagem única) são exportadas como **um único asset achatado** por nó-wrapper (prática padrão de exportação de gráficos complexos), não reconstruídas camada por camada.
- Hover/active dos botões: mesmo padrão já implementado em `Button.astro` (`transition: transform 0.1s ease`, hover `translate(-2px,-2px)`, active `translate(1px,1px)` + `box-shadow: none`) — nenhuma mudança necessária nesse componente além da extensão de ícone líder (Task 1).
- Refinamentos descobertos durante a extração de conteúdo (Task de pesquisa desta etapa) que divergem da spec original: `problems` tem estrutura rica (intro/hipótese/lista de riscos/KPIs, não uma única `description`), `context.description` e `impact.description` são 2 parágrafos cada (viram `string[]`, não `string`), e `tests` é uma grade de badges de status (reaproveitando `TestResultBadge` já existente), não imagens comparativas como a spec supôs inicialmente — corrigido nas tasks abaixo.

---

### Task 1: Estender `Button.astro` com slot de ícone líder

**Files:**
- Modify: `src/components/ui/Button.astro`

**Interfaces:**
- Consumes: nenhuma mudança de token
- Produces: `<Button>` ganha um slot nomeado opcional `leading-icon` (ícone antes do label), além do `icon` (trailing) que já existe — usado pelo botão "voltar" do `SideMenu` (Task 8, ícone à esquerda) e mantém uso existente (`icon` à direita) em `Header`/`Footer`/`CaseCard`/`BackToTopButton` (Task 16) intacto

O botão "voltar" do menu lateral (Figma, node `222:367`) tem o ícone **antes** do label ("← VOLTAR"), diferente de todo botão já implementado no site (sempre ícone à direita). `Button.astro` só suporta o slot `icon` (trailing) — precisa de um segundo slot opcional pra posição líder, sem quebrar nenhum uso existente.

- [ ] **Step 1: Adicionar o slot `leading-icon` em `src/components/ui/Button.astro`**

Substituir o conteúdo do componente por:

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
const hasLeadingIcon = Astro.slots.has('leading-icon');
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
  {hasLeadingIcon && (
    <span class="button__icon">
      <slot name="leading-icon" />
    </span>
  )}
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

- [ ] **Step 2: Verificar type-check e que os usos existentes (Header, Footer, CaseCard) não quebraram**

```bash
pnpm check
pnpm build
```

Esperado: 0 erros. `dist/index.html` continua gerando os botões de Header/Footer/CaseCard normalmente (nenhum usa `leading-icon`, então nada muda visualmente neles).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Button.astro
git commit -m "feat: adiciona slot leading-icon ao Button (icone antes do label)"
```

---

### Task 2: Corrigir `TestResultBadge.astro` pra usar os ícones reais do Figma

**Files:**
- Create: `src/assets/icons/status/verified.svg`
- Create: `src/assets/icons/status/warning.svg`
- Create: `src/assets/icons/status/unavailable.svg`
- Modify: `src/components/ui/TestResultBadge.astro`

**Interfaces:**
- Consumes: nenhuma mudança de token
- Produces: `<TestResultBadge status="verified"|"warning"|"unavailable" label>` — interface de props inalterada, só a renderização interna muda de glifo unicode pra ícone real; consumido por `CaseDiscovery.astro` (Task 12)

`TestResultBadge.astro` já existe (da fundação) mas usa glifos unicode (`✓`/`△`/`—`) como placeholder — nunca foi corrigido com os ícones reais do Figma (`ic-fill-verified-circle`, `ic-fill-warning-triangle`, `ic-fill-unavailable`, confirmados no node `222:669`, grupo "Home screen" do teste comparativo).

- [ ] **Step 1: Baixar os 3 ícones reais**

```bash
mkdir -p src/assets/icons/status

curl -sL -o src/assets/icons/status/verified.svg "https://www.figma.com/api/mcp/asset/ae5758f1-c4d8-4c06-b3b1-4cbb41d5a33c.svg"
curl -sL -o src/assets/icons/status/warning.svg "https://www.figma.com/api/mcp/asset/71e22341-4a9b-49d3-aae9-bc2fe4a56cc2.svg"
curl -sL -o src/assets/icons/status/unavailable.svg "https://www.figma.com/api/mcp/asset/4e7fef82-d8a1-4b3e-acfc-79b24594bcf8.svg"
```

Verificar que os 3 arquivos existem e não estão vazios:

```bash
find src/assets/icons/status -type f -size +0c | wc -l
```

Esperado: `3`. Se vier menos, a URL expirou (~7 dias) — re-obtenha via `get_design_context` no node `222:669` e repita só o arquivo faltante.

- [ ] **Step 2: Reescrever `src/components/ui/TestResultBadge.astro`**

```astro
---
import verifiedIcon from '../../assets/icons/status/verified.svg';
import warningIcon from '../../assets/icons/status/warning.svg';
import unavailableIcon from '../../assets/icons/status/unavailable.svg';

interface Props {
  status: 'verified' | 'warning' | 'unavailable';
  label: string;
}

const { status, label } = Astro.props;
const icon = { verified: verifiedIcon, warning: warningIcon, unavailable: unavailableIcon }[status];
---

<span class={`test-result-badge test-result-badge--${status}`}>
  <img src={icon.src} width="24" height="24" alt="" />
  {label}
</span>

<style>
  .test-result-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--scale-x3);
    padding: var(--scale-x2) var(--scale-x4);
    background-color: var(--surface-bg-off-white-primary);
    border: 3px solid var(--border-neutral-subtle);
    font-family: var(--font-family-body);
    color: var(--text-body-neutral-strong);
  }
</style>
```

Nota: o Figma (node `222:669`) mostra os 3 status com o **mesmo** fundo/borda/cor de texto (`--surface-bg-off-white-primary`, `--border-neutral-subtle`, `--text-body-neutral-strong`) — é só o ícone que muda por status, não a cor do badge inteiro. Isso substitui as 3 variantes de cor (`--text-body-accent-regular`/`--text-label-on-bg-complementary`/`--text-body-neutral-strong`) do componente antigo, que não correspondiam ao Figma real.

- [ ] **Step 3: Verificar type-check**

```bash
pnpm check
```

Esperado: 0 erros (nenhum consumidor existe ainda — `CaseDiscovery` só é criado na Task 12 — mas o componente precisa compilar sozinho).

- [ ] **Step 4: Commit**

```bash
git add src/assets/icons/status src/components/ui/TestResultBadge.astro
git commit -m "fix: usa icones reais do Figma no TestResultBadge (era glifo unicode)"
```

---

### Task 3: Corrigir o schema de `content.config.ts`

**Files:**
- Modify: `src/content.config.ts`
- Modify: `src/content/cases/exemplo-case.yaml`

**Interfaces:**
- Consumes: nenhuma
- Produces: schema corrigido de `cases.content` (`summary`, `context`, `problems`, `discovery`, `impact` mudam de forma; `delivery`/`plansAhead` inalterados) — consumido por todas as tasks de conteúdo (4, 5) e todos os componentes de seção (7–16)

Ver spec seção 1 pro raciocínio completo de cada mudança. Resumo das correções (Figma > schema anterior, que foi escrito antes do `desktop-case` existir):

- `summary`: de `z.string()` pra `{challenge, solution, results}`, cada um `{title, description}` (Figma: `row-highlights`, 3 colunas)
- `context.description`: de `z.string()` pra `z.array(z.string())` (Figma: 2 parágrafos)
- `problems`: de `{description}` pra `{intro, hypothesis, risks: string[], kpis}` (Figma: intro + hipótese + lista de 4 riscos + KPIs, cada um um bloco de texto próprio)
- `discovery`: ganha `exploration`, `pd`, `tests`, `consolidation` **aninhados** (eram campos irmãos antes) — `tests` é grade de status (`TestResultBadge`), não imagens
- `impact.description`: de `z.string()` pra `z.array(z.string())` (Figma: 2 parágrafos); `highlights` de `{title,description}` pra `{value,label}` (Figma: 3 blocos número+legenda, mesmo padrão do `CaseCard` da Home)
- `delivery`, `plansAhead`: sem mudança de forma

- [ ] **Step 1: Reescrever `src/content.config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const testResultSchema = z.object({
  status: z.enum(['verified', 'warning', 'unavailable']),
  label: z.string(),
});

const titleDescriptionSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const valueLabelSchema = z.object({
  value: z.string(),
  label: z.string(),
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
      // Métricas de resultado exibidas no card da Home (ex: "+15%" / "Boletos
      // pagos") — distinto de content.impact.highlights, que é o bloco da
      // página dedicada de case.
      highlights: z.array(valueLabelSchema).optional(),
      publishedDate: z.coerce.date(),

      // Conteúdo da página dedicada — espelha as 7 seções do frame
      // desktop-case no Figma (Resumo, Contexto, Problema & Desafios,
      // Discovery, Delivery, Impacto, Visão de futuro). Cada bloco (exceto
      // summary) é opcional: nem todo case precisa ter todas as seções.
      content: z.object({
        summary: z.object({
          challenge: titleDescriptionSchema,
          solution: titleDescriptionSchema,
          results: titleDescriptionSchema,
        }),
        context: z
          .object({
            description: z.array(z.string()),
            image: image(),
            caption: z.string(),
          })
          .optional(),
        problems: z
          .object({
            intro: z.string(),
            hypothesis: z.string(),
            risks: z.array(z.string()),
            kpis: z.string(),
          })
          .optional(),
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
            exploration: z.object({
              title: z.string(),
              description: z.string(),
              images: z.array(image()),
            }),
            pd: z.object({
              title: z.string(),
              description: z.string(),
              images: z.array(image()),
            }),
            tests: z.object({
              intro: z.string(),
              groups: z.array(
                z.object({
                  title: z.string(),
                  results: z.array(testResultSchema),
                })
              ),
              outro: z.string(),
            }),
            consolidation: z.object({
              title: z.string(),
              description: z.string(),
            }),
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
            highlights: z.array(valueLabelSchema),
            description: z.array(z.string()),
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

- [ ] **Step 2: Atualizar `src/content/cases/exemplo-case.yaml` pra bater com o schema novo**

Esse arquivo é fixture de teste do pipeline (schema + `astro:assets`), não conteúdo real — mas precisa continuar válido pro `pnpm build` passar. Substituir o `content:` inteiro por:

```yaml
content:
  summary:
    challenge:
      title: "Desafio"
      description: "Desafio fictício do case de exemplo, usado só para testar o pipeline de conteúdo."
    solution:
      title: "Solução"
      description: "Solução fictícia do case de exemplo."
    results:
      title: "Resultado"
      description: "Resultado fictício do case de exemplo."
  context:
    description:
      - "Primeiro parágrafo fictício de contexto, usado para validar o bloco context."
      - "Segundo parágrafo fictício de contexto."
    image: "../../assets/cases/placeholder.png"
    caption: "Legenda de exemplo da imagem de contexto."
  problems:
    intro: "Introdução fictícia dos problemas e desafios do case de exemplo."
    hypothesis: "Hipótese fictícia do case de exemplo."
    risks:
      - "Risco fictício 1"
      - "Risco fictício 2"
    kpis: "KPIs fictícios do case de exemplo."
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
      intro: "Introdução fictícia dos testes de usabilidade."
      groups:
        - title: "Teste comparativo"
          results:
            - status: "verified"
              label: "Resultado positivo de exemplo"
            - status: "warning"
              label: "Resultado de atenção de exemplo"
            - status: "unavailable"
              label: "Resultado indisponível de exemplo"
      outro: "Conclusão fictícia dos testes de usabilidade."
    consolidation:
      title: "Consolidação"
      description: "Descrição fictícia da consolidação dos resultados."
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
      - value: "-00%"
        label: "Métrica fictícia de impacto"
    description:
      - "Primeiro parágrafo fictício de impacto."
      - "Segundo parágrafo fictício de impacto."
  plansAhead:
    privacy:
      title: "Privacidade"
      description: "Descrição fictícia dos próximos passos de privacidade."
    pains:
      title: "Dores remanescentes"
      description: "Descrição fictícia das dores que ainda restam."
```

- [ ] **Step 3: Rodar `pnpm build` — vai falhar nos outros 2 cases ainda não migrados**

```bash
pnpm build
```

Esperado: erro de validação Zod em `jornada-pagamentos.yaml`, `gosafe-ds.yaml` **e** `redesign.yaml` (os 3 ainda têm `content.summary` como `z.string()` — corrigido nas Tasks 4, 6 e 7). Confirma que só a fixture (`exemplo-case.yaml`) já valida contra o schema novo — se o erro aparecer nos outros 3 arquivos e não nela, o Step 2 funcionou.

- [ ] **Step 4: Commit**

```bash
git add src/content.config.ts src/content/cases/exemplo-case.yaml
git commit -m "feat: corrige schema de content.cases pra bater com o desktop-case real"
```

---

### Task 4: Migrar `summary` de `jornada-pagamentos.yaml` e `gosafe-ds.yaml`

**Files:**
- Modify: `src/content/cases/jornada-pagamentos.yaml`
- Modify: `src/content/cases/gosafe-ds.yaml`

**Interfaces:**
- Consumes: schema da Task 3
- Produces: os 2 cases sem página dedicada continuam válidos contra o schema novo — nenhuma mudança visual na Home (eles não têm página dedicada ainda, `content.summary` só precisa existir pro build passar)

Nenhum dos 2 tem conteúdo real de Challenge/Solution/Results ainda (sem página dedicada nesta etapa) — usa o `shortDescription` já existente como `challenge.description`, com `solution`/`results` marcando que o conteúdo ainda não existe.

- [ ] **Step 1: Editar `src/content/cases/jornada-pagamentos.yaml`**

Substituir a linha `summary: "Reestruturação da jornada..."` por:

```yaml
  summary:
    challenge:
      title: "Desafio"
      description: "Reestruturação da jornada e implementação de design system em um app com mais de 100 mil usuários."
    solution:
      title: "Solução"
      description: "Case ainda não publicado — conteúdo completo em breve."
    results:
      title: "Resultados"
      description: "Case ainda não publicado — conteúdo completo em breve."
```

- [ ] **Step 2: Editar `src/content/cases/gosafe-ds.yaml`**

Substituir a linha `summary: "Criação de um design system..."` por:

```yaml
  summary:
    challenge:
      title: "Desafio"
      description: "Criação de um design system corporativo, com impacto direto na eficiência operacional e menos tempo para lançamentos de novos produtos."
    solution:
      title: "Solução"
      description: "Case ainda não publicado — conteúdo completo em breve."
    results:
      title: "Resultados"
      description: "Case ainda não publicado — conteúdo completo em breve."
```

- [ ] **Step 3: Rodar `pnpm build` — deve passar agora (falta só popular o Redesign)**

```bash
pnpm build
```

Esperado: erro de validação Zod só em `redesign.yaml` (ainda não migrado — Task 5/6). `jornada-pagamentos.yaml` e `gosafe-ds.yaml` já validam.

- [ ] **Step 4: Commit**

```bash
git add src/content/cases/jornada-pagamentos.yaml src/content/cases/gosafe-ds.yaml
git commit -m "fix: migra summary de jornada-pagamentos e gosafe-ds pro schema novo"
```

---

### Task 5: Baixar os assets da página de case (ícones + imagens)

**Files:**
- Create: `src/assets/icons/case/calendar.svg`
- Create: `src/assets/icons/case/clock.svg`
- Create: `src/assets/icons/case/arrow-left.svg`
- Create: `src/assets/icons/case/arrow-up.svg`
- Create: `src/assets/cases/redesign/legacy-app.png`
- Create: `src/assets/cases/redesign/competitors-mapping.png`
- Create: `src/assets/cases/redesign/interview.png`
- Create: `src/assets/cases/redesign/journey-mapping.svg`
- Create: `src/assets/cases/redesign/impact-effort-matrix.svg`
- Create: `src/assets/cases/redesign/crazy8.png`
- Create: `src/assets/cases/redesign/ds-border-radius.png`
- Create: `src/assets/cases/redesign/ds-components.png`
- Create: `src/assets/cases/redesign/ds-documentation.png`
- Create: `src/assets/cases/redesign/home-default.png`
- Create: `src/assets/cases/redesign/home-alert.png`
- Create: `src/assets/cases/redesign/home-offline.png`

**Interfaces:**
- Consumes: nenhuma
- Produces: arquivos de asset reais — consumidos por `CaseHeader`/`BackToTopButton`/`SideMenu` (ícones) e `CaseContext`/`CaseDiscovery`/`CaseDelivery` (imagens), Tasks 7–16

URLs exportadas do Figma — expiram em ~7 dias. Se algum `curl` retornar 403/404, re-obtenha a URL via `get_design_context` no node indicado e repita só aquele arquivo.

`competitors-mapping.png`, `home-default.png`, `home-alert.png` e `home-offline.png` são ilustrações/mockups compostos por múltiplas camadas vetoriais mascaradas no Figma — exportar cada uma como **um PNG único achatado** do nó-wrapper indicado (via `download_assets`/export de node no Figma, não reconstruindo as camadas), não pelas dezenas de sub-asset URLs que `get_design_context` retorna pra elas.

- [ ] **Step 1: Criar as pastas e baixar os ícones e imagens simples (URL única)**

```bash
mkdir -p src/assets/icons/case src/assets/cases/redesign

curl -sL -o src/assets/icons/case/calendar.svg "https://www.figma.com/api/mcp/asset/5baa0b68-b1c7-45c6-9a76-61e162b94fb1.svg"
curl -sL -o src/assets/icons/case/clock.svg "https://www.figma.com/api/mcp/asset/a67b5102-f80e-4826-82b3-16dc6c7acdf0.svg"
curl -sL -o src/assets/icons/case/arrow-left.svg "https://www.figma.com/api/mcp/asset/4270f61f-075d-46b1-a7b0-777a9b14f43f.svg"
curl -sL -o src/assets/icons/case/arrow-up.svg "https://www.figma.com/api/mcp/asset/e4ef4325-1ad5-498c-a613-927292a8b75f.svg"

curl -sL -o src/assets/cases/redesign/legacy-app.png "https://www.figma.com/api/mcp/asset/c57027a6-45f1-4c2c-8d6d-a2b40ebd7211.png"
curl -sL -o src/assets/cases/redesign/interview.png "https://www.figma.com/api/mcp/asset/fda8b48d-3e74-4a27-a4d9-47df6e581be1.png"
curl -sL -o src/assets/cases/redesign/journey-mapping.svg "https://www.figma.com/api/mcp/asset/571a5fe5-1b7e-42bb-9338-2decd11682ce.svg"
curl -sL -o src/assets/cases/redesign/impact-effort-matrix.svg "https://www.figma.com/api/mcp/asset/42a4b651-4e2a-4f51-8592-fefabebc1047.svg"
curl -sL -o src/assets/cases/redesign/crazy8.png "https://www.figma.com/api/mcp/asset/2a8c83d4-44e0-4e54-bb8b-fa8bf1d7a399.png"
curl -sL -o src/assets/cases/redesign/ds-border-radius.png "https://www.figma.com/api/mcp/asset/f4b6180b-2bf7-4f2c-81ac-6991bfc12e48.png"
curl -sL -o src/assets/cases/redesign/ds-components.png "https://www.figma.com/api/mcp/asset/29e86dc0-dd53-43cc-b406-ee4670ca42df.png"
curl -sL -o src/assets/cases/redesign/ds-documentation.png "https://www.figma.com/api/mcp/asset/ff72a581-9679-4fc9-a3b4-d03b71d053f7.png"
```

- [ ] **Step 2: Exportar as 4 ilustrações/mockups compostos como PNG achatado**

Chamar `get_screenshot` (arquivo `VM0MVYSWiDbznuPZFRyArB`) nos 4 nós abaixo (`maxDimension: 2048` pra manter nitidez) e salvar cada resposta em seu arquivo:

- Node `222:463` ("wrap-img-competitors") → `src/assets/cases/redesign/competitors-mapping.png`
- Node `222:724` ("wrap-img-home-default") → `src/assets/cases/redesign/home-default.png`
- Node `222:815` ("wrap-img-home-alert") → `src/assets/cases/redesign/home-alert.png`
- Node `222:930` ("wrap-img-home-offline") → `src/assets/cases/redesign/home-offline.png`

- [ ] **Step 3: Verificar que todos os 16 arquivos existem e não estão vazios**

```bash
find src/assets/icons/case src/assets/cases/redesign -type f -size +0c | wc -l
```

Esperado: `16`.

- [ ] **Step 4: Commit**

```bash
git add src/assets/icons/case src/assets/cases/redesign
git commit -m "feat: adiciona icones e imagens reais da pagina de case (Redesign)"
```

---

### Task 6: Popular `redesign.yaml` — status, summary, context, problems

**Files:**
- Modify: `src/content/cases/redesign.yaml`

**Interfaces:**
- Consumes: schema da Task 3, imagem `src/assets/cases/redesign/legacy-app.png` (Task 5)
- Produces: `content.summary`, `content.context`, `content.problems` populados com conteúdo real — consumidos por `CaseSummary`/`CaseContext`/`CaseProblems` (Tasks 9–11)

- [ ] **Step 1: Editar `src/content/cases/redesign.yaml`**

Substituir o arquivo inteiro por (o restante de `content` é completado na Task 7):

```yaml
title: "Redesign de produto"
shortDescription: "Como recriamos do zero um app de cibersegurança com código legado instável, mudamos o modelo de negócio e levamos a base de pagantes de zero a 24 mil em um ano."
status: "coming-soon" # vira "published" na Task 18, depois de tudo pronto
tags:
  - "discovery"
  - "delivery"
  - "gestão"
  - "b2b"
  - "b2c"
publishedDate: "2026-09-09"

content:
  summary:
    challenge:
      title: "Desafio"
      description: "Seis meses, equipe enxuta, um app legado carregando 100 mil usuários e mais de R$ 100 milhões em receita"
    solution:
      title: "Solução"
      description: "Discovery completo, redesenho de jornada e home screen, e mudança de modelo de negócio com apoio de consultoria"
    results:
      title: "Resultado"
      description: "Em um ano, a nota da loja saiu de 3.4 para 4.7, a base ativa dobrou e 24 mil pessoas passaram a contratar um plano pago"

  context:
    description:
      - "O app nasceu focado só em cibersegurança, com o antivírus como funcionalidade mais usada, mirando o mercado B2B. Com o tempo, consolidou uma base e tanto: mais de 100 mil usuários, R$ 100 milhões em receita. Só que por trás desses números morava um código legado instável, do tipo que rende reclamação de usuário e de parceiro em doses parecidas."
      - "O prazo pra resolver era curto, seis meses, com uma equipe enxuta, o que torna qualquer decisão errada mais cara do que o normal. O objetivo ia além de modernizar a experiência, exigia também mitigar risco e proteger a receita existente."
    image: "../../assets/cases/redesign/legacy-app.png"
    caption: "Home screen legada"

  problems:
    intro: "Reestruturar um produto já em pé, usado todos os dias, sem derrubar nada no processo (e com um time pequeno) significa equilibrar duas forças que raramente cooperam: velocidade de entrega e decisões bem fundamentadas."
    hypothesis: "Hipótese principal: se o app comunicasse com clareza o valor das suas funcionalidades e simplificasse a jornada de entrada, os usuários entenderiam melhor os benefícios, se engajariam mais com os recursos disponíveis, e isso se traduziria em retenção e conversão para planos pagos."
    risks:
      - "A complexidade do onboarding, que podia levar ao abandono por excesso de informação logo na porta de entrada"
      - "O baixo uso de funcionalidades, sintoma de uma proposta de valor mal comunicada"
      - "A fricção nas permissões solicitadas ao usuário, com risco real de soar invasivo e quebrar confiança no primeiro contato"
      - "O mais traiçoeiro dos quatro: negligenciar funcionalidades essenciais em nome de uma simplificação bem-intencionada"
    kpis: "Objetivos e KPIs, definidos com o time em três frentes: aumentar o reconhecimento da marca junto ao público-alvo, entender melhor o comportamento dos usuários pra entregar valor de forma mais clara, e acompanhar isso por métricas de crescimento da base ativa, nota nas lojas e conversão para pagantes."
```

- [ ] **Step 2: Rodar `pnpm check` (o build ainda falha — `discovery`/`delivery`/`impact`/`plansAhead` faltam, Task 7)**

```bash
pnpm check
```

Esperado: 0 erros de tipo (o YAML só é validado em runtime pelo `pnpm build`, que ainda vai reclamar dos campos obrigatórios faltando dentro de `discovery` — ver Task 7).

- [ ] **Step 3: Commit**

```bash
git add src/content/cases/redesign.yaml
git commit -m "feat: popula summary, context e problems do case Redesign"
```

---

### Task 7: Popular `redesign.yaml` — discovery, delivery, impact, plansAhead

**Files:**
- Modify: `src/content/cases/redesign.yaml`

**Interfaces:**
- Consumes: schema da Task 3, imagens de `src/assets/cases/redesign/` (Task 5)
- Produces: `content.discovery`, `content.delivery`, `content.impact`, `content.plansAhead` populados — consumidos por `CaseDiscovery`/`CaseDelivery`/`CaseImpact`/`CasePlansAhead` (Tasks 12–15)

- [ ] **Step 1: Adicionar ao final de `content:` em `src/content/cases/redesign.yaml`**

```yaml
  discovery:
    intro: "O processo como um todo teve a duração de 6 meses e foi dividido nas quatro fases abaixo:"
    phases:
      - title: "Fase 1: Exploração"
        subtitle: "2 semanas"
        description: "Benchmarks, tendências e entrevistas com 20 usuários"
      - title: "Fase 2: Product Discovery"
        subtitle: "1 semana"
        description: "Workshop com 3 dias de dinâmicas multidisciplinares, e 2 de testes de usabilidade"
      - title: "Fase 3: Alinhamento Estratégico"
        subtitle: "1 semana"
        description: "Consolidação dos aprendizados e apresentação do plano de redesenho para engenharia e lideranças"
      - title: "Fase 4: Execução e Escala"
        subtitle: "5 meses"
        description: "1 mês de foco total no core do Design System (+1 designer) e 4 meses de prototipação contínua das jornadas"
    exploration:
      title: "Exploração"
      description: "Três frentes de pesquisa rodaram em paralelo. O benchmark contra concorrentes revelou que recursos gratuitos são essenciais para atrair e reter clientes, que um tom educativo facilita o onboarding, e que pacotes de serviços em torno da assinatura é estratégia comum no setor. A análise de tendências de mercado apontou personalização de interface, transparência na coleta de dados, curadoria de conteúdo de segurança e gamificação como direções que o setor inteiro vem perseguindo. E teve as entrevistas qualitativas: 20 participantes, todos usuários ativos toda semana no último mês e na plataforma há pelo menos seis meses — critério pensado pra garantir que quem falasse já tivesse familiaridade real com o produto, não uma primeira impressão qualquer."
      images:
        - "../../assets/cases/redesign/competitors-mapping.png"
        - "../../assets/cases/redesign/interview.png"
    pd:
      title: "Product Discovery"
      description: "O workshop de 1 semana juntou as áreas de Produtos, Design, Marketing, Desenvolvimento, e Comercial, em uma mesma sala. Dele, saíram alguns artefatos que sustentaram todo o resto do projeto: Mapeamento de riscos, que formalizou os quatro pontos de atenção já citados acima. Key values, que passaram a guiar toda decisão de interface (transparência, comunicação eficiente, personalização, simplificação e autonomia). Matriz de Valor-esforço, que priorizou o que valia entrar no escopo, como melhorar descrições de funcionalidade com textos curtos e ilustração, criar níveis de proteção, entregar relatório semanal, e definir perfil de usuário via questionário. Mapeamento de jornada, decidindo unificar Onboarding, Login, Home e Antivírus em uma jornada só, mostrando o benefício do produto o mais rápido possível. Crazy-8s, gerando wireframes rápidos para os pontos mais críticos do onboarding identificados no mapeamento de riscos."
      images:
        - "../../assets/cases/redesign/journey-mapping.svg"
        - "../../assets/cases/redesign/impact-effort-matrix.svg"
        - "../../assets/cases/redesign/crazy8.png"
    tests:
      intro: "A ideia mais votada no Crazy-8s virou um protótipo de média fidelidade, testado com 8 usuários. O resultado geral: boa compreensão do produto e da jornada, navegação fluida, sem dificuldade relevante pra concluir o teste, mas ajustes de comunicação e layout ainda eram necessários pra uma usabilidade realmente boa."
      groups:
        - title: "Boas-vindas"
          results:
            - status: "verified"
              label: "Fluxo"
            - status: "verified"
              label: "Hierarquia"
            - status: "verified"
              label: "Copy"
        - title: "Login"
          results:
            - status: "verified"
              label: "Fluxo"
            - status: "verified"
              label: "Hierarquia"
            - status: "verified"
              label: "Copy"
        - title: "Home screen"
          results:
            - status: "unavailable"
              label: "Fluxo"
            - status: "verified"
              label: "Hierarquia"
            - status: "warning"
              label: "Copy"
        - title: "Antivírus"
          results:
            - status: "verified"
              label: "Fluxo"
            - status: "warning"
              label: "Hierarquia"
            - status: "warning"
              label: "Copy"
      outro: "A Home screen tinha problema de fluxo e de copy, não de hierarquia, sinal de que a organização visual já estava no caminho certo, mas a comunicação em torno dela ainda confundia. Já a tela de Antivírus concentrou os piores resultados, com hierarquia e copy pedindo revisão."
    consolidation:
      title: "Consolidação dos resultados e encaminhamentos"
      description: "Durante o Discovery vimos a possibilidade de testar uma mudança no modelo de negócio. O principal recurso passaria a ser gratuita, e os demais ficariam disponíveis via assinatura ou parcerias B2B. A lógica era usar a funcionalidade gratuita para atrair novos usuários, que poderiam ser convertidos para planos pagos. Os times também concordaram estrategicamente em recriar o app por três motivos: falta de documentação sobre decisões de design do app legado; dificuldade da equipe de desenvolvimento para trabalhar com o código legado; e a chance de usar o redesign para criar o design system corporativo, reaproveitável em outros produtos."

  delivery:
    myRole:
      title: "Meu papel"
      description: "Atuei do Discovery ao Delivery. No Discovery, levantei suposições e o plano de pesquisa com o PM, analisei concorrentes e tendências em cibersegurança, conduzi pesquisas quali e quanti, e facilitei o workshop de Product Discovery em parceria com o PM. No Delivery, gerenciei entregas do time de design também com o apoio do PM, defini a estratégia do design system (governança, arquitetura de tokens, bibliotecas), os padrões de interface do app (alinhados à marca), prototipei componentes e ícones com outro designer sênior, e dei suporte tático aos imprevistos do projeto."
    designSystem:
      title: "Design System"
      description: "Reconstruir do zero também significou construir a base que faltava. Foi criada uma biblioteca de ícones organizada por estilos, design tokens, e os componentes já documentados no Figma, pronto pra engenharia consumir."
      images:
        - "../../assets/cases/redesign/ds-border-radius.png"
        - "../../assets/cases/redesign/ds-components.png"
        - "../../assets/cases/redesign/ds-documentation.png"
    home:
      title: "Home screen"
      description: "A tela inicial foi reorganizada pra comunicar com clareza o status de proteção do usuário, distinguir recursos gratuitos de pagos sem ambiguidade, e dar feedback visual imediato sobre problemas de conexão ou do dispositivo. A hierarquia da informação passou a guiar o olhar para o que importava em cada momento."
      images:
        - "../../assets/cases/redesign/home-default.png"
        - "../../assets/cases/redesign/home-alert.png"
        - "../../assets/cases/redesign/home-offline.png"

  impact:
    highlights:
      - value: "+24k"
        label: "Assinantes pagantes"
      - value: "3.4 → 4.7"
        label: "Nota na loja"
      - value: "2x"
        label: "Base ativa dobrou"
    description:
      - "No primeiro ano completo, a base quase dobra, a nota da Play Store sobe de 3.4 para 4.7 e os usuários pagantes, inexistentes um ano antes, chegam a 24 mil. A melhora na nota tem mais de uma causa provável: a estabilidade do app recriado pesa tanto quanto a experiência que ele passou a entregar."
      - "O crescimento da base, esse sim, nasce quase todo do redesign. Dois riscos apareceram já no discovery: a fricção no onboarding e o baixo entendimento do valor das funcionalidades. A jornada de onboarding integrada e a nova hierarquia da home screen deram conta dos dois, deixando a comunicação com o usuário mais clara. Não à toa, a base ativa acelera nos meses seguintes ao lançamento dessas mudanças."

  plansAhead:
    privacy:
      title: "Explorar funcionalidades de privacidade"
      description: "Um dos insights vindo do discovery, e não entrou no escopo, foi o interesse dos usuários em recursos de privacidade. Isso poderia abrir um caminho natural de expansão, usando a confiança já construída em torno da proteção do dispositivo para introduzir funcionalidades voltadas à privacidade dos dados."
    pains:
      title: "Aprofundar o entendimento de outras dores do usuário"
      description: "Fazer uma nova rodada de pesquisa nas oportunidades que o redesenho não abordou, alimentando um ciclo de melhoria contínua de verdade, e transformar os aprendizados em roadmap, priorizando por valor para o usuário e viabilidade técnica."
```

- [ ] **Step 2: Rodar `pnpm build` pra validar o YAML inteiro contra o schema**

```bash
pnpm build
```

Esperado: build passa sem erro de validação Zod (todos os 4 cases agora válidos).

- [ ] **Step 3: Commit**

```bash
git add src/content/cases/redesign.yaml
git commit -m "feat: popula discovery, delivery, impact e plansAhead do case Redesign"
```

---

### Task 8: Criar `CaseHeader.astro`

**Files:**
- Create: `src/components/sections/case/CaseHeader.astro`

**Interfaces:**
- Consumes: `Tag` (já existe), `src/assets/icons/case/{calendar,clock}.svg` (Task 5)
- Produces: `<CaseHeader title status tags publishedDate readingTime />` — consumido por `src/pages/cases/[slug].astro` (Task 17)

Breadcrumb + tags + título + data/tempo de leitura (Figma: `col-heading`, node `222:1164`). Reaproveita a lógica de breadcrumb/tags que já existe no skeleton atual de `[slug].astro` (classes `clickable-link-internal-previous-page-title`/`non-clickable-active-page-title`/`published-case-date`/`estimated-time` já usadas ali, preservadas aqui). Também define `id="top"` no elemento raiz — alvo do botão "ir para o topo" (Task 16).

- [ ] **Step 1: Criar `src/components/sections/case/CaseHeader.astro`**

```astro
---
import Tag from '../../ui/Tag.astro';
import calendarIcon from '../../../assets/icons/case/calendar.svg';
import clockIcon from '../../../assets/icons/case/clock.svg';

interface Props {
  title: string;
  status: 'published' | 'coming-soon';
  tags: string[];
  publishedDate: Date;
  readingTime: number;
}

const { title, status, tags, publishedDate, readingTime } = Astro.props;
---

<header class="case-header" id="top">
  <nav class="case-header__breadcrumb" aria-label="breadcrumb">
    <a href="/" class="clickable-link-internal-previous-page-title text-body-caption">Início</a>
    <span aria-hidden="true">/</span>
    <span class="non-clickable-active-page-title text-body-caption">{title}</span>
  </nav>

  {status === 'published' && (
    <ul class="case-header__tags">
      {tags.map((tag) => (
        <li><Tag variant="primary">{tag}</Tag></li>
      ))}
    </ul>
  )}

  <h1 class="case-header__title text-title-h2">{title}</h1>

  <p class="case-header__meta text-body-caption">
    <img src={calendarIcon.src} width="16" height="16" alt="" />
    <time class="published-case-date" datetime={publishedDate.toISOString()}>
      {publishedDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
    </time>
    <span aria-hidden="true">·</span>
    <img src={clockIcon.src} width="16" height="16" alt="" />
    <span class="estimated-time">{readingTime} minutos</span>
  </p>
</header>

<style>
  .case-header {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x4);
    padding: var(--scale-x6) var(--scale-x20) 0;
  }

  .case-header__breadcrumb {
    display: flex;
    gap: var(--scale-base);
    align-items: center;
    color: var(--text-body-neutral-subtle, var(--text-body-neutral-strong));
  }

  .case-header__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--scale-x3);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .case-header__title {
    color: var(--text-body-primary-strong);
  }

  .case-header__meta {
    display: flex;
    align-items: center;
    gap: var(--scale-x2);
    color: var(--text-body-neutral-subtle, var(--text-body-neutral-strong));
  }
</style>
```

Nota: `--text-body-neutral-subtle` (usado no Figma pra data/breadcrumb, hex `#575252`) ainda não existe como token semântico de texto — só existe `--surface-bg-neutral-medium` (mesmo primitivo `--neutral-600`, papel de superfície). O fallback `var(--text-body-neutral-subtle, var(--text-body-neutral-strong))` evita quebra caso o token não exista; criar o token de verdade é opcional nesta etapa (ver "Riscos e pontos em aberto" do plano) — se preferir a cor exata do Figma, adicionar `--text-body-neutral-subtle: var(--neutral-600);` em `semantics.css` antes deste step.

- [ ] **Step 2: Verificar type-check**

```bash
pnpm check
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/case/CaseHeader.astro
git commit -m "feat: adiciona componente CaseHeader"
```

---

### Task 9: Criar `SideMenu.astro` (com scroll-spy)

**Files:**
- Create: `src/components/sections/case/SideMenu.astro`

**Interfaces:**
- Consumes: `Button` com `leading-icon` (Task 1), `src/assets/icons/case/arrow-left.svg` (Task 5)
- Produces: `<SideMenu />` (sem props — lista de âncoras fixa) — consumido por `src/pages/cases/[slug].astro` (Task 17). Depende de 7 elementos `id="resumo|context|problems-challenges|strategy-solutions|myrole|impact|plans-ahead"` existirem na página (criados pelos componentes de seção, Tasks 10–15)

Primeiro JS client-side do projeto. `position: sticky` + `IntersectionObserver` pra destacar o link da seção atual — decisão confirmada com o usuário: o primeiro item ("Resumo") é uma âncora normal, participando do scroll-spy como as demais.

- [ ] **Step 1: Criar `src/components/sections/case/SideMenu.astro`**

```astro
---
import Button from '../../ui/Button.astro';
import arrowLeftIcon from '../../../assets/icons/case/arrow-left.svg';

const items = [
  { href: '#resumo', label: 'Resumo' },
  { href: '#context', label: 'Contexto' },
  { href: '#problems-challenges', label: 'Problema & Desafios' },
  { href: '#strategy-solutions', label: 'Discovery' },
  { href: '#myrole', label: 'Delivery' },
  { href: '#impact', label: 'Impacto' },
  { href: '#plans-ahead', label: 'Visão de futuro' },
];
---

<nav class="side-menu" aria-label="Nesta página">
  <p class="side-menu__title text-label-sm">Nesta página</p>
  <ul class="side-menu__list">
    {items.map((item) => (
      <li>
        <a href={item.href} class="side-menu__link text-label-md" data-side-menu-link data-target={item.href.slice(1)}>
          {item.label}
        </a>
      </li>
    ))}
  </ul>
  <Button href="/" variant="outline-accent" class="clickable-link-internal-home">
    <Fragment slot="leading-icon">
      <img src={arrowLeftIcon.src} width="24" height="24" alt="" />
    </Fragment>
    Voltar
  </Button>
</nav>

<style>
  .side-menu {
    position: sticky;
    top: var(--scale-x6);
    display: flex;
    flex-direction: column;
    gap: var(--scale-x6);
    width: 234px;
    flex-shrink: 0;
  }

  .side-menu__title {
    margin: 0;
    color: var(--text-body-neutral-strong);
  }

  .side-menu__list {
    display: flex;
    flex-direction: column;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .side-menu__link {
    display: block;
    padding: var(--scale-x4) 0;
    color: var(--text-body-neutral-strong);
    text-decoration: none;
    border-bottom: 2px solid var(--surface-bg-neutral-subtle);
  }

  .side-menu__link--active {
    color: var(--text-body-accent-regular);
  }
</style>

<script>
  const links = document.querySelectorAll<HTMLAnchorElement>('[data-side-menu-link]');
  const sections = Array.from(links)
    .map((link) => document.getElementById(link.dataset.target!))
    .filter((el): el is HTMLElement => el !== null);

  function setActive(id: string) {
    for (const link of links) {
      link.classList.toggle('side-menu__link--active', link.dataset.target === id);
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      }
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
  );

  for (const section of sections) {
    observer.observe(section);
  }
</script>
```

- [ ] **Step 2: Verificar type-check**

```bash
pnpm check
```

Esperado: 0 erros (o script inline é verificado pelo `astro check` como TypeScript).

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/case/SideMenu.astro
git commit -m "feat: adiciona componente SideMenu com scroll-spy (IntersectionObserver)"
```

---

### Task 10: Criar `CaseSummary.astro`

**Files:**
- Create: `src/components/sections/case/CaseSummary.astro`

**Interfaces:**
- Consumes: nenhum componente externo
- Produces: `<CaseSummary challenge solution results />`, cada um `{title, description}` — consumido por `src/pages/cases/[slug].astro` (Task 17)

3 colunas (Desafio/Solução/Resultado), cada uma com cor de cabeçalho própria (Figma: `col-summary`, node `222:393`).

- [ ] **Step 1: Criar `src/components/sections/case/CaseSummary.astro`**

```astro
---
interface Block {
  title: string;
  description: string;
}

interface Props {
  challenge: Block;
  solution: Block;
  results: Block;
}

const { challenge, solution, results } = Astro.props;
---

<section class="case-summary" id="resumo">
  <h2 class="text-title-h3">Resumo</h2>
  <div class="case-summary__grid">
    <div class="case-summary__col">
      <h3 class="case-summary__col-title case-summary__col-title--challenge text-title-h4">
        {challenge.title}
      </h3>
      <p class="case-summary__col-desc text-body-md">{challenge.description}</p>
    </div>
    <div class="case-summary__col">
      <h3 class="case-summary__col-title case-summary__col-title--solution text-title-h4">
        {solution.title}
      </h3>
      <p class="case-summary__col-desc text-body-md">{solution.description}</p>
    </div>
    <div class="case-summary__col">
      <h3 class="case-summary__col-title case-summary__col-title--results text-title-h4">
        {results.title}
      </h3>
      <p class="case-summary__col-desc text-body-md">{results.description}</p>
    </div>
  </div>
</section>

<style>
  .case-summary {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x6);
    color: var(--text-body-primary-strong);
  }

  .case-summary__grid {
    display: flex;
    gap: var(--scale-x10);
    align-items: stretch;
  }

  .case-summary__col {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: var(--surface-bg-off-white-primary);
    border: 3px solid var(--border-neutral-strong);
    box-shadow: var(--shadow-layout-neutral);
  }

  .case-summary__col-title {
    margin: 0;
    padding: var(--scale-x6);
    border-bottom: 3px solid var(--border-neutral-strong);
    color: var(--text-body-neutral-strong);
  }

  .case-summary__col-title--challenge {
    background-color: var(--surface-bg-tertiary-subtle);
  }

  .case-summary__col-title--solution {
    background-color: var(--surface-bg-off-white-tertiary);
  }

  .case-summary__col-title--results {
    background-color: var(--surface-bg-primary-subtle);
  }

  .case-summary__col-desc {
    padding: var(--scale-x6);
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
git add src/components/sections/case/CaseSummary.astro
git commit -m "feat: adiciona componente CaseSummary"
```

---

### Task 11: Criar `CaseContext.astro`

**Files:**
- Create: `src/components/sections/case/CaseContext.astro`

**Interfaces:**
- Consumes: `astro:assets` `<Image />`
- Produces: `<CaseContext description={string[]} image caption />` — consumido por `src/pages/cases/[slug].astro` (Task 17)

- [ ] **Step 1: Criar `src/components/sections/case/CaseContext.astro`**

```astro
---
import { Image } from 'astro:assets';
import type { ImageMetadata } from 'astro';

interface Props {
  description: string[];
  image: ImageMetadata;
  caption: string;
}

const { description, image, caption } = Astro.props;
---

<section class="case-context" id="context">
  <h2 class="text-title-h3">Contexto</h2>
  <div class="case-context__row">
    <div class="case-context__text">
      {description.map((paragraph) => (
        <p class="text-body-md">{paragraph}</p>
      ))}
    </div>
    <figure class="case-context__figure">
      <Image src={image} alt={caption} width={156} />
      <figcaption class="text-body-caption">{caption}</figcaption>
    </figure>
  </div>
</section>

<style>
  .case-context {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x5);
    color: var(--text-body-primary-strong);
  }

  .case-context__row {
    display: flex;
    gap: var(--scale-x10);
    align-items: flex-start;
  }

  .case-context__text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--scale-x3);
    color: var(--text-body-neutral-strong);
  }

  .case-context__figure {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x4);
    align-items: center;
    margin: 0;
    flex-shrink: 0;
  }

  .case-context__figure img {
    border: 3px solid var(--border-neutral-strong);
    box-shadow: var(--shadow-layout-img);
  }

  .case-context__figure figcaption {
    color: var(--text-body-neutral-strong);
    text-transform: uppercase;
  }
</style>
```

- [ ] **Step 2: Verificar type-check e build (a imagem precisa resolver via `astro:assets`)**

```bash
pnpm check
pnpm build
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/case/CaseContext.astro
git commit -m "feat: adiciona componente CaseContext"
```

---

### Task 12: Criar `CaseProblems.astro`

**Files:**
- Create: `src/components/sections/case/CaseProblems.astro`

**Interfaces:**
- Consumes: nenhum componente externo
- Produces: `<CaseProblems intro hypothesis risks={string[]} kpis />` — consumido por `src/pages/cases/[slug].astro` (Task 17)

- [ ] **Step 1: Criar `src/components/sections/case/CaseProblems.astro`**

```astro
---
interface Props {
  intro: string;
  hypothesis: string;
  risks: string[];
  kpis: string;
}

const { intro, hypothesis, risks, kpis } = Astro.props;
---

<section class="case-problems" id="problems-challenges">
  <h2 class="text-title-h3">Problema &amp; Desafios</h2>
  <div class="case-problems__text">
    <p class="text-body-md">{intro}</p>
    <p class="text-body-md">{hypothesis}</p>
    <ul class="case-problems__risks">
      {risks.map((risk) => (
        <li class="text-body-md">{risk}</li>
      ))}
    </ul>
    <p class="text-body-md">{kpis}</p>
  </div>
</section>

<style>
  .case-problems {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x5);
    color: var(--text-body-primary-strong);
  }

  .case-problems__text {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x3);
    color: var(--text-body-neutral-strong);
  }

  .case-problems__risks {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x2);
    margin: 0;
    padding-left: var(--scale-x6);
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
git add src/components/sections/case/CaseProblems.astro
git commit -m "feat: adiciona componente CaseProblems"
```

---

### Task 13: Criar `CaseDiscovery.astro`

**Files:**
- Create: `src/components/sections/case/CaseDiscovery.astro`

**Interfaces:**
- Consumes: `TestResultBadge` (Task 2), `astro:assets` `<Image />`
- Produces: `<CaseDiscovery intro phases exploration pd tests consolidation />` (props tipadas conforme schema da Task 3) — consumido por `src/pages/cases/[slug].astro` (Task 17)

Maior componente da página: intro, timeline de 4 fases (marcador quadrado 28×28 preenchido `--yellow-200`, conectado por uma linha vertical de 3px `--border-neutral-strong` — Figma node `222:427`), exploration, pd, tests (grade de `TestResultBadge` por grupo) e consolidation, todos internos (não desmembrados em sub-componentes).

- [ ] **Step 1: Criar `src/components/sections/case/CaseDiscovery.astro`**

```astro
---
import { Image } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import TestResultBadge from '../../ui/TestResultBadge.astro';

interface Phase {
  title: string;
  subtitle: string;
  description: string;
}

interface ImagesBlock {
  title: string;
  description: string;
  images: ImageMetadata[];
}

interface TestResult {
  status: 'verified' | 'warning' | 'unavailable';
  label: string;
}

interface TestGroup {
  title: string;
  results: TestResult[];
}

interface Props {
  intro: string;
  phases: Phase[];
  exploration: ImagesBlock;
  pd: ImagesBlock;
  tests: { intro: string; groups: TestGroup[]; outro: string };
  consolidation: { title: string; description: string };
}

const { intro, phases, exploration, pd, tests, consolidation } = Astro.props;
---

<section class="case-discovery" id="strategy-solutions">
  <h2 class="text-title-h3">Discovery</h2>
  <p class="text-body-md">{intro}</p>

  <ol class="case-discovery__timeline">
    {phases.map((phase, i) => (
      <li class="case-discovery__phase">
        <div class="case-discovery__marker-col">
          {i > 0 && <span class="case-discovery__timeline-line" aria-hidden="true"></span>}
          <span class="case-discovery__marker" aria-hidden="true"></span>
          {i < phases.length - 1 && <span class="case-discovery__timeline-line" aria-hidden="true"></span>}
        </div>
        <div class="case-discovery__phase-content">
          <h3 class="text-body-lg-strong">{phase.title}</h3>
          <p class="case-discovery__phase-subtitle text-label-sm">{phase.subtitle}</p>
          <p class="text-body-md">{phase.description}</p>
        </div>
      </li>
    ))}
  </ol>

  <div class="case-discovery__block">
    <h3 class="text-title-h4">{exploration.title}</h3>
    <p class="text-body-md">{exploration.description}</p>
    <div class="case-discovery__images">
      {exploration.images.map((img) => (
        <Image src={img} alt="" width={483} />
      ))}
    </div>
  </div>

  <div class="case-discovery__block">
    <h3 class="text-title-h4">{pd.title}</h3>
    <p class="text-body-md">{pd.description}</p>
    <div class="case-discovery__images">
      {pd.images.map((img) => (
        <Image src={img} alt="" width={360} />
      ))}
    </div>
  </div>

  <div class="case-discovery__block">
    <h3 class="text-title-h4">Testes de usabilidade</h3>
    <p class="text-body-md">{tests.intro}</p>
    <div class="case-discovery__tests">
      {tests.groups.map((group) => (
        <div class="case-discovery__test-group">
          <p class="text-body-lg-strong">{group.title}</p>
          <div class="case-discovery__test-results">
            {group.results.map((result) => (
              <TestResultBadge status={result.status} label={result.label} />
            ))}
          </div>
        </div>
      ))}
    </div>
    <p class="text-body-md">{tests.outro}</p>
  </div>

  <div class="case-discovery__block">
    <h3 class="text-title-h4">{consolidation.title}</h3>
    <p class="text-body-md">{consolidation.description}</p>
  </div>
</section>

<style>
  .case-discovery {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x6);
    color: var(--text-body-primary-strong);
  }

  .case-discovery > p,
  .case-discovery__block {
    color: var(--text-body-neutral-strong);
  }

  .case-discovery__timeline {
    display: flex;
    flex-direction: column;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .case-discovery__phase {
    display: flex;
    gap: var(--scale-x6);
  }

  .case-discovery__marker-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 28px;
    flex-shrink: 0;
  }

  .case-discovery__timeline-line {
    flex: 1;
    width: 3px;
    background-color: var(--border-neutral-strong);
  }

  .case-discovery__marker {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    background-color: var(--yellow-200);
    border: 3px solid var(--border-neutral-strong);
  }

  .case-discovery__phase-content {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x2);
    padding-bottom: var(--scale-x6);
    color: var(--text-body-neutral-strong);
  }

  .case-discovery__phase-subtitle {
    color: var(--text-body-accent-regular);
  }

  .case-discovery__block {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x4);
  }

  .case-discovery__images {
    display: flex;
    gap: var(--scale-x10);
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .case-discovery__images :global(img) {
    border: 3px solid var(--border-neutral-strong);
    box-shadow: var(--shadow-layout-img);
  }

  .case-discovery__tests {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x4);
  }

  .case-discovery__test-group {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x2);
  }

  .case-discovery__test-results {
    display: flex;
    flex-wrap: wrap;
    gap: var(--scale-x3);
  }
</style>
```

**Nota de token:** `--yellow-200` (marcador da timeline) já existe em `primitives.css` (adicionado durante o resync de tokens da Home, valor `#ffe991`) — usado direto aqui como primitivo porque não há um papel semântico próprio pra "marcador de timeline" ainda; se a página de case ganhar mais elementos assim no futuro, vale extrair um token semântico dedicado.

- [ ] **Step 2: Verificar type-check e build**

```bash
pnpm check
pnpm build
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/case/CaseDiscovery.astro
git commit -m "feat: adiciona componente CaseDiscovery (timeline, exploration, pd, testes, consolidacao)"
```

---

### Task 14: Criar `CaseDelivery.astro`

**Files:**
- Create: `src/components/sections/case/CaseDelivery.astro`

**Interfaces:**
- Consumes: `astro:assets` `<Image />`
- Produces: `<CaseDelivery myRole designSystem home />` — consumido por `src/pages/cases/[slug].astro` (Task 17)

- [ ] **Step 1: Criar `src/components/sections/case/CaseDelivery.astro`**

```astro
---
import { Image } from 'astro:assets';
import type { ImageMetadata } from 'astro';

interface Block {
  title: string;
  description: string;
  images?: ImageMetadata[];
}

interface Props {
  myRole: Block;
  designSystem: Block;
  home: Block;
}

const { myRole, designSystem, home } = Astro.props;
---

<section class="case-delivery" id="myrole">
  <h2 class="text-title-h3">Delivery</h2>

  <div class="case-delivery__block">
    <h3 class="text-title-h4">{myRole.title}</h3>
    <p class="text-body-md">{myRole.description}</p>
  </div>

  <div class="case-delivery__block">
    <h3 class="text-title-h4">{designSystem.title}</h3>
    <p class="text-body-md">{designSystem.description}</p>
    {designSystem.images && (
      <div class="case-delivery__images">
        {designSystem.images.map((img) => (
          <Image src={img} alt="" width={248} />
        ))}
      </div>
    )}
  </div>

  <div class="case-delivery__block">
    <h3 class="text-title-h4">{home.title}</h3>
    <p class="text-body-md">{home.description}</p>
    {home.images && (
      <div class="case-delivery__images">
        {home.images.map((img) => (
          <Image src={img} alt="" width={283} />
        ))}
      </div>
    )}
  </div>
</section>

<style>
  .case-delivery {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x6);
    color: var(--text-body-primary-strong);
  }

  .case-delivery__block {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x4);
    color: var(--text-body-neutral-strong);
  }

  .case-delivery__images {
    display: flex;
    gap: var(--scale-x10);
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .case-delivery__images :global(img) {
    border: 3px solid var(--border-neutral-strong);
    box-shadow: var(--shadow-layout-img);
  }
</style>
```

- [ ] **Step 2: Verificar type-check e build**

```bash
pnpm check
pnpm build
```

Esperado: 0 erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/case/CaseDelivery.astro
git commit -m "feat: adiciona componente CaseDelivery"
```

---

### Task 15: Criar `CaseImpact.astro`

**Files:**
- Create: `src/components/sections/case/CaseImpact.astro`

**Interfaces:**
- Consumes: nenhum componente externo
- Produces: `<CaseImpact highlights={{value,label}[]} description={string[]} />` — consumido por `src/pages/cases/[slug].astro` (Task 17)

- [ ] **Step 1: Criar `src/components/sections/case/CaseImpact.astro`**

```astro
---
interface Highlight {
  value: string;
  label: string;
}

interface Props {
  highlights: Highlight[];
  description: string[];
}

const { highlights, description } = Astro.props;
---

<section class="case-impact" id="impact">
  <h2 class="text-title-h3">Impacto</h2>
  <div class="case-impact__highlights">
    {highlights.map((highlight) => (
      <div class="case-impact__highlight">
        <p class="text-title-h3">{highlight.value}</p>
        <p class="text-body-md">{highlight.label}</p>
      </div>
    ))}
  </div>
  <div class="case-impact__text">
    {description.map((paragraph) => (
      <p class="text-body-md">{paragraph}</p>
    ))}
  </div>
</section>

<style>
  .case-impact {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x6);
    color: var(--text-body-primary-strong);
  }

  .case-impact__highlights {
    display: flex;
    gap: var(--scale-x10);
    flex-wrap: wrap;
  }

  .case-impact__highlight {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x2);
    padding: var(--scale-x5);
    background-color: var(--surface-bg-off-white-primary);
    border: 3px solid var(--border-neutral-strong);
    box-shadow: var(--shadow-layout-neutral);
    min-width: 200px;
  }

  .case-impact__highlight p:first-child {
    color: var(--text-body-primary-strong);
  }

  .case-impact__highlight p:last-child {
    color: var(--text-body-neutral-strong);
  }

  .case-impact__text {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x3);
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
git add src/components/sections/case/CaseImpact.astro
git commit -m "feat: adiciona componente CaseImpact"
```

---

### Task 16: Criar `CasePlansAhead.astro` e `BackToTopButton.astro`

**Files:**
- Create: `src/components/sections/case/CasePlansAhead.astro`
- Create: `src/components/sections/case/BackToTopButton.astro`

**Interfaces:**
- Consumes: `Button` (Task 1), `src/assets/icons/case/arrow-up.svg` (Task 5)
- Produces: `<CasePlansAhead privacy pains />`, `<BackToTopButton />` — consumidos por `src/pages/cases/[slug].astro` (Task 17)

- [ ] **Step 1: Criar `src/components/sections/case/CasePlansAhead.astro`**

```astro
---
interface Block {
  title: string;
  description: string;
}

interface Props {
  privacy: Block;
  pains: Block;
}

const { privacy, pains } = Astro.props;
---

<section class="case-plans-ahead" id="plans-ahead">
  <h2 class="text-title-h3">Visão de futuro</h2>
  <div class="case-plans-ahead__block">
    <h3 class="text-title-h4">{privacy.title}</h3>
    <p class="text-body-md">{privacy.description}</p>
  </div>
  <div class="case-plans-ahead__block">
    <h3 class="text-title-h4">{pains.title}</h3>
    <p class="text-body-md">{pains.description}</p>
  </div>
</section>

<style>
  .case-plans-ahead {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x6);
    color: var(--text-body-primary-strong);
  }

  .case-plans-ahead__block {
    display: flex;
    flex-direction: column;
    gap: var(--scale-x4);
    color: var(--text-body-neutral-strong);
  }
</style>
```

- [ ] **Step 2: Criar `src/components/sections/case/BackToTopButton.astro`**

```astro
---
import Button from '../../ui/Button.astro';
import arrowUpIcon from '../../../assets/icons/case/arrow-up.svg';
---

<Button href="#top" variant="outline-accent" class="clickable-anchor-backtotop">
  Ir para o topo
  <Fragment slot="icon">
    <img src={arrowUpIcon.src} width="24" height="24" alt="" />
  </Fragment>
</Button>
```

- [ ] **Step 3: Verificar type-check**

```bash
pnpm check
```

Esperado: 0 erros.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/case/CasePlansAhead.astro src/components/sections/case/BackToTopButton.astro
git commit -m "feat: adiciona componentes CasePlansAhead e BackToTopButton"
```

---

### Task 17: Compor a página em `src/pages/cases/[slug].astro`

**Files:**
- Modify: `src/pages/cases/[slug].astro`

**Interfaces:**
- Consumes: todos os componentes das Tasks 8–16, `estimateReadingTime` (já existe)
- Produces: rota `/cases/[slug]` renderizada com o visual real, pra qualquer case com `content` completo (não só Redesign — os outros 2 renderizam com o conteúdo mínimo de fallback das Tasks 4/3, já que não têm CTA na Home ainda)

Substitui o skeleton semântico da fundação pela composição real, incluindo o layout de duas colunas (menu lateral + conteúdo) do Figma (`row-section-case`, node `222:1163`).

- [ ] **Step 1: Reescrever `src/pages/cases/[slug].astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Divider from '../../components/ui/Divider.astro';
import CaseHeader from '../../components/sections/case/CaseHeader.astro';
import SideMenu from '../../components/sections/case/SideMenu.astro';
import CaseSummary from '../../components/sections/case/CaseSummary.astro';
import CaseContext from '../../components/sections/case/CaseContext.astro';
import CaseProblems from '../../components/sections/case/CaseProblems.astro';
import CaseDiscovery from '../../components/sections/case/CaseDiscovery.astro';
import CaseDelivery from '../../components/sections/case/CaseDelivery.astro';
import CaseImpact from '../../components/sections/case/CaseImpact.astro';
import CasePlansAhead from '../../components/sections/case/CasePlansAhead.astro';
import BackToTopButton from '../../components/sections/case/BackToTopButton.astro';
import { getCollection, type CollectionEntry } from 'astro:content';
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
  <CaseHeader
    title={data.title}
    status={data.status}
    tags={data.tags}
    publishedDate={data.publishedDate}
    readingTime={readingTime}
  />
  <Divider />
  <div class="case-layout">
    <SideMenu />
    <div class="case-layout__divider" aria-hidden="true"></div>
    <div class="case-layout__content">
      <CaseSummary
        challenge={data.content.summary.challenge}
        solution={data.content.summary.solution}
        results={data.content.summary.results}
      />

      {data.content.context && (
        <>
          <Divider width="156px" />
          <CaseContext {...data.content.context} />
        </>
      )}

      {data.content.problems && (
        <>
          <Divider width="156px" />
          <CaseProblems {...data.content.problems} />
        </>
      )}

      {data.content.discovery && (
        <>
          <Divider width="156px" />
          <CaseDiscovery {...data.content.discovery} />
        </>
      )}

      {data.content.delivery && (
        <>
          <Divider width="156px" />
          <CaseDelivery {...data.content.delivery} />
        </>
      )}

      {data.content.impact && (
        <>
          <Divider width="156px" />
          <CaseImpact {...data.content.impact} />
        </>
      )}

      {data.content.plansAhead && (
        <>
          <Divider width="156px" />
          <CasePlansAhead {...data.content.plansAhead} />
        </>
      )}

      <BackToTopButton />
    </div>
  </div>
</BaseLayout>

<style>
  .case-layout {
    display: flex;
    gap: var(--scale-x10);
    padding: var(--scale-x6) var(--scale-x20) var(--scale-x20);
    align-items: flex-start;
  }

  .case-layout__divider {
    align-self: stretch;
    width: 5px;
    background-color: var(--border-accent-strong);
  }

  .case-layout__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--scale-x11);
    max-width: 977px;
  }
</style>
```

- [ ] **Step 2: Verificar type-check e build**

```bash
pnpm check
pnpm build
```

Esperado: 0 erros; `dist/cases/redesign/index.html`, `dist/cases/jornada-pagamentos/index.html`, `dist/cases/gosafe-ds/index.html` e `dist/cases/exemplo-case/index.html` gerados.

- [ ] **Step 3: Commit**

```bash
git add src/pages/cases/[slug].astro
git commit -m "feat: compoe a pagina de case com header, menu lateral e todas as secoes"
```

---

### Task 18: Publicar o case Redesign

**Files:**
- Modify: `src/content/cases/redesign.yaml`
- Modify: `src/components/sections/CasesPreview.astro`

**Interfaces:**
- Consumes: nenhuma
- Produces: `redesign` sai de `coming-soon`, `CaseCard` da Home ganha `href="/cases/redesign"` — CTA "Ler case" ativo (comportamento já implementado em `CaseCard.astro`, só dormente por falta de `href`)

- [ ] **Step 1: Mudar `status` em `src/content/cases/redesign.yaml`**

```yaml
status: "published"
```

- [ ] **Step 2: Passar `href` condicional em `src/components/sections/CasesPreview.astro`**

Substituir:

```astro
        shadow={caseEntry.id === 'redesign' ? 'accent' : 'neutral'}
```

por:

```astro
        shadow={caseEntry.id === 'redesign' ? 'accent' : 'neutral'}
        href={caseEntry.id === 'redesign' ? `/cases/${caseEntry.id}` : undefined}
```

- [ ] **Step 3: Rodar a suíte completa**

```bash
pnpm check
pnpm test
pnpm build
```

Esperado: 0 erros, todos os testes Vitest passando, build sem erro. Verificar em `dist/index.html` que o card do Redesign agora renderiza a tag categórica real (não mais "Em breve", já que `status` virou `published`) e o botão "Ler case" com `href="/cases/redesign"`.

- [ ] **Step 4: Commit**

```bash
git add src/content/cases/redesign.yaml src/components/sections/CasesPreview.astro
git commit -m "feat: publica o case Redesign e ativa o CTA Ler case na Home"
```

---

### Task 19: Atualizar `design-notes.md`

**Files:**
- Modify: `docs/design-notes.md`

- [ ] **Step 1: Atualizar a entrada `clickable-active-anchor-point-example`**

Substituir:

```markdown
### clickable-active-anchor-point-example
**Contexto:** exemplo de alteração de estilo no botão que referencia a posição da seção do case que está sendo lida no momento
**Decisão:** ao clicar, não fazer nada
**Motivo:** facilitar a navegação do usuário por todo o case
```

por:

```markdown
### clickable-active-anchor-point-example
**Contexto:** primeiro item do menu lateral do case — referencia a seção "Resumo", mostrando o estilo do estado "ativo" (âncora atualmente em foco no scroll-spy)
**Decisão:** funciona como âncora normal, igual às demais `clickable-inactive-anchor-*` — clicável e participa do scroll-spy (implementado via `IntersectionObserver` em `SideMenu.astro`). O nome "example" na camada do Figma descrevia o exemplo visual do estado ativo, não uma restrição funcional
**Motivo:** facilitar a navegação do usuário por todo o case; confirmado com o usuário durante o brainstorming da spec `2026-09-09-case-detail-visual-design.md`
```

- [ ] **Step 2: Commit**

```bash
git add docs/design-notes.md
git commit -m "docs: atualiza clickable-active-anchor-point-example (e a ancora do Resumo)"
```

---

### Task 20: Verificação final

**Files:** nenhum (só verificação)

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

Abrir `http://localhost:4321/cases/redesign` e comparar lado a lado com o screenshot do frame `desktop-case` (node `222:343`, arquivo `VM0MVYSWiDbznuPZFRyArB`). Checar especialmente: menu lateral sticky com scroll-spy funcionando (rolar a página e ver o item ativo mudar), as 7 seções na ordem certa, timeline do Discovery com marcador quadrado amarelo conectado por linha, grade de `TestResultBadge` dos 4 grupos de teste com os ícones corretos (verified/warning/unavailable batendo com o texto), imagens carregando (incluindo as 4 ilustrações exportadas achatadas na Task 5), botão "voltar" com ícone à esquerda, botão "ir para o topo" funcionando. Confirmar também na Home (`http://localhost:4321/`) que o card do Redesign mostra o CTA "Ler case" e leva pra página nova.

Parar o servidor ao final:

```bash
pnpm astro dev stop
```

- [ ] **Step 3: Registrar divergências encontradas**

Se algo divergir visualmente do Figma, registrar em uma nova seção "Riscos e pontos em aberto" na spec (`docs/superpowers/specs/2026-09-09-case-detail-visual-design.md`) — sem commit automático neste step, qualquer ajuste vira uma correção pontual nos componentes já commitados.
