# Implementação visual da Home (V1) — Design

**Data:** 2026-09-08
**Status:** Aprovado para plano de implementação
**Fontes:** Figma (`VM0MVYSWiDbznuPZFRyArB`, frame `desktop-home`, node `31:690`), `docs/prd.md`, `docs/design-notes.md`, `docs/superpowers/specs/2026-09-07-astro-project-foundation-design.md`

**Regra de resolução de conflito:** quando o Figma e a documentação escrita (PRD/design-notes/spec da fundação) divergirem, **o Figma prevalece** — decisão explícita do usuário durante o brainstorming desta etapa. Casos concretos encontrados e resolvidos assim estão marcados abaixo com "(Figma > PRD)".

## Objetivo

Implementar visualmente a Home (V1) a partir do frame `desktop-home` do Figma, sobre a fundação já existente (tokens, content collection, componentes base, rotas). Cobre: correção de bugs de token encontrados na fundação, os componentes de seção que faltavam (`Hero`, `CasesPreview`, `SkillsExpertise`, `AboutMe`), conteúdo real dos 3 cases exibidos na Home, assets reais (avatar, logo, ícones) e microinterações de hover/active dos botões.

**Fora de escopo desta etapa** (mantido do plano anterior, sem novidade):
- Página dedicada de case (`desktop-case`) — próxima etapa, quando o CTA "Ler case" for reativado
- Dark mode com valores reais (Figma ainda não tem um segundo modo desenhado)
- CV em PDF real, ID do Umami, `og:image`/`site` em `astro.config.mjs`
- Nav de macro-seções visível no Header (só entra quando V2 tiver mais de 1 seção habilitada)
- Transições/animações elaboradas (GSAP/transitions.dev) — reservadas ao V4 do PRD

## 1. Correções em componentes existentes

Comparando os componentes da fundação com o Figma real, o mapeamento de tokens dos variants do `Button.astro` estava trocado:

| Variant | Antes (errado) | Depois (Figma) |
|---|---|---|
| `filled-accent` (ex: "Contato") | `border-accent-strong` + `shadow-comp-accent` | `border-neutral-strong` + `shadow-comp-neutral` |
| `outline-accent` (ex: "Ler case", botões do footer) | `border-neutral-strong` + `shadow-comp-neutral` + `text-body-neutral-strong` | `border-accent-strong` + `shadow-comp-accent` + `text-label-on-bg-accent` |

Novo variant `ghost-accent` (botão "sobre mim" do header): `background: var(--button-bg-accent-outline-regular)`, `border-color: var(--button-border-neutral-subtle)` (quase invisível sobre o fundo off-white), **sem** `box-shadow`, `color: var(--text-label-on-bg-accent)`.

`Tag--secondary` ("em breve"): cor de texto corrigida de `--text-body-neutral-strong` para `--text-label-on-bg-complementary` (vermelho escuro, `--red-900`).

`typography.css`: adicionar `text-transform: uppercase` em `.text-label-md`, `.text-label-sm` (todo label/tag/botão é uppercase no Figma) e em `.text-title-h2` (os 3 usos atuais — "Cases selecionados", "Skills & Expertise", "Sobre mim" — são uppercase; `.text-title-h3` não é, não mexe).

## 2. Schema da content collection — campo novo

`src/content.config.ts`: adicionar campo opcional no nível raiz do case (metadado de card, distinto do `content.impact.highlights` que já existe para a página dedicada):

```ts
highlights: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
```

Usado pelo `CaseCard` para a linha de métricas do card (ex: "+15% Boletos pagos"). Ausente quando o case não tem métricas no card (caso do Redesign).

## 3. Conteúdo real dos 3 cases

Os 3 cases reais substituem/complementam o `exemplo-case.yaml` de fixture (que continua existindo para validar o pipeline). Todos ficam `status: coming-soon` nesta etapa — decisão do usuário, incluindo o Redesign (único com CTA visível no Figma), para manter consistência até a página dedicada de case existir. **(Figma > PRD):** o PRD diz que `coming-soon` esconde as tags; o Figma mostra que a tag categórica é **substituída** por uma tag secundária "Em breve" (`Tag variant="secondary"`), não removida — e que métricas de resultado (`highlights`) continuam aparecendo quando existem. `CaseCard` implementa esse comportamento real, não a regra literal do texto do PRD.

