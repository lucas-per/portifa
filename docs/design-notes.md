# Notas de design — referência por camada

Este documento existe para registrar a **intenção** por trás de decisões de design que não ficam óbvias só olhando a estrutura do Figma (nomes de camada, posição, tamanho). Cada entrada deve corresponder a uma camada nomeada de forma única no arquivo Figma do projeto.

Ao implementar no Claude Code, esse arquivo deve ser lido em conjunto com o design context extraído do Figma (nome da camada + screenshot + variáveis) — ele preenche o "porquê" que a estrutura visual sozinha não entrega.

---

## Como preencher cada entrada

```markdown
## [nome-exato-da-layer-no-figma]
**Contexto:** o que essa camada representa (onde fica, o que contém)
**Decisão/observação:** o que precisa ser levado em conta na implementação
**Motivo:** por que essa decisão foi tomada (omitir se for autoexplicativo)
```

**Regras práticas:**
- O nome da entrada (`## [...]`) deve ser **idêntico** ao nome da camada no Figma — é essa correspondência exata que permite cruzar as duas fontes
- Uma entrada por camada/decisão relevante — não precisa documentar tudo, só o que não seria óbvio pra quem só vê a estrutura
- Se uma decisão vale pra várias camadas (ex: um padrão repetido nos cards de case), documentar uma vez e referenciar as demais camadas na mesma entrada

---

## Breakpoints e comportamento responsivo

### Valores de referência

- **Mobile:** < 768px
- **Tablet:** 768px – 1440px
- **Desktop:** > 1440px

### Estrutura no Figma

Para seções onde o layout muda de forma significativa entre breakpoints (ex: grid de cases indo de múltiplas colunas para empilhado), usar **frames separados por breakpoint** (Desktop / Tablet / Mobile) em vez de depender só de nomenclatura — garante que o layout pretendido esteja de fato desenhado, não inferido.

### Convenção de nomenclatura (para comportamentos pontuais)

Para ajustes que não justificam um frame inteiro:

- `hidden-mobile-*` / `hidden-tablet-*` → elemento não aparece nesse breakpoint
- `stack-mobile-*` → indica que uma camada `row-*` se torna `col-*` nesse breakpoint (ex: `row-cases-selecionados` vira `stack-mobile-cases-selecionados`)

<!-- Adicionar novos prefixos responsivos aqui conforme surgirem no projeto -->

---

## Padrão de implementação — fidelidade estrutural ao Figma

Convenção geral, válida para toda a implementação (não é intenção de uma camada específica):

- **A hierarquia de containers no código deve espelhar a hierarquia de auto-layout do Figma** — cada `row-*`/`col-*`/`wrap-*` do Figma deve virar um elemento HTML correspondente na mesma posição da árvore, não ser "achatado" em divs genéricas reconstruídas de memória
- **Margens, paddings e gaps devem ser aplicados no elemento que os possui no Figma** — se o espaçamento pertence ao container pai (`padding`/`gap` do auto-layout), aplicar no container correspondente no código; não simular com `margin` em elementos filhos, mesmo que o resultado visual pareça igual à primeira vista
- **Motivo:** implementações que "adivinham" a estrutura, em vez de espelhar o Figma, tendem a parecer corretas isoladamente mas quebram de formas sutis quando o conteúdo muda (texto mais longo, mais itens, cards de alturas diferentes) — gerando retrabalho evitável

---

## Formatos de arquivo

### Imagem
Não converta imagens vetoriais, como um SVG, para um formato de bitmap, como PNG e JPEG.

---

## Arquitetura de tokens (Figma Variables)

As variables do Figma estão organizadas em duas collections, cada uma com grupos e subgrupos internos, nomenclatura já definida diretamente nas variables:

- **`primitives`** → valores brutos (ex: a cor em si, sem contexto de uso)
- **`semantics`** → contexto de onde o token é usado; pode referenciar tokens de `primitives` como alias

**Regra de dependência (mão única):** `semantics` pode usar `primitives` como alias. `primitives` **nunca** referencia `semantics`. Essa direção não pode ser invertida na implementação.

