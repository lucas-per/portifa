# Implementação visual da página de Case (Redesign) — Design

**Data:** 2026-09-09
**Status:** Aprovado para plano de implementação
**Fontes:** Figma (`VM0MVYSWiDbznuPZFRyArB`, frame `desktop-case`, node `222:343`), `docs/prd.md` (seção 4.2), `docs/design-notes.md`, `src/content.config.ts` (schema atual, criado na fundação — desatualizado em relação ao Figma real)

**Regra de resolução de conflito:** quando o Figma e a documentação escrita (PRD/design-notes/schema da fundação) divergirem, **o Figma prevalece** — decisão já estabelecida nas etapas anteriores do projeto. O schema atual de `content.config.ts` foi escrito antes do `desktop-case` existir no Figma — diverge da estrutura real em vários pontos, corrigidos abaixo.

## Objetivo

Implementar visualmente a página dedicada de case a partir do frame `desktop-case`, populando com o conteúdo real do case "Redesign de produto" (hoje `status: coming-soon`, sem página dedicada). Ao final desta etapa, o case vira `status: published` e ganha `href` no `CaseCard` da Home, ativando o CTA "Ler case" (já implementado e dormente).

**Fora de escopo desta etapa:**
- Responsividade/mobile — segue o mesmo precedente da Home V1: só o frame desktop, sem breakpoints. O accordion mobile do menu lateral (`clickable-row-accordion-sections`, já documentado em `design-notes.md`) fica para uma etapa responsiva futura.
- Conteúdo dos outros 2 cases (`jornada-pagamentos`, `gosafe-ds`) — cada um ganha sua página dedicada em etapas futuras, quando tiverem frame próprio no Figma.
- Transições/animações (V4 do PRD).

## 1. Correção do schema (`content.config.ts`)

O schema atual foi escrito especulativamente antes do `desktop-case` existir. Comparando com a estrutura real do frame, a página tem exatamente **7 seções de conteúdo** (mapeadas 1:1 com os 7 itens do menu lateral — ver seção 3): Resumo, Contexto, Problema & Desafios, Discovery, Delivery, Impacto, Visão de futuro.

### 1.1 `summary`: de string livre para estrutura Challenge/Solution/Results

Hoje `content.summary` é `z.string()`. O Figma (`col-summary`, node `222:393`) mostra um bloco `row-highlights` com 3 colunas: `col-challenge`, `col-solution`, `col-results` — cada uma provavelmente com um título curto + descrição (mesmo padrão de `col-title-phase-N` do Discovery). Isso também resolve uma aparente contradição do PRD (seção 4.2): o PRD diz que a descrição curta do **card** da Home não deve seguir a estrutura Desafio/Solução/Resultado — implícito nisso é que a **página dedicada** deveria seguir essa estrutura, que é exatamente o que o Figma mostra.

```ts
const summaryBlockSchema = z.object({ title: z.string(), description: z.string() });

summary: z.object({
  challenge: summaryBlockSchema,
  solution: summaryBlockSchema,
  results: summaryBlockSchema,
}),
```

**(Figma > PRD/schema anterior):** campo deixa de ser `z.string()` — é uma mudança que quebra compatibilidade com o `content.summary` atual dos 3 YAMLs (usado hoje como texto simples reaproveitado do `shortDescription`). Os outros 2 cases (`jornada-pagamentos`, `gosafe-ds`) precisam migrar para o novo formato mesmo sem página dedicada ainda, já que o campo é obrigatório no schema. Conteúdo de migração exato (nenhum desses 2 cases tem conteúdo real de Challenge/Solution/Results ainda):
  - `challenge: { title: "Desafio", description: <shortDescription atual do case> }`
  - `solution: { title: "Solução", description: "Case ainda não publicado — conteúdo completo em breve." }`
  - `results: { title: "Resultados", description: "Case ainda não publicado — conteúdo completo em breve." }`

### 1.2 `discovery`: nesting de `exploration`, `pd`, `tests` + novo `consolidation`

Hoje `exploration`, `pd` e `tests` são campos irmãos de `discovery` em `content`. No Figma real (`col-discovery`, node `222:422`), esses 3 blocos são **filhos** de `col-discovery`, na ordem: intro → timeline de 4 fases → exploration → pd → tests → consolidation (bloco novo, sem equivalente no schema atual).

```ts
const phaseSchema = z.object({ title: z.string(), subtitle: z.string(), description: z.string() });

const imagesBlockSchema = z.object({
  title: z.string(),
  description: z.string(),
  images: z.array(image()),
});

discovery: z
  .object({
    intro: z.string(),
    phases: z.array(phaseSchema), // 4 no Figma, mas o array continua flexível
    exploration: imagesBlockSchema,
    pd: imagesBlockSchema,
    tests: z.object({
      intro: z.string(), // desc-tests-1
      groups: z.array(z.object({ title: z.string(), images: z.array(image()) })), // 4 no Figma: Boas-vindas, Login, Home screen, Antivírus — 3 imagens cada
      outro: z.string(), // desc-tests-2
    }),
    consolidation: z.object({ title: z.string(), description: z.string() }),
  })
  .optional(),
```