| id | title | shortDescription | highlights |
|---|---|---|---|
| `redesign` | Redesign de produto | Como recriamos do zero um app de cibersegurança com código legado instável, mudamos o modelo de negócio e levamos a base de pagantes de zero a 24 mil em um ano. | — |
| `jornada-pagamentos` | Jornada de Pagamentos | Reestruturação da jornada e implementação de design system em um app com mais de 100 mil usuários. | `+15%` Boletos pagos, `+20%` Pagamentos |
| `gosafe-ds` | GoSafe DS | Criação de um design system corporativo, com impacto direto na eficiência operacional e menos tempo para lançamentos de novos produtos. | `-60%` Time-to-market |

Tags reais do Redesign (guardadas no YAML mesmo com `status: coming-soon`, para quando o status virar `published` na próxima etapa): `discovery`, `delivery`, `gestão`, `b2b`, `b2c`.

## 4. Componentes novos

- **`Header.astro`** (reescrito): logo (`clickable-link-internal-home`, SVG + wordmark "LUCAS PEREIRA"), botão `ghost-accent` "sobre mim" (`clickable-anchor-aboutme`, scroll até `#sobre-mim`), botão `filled-accent` "contato" (`clickable-mailto-header`, ícone mail à direita). Sem lista de nav de macro-seções (Figma não desenha; `getEnabledSections()` fica pronta em `navigation.ts` sem ser renderizada até o V2).
- **`Footer.astro`** (reescrito): borda superior `accent-strong` 5px, linha de botões `outline-accent` (mailto `oi@lpereira.me` com ícone mail, "baixar cv" com ícone download apontando pro PDF ainda inexistente, "linkedin" com ícone external-link) separados por grupos de divisores finos (`accent-strong`, 5 linhas de 3px cada), copyright centralizado (`text-body-caption`, cor `text-body-accent-regular`, uppercase).
- **`Hero.astro`** (`src/components/sections/Hero.astro`): headline (`.text-title-display`, trechos "produtos complexos" e "alto impacto" em `--text-body-accent-regular`/azul), avatar (`wrap-avatar-frame` com borda `neutral-strong` + `shadow-layout-img`).
- **`CasesPreview.astro`** (`src/components/sections/CasesPreview.astro`): título "Cases selecionados" (`.text-title-h2`) + grid de 3 `CaseCard`, iterando `getCollection('cases')` filtrado aos 3 reais (fixture `exemplo-case` não entra no grid da Home — mantido só para o teste de pipeline/schema).
- **`CaseCard.astro`** (`src/components/sections/CaseCard.astro`): recebe props (`title`, `shortDescription`, `status`, `tags`, `highlights?`, `href?`). Borda `neutral-strong` 3px; sombra do card varia por posição visual no Figma (Redesign: `shadow-layout-accent`; Payments/DS: `shadow-layout-neutral`) — replicado 1:1, não é uma regra dependente de status. Tag row: `status === 'coming-soon'` → uma `Tag variant="secondary"` "Em breve"; senão → `Tag variant="primary"` por tag. `highlights`, se presente, renderiza a linha com borda `neutral-medium` e colunas divididas por borda direita (só a primeira/intermediárias, não a última). CTA "Ler case" (`Button variant="outline-accent"`, ícone `arrow-right`) só quando `href` é passado (isto é, quando o caller decide que o case já é "clicável" — hoje nenhum dos 3 passa `href`, então nenhum CTA aparece).
- **`SkillsExpertise.astro`** (`src/components/sections/SkillsExpertise.astro`): título "Skills & Expertise" + 4 colunas com header colorido (`surface-bg-tertiary-subtle` / `surface-bg-off-white-tertiary` / `surface-bg-primary-subtle` / `surface-bg-complementary-subtle`) e lista de itens separados por `divider` (`surface-bg-neutral-subtle`, 2px). Conteúdo real:
  - **Estratégia & Discovery**: Product Strategy, Product Discovery, Product Research, Prototipação, Priorização
  - **Design Systems**: Design System Agêntico, Design Tokens, Governança de DS, Documentações, Acessibilidade (WCAG)
  - **Execução e Colaboração**: Design Ops, Facilitação de workshops, Metodologias Ágeis, Design Handoff, Design Systems
  - **Ferramentas que uso**: 12 ícones (Figma, Claude Code, Claude, Gemini, Notebook, Maze, TS, paper, sp, sb, GitHub, or, jamovi), sem label de texto — só os ícones, como no Figma
