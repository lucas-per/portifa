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

## Escala de forma (UaiUI)

Decisão fechada em 2026-10-16. Vale para o site e para tudo que entrar nele (ferramentas incluídas), e é a base da UaiUI.

| Elemento | Espessura |
|---|---|
| Dividers | 3px e 5px |
| Bordas de campos, painéis, cards e tags | 2px |
| Bordas de botões | 3px |
| Sombras duras, sem blur | 3px e 5px |

O site já segue a escala. Exceções que não são forma e ficam fora dela: o anel de foco (`outline` de 2px) e marcadores pontuais, como a faixa de aviso dos tons do Color Decomposer.

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

### clickable-link-external-github
**Contexto:** botão que permite ao usuário ver meu perfil no GitHub (footer, desktop `438:328` e mobile `438:510`)
**Decisão:** ao clicar, o usuário é levado para uma nova aba contendo meu perfil no GitHub → https://github.com/lucas-per. Ordem dos botões no footer, nos dois breakpoints: E-mail → LinkedIn → GitHub → Baixar CV
**Motivo:** facilitar que o usuário possa ver meu código e projetos

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

**Texto curto no mobile (2026-09-14, Figma node 275:1148):** no mobile, esse botão divide a linha (`row-btn-top`) com "Voltar" — o texto completo "Ir para o topo" foi trocado por "Topo" só aí (via CSS, `@media (max-width: 767px)`, duas `<span>` alternadas por `display`), mantendo "Ir para o topo" no desktop (instância própria, sem par ao lado) e o mesmo `aria-label="Ir para o topo da página"` nos dois — texto visível curto, nome acessível completo. `Button.astro` ganhou a prop `ariaLabel` pra isso (sobrescreve o nome acessível quando o slot visível é abreviado).
**Espaçamento (`row-btn-top`):** `justify-content: space-between` entre "Voltar" e "Topo/Ir para o topo" (Figma), não um gap fixo — o espaço do meio é o que sobra da linha. `gap: var(--scale-x2)` continua declarado, mas como **piso mínimo** (o comportamento padrão de `gap` + `space-between` no CSS): some na prática quando sobra espaço normal, e só passa a valer quando a fonte do sistema/zoom aumenta numa tela estreita a ponto de o espaço sobrando quase zerar — sem ele os dois botões chegavam a se tocar (testado a 150% em 360px). `flex-wrap: wrap` é a última rede de segurança: se nem esse piso couber lado a lado, "Topo" quebra pra uma segunda linha em vez de colar em "Voltar".

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

**Correção adicional (2026-09-14) — WCAG 1.4.4/1.4.10, texto sobrepondo sob fonte ampliada:** `.case-card__highlight-value` tinha `min-width: 68px` herdado do Figma (medida do valor no tamanho de fonte padrão). Com a fonte do sistema/zoom do navegador a 200%, esse piso fica menor que o `min-content` real do texto ("+15%", "+20%", "-60%") e o item encolhe abaixo do próprio conteúdo, vazando visualmente por cima do label ao lado (nenhum `overflow: hidden` na árvore corta o texto — ele só sobrepõe). Trocado `min-width: 68px` por `flex-shrink: 0` (o valor nunca encolhe abaixo do seu tamanho natural) + `flex-wrap: wrap` em `.case-card__highlight` (se valor+label não couberem lado a lado, o label quebra pra linha de baixo em vez de sobrepor). Testado com Playwright (`html { font-size: 200% }`, desktop 1440px e mobile 375px) via `scrollWidth`/`clientWidth`/`getBoundingClientRect()` de cada filho — sem overflow em nenhuma combinação. Ver playbook, seção 11.