**Ordem de leitura na implementação:** ler `semantics` primeiro — já carrega o contexto de uso, que é o que orienta a nomenclatura abstrata do token no código (PRD, seção 6.5). Só descer até `primitives` para resolver o valor bruto final por trás do alias.

**Exceção — `line-height` e `list-spacing`:** nenhum dos dois pode ser vinculado a uma variable no Figma (no caso do `line-height`, porque o Figma não aceita porcentagem como tipo de variable). `list-spacing` é análogo ao `paragraph-spacing`, mas específico para espaçamento entre itens de lista. Ainda assim, tratar ambos como token na arquitetura de código — extrair o valor do node (via design context) e criar o token correspondente, mesmo sem uma variable de origem no Figma para referenciar.

**Escala de nomenclatura para `line-height` e `list-spacing`:**
- `none` → valor zero
- `compact` → menor valor diferente de zero encontrado no projeto
- `regular` → valor(es) intermediário(s)
- `comfortable` → maior valor diferente de zero encontrado no projeto

A escala é relativa ao conjunto de valores usados no próprio projeto, não a uma referência externa fixa — se só existirem dois valores diferentes de zero, usar `compact` (menor) e `comfortable` (maior), sem forçar um `regular` que não corresponda a nenhum valor real. Premissa que sustenta essa escala: cada tipografia tem no máximo 4 valores de `line-height`/`list-spacing` no total, então os 4 nomes sempre são suficientes para cobrir o conjunto sem ambiguidade.

## Convenções de nomenclatura de camadas

### Estrutura de alto nível (landmarks da página)

- `header` → topo da página; contém logo e navegação (equivalente a `<header>`)
- `main` → conteúdo principal da página, entre header e footer (equivalente a `<main>` — não usar "body", que em HTML se refere ao documento inteiro, incluindo header e footer)
- `footer` → rodapé da página (equivalente a `<footer>`)
- `section` → agrupamento de conteúdo dentro de main; cada página pode ter várias (equivalente a `<section>`)

Hierarquia completa: `header` / `footer` (fora de main) e, dentro de `main`: `section` → `row`/`col` (ver abaixo) → camadas de conteúdo/comportamento (`clickable-*`, `non-clickable-*`, `active-*`).

### Comportamento e layout

Prefixos/termos usados nos nomes das camadas que indicam comportamento, para evitar inferência ambígua na hora da implementação:

- `clickable-*` → elemento interativo (link ou botão); incluir estado de hover/focus
- `non-clickable-*` → texto/elemento estático, sem interação
- `active-*` → estado atual/selecionado (não implica necessariamente que seja clicável — depende do prefixo combinado, ex: `non-clickable-active-page-title`)
- `wrap-*` → envolve um filho único, sem implicar organização entre irmãos (ex: para aplicar padding/background/dimensionamento). Não usar "container" — em CSS moderno o termo colide com `container-type`/container queries, o que gera ambiguidade se o projeto vier a usar essa técnica de responsividade
- `row-*` → indica que os filhos dessa camada são organizados lado a lado, horizontalmente (equivalente a `flex-direction: row` / `flex-row` no Tailwind)
- `col-*` → indica que os filhos dessa camada são organizados empilhados, verticalmente (equivalente a `flex-direction: column` / `flex-col` no Tailwind)

### Tipos de clicável

Sub-tipo de `clickable-*`, indicando a natureza do link/ação — não o destino exato (o destino vai na entrada correspondente em "Entradas", não no nome da camada, já que muda com mais frequência que o tipo):