- **`AboutMe.astro`** (`src/components/sections/AboutMe.astro`, `id="sobre-mim"` para o scroll-anchor do header): título "Sobre mim" + 2 parágrafos de bio real (extraídos do Figma, ver node `31:735`).

Como no Figma a grade de cases (`col-cases`) é filha do próprio `section-hero` (não uma seção irmã), `Hero.astro` recebe a lista de cases via prop e renderiza `CasesPreview` internamente, reproduzindo essa hierarquia. `src/pages/index.astro` passa a compor só `Hero` (que já inclui `CasesPreview`) + `SkillsExpertise` + `AboutMe`, dentro do `BaseLayout`.

## 5. Assets

Baixar do Figma (`get_design_context`/asset URLs) e commitar como bytes reais — nunca redesenhar à mão:

- Avatar (`img-avatar-azul-bege`, PNG) → `src/assets/home/avatar.png`, via `<Image />` do `astro:assets` (é foto, se beneficia de otimização)
- Logo (`logo-desktop`, SVG) → `src/assets/icons/logo.svg`
- Ícones de UI: mail, download, external-link, arrow-right (SVG) → `src/assets/icons/`
- Ícones de ferramentas (12, SVG): figma, claude-code, claude, gemini, notebook, maze, ts, paper, sp, sb, github, or, jamovi → `src/assets/icons/tools/`

**Exceção ao pipeline `astro:assets` para SVGs decorativos:** logo e ícones são importados como módulo e renderizados via `<img src={icone.src} width={W} height={H} alt="" />` (dimensões explícitas, nunca `auto`) — não via `<Image />`, que não traz benefício para SVG e não faz parte do escopo de "conteúdo de imagem" que a restrição original visava (fotos/galerias). O avatar, sendo foto, continua exclusivamente via `<Image />`.

## 6. Hover / active (design-notes)

Aplicado aos 3 variants do `Button.astro` (`filled-accent`, `outline-accent`, `ghost-accent`):

```css
.button {
  transition: transform 0.1s ease;
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
```

`ghost-accent` não tem `box-shadow` de base, então seu `:active` só reseta o `transform` (a regra `box-shadow: none` não tem efeito, mas não quebra nada por ser idempotente).

## Riscos e pontos em aberto

- Os ids dos 2 cases ainda sem case dedicado (`jornada-pagamentos`, `gosafe-ds`) são provisórios — confirmar/ajustar quando a página de case desses 2 for desenhada no Figma.
- Quando a página dedicada do Redesign existir (próxima etapa), o case volta a `status: published` e ganha `href` no `CaseCard` — nenhuma mudança de schema necessária, só de dado.
- Ícones de ferramentas: o Figma nomeia alguns de forma ambígua (`or-container`, `sp-container`, `sb-container`, `paper-container`) — o nome do arquivo de asset segue o nome da camada do Figma tal qual, sem tentar adivinhar a ferramenta real por trás do ícone.
- `src/assets/home/avatar.png` tem bytes JPEG reais (assinatura JFIF), não PNG — a API de asset do Figma serviu o conteúdo assim para essa URL, apesar da extensão `.png` pedida no plano. Não redesenhado/reconvertido (regra de asset real). `astro:assets`/sharp detecta o formato pelos bytes, não pela extensão, então `pnpm build` otimiza normalmente (confirmado: 719kB → 14kB webp) — sem impacto funcional, só uma inconsistência de nome de arquivo a corrigir se o asset for re-exportado no futuro.
