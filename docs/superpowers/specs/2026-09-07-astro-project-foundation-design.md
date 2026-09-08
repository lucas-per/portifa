# Fundação do projeto Astro — Design

**Data:** 2026-09-07
**Status:** Aprovado para plano de implementação
**Fontes:** `docs/prd.md`, `docs/design-notes.md`, Figma (`VM0MVYSWiDbznuPZFRyArB`, frames `desktop-home` e `desktop-case`)

## Objetivo

Estruturar a fundação do site pessoal em Astro: stack, tokens de design, content collections, rotas, navegação extensível e organização de componentes — o suficiente para começar a implementar as telas do V1 (Home + página dedicada de case) em uma etapa seguinte, sem precisar refatorar a base depois.

Fora de escopo desta etapa: estilos visuais finais/pixel-perfect, animações de hover/active, preenchimento de conteúdo real dos cases, conexão do GitHub Actions com o Cloudflare Pages no painel (fica documentada, não configurada).

## 1. Stack e ferramentas

- **Astro** com TypeScript em modo strict.
- **pnpm** como gerenciador de pacotes.
- **CSS vanilla**, aproveitando o escopo automático por componente do Astro — sem framework utilitário (PRD 6.5).
- **Browserslist**: `.browserslistrc` com o alvo do PRD 6.3 (últimas 2 versões principais de Chrome/Edge, Firefox, Safari), alimentando Autoprefixer no build.
- **i18n nativo do Astro**: `i18n.locales: ['pt']`, `defaultLocale: 'pt'`, `routing.prefixDefaultLocale: false`. A Home fica em `/`, sem prefixo de idioma. Adicionar um idioma no futuro (PRD 6.4) é estender `locales` + criar o conteúdo correspondente — sem refatorar rotas.
- **CI**: `.github/workflows/ci.yml` rodando em push/PR — install (pnpm) → `astro check` (type-check) → `astro build`. A integração de deploy real com Cloudflare Pages é feita depois, no painel da Cloudflare (nativa, sem passo de Wrangler CLI — PRD 6.5/9), fora do escopo desta fundação.

## 2. Tokens de design (Figma → código)

As variáveis do Figma já foram lidas via MCP (`get_variable_defs` no node `31:690`) e chegam como tokens semânticos resolvidos (ex.: `layout/surface/bg/neutral/surface-neutral-strong` → `#2e2b2b`).

- `src/styles/tokens/primitives.css`: valores brutos convertidos de hex para **OKLCH**. Hex repetidos entre múltiplos tokens semânticos são deduplicados em um único primitivo (ex.: `#2e2b2b`, usado em `layout/surface/bg/neutral/surface-neutral-strong` e `component/button/border/neutral-strong`, vira um `--neutral-900` único, referenciado duas vezes na camada de semantics).
- `src/styles/tokens/semantics.css`: nomenclatura abstrata idêntica à do Figma (ex.: `--surface-bg-neutral-strong`, `--button-bg-primary-filled-pressed`, `--text-label-on-bg-accent`), cada uma via `var()` apontando para um primitivo. Regra de mão única do design-notes: semantics pode referenciar primitives, nunca o inverso.
- Nenhum token do Figma bate em preto/branco absoluto — o mais escuro é `#242121` (`shadow/neutral`), o mais claro é `#fffff2` (`layout/surface/bg/off-white/primary`). Já compatível com a restrição de acessibilidade do PRD 6.2.
- `line-height` e `list-spacing` não vêm como variable do Figma (limitação nativa da ferramenta, documentada no design-notes). A escala de nomenclatura (`none` / `compact` / `regular` / `comfortable`) é definida nesta fundação como convenção em `semantics.css`, mas os valores numéricos exatos só são preenchidos quando cada seção for implementada de fato (via `get_design_context` seção a seção) — não fazem parte desta etapa.
- Tipografia: 3 famílias no Figma — `Plus Jakarta Sans` (títulos), `DM Sans` (corpo), `JetBrains Mono` (labels). Nenhuma é serifada, portanto não fere a restrição do PRD 7.2 (que proíbe combinar serifada com não-serifada no mesmo sistema). As 3 famílias são tratadas como tokens de família separados (`--font-family-title`, `--font-family-body`, `--font-family-label`).
- Light/dark mode: os valores de `semantics.css` trocam por tema (`prefers-color-scheme` + override manual via atributo, ex. `[data-theme="dark"]`); os primitivos (`primitives.css`) não mudam por tema — são a paleta bruta.

## 3. Content Collections — Cases

Cada case é um arquivo de dados estruturado (YAML) em `src/content/cases/`, validado por schema Zod em `src/content/config.ts`. A estrutura reflete o que já está desenhado no frame `desktop-case` do Figma — não é uma lista de campos inventada, é o espelho das seções reais.