**Nota sobre `tests`:** o schema atual usa `TestResultBadge` (badges verified/warning/unavailable) — não corresponde ao Figma real, que mostra 4 grupos de teste comparativo com imagens (`col-comparative-test`, node `222:636`, 3 imagens por grupo). `TestResultBadge` não é usado nesta página; reavaliar se ainda tem uso em outro lugar do projeto ou se deve ser removido (fora do escopo desta spec, mas registrado como achado).

### 1.3 `impact`: `highlights` com `{value, label}` em vez de `{title, description}`

Figma mostra exatamente 3 blocos (`col-highlight-subscriptions`, `-score`, `-base`), cada um com um número grande + legenda curta — mesmo padrão de `highlights` já usado no `CaseCard` da Home (`{value, label}`), não o `{title, description}` do schema atual.

```ts
impact: z
  .object({
    highlights: z.array(z.object({ value: z.string(), label: z.string() })),
    description: z.string(),
  })
  .optional(),
```

Reaproveita `highlightSchema`? Não — é uma estrutura diferente (`{value,label}` vs `{title,description}`), então vira um schema próprio (ou reaproveita o mesmo `z.object({ value: z.string(), label: z.string() })` já usado no campo raiz `highlights` do card da Home, movido para um schema compartilhado).

### 1.4 `context`, `problems`, `delivery`, `plansAhead`: sem mudança estrutural

Comparados com o Figma real, esses 4 blocos já batem com o schema atual:
- `context`: `{description, image, caption}` ✓ (Figma: `desc-context` + `col-img-context` com 2 filhos — imagem + legenda)
- `problems`: `{description}` ✓ (Figma: só `desc-problems`, sem imagem)
- `delivery`: `{myRole, designSystem, home}` ✓ (Figma: `col-myrole`, `col-ds`, `row-home` — mesma tripla, `designSystem`/`home` com imagens opcionais)
- `plansAhead`: `{privacy, pains}` ✓ (Figma: `col-privacy`, `col-pains` — mesma dupla)

## 2. Componentes novos

Um componente por seção de conteúdo, seguindo o padrão já estabelecido na Home (`src/components/sections/`):

- **`CaseHeader.astro`**: breadcrumb (`clickable-link-internal-previous-page-title` "Início" / `non-clickable-active-page-title` com o título do case) + linha de tags (reaproveita `Tag`) + `h1` com o título + data de publicação (ícone calendário + `published-case-date`) + tempo de leitura (ícone relógio + `estimated-time`), replicando `row-date-reading-time` (node `222:1178`).
- **`SideMenu.astro`**: título "NESTA PÁGINA" + lista de 7 âncoras (Resumo, Contexto, Problema & Desafios, Discovery, Delivery, Impacto, Visão de futuro) + botão "voltar" ao final (`clickable-link-internal-home`, ícone + label, componente `Button`). `position: sticky`, já que no Figma o `divider` vertical ao lado ocupa a altura inteira do conteúdo (8605px) enquanto a caixa do menu (`col-side-menu`) mede só 732px, ficando fixa perto do topo enquanto o resto rola. Contém o `<script>` de scroll-spy (seção 3).
- **`CaseSummary.astro`**: 3 colunas (Challenge/Solution/Results).
- **`CaseContext.astro`**, **`CaseProblems.astro`**: texto (+ imagem no caso de Context).
- **`CaseDiscovery.astro`**: intro, timeline de 4 fases (marcador visual + título/subtítulo/descrição por fase), exploration (título+descrição+imagens), pd (idem), tests (intro + 4 grupos com imagens + outro), consolidation (título+descrição) — tudo interno a este componente, não desmembrado em sub-componentes (só aparecem juntos, nesta ordem fixa, dentro de Discovery).
- **`CaseDelivery.astro`**: myRole, designSystem (com imagens opcionais), home (com imagens opcionais).
- **`CaseImpact.astro`**: 3 números de destaque + descrição.
- **`CasePlansAhead.astro`**: privacy, pains.
- **`BackToTopButton.astro`** (ou inline na página, ainda a decidir no plano): botão fixo/near o final do conteúdo (`clickable-anchor-backtotop`, node `222:1065`).

**Reaproveitados sem alteração** (estrutura idêntica confirmada no Figma): `Header`, `Footer`, `Divider`, `Tag`, `Button`.

`src/pages/cases/[slug].astro` vira um arquivo de composição fino (mesmo padrão de `index.astro`), delegando toda a renderização real aos componentes acima.

## 3. Menu lateral e scroll-spy