### col-case-content
**Contexto:** área de conteúdo do case (fundo cinza, `--surface-bg-neutral-subtle`), à direita do menu lateral — contém todas as seções (Resumo, Contexto, Discovery etc.) e o botão "Ir para o topo"
**Decisão (diverge do Figma atual — pendente de atualizar lá):** o fundo cinza se estende até encostar na faixa vermelha (`divider-trail`, 7px) e no footer, sem o respiro off-white que hoje existe no Figma entre o fim do botão "Ir para o topo" e o footer. A faixa vermelha aparece no desktop e no mobile (em 2026-10-12 deixou de ficar oculta no desktop, seguindo o Figma 452:938)
**Motivo:** decisão de design tomada diretamente em código — o respiro off-white no meio quebrava a continuidade visual da página sem agregar nada
**Ação pendente:** atualizar essa camada no Figma pra remover o respiro off-white antes do footer, mantendo a fonte de design sincronizada com o código

### logo-reduced — header mobile em telas muito estreitas (2026-09-14)
**Contexto:** header mobile (`HeaderMobile.astro`, row-cta node 236:1784) — logo + botão de contato lado a lado, `justify-content: space-between`. Padding/gap do header são em `rem`, então crescem junto com a fonte do sistema/acessibilidade, apertando o espaço entre logo e botão em telas estreitas até correr risco de cortar um dos dois.
**Decisão:** terceira variante de logo criada no Figma — `logo-reduced` (node 412:335, só a marca amarela "LP", sem o nome) — substitui `logo-mobile` via `@media (max-width: 360px)` (dois `<img>`, alternados por `display: none`/`inline-flex`, mesmo `alt="Lucas Pereira"` nos dois). Acima de 360px continua a logo mobile completa.
**Motivo:** dar mais respiro ao layout sem quebrar a linha do header nem adicionar JS — aprovado como aproximação fixa por largura de tela, não uma detecção real de zoom/fonte (que exigiria JS pra medir o espaço disponível de verdade). 360px foi o valor sugerido e usado como está; o projeto não tinha nenhum breakpoint já definido nesse intervalo.
**Verificação:** Playwright em larguras 320–767px — a troca acontece exatamente em 360/361px, sem overlap entre logo e botão em nenhuma delas.

**Resize das 3 logos (2026-09-14):** `logo-reduced`, `logo-mobile` (node 299:383) e `logo-desktop` (node 299:412) foram ajustadas no Figma pra ficarem visualmente consistentes entre si — altura padrão 54px → 58px nas três, larguras acompanhando (`logo-reduced` 63×54 → 68×58; `logo-mobile` 156×54 → 156×58; `logo-desktop` 304×54 → 304×58). Reexportados os 3 SVGs e atualizados os `width`/`height` em `Header.astro` e `HeaderMobile.astro`. Como `.site-header__inner` e `.site-header-mobile__core` já usam `align-items: center`, a troca de altura recentralizou sozinha contra o botão de contato ao lado — nenhum CSS de alinhamento precisou mudar (confirmado via Playwright: diferença de centro vertical = 0px em desktop, mobile completo e mobile reduzido).

**Ajuste fino de largura (mesmo dia):** nova rodada no Figma mexeu só em `logo-mobile` (156×58 → 160×58) e `logo-desktop` (304×58 → 308×58) — altura manteve 58px, `logo-reduced` não mudou. Reexportado e atualizado só o `width` dos dois `<img>`. Sem overlap com o botão de contato nem desalinhamento em nenhum breakpoint testado (320–1440px, incluindo a faixa 360/361px onde a logo reduzida entra em cena).

### Sincronização desktop de 2026-10-12 — case Jornada de Pagamentos e ajustes globais

Origem: frame `desktop-case-pagamentos` (452:216) + mudanças recentes do Figma desktop. O Figma prevaleceu sobre qualquer descrição em texto. No mobile só entraram os dividers e o que decorre das regras globais abaixo; os frames mobile do Figma estão desatualizados e não foram usados como referência.