- `clickable-link-internal-*` → navega para outra página/rota do próprio site
- `clickable-link-external-*` → sai do site (abre em nova aba por padrão)
- `clickable-download-*` → dispara download de arquivo (ex: CV)
- `clickable-anchor-*` → rola até uma seção na mesma página (ex: menu → #contato)
- `clickable-mailto-*` → abre cliente de e-mail

### Hierarquia de texto

- `h1-*`, `h2-*`, `h3-*` → indica o nível semântico do heading (equivalente direto a `<h1>`, `<h2>`, `<h3>` etc.)
- Não confundir com tamanho/peso visual da fonte — o nível indica hierarquia semântica de documento, não estilo. Um `h2-*` pode ser visualmente menor que um `h3-*` se o design pedir, mas a tag no código deve seguir o nível indicado no nome
- Manter a hierarquia sem pular níveis na página (não ir de `h1` direto pra `h3`), para não comprometer acessibilidade

<!-- Adicionar novos prefixos aqui conforme surgirem no projeto -->

---

## Padrão de interação — botões

Convenção geral, válida para todo `clickable-*` do tipo botão (não é intenção de uma camada específica — é regra de comportamento do projeto inteiro, coerente com a direção neo-brutalista da seção 7 do PRD):

- **Transition:** rápida e direta — `0.1s`, `ease`. Sem enrolação, sem easing suave/orgânico
- **Hover:** o botão "levanta" — desloca na direção oposta à sombra (ex: `translate(-2px, -2px)`), sombra permanece
- **Active:** o botão "afunda" — desloca na direção da sombra (ex: `translate(1px, 1px)`), sombra some, simulando o clique físico
- **Focus-visible:** outline separado do `box-shadow` do botão, com `outline-offset`, em cor de contraste distinta do resto da paleta (não reaproveitar a cor da sombra/borda) — garante visibilidade de foco por teclado sem se confundir com o estado padrão

**Nota de acessibilidade:** os valores literais de cor do CSS de referência (preto puro, `#000`) não devem ser usados como estão — seguir os tokens em OKLCH já definidos, respeitando a restrição de não usar preto/branco absolutos (PRD, seção 6.2).

---

## Entradas

<!--
Exemplo (baseado no PRD do site pessoal):

## card-case-resultado-destaque
**Contexto:** número de impacto dentro do card de case (ex: -57%)
**Decisão:** peso tipográfico deve ser visivelmente mais pesado que o resto do card
**Motivo:** é o dado mais persuasivo do case, não pode competir com o resto da hierarquia

## hero-cta-download-cv
**Contexto:** botão de download do CV, visível no topo da página
**Decisão:** deve ficar sempre visível (sticky ou fixo), não só na primeira dobra
**Motivo:** requisito do PRD (seção 4.4) — acesso ao CV não pode depender de rolar a página
-->

<!-- Adicione suas entradas reais abaixo desta linha -->

### clickable-title-site
**Contexto:** logotipo do website
**Decisão:** ao clicar, o usuário deve ser levado para página inicial/home
**Motivo:** facilitar a navegação do usuário por todo o site

### clickable-anchor-aboutme
**Contexto:** botão que dispara o scroll automático para a respectiva posição na página inicial/home
**Decisão:** ao clicar, disparar o scroll vertical automático, mostrando ao usuário a "section-about-me" (página inicial/home)
**Motivo:** facilitar a navegação do usuário por todo o site

### clickable-mailto-header
**Contexto:** botão que abre o cliente de e-mail padrão do usuário
**Decisão:** ao clicar, abre o cliente de e-mail padrão do usuário, com o e-mail para contato já preenchido → oi@lpereira.me
**Motivo:** facilitar o contato por parte do usuário

### clickable-mailto-footer
**Contexto:** botão que abre o cliente de e-mail padrão do usuário
**Decisão:** ao clicar, abre o cliente de e-mail padrão do usuário, com o e-mail para contato já preenchido → oi@lpereira.me
**Motivo:** facilitar o contato por parte do usuário

### clickable-download-cv
**Contexto:** botão que permite ao usuário baixar (download) o arquivo de currículo
**Decisão:** ao clicar, baixa (download) o arquivo PDF que contém o meu currículo para o dispositivo da pessoa
**Motivo:** facilitar que o usuário possa ver meu perfil profissional completo

### clickable-link-external-linkedin
**Contexto:** botão que permite ao usuário ver meu perfil profissional no LinkedIn
**Decisão:** ao clicar, o usuário é levado para uma nova aba contendo meu perfil professional no linkedin → https://www.linkedin.com/in/lucasvalimpereira/
**Motivo:** facilitar que o usuário possa ver meu perfil professional completo

### section-side-menu
**Contexto:** menu lateral dedicado a navegação, contendo botões que levam para posições específicas na mesma página, ou que permitam que o usuário volte para a página anterior
**Decisão:** o menu deve ficar fixo na lateral esquerda, não dependendo da rolagem da seção que contém o case
**Motivo:** facilitar a navegação do usuário por todo o case

### clickable-active-anchor-point-example
**Contexto:** primeiro item do menu lateral do case — referencia a seção "Resumo", mostrando o estilo do estado "ativo" (âncora atualmente em foco no scroll-spy)
**Decisão:** funciona como âncora normal, igual às demais `clickable-inactive-anchor-*` — clicável e participa do scroll-spy (implementado via `IntersectionObserver` em `SideMenu.astro`). O nome "example" na camada do Figma descrevia o exemplo visual do estado ativo, não uma restrição funcional
**Motivo:** facilitar a navegação do usuário por todo o case; confirmado com o usuário durante o brainstorming da spec `2026-09-09-case-detail-visual-design.md`

### clickable-inactive-anchor-context
**Contexto:** botão que dispara o scroll automático para a respectiva posição no case
**Decisão:** ao clicar, disparar o scroll vertical automático apenas na "section-case", mostrando ao usuário a "col-context"
**Motivo:** facilitar a navegação do usuário por todo o case

### clickable-inactive-anchor-problems-challenges
**Contexto:** botão que dispara o scroll automático para a respectiva posição no case
**Decisão:** ao clicar, disparar o scroll vertical automático apenas na "section-case", mostrando ao usuário a "col-problems-challenges"
**Motivo:** facilitar a navegação do usuário por todo o case

### clickable-inactive-anchor-strategy-solutions
**Contexto:** botão que dispara o scroll automático para a respectiva posição no case
**Decisão:** ao clicar, disparar o scroll vertical automático apenas na "section-case", mostrando ao usuário a "col-strategy-solutions"
**Motivo:** facilitar a navegação do usuário por todo o case

### clickable-inactive-anchor-myrole
**Contexto:** botão que dispara o scroll automático para a respectiva posição no case
**Decisão:** ao clicar, disparar o scroll vertical automático apenas na "section-case", mostrando ao usuário a "col-myrole"
**Motivo:** facilitar a navegação do usuário por todo o case

### clickable-inactive-anchor-impact
**Contexto:** botão que dispara o scroll automático para a respectiva posição no case
**Decisão:** ao clicar, disparar o scroll vertical automático apenas na "section-case", mostrando ao usuário a "col-impact"
**Motivo:** facilitar a navegação do usuário por todo o case

### clickable-inactive-anchor-plans-ahead
**Contexto:** botão que dispara o scroll automático para a respectiva posição no case
**Decisão:** ao clicar, disparar o scroll vertical automático apenas na "section-case", mostrando ao usuário a "col-plans-ahead"
**Motivo:** facilitar a navegação do usuário por todo o case

### clickable-link-internal-home
**Contexto:** link interno que referencia a página anterior, no caso, a de início (home/página inicial)
**Decisão:** ao clicar, deve levar o usuário para a página em questão (no caso, a home/página inicial)
**Motivo:** facilitar a navegação do usuário por todo o site

### clickable-link-internal-previous-page-title
**Contexto:** link interno que referencia a página anterior, no caso, a de início (home/página inicial)
**Decisão:** ao clicar, deve levar o usuário para a página em questão (no caso, a home/página inicial)
**Motivo:** facilitar a navegação do usuário por todo o site

### clickable-link-internal-previous-page-title — cor/underline no breadcrumb mobile
**Contexto:** estilo do breadcrumb do case no mobile (<768px, node 275:426) — "Início" (link) e o título da página atual, lado a lado
**Decisão (diverge do Figma atual — pendente de corrigir lá):** o destaque azul + underline vai no link clicável ("Início"), não no título da página atual. O Figma mobile tinha isso invertido (underline/azul no `non-clickable-active-page-title`, "Início" em cinza neutro)
**Motivo:** confirmado com o usuário — texto não-clicável estilizado como link (e o link de fato clicável sem nenhuma affordance) confunde a expectativa padrão de breadcrumb; o link deve parecer link
**Ação pendente:** corrigir a cor/underline no Figma (mover do item ativo pro link "Início")

### published-case-date
**Contexto:** data em que o case foi publicado na internet
**Decisão:** ao incluir um case novo no site, trazer a data em que foi publicado
**Motivo:** a pessoa que estiver lendo pode ver se o case foi atualizado recentemente, ou não

### estimated-time
**Contexto:** tempo estimado para leitura do case
**Decisão:** ler a seção 4.2 do PRD, e aplicar a fórmula para tempo estimado de leitura
**Motivo:** a pessoa poder estimar o tamanho do case através do tempo de leitura

### clickable-anchor-backtotop
**Contexto:** atalho para o usuário voltar rapidamente para o início da página
**Decisão:** ao clicar no botão/link, o usuário deve ser levado para o topo da página
**Motivo:** facilitar a navegação do usuário por todo o case

### clickable-row-accordion-sections
**Contexto:** container clicável que possibilita ver a lista de opções do componente accordion
**Decisão:** ao clicar, a lista de opções do accordion se expande mostrando todas as opções selecionáveis
**Motivo:** facilitar a navegação do usuário por todo o case quando estiver usando celular

### clickable-row-accordion-sections — conteúdo expandido (mobile)
**Contexto:** lista de âncoras que aparece dentro do accordion quando expandido (case, mobile <768px) — equivalente mobile do SideMenu desktop
**Decisão:** a lista expandida mostra só as 7 âncoras de seção (Resumo, Contexto, Problema & Desafios, Discovery, Delivery, Impacto, Visão de futuro), sem o botão "Voltar" que existe no SideMenu desktop
**Motivo:** a instância do accordion capturada via `get_design_context` (node 299:673) tinha o container `col-menu-list-items` vazio (sem conteúdo autoral), então não deu pra confirmar via Figma; a altura documentada nesse container (442px) bate com as 7 âncoras sozinhas, sem sobrar espaço pro botão — e o breadcrumb "Início" no topo da página já cobre a navegação de volta. Confirmado com o usuário durante a implementação do breakpoint mobile (2026-09-11)
**Ação pendente:** se o Figma vier a autorar esse conteúdo, revisar essa decisão

### row-results-payments
**Contexto:** bloco de destaques/métricas de resultado (ex: "+15% Boletos pagos") dentro do card de case na Home — usado tanto no card "Pagamentos" (2 métricas) quanto no "GoSafe DS" (1 métrica)
**Decisão (resolvida — Figma atualizado, nodes 174:304/174:307/174:311):** o Figma confirmou o empilhamento vertical das métricas (uma por linha, full-width, `border-bottom` entre elas — exatamente a solução adotada abaixo pra evitar o overflow). A única correção necessária foi *dentro* de cada métrica: valor e label ficam lado a lado (`flex-direction: row`, `align-items: center`, `gap: 8px`), não mais empilhados um sobre o outro como na primeira implementação
**Motivo:** cada métrica ocupar 100% da largura do card evita o overflow de texto quando há 2+ métricas (resolvido antes desta atualização); o valor e o label lado a lado é só o arranjo interno de cada linha, sem relação com o problema de overflow

### col-case-content
**Contexto:** área de conteúdo do case (fundo cinza, `--surface-bg-neutral-subtle`), à direita do menu lateral — contém todas as seções (Resumo, Contexto, Discovery etc.) e o botão "Ir para o topo"
**Decisão (diverge do Figma atual — pendente de atualizar lá):** o fundo cinza se estende até encostar no footer, sem o respiro off-white que hoje existe no Figma entre o fim do botão "Ir para o topo" e o footer
**Motivo:** decisão de design tomada diretamente em código — o respiro off-white no meio quebrava a continuidade visual da página sem agregar nada
**Ação pendente:** atualizar essa camada no Figma pra remover o respiro off-white antes do footer, mantendo a fonte de design sincronizada com o código