7 âncoras, na ordem do conteúdo: Resumo (`#resumo`), Contexto (`#context`), Problema & Desafios (`#problems-challenges`), Discovery (`#strategy-solutions` — nome do node no Figma, mantido como id da âncora por consistência com `design-notes.md`), Delivery (`#myrole`), Impacto (`#impact`), Visão de futuro (`#plans-ahead`).

**Decisão confirmada com o usuário:** o primeiro item do menu, nomeado `clickable-active-anchor-point-example` no Figma (com uma nota em `design-notes.md` dizendo "ao clicar, não fazer nada"), é a âncora do Resumo — funciona como uma âncora normal, clicável e participando do scroll-spy. A nota do design-notes descrevia o exemplo visual do estado "ativo" do componente, não uma restrição funcional real. `design-notes.md` deve ser atualizado para refletir isso (ver seção "Riscos e pontos em aberto").

**Scroll-spy via `IntersectionObserver`** (aprovado entre as 3 opções avaliadas — ver histórico de brainstorming desta spec): um `<script>` em `SideMenu.astro` observa cada `<section>` de conteúdo (via seus `id`s) e alterna uma classe `active` no link correspondente do menu quando a seção cruza um threshold do viewport. Sem scroll-event listener, sem necessidade de throttle manual, sem framework/hidratação — consistente com a ausência total de JS client-side no projeto até agora (Home V1 é 100% estático) e com o requisito de performance (PRD 6.1).

## 4. Fluxo de dados

Idêntico ao padrão já usado em `[slug].astro`: `getStaticPaths()` carrega `getCollection('cases')`, gera uma rota por entrada, passa `entry.data` como props tipadas. Cada seção só renderiza se o campo opcional correspondente existir em `content.*` — mesmo padrão condicional já usado no skeleton atual (`{data.content.x && <ComponenteX data={...} />}`).

## 5. Assets e conteúdo real

- **Ícones novos a baixar** (mesma regra da Home — bytes reais do Figma, nunca redesenhados): calendário (`ic-out-calendar`), relógio (`ic-out-time`), e o(s) ícone(s) do botão de voltar do menu lateral e do botão "voltar ao topo".
- **Imagens**: Context (1), Discovery/exploration (2), Discovery/pd (2), Discovery/tests (4 grupos × 3 = 12), Delivery/designSystem (2), Delivery/home (2) — todas via `astro:assets` `<Image />` (fotos/capturas de tela reais, não SVGs decorativos).
- **Conteúdo textual real**: todo o corpo de texto (descrições de cada bloco, títulos das 4 fases da timeline, títulos/legendas do Challenge-Solution-Results, etc.) precisa ser extraído do Figma nó a nó durante a implementação — não replicado nesta spec (mesmo padrão da Home: a spec fixa estrutura, o plano/implementação extrai o texto real). Já confirmados nesta spec: os 7 títulos de seção (Resumo, Contexto, "Problema & Desafios", Discovery, Delivery, Impacto, "Visão de futuro"), o texto de `desc-intro-discovery`, os 3 highlights de impacto (`+24k`/"Assinantes pagantes", `3.4 → 4.7`/"Nota na loja", `2x`/"Base ativa dobrou"), os 4 nomes dos grupos de teste (Boas-vindas, Login, Home screen, Antivírus) e o título "NESTA PÁGINA" do menu.
- Ao publicar: `redesign.yaml` muda `status: coming-soon` → `published`, `content.summary` migra pro novo formato estruturado (seção 1.1), e `CasesPreview.astro` passa a fornecer `href="/cases/redesign"` só para esse case (os outros 2 continuam sem `href`, sem CTA).

## Riscos e pontos em aberto

- `jornada-pagamentos.yaml` e `gosafe-ds.yaml` têm `content.summary` como string simples hoje — precisam migrar pro novo formato estruturado (mesmo sem conteúdo real ainda) só para o schema continuar válido, já que o campo é obrigatório.
- `TestResultBadge` (componente já existente) não é usado nesta página — a estrutura real de `tests` é comparativo de imagens, não badges de status. Avaliar separadamente se o componente ainda serve pra outro propósito ou deve ser removido.
- O label real do botão "voltar" no rodapé do menu lateral (`clickable-link-internal-home`, node `222:366`) ainda não foi extraído — só a estrutura (ícone + label) foi confirmada. Extrair o texto exato durante a implementação.
- `design-notes.md` tem uma entrada (`clickable-active-anchor-point-example`) com a nota "ao clicar, não fazer nada", que diverge da decisão desta spec (é a âncora real do Resumo). Atualizar a entrada durante a implementação pra refletir o comportamento real.
- Nomes de id de âncora (`#strategy-solutions` pro Discovery, `#myrole` pro Delivery) preservam a nomenclatura já usada em `design-notes.md`/`[slug].astro` mesmo divergindo do título visível da seção (Discovery/Delivery) — mantido por consistência com o que já está documentado, não por corresponder ao texto exibido.