- **Tokens:** `bg/primary → bg/secondary`, `bg/complementary → bg/quaternary`, `green/2` (`--green-200`), coleções `primitive`/`semantic` no singular. Os primitivos amarelos (`yellow-50/100/400/700`) e o cinza claro (`neutral-50`) mudaram de **valor**, não só de nome (o fundo do site inteiro fica mais amarelado — aprovado). Novos semânticos: `surface-bg-neutral-extra`, `surface-bg-accent-subtle`, `surface-bg-accent-medium` (+ primitivos `accent-50`/`accent-100`).
- **Divisores:** `Divider` padrão e divisor vertical do menu lateral em 3px. O divider logo abaixo do header fica **oculto** em todas as páginas (Home e cases); em vez dele o header (desktop e mobile) tem borda inferior de 5px `border-accent-strong`. O footer perdeu o `border-top`. A faixa vermelha de 7px antes do footer (`divider-trail`) aparece no desktop e no mobile dos cases, como no Figma (452:938).
- **Bordas:** cards e imagens passam a 2px. Exceções que seguem o Figma: botões, marcadores da timeline e `TestResultBadge` em 3px; as telas de celular do Delivery estão com stroke de 1px no Figma, mas a decisão do projeto é **2px**, igual às demais imagens.
- **Home:** ordem Pagamentos → Redesign → DS; cards com `neutral/extra` e sombra accent quando publicados; wraps de botão `clickable-link-internal-case-payments|redesign`; Skills com fundo `secondary/subtle`, colunas `neutral/extra` e título de Colaboração em `accent/medium`; "Sobre mim" com fundo `accent/subtle`, gap de 44px e o texto "+15% no número de transações envolvendo boletos". O divider antes do "Sobre mim" agora é de largura total (antes 196px contido).
- **Tags:** o card da Home mostra menos tags que o cabeçalho do case (Figma). Campo opcional `cardTags` no schema; sem ele usa `tags`.
- **Case Pagamentos:** schema ampliado sem quebrar o Redesign (`myRole`, `discoveryTopics`, `deliveryFlows`, `problems.hypothesisCard/risksIntro`, `plansAhead.paragraphs`). Trechos em negrito do Figma viram `**texto**` no YAML (`utils/inline-markup.ts`, escapa todo o resto). "Meu papel" é seção própria, sem divider entre ela e o Contexto, e fora do menu lateral.
- **Imagens:** `optimizedImages: true` no YAML faz o case usar `<Picture>` (AVIF + WebP, 1x e 2x, PNG de fallback) via `ui/CaseImage.astro`. O Redesign mantém `<Image>` simples de propósito. PNGs originais em 720×1600 (telas) e maiores nas duas imagens de contexto/mapeamento.
- **Data de publicação:** é a do dia em que o case vai para a `main`; o `2026-10-12` do YAML é provisório até o merge.
- **Divider duplo antes do "Ir para o topo":** dois dividers de 156px com 20px entre si e 64px de espaço acima e abaixo, nos dois cases. Vale o do Pagamentos; o frame do Redesign no Figma ainda tem gap de 32px entre os dois (e 38px de altura) e precisa ser alinhado ao Pagamentos.

### Sincronização de footer e versão de 2026-10-14

Origem: componente `footer-desktop` (91:581) e texto do copyright (88:720).

- **Fundo:** o footer (desktop e mobile) passa de `off-white/primary` para `tertiary/subtle`. O mobile segue o desktop de propósito: o frame mobile do Figma está desatualizado e ainda mostra o fundo antigo.
- **Versão:** o copyright vira "© 2026 Lucas Pereira · v.1.0.1", em maiúsculas como no Figma (`text-transform: uppercase`, igual ao desktop e ao mobile). O formato "v." com ponto vem do Figma. A fonte única é o `version` do `package.json`, lido em `src/config/version.ts` (`siteVersion`) no build; `resolveJsonModule` já vem ligado no `astro/tsconfigs/strict`, então o import tipa sem configuração extra.
- **Regra de versão (semver manual, a cada PR que vai para a main):** patch para correções e ajustes de texto, minor para seções ou cases novos, major para redesign. A versão inicial é 1.0.1.
### Sincronização de textos de 2026-10-14 — cards da Home, título do case e "Sobre mim"

Origem: frame `desktop-home` (31:690), nó do "Sobre mim" (31:735) e `desktop-case-pagamentos` (452:216).