**Metadados de card/listagem** (usados na Home e futuramente em Projetos, V2):
- `title`, `shortDescription`
- `status`: `'published' | 'coming-soon'` — quando `'coming-soon'`, as tags não são exibidas no card (PRD 4.2)
- `tags`: `string[]` sem enum fechado — lista aberta para não travar quando Artigos/Projetos (V2) reaproveitarem o mesmo padrão de metadados (PRD seção 5)
- `publishedDate`: data

**Conteúdo da página dedicada**, cada bloco opcional (nem todo case precisa ter todas as seções):
- `summary`: texto de resumo
- `context`: `{ description, image, caption }`
- `problems`: `{ description }`
- `discovery`: `{ intro, phases: [{ title, subtitle, description }] }` — a timeline de 4 fases do Figma
- `exploration`: `{ title, description, images: [] }`
- `pd`: `{ title, description, images: [] }` (prototipação)
- `tests`: `{ groups: [{ title, results: [{ status: 'verified' | 'warning' | 'unavailable', label }] }] }`
- `delivery`: `{ myRole, designSystem, home }` — cada um `{ title, description, images? }`
- `impact`: `{ highlights: [{ title, description }], description }`
- `plansAhead`: `{ privacy: { title, description }, pains: { title, description } }`

**Tempo de leitura**: não é um campo salvo no YAML. `src/utils/reading-time.ts` percorre os campos de texto do case em build-time e aplica a fórmula do PRD 4.2 (contagem de palavras ÷ 200–238 wpm, arredondado para cima) — mesma função reaproveitada por Artigos no V2.

Isso mantém `src/pages/cases/[slug].astro` simples: itera as seções presentes no objeto e renderiza os mesmos componentes de UI (timeline, galeria, badge de teste) para qualquer case, sem duplicar layout por case.

## 4. Rotas

- `src/pages/index.astro` → Home (hero, cases selecionados, skills & expertise, about me)
- `src/pages/cases/[slug].astro` → página dedicada do case, `getStaticPaths()` a partir da content collection

URLs de case já seguem o padrão amigável do PRD 6.6 (`/cases/nome-do-projeto`), compatível com a futura seção de Projetos (V2).

## 5. Navegação extensível

Requisito do PRD (seção 2): a IA é uma lista extensível de macro-seções, não um conjunto fixo. Um único arquivo `src/config/navigation.ts` centraliza as macro-seções como `{ key, label, path, enabled }`. Hoje só "Portfólio/Home" está `enabled: true`. Quando Artigos/Projetos/Fotos entrarem (V2/V3), a mudança é acrescentar uma entrada nesse arquivo — Header e Footer renderizam a navegação a partir dessa lista, sem alterar código de layout.

## 6. Organização de componentes

Separação pensada para a futura migração para a UaiUI DS (PRD 6.5) — componentes trocáveis isoladamente, sem reescrever páginas inteiras:

```
src/components/
  ui/        Button, Tag, Card, Accordion, TestBadge — puramente apresentacionais, props-driven
  layout/    Header, Footer, SideMenu
  sections/  Hero, CasesPreview, SkillsExpertise, AboutMe — composição específica de página, usam ui/
src/layouts/
  BaseLayout.astro   head (meta tags, Open Graph, SEO, script do Umami), estrutura header/main/footer, tema light/dark
```

Os elementos clicáveis seguem a convenção do design-notes (`clickable-link-internal-*`, `clickable-link-external-*`, `clickable-anchor-*`, `clickable-mailto-*`, `clickable-download-*`). Cada variante tem uma responsabilidade distinta (navegação interna vs. externa vs. scroll-to-anchor vs. abrir cliente de e-mail vs. disparar download) — os componentes/props do código refletem essa distinção explicitamente, em vez de um único componente `Link` genérico, evitando a inferência ambígua que o design-notes pede para prevenir.

## 7. Analytics e SEO (infraestrutura cross-cutting)

`BaseLayout.astro` centraliza, desde a fundação:
- Meta tags e Open Graph (título, descrição, imagem de preview) — PRD 6.6
- Script do Umami Cloud (plano Hobby, PRD 6.7), sem cookies, carregado de forma leve

## Riscos e pontos em aberto

- A integração Astro-Angular (para a migração UaiUI DS) é mantida pela comunidade, não pelo core do Astro (PRD 6.5) — não afeta esta fundação, é um risco a reavaliar só no momento da migração.
- Os valores exatos de `line-height`/`list-spacing` e as animações de hover/active dos botões dependem de leitura seção-a-seção do `get_design_context` — tratados na etapa de implementação visual, não nesta fundação.
- 3 famílias tipográficas (título/corpo/label) — confirmado com o usuário que não fere a restrição do PRD 7.2, mas fica registrado aqui para referência futura.