- **Título do case de pagamentos:** "Jornada de Pagamentos" virou "Área de pagamentos" (card, h1, breadcrumb e `<title>`, todos vindos do YAML). O slug segue `/cases/jornada-pagamentos`. O Figma tem três grafias (card "Área de Pagamentos", h2 "Área de pagamentos", breadcrumb "ÁREA de pagamentos"); o código usa só a do h2, e o `uppercase` do CSS cobre o breadcrumb e o h1.
- **Cards da Home:** `shortDescription` agora aceita `**negrito**` e o `CaseCard` renderiza com `inlineMarkup`, como o Figma (SemiBold em "+15%", "+20%", "novo modelo de negócio" e "base de pagantes"). As metatags (`description`, `og:description`, `twitter:description`) usam `stripInlineMarkup`, sem os asteriscos.
- **Dados da empresa:** os cards não citam mais "mais de 100 mil usuários" nem "24 mil". O "Sobre mim" também não cita "24 mil". Os números que aparecem no corpo do case do Redesign ficam para outra tarefa.
- **"Sobre mim":** duas frases novas (EXA e Serasa) e negritos do Figma em "11 anos", "de 3,6 para 4,7", "60%", "+15%" e "+20%".
### Sincronização de paleta de 2026-10-14 — primitivos espelham o Figma

Origem: coleção `primitive` do Figma (`VM0MVYSWiDbznuPZFRyArB`) e frames `desktop-home` (31:690) e `desktop-case-pagamentos` (452:216). O Figma prevaleceu.

- **Primitivos renomeados:** `--grey-1…9`, `--purple-1…9`, `--blue-1…9`, `--red-1…9`, `--yellow-1…9`, `--green-1…6`, `--pink-1…5` (rosa sem uso em semânticos). Os nomes antigos (`--neutral-*`, `--primary-*`, `--accent-*`, `--red-900` etc.) foram removidos; nenhum componente os referenciava, só os semânticos. `--neutral-50-transparent` virou `--grey-1-transparent`. `--neutral-100` (fill solto do avatar, sem variable no Figma) virou `--avatar-frame-beige`, para renomear quando a variable existir.
- **Semânticos:** 52 valores mudaram e 15 tokens novos foram declarados: `text-body-accent-strong`, `surface-bg-off-white-extra`, `surface-bg-secondary-medium`, `surface-bg-tertiary-medium`, `icon-primary`, `button-bg-accent-filled-{hovered,pressed}`, `button-bg-accent-outline-{hovered,pressed}`, `button-bg-primary-filled-{regular,hovered}`, `button-bg-primary-outline-hovered`, `button-border-accent-{subtle,medium}` e `button-border-primary-subtle`. Os de hover e pressed só foram declarados: o hover dos botões segue sendo o deslocamento da sombra.
- **`border-focus-strong`** (anel de foco, sem equivalente no Figma) aponta para `red/6`. Contraste de 4,84 a 5,10:1 sobre os fundos onde o anel aparece.
- **Fundos alinhados ao Figma:** Hero e "Sobre mim" sem fundo próprio (usam o off-white da página), Skills com `accent/subtle` e colunas do Skills com `off-white/primary`.
- **Contraste (WCAG AA):** `blue/5` sobre `yellow/1` dá 4,47:1. Texto accent abaixo de 18,66px bold usa `text-body-accent-strong` (`blue/6`, 6,48:1): "Início" do breadcrumb (desktop e mobile) e labels dos botões accent no mobile (16px). Os labels de 20px bold do desktop seguem em `blue/5` (texto grande, mínimo 3:1). Para replicar no Figma, ver a descrição do PR.
- **Divergências conhecidas, mantidas:** bordas abaixo de 3:1 (`blue/4` nos botões e no header, `grey/3` no `TestResultBadge`). O "Início" do breadcrumb passou a azul também no desktop (Figma 452:222), mas em `blue/6` e não em `blue/5`, pelo mesmo motivo de contraste.

### Seta "→" dos destaques de Impacto — subset da Plus Jakarta Sans de 2026-10-14

- **Causa:** `plus-jakarta-sans-variable.woff2` é um subset (a faixa `latin` do Google, 229 caracteres) e não tinha U+2192. O navegador desenhava só a seta com uma fonte do sistema, mais fina e com a cabeça menor que a do Figma. A fonte completa (v2.071, `google/fonts`, `ofl/plusjakartasans`) tem a seta; só o recorte a excluía.
- **Correção:** o arquivo foi regerado a partir da fonte completa com os 229 caracteres anteriores mais U+2192 e U+2190 (27.348 para 27.420 bytes, +72). Mesmos eixos (`wght` 200 a 800), mesmas features (`calt ccmp dnom frac liga locl numr pnum tnum kern mark`), mesmos nomes (inclusive a licença) e mesmos contornos em todos os pesos testados (400, 700 e 800).
- **Como regerar** (fonttools e brotli; `LISTA` = a `cmap` do arquivo atual, não a faixa `latin` pura, que difere em 16 caracteres):
  ```
  pyftsubset "PlusJakartaSans[wght].ttf" --unicodes="$LISTA,U+2190,U+2192" \
    --layout-features=calt,ccmp,dnom,frac,liga,locl,numr,pnum,tnum,kern,mark \
    --glyph-names --name-IDs=0,1,2,3,4,5,6,14,259,260,261,262,263,264,265,266,267,268 \
    --flavor=woff2 --output-file=plus-jakarta-sans-variable.woff2
  ```
- **Guarda:** `fonts.test.ts` falha se o arquivo perder →, ←, ×, ↑ ou ↓. Caractere novo que apareça em texto de título precisa entrar no subset; o navegador não avisa quando cai numa fonte do sistema.
- **Levantamento:** nas 4 páginas geradas, a seta era o único caractere fora do subset nas 3 fontes (Plus Jakarta Sans, DM Sans e JetBrains Mono).

### Página do Color Decomposer (`/ferramentas/color-decomposer/`) — 2026-10-16

Fase 1 da integração: a interface de `lucas-per/color-decomposer@v0.2.0` (`app/`) portada sem redesenho, com o motor como dependência (`github:lucas-per/color-decomposer#v0.2.0`). A partir daqui, a interface oficial é esta; o `app/` do repositório da ferramenta fica congelado. Spec: `docs/superpowers/specs/2026-10-16-color-decomposer-page-design.md`.

- **Tema derivado só na área da ferramenta:** fundo, texto e bordas saem dos neutros da cor escolhida e são aplicados no `.cd` (com `data-theme` e `color-scheme`), nunca no `<html>`. Cabeçalho, rodapé e o modo escuro do site não mudam. O CSS do app tem todo seletor prefixado por `.cd` (`src/styles/tools/color-decomposer.css`, garantido por teste).
- **Duas faixas de 5px, aceitas na fase 1:** a azul do cabeçalho do site e a do cabeçalho da ferramenta, na cor digitada. A segunda muda com a cor, então é comportamento da ferramenta.
- **Breakpoints diferentes:** a ferramenta vira coluna única em 900px; o site troca de cabeçalho em 767px. Entre 768 e 900px aparecem o cabeçalho desktop do site e o layout de celular da ferramenta. Unificar fica para a fase 2.
- **Celular:** a página tem `scroll-padding-top` igual à altura do cabeçalho sticky mais 8px, para os atalhos da Ajuda e o foco não pararem escondidos sob ele.
- **Umami:** só esta página usa `data-exclude-hash`, porque o estado da ferramenta mora no hash e muda a cada ajuste. Exportar, Copiar tudo e Baixar arquivo enviam eventos (`color-decomposer-exportar`, `-copiar-tudo`, `-baixar-arquivo`).
- **Onde o app diverge da escala de forma** (troca na fase 2, junto com os componentes do site):
  - sombras de 2 e 4px (`--shadow-comp`, `--shadow-comp-hover`, `--shadow-layout` e a sombra do aviso amarelo), em vez de 3 e 5px;
  - bordas de 2px nos botões (`.btn`, botão de copiar dos tons), em vez de 3px;
  - divisores de 2px (linha do painel de ajustes, "Ajustes avançados", linha das abas, seções e perguntas da Ajuda, "No modo …" dos detalhes), em vez de 3px.
  Campos, painéis, células da faixa e tags já estão em 2px, e a faixa do cabeçalho em 5px.
