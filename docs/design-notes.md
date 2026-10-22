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

## Escala de forma do site

Decisão fechada em 2026-10-16. Vale para o site e para tudo que entrar nele (ferramentas incluídas). *(Até 2026-10-21 esta seção se chamava "Escala de forma (UaiUI)" e dizia ser a base da UaiUI. O pacote `uaiui-ds` ficou com a escala própria, 2 e 4px, e na área do DS vale a dele; ver a seção "UaiUI — PR A". A unificação dos tokens fica para depois.)*

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

### Página do Color Decomposer (hoje Paletaria, `/projetos/paletaria/`) — 2026-10-16

A rota era `/ferramentas/color-decomposer/`, passou a `/projetos/decomposer/` em 2026-10-19 e, no mesmo dia, a `/projetos/paletaria/` (a ferramenta agora se chama Paletaria, ver a seção da PR 5) ("ferramentas" e "projetos" são a mesma coisa no PRD; o termo é "projetos"). A rota antiga não redireciona e deixou de existir: como o site não tem `404.html`, a Cloudflare Pages serve a home (status 200) para qualquer endereço inexistente, a antiga inclusive.

Fase 1 da integração: a interface de `lucas-per/color-decomposer@v0.2.0` (`app/`) portada sem redesenho, com o motor como dependência (`github:lucas-per/color-decomposer#v0.2.0`). A partir daqui, a interface oficial é esta; o `app/` do repositório da ferramenta fica congelado. Spec: `docs/superpowers/specs/2026-10-16-color-decomposer-page-design.md`.

- **Tema derivado só na área da ferramenta:** fundo, texto e bordas saem dos neutros da cor escolhida e são aplicados no `.cd` (com `data-theme` e `color-scheme`), nunca no `<html>`. Cabeçalho, rodapé e o modo escuro do site não mudam. O CSS do app tem todo seletor prefixado por `.cd` (`src/styles/tools/color-decomposer.css`, garantido por teste).
- **Divider colorido do cabeçalho da ferramenta removido (2026-10-17):** sobra só a faixa azul do cabeçalho do site. O espaço do título até o conteúdo é 24px (16 + 8). `--band` continua declarado e definido por `chrome.js`, mas nada o usa. A Ajuda não tinha divider sob o título.
- **Breakpoints diferentes:** a ferramenta vira coluna única em 900px; o site troca de cabeçalho em 767px. Entre 768 e 900px aparecem o cabeçalho desktop do site e o layout de celular da ferramenta. Unificar fica para a fase 2.
- **Celular:** a página tem `scroll-padding-top` igual à altura do cabeçalho sticky mais 8px, para os atalhos da Ajuda e o foco não pararem escondidos sob ele.
- **Exceção de tipografia (decisão do Lucas, 2026-10-16):** os títulos da ferramenta usam **DM Sans**, não Plus Jakarta Sans. Vale para tudo que usa `--font-title` dentro do `.cd`: nome da ferramenta, "Ajustes", títulos dos detalhes, do diálogo e da Ajuda, os "Aa" dos tons e da amostra e os números do guia rápido. É como o app desenhava na prática (ele não pré-carregava a Plus Jakarta Sans e, com `font-display: optional`, caía na DM Sans). Os pesos 700 e 800 pedidos pelo CSS saem como 600, o máximo declarado no `@font-face` do site, sem negrito sintético, igual ao app. Fora do `.cd` nada muda. Guarda: `color-decomposer.test.ts`. *(Atualizado na PR 4: só o título da página, "Ajustes" e "Paletas" passam à Plus Jakarta Sans; o resto continua em DM Sans, como aqui.)*
- **Umami:** só esta página usa `data-exclude-hash`, porque o estado da ferramenta mora no hash e muda a cada ajuste. Exportar, Copiar tudo e Baixar arquivo enviam eventos (`color-decomposer-exportar`, `-copiar-tudo`, `-baixar-arquivo`).
- **Onde o app diverge da escala de forma** (troca na fase 2, junto com os componentes do site):
  - sombras de 2 e 4px (`--shadow-comp`, `--shadow-comp-hover`, `--shadow-layout` e a sombra do aviso amarelo), em vez de 3 e 5px;
  - bordas de 2px nos botões (`.btn`, botão de copiar dos tons), em vez de 3px;
  - divisores de 2px (linha do painel de ajustes, "Ajustes avançados", linha das abas, seções e perguntas da Ajuda, "No modo …" dos detalhes), em vez de 3px.
  Campos, painéis, células da faixa e tags já estão em 2px.

**Polimento da página (2026-10-17), divergências do app v0.2.0:**
- **Rodapé:** o `divider-trail` (7px, `surface-bg-tertiary-strong`) passou das páginas (home e cases) para `Footer.astro` e `FooterMobile.astro`, e vale em todas as páginas, inclusive a da ferramenta. Home e cases ficam idênticas.
- **Botões ghost (`.btn--quiet`):** sem padding lateral nem borda, para o texto alinhar com a borda do conteúdo; altura mínima de 44px com padding vertical de 8px. Sem fundo e sem sublinhado fixo (o app sublinhava sempre). Hover muda a cor (de `--fg` para `--muted`, só em `@media (hover: hover)`); pressed e aberto (`aria-expanded`/`aria-pressed`) sublinham; foco com contorno de 2px e `outline-offset` de 2px. Mesmo padrão do `HeaderLink`. O botão de copiar do código da Ajuda deixou de ter 36px de altura.
- **"Fechar detalhes":** no canto superior direito, também no celular (o app empilhava abaixo). A ordem no DOM não mudou. Desde 2026-10-17 alinhado pelo topo ao título (o texto no topo do alvo de 44px, sem margem negativa), e a linha do título passou a ter 44px de altura.
- **Painel de detalhes, copiar (2026-10-17):** o botão "Copiar" virou botão de ícone de 44x44px, ao lado do código (colunas comuns às três linhas: amostra, texto, botão; `.values` em grade). No celular (até 767px) o botão vai para a borda direita do painel (em 320px o rótulo "Texto sobre a superfície" quebra em duas linhas). Ícones novos, no estilo dos do site (24x24, cantos retos, `currentColor`): copiar (dois quadrados) e confirmação; o nome acessível segue `Copiar superfície #FF64A5` e o aviso falado `Copiado: #FF64A5` (`role="status"`, no `#live`); por 1,5s o ícone vira o de confirmação. Hover só em `@media (hover: hover)`. O botão de copiar dos tons da faixa (`.swatch__copy`) e o "Copiar" do código da Ajuda continuam como eram.

**Comportamento da ferramenta (2026-10-17), divergências do app v0.2.0:**
- **Intensidade:** o número ao lado do rótulo é o valor real. Se o valor pedido passa do máximo da cor, o controle só encaixa no real ao soltar (evento `change`), não durante o arraste; o aviso continua depois do encaixe, até a próxima mudança, num `role="status"`. No teclado cada seta dispara `input` e `change`: acima do máximo o controle volta ao máximo a cada passo.
- **Auto e Cor viva:** indisponíveis ficam com `aria-disabled="true"` (e não `disabled`), continuam no foco do teclado e do leitor de tela, e não executam a ação. O motivo aparece em texto abaixo dos botões, ligado por `aria-describedby` (`auto-why`, `vivid-why`). Textos em `strings.js` (`tune.autoSupport` a `tune.vividSame`).
- Desfazer o Auto continua pelo Redefinir ou trocando a cor; um Auto reversível fica para depois.

**Mini paleta (2026-10-17), Figma `hexrow-new` (608:231):** quatro tons mais claros, o seletor de cor (44px de toque, amostra de 32px) e quatro mais escuros, tudo num bloco que ocupa a largura que sobra ao lado do campo de HEX (164px em 268px de linha). As faixas usam `flex: 1`; os 13,75 e 14,25px do Figma são resultado de layout. Divergências:
- Campo de HEX com 96px (6rem), não 98px, para seguir os múltiplos de 4; o bloco continua com 164px.
- Os 8 tons vêm dos níveis da paleta menos o da marca (que é o seletor); no Aplica, 8 espaçados por igual. A marcação amarela dos tons parecidos continua sob a faixa (decisão do Lucas, 2026-10-17), agora sob os 8 tons mostrados e sob o seletor, na ordem em que se vê; o frame novo não a desenha.
- Cor de apoio (o Figma não desenha): uma amostra decorativa (`aria-hidden`) de 32x44px, no mesmo desenho do seletor (borda de 2px, amostra interna de 20x32px), logo à direita dele; as faixas encolhem para abrir espaço.
- O seletor da cor de apoio e o da principal passam a ter a amostra de 32px (antes 34px); sai a exceção `padding: 3px` do `KNOWN_EXCEPTIONS`.

### Regras do sistema — 2026-10-17

- **Múltiplos de 4:** espaçamento e dimensões que definimos (`padding`, `margin`, `gap`, `width`, `height`, `min-` e `max-`) são múltiplos de 4px (em rem, de 0,25rem), exceto 0, 1 e 2. Fora da regra: a escala de forma (bordas de 2 e 3px, dividers e sombras de 3 e 5px), tipografia e dimensões que vêm do conteúdo. `calc()`, `clamp()`, `min()` e `max()` não são avaliados. Guarda: `src/styles/spacing-scale.test.ts`.
  - Dividers de 3px são exceção **por classe** (`SHAPE_CLASSES` no teste): `site-footer__divider-line`, `site-footer-mobile__divider-line`, `case-accordion__divider`, `case-discovery__timeline-line` e `case-layout__divider`.
  - **`KNOWN_EXCEPTIONS`** (no teste) guarda as violações que já existiam; só encolhe, porque uma exceção que passa a seguir a regra faz o teste falhar. Hoje são 28: 4 vêm do Figma (`HeaderLink` 0.875rem = size/scale-x3_5, sem token; menu lateral 234px; miniatura de 107px do tópico de descoberta; miolo do case com 977px, que fecha os 1440px do frame) e 24 vêm do app do Color Decomposer, que migram na fase 2. Com a nova estrutura da ferramenta (2026-10-19) caíram para 11: as 4 do Figma e 7 do app (o espaço de 10px na marca, que o Figma desktop também usa; a margem do erro do campo; os avisos; o diálogo de exportação).
- **Divisores da ferramenta:** `--edge` (chrome.js) é o primeiro neutro com pelo menos 3,2 para 1 contra o fundo **e** contra o painel, como o `--muted`. Antes só contava o fundo e, no Padrão claro, o contraste sobre o painel chegava a 2,84. A amostra de cor do painel de detalhes usa `--edge` na borda, não mais a borda do tom (`--b`). Guarda: `chrome.test.ts`.

### Color Decomposer — nova estrutura, PR 1 (estrutura e visual) — 2026-10-19

Figma `Decomposer / Paleta / Claro / 1440` (609:258) e `/ 360 — Nível 100 aberto` (610:2300). A lógica de cor não muda: os ajustes que saíram usavam os mesmos valores que o motor tem por padrão.

**Decisões do Lucas (respostas ao plano):**
- O preset `aplica` aparece como **Alternativo** no alternador e na Ajuda. Ficam as menções ao **Aplica Design System** como origem das regras (Ajuda, rodapé da ferramenta, formato "Tokens do Aplica" da exportação) e a seção "Para devs", que fala do motor (o id do preset continua `aplica`).
- **Cor do texto** tem só duas opções (Preto ou branco, Tom da cor) e fica no painel de detalhes; vale para todos os tons. A "Cor própria" saiu. *(Substituído na PR 8: o seletor vira o toggle "Texto com tom da cor".)*
- **Ajustes básicos e avançados saíram do site** (ordem do texto, preto ou branco a partir do nível, saturação do escuro, distâncias da borda, falha de contraste, neutros próprios, token `txt`). Um endereço antigo com eles abre no padrão. Saiu também o **Redefinir**.
- **Contraste mínimo** é um alternador AA/AAA ao lado de Modo de cor.
- **Painel de detalhes:** título, amostra com a tag do nível alcançado (`AA (4,5:1)`, `AAA (7,2:1)`, `Abaixo do AA (3,2:1)`, com vírgula), Cor do texto e os três valores com copiar. Saíram a nota "Sua cor, sem alteração.", o veredito em texto e a linha "No modo escuro". O veredito completo continua no nome acessível de cada linha.
- **Textos que deixaram de existir:** ajuda do campo de HEX, "Tons bem separados." e o status da mini paleta, os motivos do Auto e da Cor viva (os novos chegam na PR 2), o aviso de tons parecidos (a marcação amarela sob a mini paleta continua), a nota da escala e o "Saiba mais".
- **Larguras:** três colunas a partir de 1280px (Ajustes até 368px, divisor de 2px, lista de 392px e detalhe no que sobra, 390px em 1440). De 901 a 1279px, Ajustes em cima (até 368px) e lista e detalhe lado a lado. Até 900px, uma coluna com o detalhe em accordion.
- **Sliders:** 44px de altura (alvo de toque) também no computador, com os 24px do Figma entre eles; nenhum espaçamento novo.
- **Exportar tokens** igual ao do celular (borda e sombra de 2px, 44px) nos dois tamanhos. *(Posição substituída na PR 3: o botão fica abaixo da lista; ver a seção da PR 3.)*
- **Cor de apoio:** nesta PR sai só a interface. A lógica, o estado da URL e os textos dela saem na PR 2.

**Implementação:**
- **Lista de níveis em todos os tamanhos.** Linhas de 60px: o tom em 56px dentro da borda de 2px. No Figma a borda fica por dentro, sobre o padding de 2px, então no CSS há só a borda; 9 níveis dão 524px. O botão de copiar (44px, borda de 2px na cor do texto do tom) fica sempre visível. *(Substituído na PR 6: o item tem 64px e 9 níveis dão 560px; ver a seção da PR 6.)*
- **Computador:** a lista é um `radiogroup` (setas escolhem, Tab entra no nível ativo e no copiar dele). O painel fica sempre aberto, no nível da cor principal quando não há escolha (no meio da escala em Neutros e Cinzas). Esc não fecha e não há "Fechar detalhes". O painel está num subgrid na linha da lista e tem a altura dela (524px); Exportar fica no topo da coluna. *(Substituído na PR 3: o painel continua na linha da lista, mas o Exportar não fica mais no topo da coluna; fica abaixo da lista.)*
- **Seta do detalhe:** `::before` e `::after` da linha escolhida (pseudo-elementos sem texto não chegam à árvore de acessibilidade, então são decorativos sem `aria-hidden`). Tem 28x56px, contorno de 2px em `--fg` e miolo na cor do tom, recuado 2,83px nos lados inclinados. Começa na borda direita da linha e deixa 28px dos 56 até o painel. Em `forced-colors`, o contorno fica em CanvasText e o miolo em Canvas. *(Substituída na PR 6: a seta vira a ponta de uma forma contínua com o item, 64x28px.)*
- **Celular:** cada linha é um botão com `aria-expanded` e `aria-controls="detail"`. O painel abre logo abaixo dela; tocar na linha aberta, "Fechar detalhes" ou Esc fecham e devolvem o foco à linha. As setas só movem o foco. Em 320px a tag "Sua cor" passa para cima do código em vez de estourar a largura.
- **Mini paleta:** 208x44px, com 4 tons, o anel e 4 tons. O anel tem 36x36px, borda de 1px e a cor em 28x28px (o nível da cor principal no modo atual). O bloco é só imagem (`aria-hidden`) e o seletor de cor nativo saiu com os handlers. Campo de HEX com 152px no computador e 112px no celular (o que sobra da linha).
- **Ícone de copiar único** (o do Figma, 24px, `currentColor`) nas linhas e no painel, em botões de 44px sem sombra; por 1,5s vira o de confirmação. O "Copiar" em texto dos blocos de código da Ajuda não é ícone e não mudou.
- **Auto e Cor viva:** mesmo botão (`.btn--sm`, 36px, decisão de design), alinhados à direita, opacidade de 0,5 quando indisponíveis, com `aria-disabled`. Depois do Auto, o resultado é anunciado no `#live`: "Auto aplicado. Sua cor está no nível N."
- **"Refinar cor principal" e "Paletas"** abrem e fecham, com o chevron do site (`case/chevron-down.svg`, porque o `icon/chevron-up` do Figma veio vazio na exportação), para cima quando aberto. Os dois têm o chevron também no celular (o frame 360 não desenha o de "Refinar"). "Paletas" é um botão com `aria-expanded`; fechado, esconde sistema de níveis, abas, lista e detalhe, e Exportar continua. Os títulos "Ajustes" e "Paletas" têm 44px de altura (alvo do botão), não os 28 do Figma. *(Substituído na PR 3 no computador: "Paletas" não abre e fecha a partir de 901px; o colapso e o chevron valem só no celular.)*
- **Divergências do Figma:** os alternadores têm 44px (o Figma tem 40, com a borda por dentro) e, para o painel caber nos 524px, o título do detalhe tem altura de linha 1. Os textos de ajuda usam altura de linha 1,3 (o Figma usa 1), porque o aviso da Intensidade ocupa várias linhas. O título da ferramenta continua em DM Sans (600), como no frame 360.
- **Cabeçalho da ferramenta:** 48px acima e 44px abaixo no computador, 20 e 16 no celular. O conteúdo vai até 1264px (82rem com 24px de margem), o que dá os 88px do frame em 1440. O botão Ajuda já existia; mudou só o tamanho (16px no computador, 14px no celular).
- **Umami:** nenhum evento saiu; continuam exportar, copiar-tudo e baixar-arquivo.
- **Escala de 4:** nenhuma exceção nova; 16 do app saíram de `KNOWN_EXCEPTIONS`.

### Color Decomposer — PR 2 (comportamento) — 2026-10-19

**Decisões do Lucas:**
- **Manter minha cor exata** (switch, `role="switch"`, desligado por padrão) verifica em que nível a cor digitada cai (o de claridade mais próxima, `suggestBrandLevel` do motor), a fixa lá, exata, e gera o resto da paleta pelas regras. É o que o Auto antigo fazia. Substitui a cor de apoio, que saiu com a lógica, o estado da URL, os textos e os testes. O anel da mini paleta, a tag "Sua cor", a lista e o painel de detalhes (com a seta) vão para esse nível. Texto dinâmico: "Desligado: sua cor está no nível 100." e "Ligado: sua cor está no nível {N}." (no modo escuro, o nível espelhado). *(A tag "Sua cor" saiu na PR 6; o anel da mini paleta e o nome acessível seguem.)* *(Substituída na PR 8: o "Manter minha cor exata" saiu; a cor principal fica sempre no nível 100.)*
- **Auto** é um botão (ação única) que sugere uma cor principal próxima da digitada quando ela gera tons parecidos. A cor sugerida substitui a digitada no campo, no nível 100. Indisponível (`aria-disabled`, motivo visível por `aria-describedby`):
  - com o switch ligado: "Indisponível com 'Manter minha cor exata' ligado."; *(Substituído na PR 8: o motivo "Indisponível com..." saiu; o Auto só fica indisponível sem tons parecidos.)*
  - sem tons parecidos: "Disponível quando sua cor gera tons parecidos.".
  Ao desligar o switch, o Auto volta a seguir só a regra dos tons parecidos.
- **Cor viva** saiu inteira: botão, estado, opção `vividChroma`, textos, FAQ e os tokens do alternador ligado (`--on-fg`, `--fg-hover`, `--fg-pressed` e os pares `on-`, em `chrome.js` e no CSS).
- **"Usar sua cor no estado normal"** saiu: os níveis de Comportamento são sempre os do preset, com ou sem o switch.
- **Endereços antigos:** `lvl=…` (o Auto antigo) liga o switch; `support`, `normal` e `vivid` são ignorados.

**Implementação:**
- **Busca do Auto** (`auto.js`, fora do motor, que segue em v0.2.0 sem release): candidatas com o mesmo matiz, claridade até 0,5 para cada lado em passos de 0,005 e intensidade de 100% a 40% da original, testadas em ordem de distância perceptual (ΔE OK). Vale a primeira cuja paleta no nível 100 não tem tons parecidos em nenhum dos dois modos. Na amostra de 146 cores com o problema (dois presets), sempre acha, com ΔE até 0,22 e em até ~75ms; roda só no clique. Exemplo: #FCFBF2 vira #CECDC6. A disponibilidade segue os tons parecidos do modo à vista (a marcação amarela). Guarda: `auto.test.ts`.
- Depois do Auto, o foco fica no botão (agora indisponível) e o `#live` anuncia "Auto: sua cor principal ficou #XXXXXX.". Se nenhuma candidata servir, anuncia "Não achamos uma cor próxima sem tons parecidos." (não aconteceu na amostra).
- **Contraste mínimo:** linha de ajuda em `role="status"` (`aria-live="polite"`), ligada ao alternador por `aria-describedby`: "AA: contraste de 4,5 para 1 ou mais." e "AAA: contraste de 7 para 1 ou mais." (frases das opções do antigo select, "AA: 4,5 para 1" e "AAA: 7 para 1", no formato do Figma). As linhas de status só se reescrevem quando o texto muda.
- **Mini paleta:** o anel fica na posição do nível da cor na escala; as faixas dividem os 168px na proporção dos tons de cada lado, e um lado sem tons some (cor no primeiro ou no último nível).
- **Escolhas visuais sem desenho no Figma:**
  - switch ligado: a trilha preenchida em `--fg` e o polegar de 12px à direita, em `--bg`; em `forced-colors`, Highlight e HighlightText;
  - motivo do Auto: linha de ajuda (12px, JetBrains, maiúsculas, `--muted`), alinhada à direita sob o botão, escondida quando vazia.
- O switch segue o Figma: rótulo à esquerda (15px), trilha de 44x24 à direita, polegar de 12px a 4px da borda interna; a linha inteira é o alvo, com 44px de altura.
- Na Ajuda, "Para devs" continua citando `vividChroma` e `anchors` entre as extensões do motor, porque elas existem no pacote.

### Color Decomposer — PR 3 (layout do computador) — 2026-10-19

Figma `Decomposer / Paleta / Claro / 1440 — Proposta: lista e detalhe alinhados` (642:963), que prevalece sobre o 609:258. Vale de 901px em diante (de 901 a 1279px, com Ajustes em cima). O celular não muda. Sem mudança na lógica de cor, nos textos nem nos eventos do Umami.

- **Exportar tokens abaixo da lista** (substitui "Exportar fica no topo da coluna", da PR 1): na coluna da lista (392px), 44px de altura, borda e sombra de 2px, 32px depois da lista (16px de padding do Figma mais 16px de gap). É a linha 6 do grid da paleta, só na coluna da lista, e o painel não se estica para incluí-lo. Com avisos de contraste, o botão fica 32px depois do aviso (o Figma não os desenha). O botão vem depois do corpo no DOM: a ordem é lista, painel e Exportar, no computador e no celular (WCAG 2.4.3).
- **Abas na largura da lista:** as três menores dividem o espaço em partes iguais (`flex: 1 1 0`) e "Comportamento" fica com a largura do conteúdo (`flex: none`). A linha de baixo não mudou.
- **Painel alinhado à lista:** o topo é o da lista e a altura, a dela (524px com 9 níveis, 1104px no Alternativo), sem altura fixa. **Decisão do Lucas, aba Comportamento** (6 níveis, lista de 350px): o conteúdo do painel precisa de cerca de 522px, então a altura mínima do painel é a do conteúdo. Nessa aba o painel passa da lista, a linha do grid cresce e o Exportar fica 32px depois do fim da linha (204px depois da lista), na coluna da lista. O Figma só desenha a aba Paleta. A seta continua centralizada no nível, com 28px até o painel. *(Substituído na PR 6: 560px com 9 níveis; a decisão da aba Comportamento continua.)* *(Na aba Comportamento, no computador, o Exportar passou a ficar na linha do painel, com a base na dele; ver a PR 9.)*
- **"Paletas" no computador** (substitui "abre e fecha", da PR 1): título estático, sem chevron. No celular continua o botão com chevron, `aria-expanded` e `aria-controls`. O `<h2>` tem os dois filhos (o botão e um `<span>`), e o CSS mostra um por breakpoint; o escondido fica em `display: none`, fora do foco e da árvore de acessibilidade. O colapso é estado do JS (`stageOpen`) e só vale no celular (`hidden = estreito && fechado`): fechar no celular e alargar a janela mostra o conteúdo aberto, e ao estreitar de novo o estado fechado volta.
- **Observação (já existia na `main`):** em 901px exatos há 41px de rolagem horizontal, vinda do cabeçalho do site (nenhum elemento da ferramenta passa da largura). Não tratada aqui.
- **Escala de 4:** nenhuma exceção nova; só valores já usados.

### Color Decomposer — PR 4 (título, subtítulos e cor inicial) — 2026-10-19

Figma `Decomposer / Paleta / Claro / 1440 — Proposta: lista e detalhe alinhados` (642:963). O celular segue os mesmos estilos em tamanho de celular, como os títulos do site. Sem mudança na lógica de cor nem no Umami.

- **Título da página:** "COLOR DECOMPOSER" em caixa alta (`text-transform`; o texto do `<h1>` não muda), Plus Jakarta Sans 800, 36px, altura de linha 1,24, com a logo de 28x36px (as três barras de antes, agora com 36px de altura; mantive o SVG em linha com `currentColor`, em vez do arquivo do Figma com cor fixa, para seguir o tema claro e escuro). Celular: 32px e logo de 24x32px; até 380px, 24px e logo de 20x28px (em 320px, 32px quebra a palavra "DECOMPOSER"). O "Ajuda" fica à direita do título.
- **Subtítulo novo** (`top__lead`): "Gere paletas de cores acessíveis a partir de uma única cor, com contraste conferido nível por nível." DM Sans 20px, altura de linha 1,48, 24px abaixo do título (16px no celular, em 16px de fonte). O cabeçalho passa a ser uma grade: título e Ajuda na primeira linha, subtítulo na segunda.
- **"Ajustes" e "Paletas":** Plus Jakarta Sans 800, 32px, altura de linha 1,24, sem o chevron de "Paletas" no computador (já era assim). Celular: 24px em 700, como o h3 mobile do site; o botão de "Paletas" no celular tem o mesmo estilo e continua com 44px de alvo. As alturas dos títulos mudaram de 44px para 40px no computador, e o corpo das duas colunas continua alinhado (72px desde o topo do título).
- **Fonte (decisão do Lucas, 2026-10-19):** nova variável `--font-heading` (Plus Jakarta Sans), usada só por `.brand`, `.rail__title`, `.stage__label` e `.stage__toggle`. `--font-title` segue em DM Sans (título do painel, "Aa", diálogos e Ajuda). O teste `color-decomposer.test.ts` trocou "sem Plus Jakarta Sans" por "só nesses quatro seletores".
- **Rodapé da ferramenta removido:** o texto "Segue as regras de cor do Aplica Design System (engine 3.23.4). Projeto independente, sem vínculo com a Aplica." e o `<footer class="foot">` saíram, com o CSS dele. As menções ao Aplica Design System na Ajuda ficam.
- **Cor inicial:** `#057ABD` (o azul do site), no lugar de `#E7398A`, no estado padrão (`DEFAULTS.color`), no `placeholder` do campo e no exemplo do aviso de código inválido ("como #057ABD"). Um endereço com `#color=` continua valendo; o estado padrão (sem hash) é que muda. O Auto fica indisponível nessa cor (sem tons parecidos). Os exemplos em `#E7398A` da seção "Para devs" da Ajuda e o nome do arquivo de exportação não mudaram.
- **Escala de 4:** nenhuma exceção nova.

### Paletaria — PR 5 (nome novo e sem logo) — 2026-10-19

Figma `642:966` (marca da página): o nome da ferramenta passa de "Color Decomposer" para **Paletaria**. As seções anteriores deste arquivo ficam como foram escritas e usam o nome antigo; daqui em diante vale Paletaria. Sem mudança na lógica de cor.

- **Nome em todo texto visível** (decisão do Lucas): `<h1>` ("Paletaria", em caixa alta por CSS), `<title>` ("Paletaria: uma cor vira paleta, neutros e estados", que alimenta `og:title` e `twitter:title`), título da aba da Ajuda ("Ajuda · Paletaria") e o link do cabeçalho do site, que é "Paletaria" no computador e no celular (o rótulo curto passou a ser igual ao completo, então não há `aria-label` extra no celular).
- **Rota** `/projetos/paletaria/` (antes `/projetos/decomposer/`). A rota antiga não redireciona: a Cloudflare Pages serve a home para qualquer endereço inexistente.
- **Sem logo:** a marca de três barras saiu do título, com o CSS dela (`.brand__mark`). O `<h1>` é só texto. Como "PALETARIA" é bem mais curto que "COLOR DECOMPOSER", o título de 32px cabe em uma linha até em 320px, e a regra que o reduzia para 24px abaixo de 380px (PR 4) saiu.
- **Plugin do Figma:** as citações saíram, a pedido do Lucas (o plugin não será feito por enquanto). Saiu o formato de exportação "Variables do Figma (para o plugin)" do diálogo de exportar (restam Tokens do Aplica, Variáveis CSS e JSON completo), com o texto de ajuda dele, a pergunta "Como uso no Figma?" da Ajuda e a menção a "variables do Figma" no guia rápido. A função `toFigmaJson` continua no motor e na lista de funções da seção "Para devs". Para trazer o formato de volta, é só recolocar a opção no diálogo e o ramo `figma` em `exportFile` (`main.js`).
- **Não mudaram (internos):** os eventos do Umami (`color-decomposer-exportar`, `-copiar-tudo` e `-baixar-arquivo`), a pasta do componente `tools/color-decomposer`, o pacote do motor `color-decomposer`, a chave `color-decomposer` em `macroSections` (e a classe de clique derivada dela) e o nome do arquivo de exportação.
- **Escala de 4:** nenhuma exceção nova; saiu uma antiga (`gap: .625rem`, do `.brand`).


### Paletaria — PR 6 (item de nível novo) — 2026-10-20

Figma `642:963` (layout) e componente `swatch-row` (`648:1062`; variantes Padrão `614:484` e Selecionado `648:1051`). Vale no computador e no celular. Sem mudança na lógica de cor, nos textos (além da tag) nem no Umami.

- **Itens 1 a 4 só verificados** (já entregues na PR #35, "PR 3"): Exportar fica 32px abaixo da lista, as abas ocupam os 392px, o painel está na linha da lista e "Paletas" não colapsa no computador. Medidas em 1440, 1100 e 360px na descrição da PR. A aba Comportamento mantém a decisão da PR 3 (o painel pode passar da lista).
- **Item padrão:** 64px = borda de 2 + conteúdo de 60 + borda de 2, com os itens sobrepostos em 2px (9 níveis = 560px; a lista tinha 524px com linhas de 60px). Padding de 8px (cima e baixo) e 12px (lados), gap de 4px. Ordem: número (JetBrains Mono 700, 15px, 36px de largura), "Aa" (DM Sans 600, 20px) e o grupo da direita, com o texto (hex em cima e razão embaixo, DM Sans 400, 14px, à direita, `padding: 4px 0`, `space-between`, `white-space: nowrap`) e o botão de copiar de 44x44px. O copiar continua sendo um botão irmão do botão da linha (sem botão dentro de botão), sobreposto na mesma célula da grade; o botão da linha reserva 12px + 44px + 12px à direita.
- **Tag "Sua cor" removida** do HTML, do CSS (`.swatch__tag`, `.swatch__line`) e do JS. A string `yourColor` continua em `strings.js`, porque o nome acessível do nível da cor principal na paleta já termina em ", sua cor" (`aria-label` do botão da linha). **Decisão do Lucas:** texto "Sua cor" só para tecnologia assistiva, no nome acessível do item da cor principal, sem tag visível; por isso não houve `aria-current` nem `sr-only` novo. O equivalente visual é o anel da mini paleta de "Cor principal". Na aba Comportamento o nível-base também tinha a tag e o nome acessível dele nunca citou "sua cor" (o texto da linha é `aria-hidden`): o marcador visual saiu e o nome ficou como estava.
- **Selecionado, no computador: uma forma só.** Sem borda direita; a ponta sai do lado direito, com 64px de altura (de uma borda à outra) e 28px de avanço, e há 28px dela até o painel (56px de gap da coluna menos a ponta). Técnica: dois pseudo-elementos com `clip-path: polygon`, o de baixo na cor da borda e o de cima na cor do tom, recuado 2px de cada lado inclinado. Uma `border` comum não dá 2px visuais nas diagonais. O recuo horizontal da ponta interna é 2 x raiz(28² + 32²) / 32 = 2,66px (e não 2 x raiz de 2, que só vale a 45°); a diagonal interna cruza a linha de 2px em x = -0,91px. As duas camadas começam 2px dentro do item e se sobrepõem a ele, em vez de encostar: não aparece linha de emenda em 100%, 125% nem 200%. Decorativas (pseudo-elementos), sem clique nem foco, sem rolagem horizontal. O Figma exporta a ponta como um traço de 2px, de 27x62px no caminho central; com meio traço para cada lado o contorno externo tem 64px de altura e cerca de 28px de largura, e é essa a medida usada.
- **14px do selecionado:** sem número fixo. O padding direito é `calc(.75rem + var(--bw))` (12px mais os 2px da borda que sumiu), por uma variável local `--pr`, para o copiar alinhar com o dos outros itens.
- **Foco visível:** o aro agora é interno (`outline-offset: -6px`, na cor do texto do tom, que tem contraste com o tom), em todos os itens e tamanhos. O aro externo de antes cruzaria a ponta do selecionado, que é o item que quase sempre tem o foco no computador. O copiar mantém o aro externo de 2px. O aro não é cortado nem escondido pela ponta.
- **`forced-colors`:** `clip-path` com `background` perde as cores, então as camadas têm `forced-color-adjust: none`; o contorno do item selecionado (borda e ponta) vai para `Highlight`, o miolo segue a cor do tom (como o item), e as bordas dos outros itens ficam em `CanvasText`.
- **Celular:** o mesmo item padrão, sem ponta; o painel abre abaixo e a indicação de selecionado é a de antes (`aria-expanded`).
- **Escala de 4:** nenhuma exceção nova. Fora da regra por serem forma: os vértices do polígono (px dentro de `clip-path`).
- **Versão:** 1.1.5 para 1.1.6 (patch).

### Paletaria — PR 7 (copiar em todas as abas) — 2026-10-20

- **Bug:** em Comportamento e Cinzas as linhas não tinham o botão de copiar. A causa era `COPYABLE = ['palette', 'neutrals']` em `main.js`, que vinha da página original (não da PR 6): só as linhas dessas duas abas criavam o `.swatch__copy`. A PR 1 diz que o copiar "fica sempre visível" e o Figma tem um componente de item só (`swatch-row`), então o comportamento esperado é o mesmo nas 4 abas. *(Substitui, na PR 1, a leitura de que o copiar era só das abas Paleta e Neutros.)*
- **Correção:** `COPYABLE` saiu; toda linha de toda aba ganha o botão (44x44px, borda de 2px, ícone de 24px, mesmo `aria-label` por nível, mesmo `tabIndex` do item e a confirmação de 1,5s). Contagem medida: Paleta 9, Neutros 9, Comportamento 6 e Cinzas 9, em 1440 e 360px.
- **Ajuste que veio junto (Comportamento em 360px):** com o botão de copiar, "Pressionado" estourava a linha e empurrava o botão da última coluna para a direita. A grade do item passou a ter uma coluna `minmax(0, 1fr)` (o botão nunca se desloca), o nome do comportamento ficou em 14px, sem o recuo de 8px que eu tinha dado à esquerda, e quebra só quando não cabe (`overflow-wrap: anywhere`). Em 320px "Início da escala" e "Fim da escala" já quebravam em duas linhas e a linha cresce até 87px; nos outros tamanhos todas têm 64px.
- **Teste:** `markup.test.ts` confere que não há lista de abas com copiar e que nada condiciona a criação do botão.
- **Versão:** 1.1.6 para 1.1.7 (patch). Sem exceção nova em `KNOWN_EXCEPTIONS`.

### Paletaria — PR 8 (toggle "Texto com tom da cor" e fim do "Manter minha cor exata") — 2026-10-20

Figma `642:963` (desktop), `658:1650` (estados do toggle) e `610:2300` (celular). Os frames `609:258`, `612:270` e `615:498` ainda mostram o switch em Ajustes e estão desatualizados. Sem mudança no motor de cor nem no Umami.

- **"Manter minha cor exata" removido** (decisão do Lucas): o switch de Ajustes, a linha de ajuda dele, os textos "Ligado/Desligado: sua cor está no nível…", o motivo do Auto "Indisponível com…", o estado `exact` e as perguntas da Ajuda que o citavam. A cor principal fica sempre no nível base do sistema de níveis (100, no Padrão e no Alternativo); o Auto continua e muda a cor, e só fica indisponível quando não há tons parecidos. O texto da Ajuda sobre o botão de copiar agora diz "em todas as abas" (a PR 7 já era assim).
- **Links antigos:** `exact=` e `lvl=` são ignorados, sem erro e sem aviso (`parseHash` só lê as chaves de `DEFAULTS`). Quem abre um endereço com eles vê a cor principal no nível 100. Saíram também os ramos de booleano de `parseHash` e `serialize`, que só o `exact` usava.
- **Toggle no painel de detalhes** (substitui o seletor "Cor do texto", "Preto ou branco" / "Tom da cor", e o título dele): `<input type="checkbox" role="switch" name="strategy">` nativo, sem `aria-checked` à mão (o estado vem do `checked`, e o leitor de tela anuncia "ligado/desligado"; o foco volta ao toggle depois de refazer o painel). Desligado (padrão) é `high-contrast`, o antigo "Preto ou branco"; ligado é `brand-tint`. O parâmetro `strategy` da URL não mudou. O CSS `.switch*` foi reaproveitado (a linha inteira, com 44px, é o alvo). *(A posição mudou na PR 9: o toggle é o último bloco do painel, depois de Borda, como no Figma.)*
- **Cor da trilha ligada:** a superfície do primeiro nível de Comportamento (20 no Padrão) no claro e a do último (180) no escuro; o polegar fica na cor do texto sobre essa superfície (escura nos dois modos). O JS define `--on-bg` e `--on-fg` no `<label>`; sem elas o CSS cai em `--fg` e `--bg`. **Decisão do Lucas:** o espelhamento N ↔ 200 − N não vale literalmente no Alternativo, que tem 10 e 170 como primeiro e último nível de Comportamento: vale "primeiro no claro, último no escuro" (10 / 170, `#BCFFFF` e `#95E2FF`). O estado também aparece na posição do polegar, porque a trilha é muito clara; a borda de 2px em `--fg` tem 13:1 contra o painel nos dois modos. `forced-colors` continua com `Highlight` e `HighlightText`.
- **Altura do painel de detalhes** (para o Exportar na PR C): com a lista de 560px (Paleta, Neutros e Cinzas), o painel acompanha a lista, 560px. Na aba Comportamento (lista de 374px) vale a altura do conteúdo, 502px (era cerca de 522px com o seletor), contra 482px no Figma: a diferença de 20px vem do título do painel e dos espaços de 40px entre os blocos, que seguem os do restante do painel. *(Substituído na PR 9: com o toggle no fim e com 24px de altura, o painel de Comportamento tem 482px, como no Figma.)*
- **Escala de 4:** nenhuma exceção nova. `--on-bg` e `--on-fg` entraram na lista de variáveis de execução do `var-usage.test.ts`.
- **Abas e alternadores no nível 100** (nota do Figma 658:1650): ficam para a PR C.
- **Versão:** 1.1.7 para 1.1.8 (patch).

### Paletaria — PR 9 (cor ativa e Exportar em Comportamento) — 2026-10-20

Figma `642:963` (desktop), `658:1353` (aba Comportamento) e `610:2300` (celular). O cabeçalho do `658:1353` ("Color Decomposer", "Sobre mim") é herança do frame antigo e não foi implementado.

- **Cor ativa dos seletores e das abas:** a opção marcada dos seletores (Modo de cor, Contraste mínimo, Sistema de níveis) e a aba ativa usam como fundo o nível 100 de Comportamento, e como texto o par que o motor já calculou para ele (`--active-bg`, `--active-fg`, definidos em `chrome.js` a cada `update()`). No escuro o espelhado de 100 é o próprio 100, então vale a mesma chave. O texto acompanha o toggle "Texto com tom da cor". Antes era `--fg` sobre `--bg`.
- **Fallback de contraste:** (1) texto: se o texto do motor fica abaixo de 4,5 para 1 sobre a cor ativa (o motor avisa "Abaixo do AA"), vale o melhor entre `--bg`, `--fg` e preto ou branco, e um deles sempre passa de 4,5; (2) indicador: se a cor ativa tem menos de 3 para 1 contra `--bg` (cor principal muito clara no claro, ou muito escura no escuro), a raiz ganha `data-active-weak="1"` e a opção ou aba ativa ganha um contorno de 2px em `--fg`, por dentro (`inset box-shadow`), com 13 para 1. **Decisão do Lucas:** o contorno só entra nesse caso, não sempre. Nos demais, o sinal além da cor é o bloco preenchido contra o fundo transparente das outras opções. `forced-colors` continua com `Highlight` e `HighlightText`, e o foco não mudou. Cobertura: `chrome.test.ts` varre as cores de amostra, os dois sistemas de níveis e os dois modos.
- **Exportar tokens na aba Comportamento (desktop, a partir de 901px):** o botão vai para a linha da lista e do painel, na coluna da esquerda, com a base na do painel (`align-self: end`). A lista e os avisos ficam na mesma célula e o bloco ganha 76px (44 + 32) de reserva abaixo, então há pelo menos 32px entre a lista (ou os avisos) e o botão: com 6 níveis a lista tem 374px, o painel 482px e o botão fica a 64px da lista. Nas outras abas e no celular, nada mudou. Substitui a decisão da PR 3 para essa aba, em que o Exportar ficava 32px depois do fim do painel.
- **Sem reserva de espaço (decisão do Lucas):** a página encolhe ao entrar em Comportamento (cerca de 154px em 1440px: de 1364px para 1210px), sem medição por script. Alternativa só em CSS, para quem quiser evitar o encolhimento: empilhar os painéis das abas na mesma célula do grid e dar à linha a altura do maior.
- **Altura do painel de detalhes:** o toggle "Texto com tom da cor" passou a ser o último bloco do painel, depois de Borda (Figma 658:1353 e 642:963; na PR 8 ele ficava entre a amostra e os valores). A linha do toggle tem 24px (a trilha, como no Figma) e o alvo de 44px vem do `<input>` invisível, que avança 10px acima e abaixo sobre os espaços de 40px entre blocos. Resultado: 482px em Comportamento, como no Figma (era 502px); nas outras abas o painel continua com a altura da lista (560px).
- **Ordem do DOM e do Tab:** o botão Exportar vem antes do host do detalhe (e depois da lista e dos avisos), mantendo-se fora do corpo da paleta, que fecha com "Paletas" no celular. No celular o host do detalhe fica vazio (o detalhe abre dentro da lista), então a ordem de lá é a mesma. No desktop o Tab segue a coluna da esquerda e depois a do painel: lista, Exportar, valores copiáveis e o toggle.
- **Escala de 4:** nenhuma exceção nova (`inset: -.625rem` não é medida da regra).
- **Versão:** 1.1.8 para 1.1.9 (patch).

### UaiUI — PR A (shell da documentação e menu mobile) — 2026-10-21

Figma, página "UaiUI": `666:17` (desktop, página de Button, usada como referência do shell), `667:178` (mobile), `667:418` (menu lateral aberto no mobile) e `668:351` (notas); página "Prototype — Mobile": `676:3863` (menu aberto) e os componentes `254:1007` (header-mobile), `98:398` (header-desktop) e `676:514` (header-mobile-menu). Origem das páginas: o site de docs do `lucas-per/uaiui-ds` v0.2.0 (sem deploy), portado sem o `DocsLayout` próprio.

**Rota e conteúdo:** `/projetos/uaiui/` (Introdução) e `/projetos/uaiui/tokens/` (Tokens e temas). Accordion, Button e Toast entram na PR B, que depende desta. O menu lateral, a busca, o pager e a seção "Componentes" da Introdução saem de `src/config/uaiui-nav.ts` (porte do `nav.ts`), e só entra ali página que existe (teste). Grupo sem itens não aparece: "Componentes" some nesta PR e volta sozinho na PR B. Os caminhos já são os do site, então o `url.ts` (`withBase`) não foi portado. `Example.astro`, `PropsTable.astro` e `icons.ts` ficam para a PR B, junto com as páginas que os usam.

**Dependência:** `"uaiui-ds": "github:lucas-per/uaiui-ds#v0.2.0"` (repositório público; o pnpm baixa o tarball do codeload, como o `color-decomposer`). O pacote publica só CSS: `tokens-wrapper.css` (tudo sob `.uaiui`) e `components/{button,accordion,toast}.css`.

**Wrapper e escopo (decisões do Lucas):**
- A área do DS é `<div class="uaiui uaiui-docs">` dentro do `<main>`: `.uaiui` é o wrapper dos tokens do DS e `.uaiui-docs` é a classe do shell. Sem `data-uaiui-theme`: a área segue o tema do site, hoje sempre claro. O tema minimalista vem numa fase futura, com um botão que muda só a área do DS (ao lado de Densidade, nota do Figma).
- O CSS do DS entra só nas páginas do UaiUI: o `UaiuiDocsLayout.astro` importa `uaiui-ds/tokens-wrapper.css`, `uaiui-docs.css` e `uaiui-code-font.css`; o CSS de cada componente vai entrar na página dele. Conferido no build: home, cases e Paletaria não carregam CSS com `.uaiui`. Guarda: `uaiui-docs.test.ts` (só o layout e as páginas do UaiUI importam esses arquivos; o `BaseLayout` não cita o UaiUI).
- `src/styles/tools/uaiui-docs.css`: todo seletor começa por `.uaiui-docs`; os globais do site de docs do DS (`*`, `html`, `body`, `a`, `h1`–`h4`, `:focus-visible`) não vieram. Cores só por tokens do wrapper (`--ui-*`, `--interface-function-*`), sem cor fixa; fontes só por `var(--font-family-*)`. Guarda: `uaiui-docs.test.ts`. O `var-usage.test.ts` aceita os tokens do wrapper (lidos do pacote) só nos arquivos do UaiUI.
- O wrapper redeclara `--font-family-body` e `--font-family-label` com os mesmos valores do site (DM Sans e JetBrains Mono); não muda nada.
- **Tipografia:** a do site (Plus Jakarta Sans nos títulos, DM Sans no corpo, JetBrains Mono 700 nos rótulos). Os componentes do DS mantêm a tipografia e a densidade deles.
- **Cor de referência da marca UaiUI:** `#057ABD`, já nos tokens do DS.
- **Sombras:** na área do DS vale a escala do DS (2px nos componentes, 4px no layout: `--shadow-offset-component` e `--shadow-offset-layout`), não a escala de forma do site (3 e 5px). Faltavam dois valores da origem (6px no hover do card, 8px no diálogo de busca) e nenhum token novo foi criado: o diálogo usa `--shadow-offset-layout` (4px), pager e cards ficam fixos em 4px e o hover troca o fundo (`ghost-action`).
- **Foco:** dentro da área, o anel do DS (`--ui-focus-ring`, 2px e 2px de afastamento); no cabeçalho e no rodapé, o do site.

**Shell (Figma 666:17 e 667:178):**
- Bloco de título: "UAIUI" (Plus Jakarta Sans 800, 36px; 32px no celular) é um `<p>`, não título; o `<h1>` é o da página ("Introdução", "Tokens e temas"), que também dá o `<title>` ("Introdução · UaiUI"). Subtítulo do Figma 666:90. A partir de 1184px, busca e densidade ficam à direita do título; de 768 a 1183px, numa linha própria abaixo do subtítulo (a linha do Figma precisa de uns 880px).
- Colunas: menu lateral (240px), conteúdo (até 728px) e "Nesta página" (200px) a partir de 1280px; de 768 a 1279px, sem "Nesta página"; abaixo de 768px, uma coluna. Padding lateral de 88px a partir de 1184px (o mesmo ponto do logo completo do cabeçalho) e 20px abaixo.
- No celular, o menu lateral vira o botão "Páginas" (com a página atual), que abre a lista no lugar, sem sobrepor o conteúdo (disclosure com `aria-expanded`, `aria-controls` e `hidden`; Esc fecha e devolve o foco). Do tablet em diante a lista fica sempre visível. A origem do DS usava uma gaveta lateral; vale o Figma.
- "Nesta página" é montado no navegador a partir dos `h2` com `id`, com `aria-current` na seção visível.
- **Densidade (decisão do Lucas):** `fieldset` com rádios nativos, rótulos do Figma (Desktop, Mobile, Compacto), padrão Desktop (sem atributo) em qualquer tela. A escolha muda `data-uaiui-density` no wrapper e fica em `localStorage` (`uaiui-density`, com try/catch); um script inline na abertura do wrapper aplica a escolha antes da pintura (sem piscar). Cada opção tem 44px de altura (o Figma desktop desenha 40, com a borda por dentro), e o grupo quebra linha quando o texto é ampliado.
- **Busca:** diálogo modal (Ctrl/⌘ + K ou o botão), combobox com lista de resultados e a contagem num `role="status"`. Esc fecha de uma vez (no `<input type="search">` o primeiro Esc só limparia o campo), e o foco volta para quem abriu. Ganhou o botão "Fechar" (44px), para fechar no toque.
- **Código:** blocos monocromáticos, como no Figma (fundo `--ui-fg-default`, texto `--ui-bg-page`), sem o realce do `<Code>`/Shiki da origem, que traria cores fixas. "Copiar" anuncia "Código copiado." num `role="status"`.
- Tabela rola na horizontal no celular (largura mínima de 560px), numa região com foco pelo teclado.
- **Fonte de código (decisão do Lucas):** JetBrains Mono 400, só nas páginas do UaiUI (`uaiui-code-font.css`), sem preload, com `swap`. `jetbrains-mono-400.woff2` (19.664 bytes) tem o mesmo recorte de 230 caracteres do 700 (a faixa "latin" do Google Fonts, versão 2.211). Foi gerado a partir do arquivo "latin" atual do Google Fonts, que é a fonte variável 2.211 (`wght` 400 a 800), instanciado em 400 com o harfbuzz (`subset-font`, `variationAxes: { wght: 400 }`, mesmos caracteres e as features `calt ccmp frac mark`). Validação: o mesmo processo em 700 reproduz o arquivo 700 atual em 227 dos 228 glifos (no "0" a diferença é de uma unidade de arredondamento). Guarda: `fonts.test.ts` (mesmo recorte do 700, fora do `fonts.css`).

**Textos do DS (decisão do Lucas):** o conteúdo é o do DS, com duas mudanças:
- Introdução: saiu "Use o seletor no cabeçalho para ver." (do princípio "Tema e densidade por modo"), porque aqui não há seletor de tema.
- Tokens e temas: "Usar no projeto" passou a mostrar o uso por wrapper (`.uaiui`, `data-uaiui-theme`, `data-uaiui-density`), com o texto do README do DS, no lugar de `tokens.css` com `data-theme` no `<html>`; e saiu "Mude o tema no cabeçalho para ver as cores trocarem." da amostra de cores.

**Cabeçalho desktop:**
- Link "UaiUI" ao lado de Paletaria (`macroSections`, `inHeader`). **Decisão do Lucas:** não há campo novo em `navigation.ts`; `inHeader` passa a significar "barra do desktop e menu do mobile", e a barra do mobile não tem mais links de seção.
- Logo completo, padding de 88px e 56px entre links e botões a partir de **1184px** (antes 1160): com Paletaria e UaiUI o cabeçalho precisa de 1140px, mais 15px da barra de rolagem. Abaixo disso, logo reduzido, padding de 20px e **32px** entre links e botões (decisão do Lucas; com 56px sobravam 3px em 768). Folga medida (largura útil menos a necessária, com a barra de rolagem de 15px): 27px em 768, 283px em 1024, 442px em 1183 e 29px em 1184.
- Os links do desktop têm 24px de altura (Figma 605:861); a área de clique cresce 10px para cima e para baixo (`::before`), sem mudar o layout, e chega a 44px.

**Cabeçalho mobile e menu (Figma 254:1007, 676:514 e 676:3863):**
- A barra tem o logo, o botão de menu e o de e-mail (16px entre eles, como no Figma; antes 24px). Paletaria e UaiUI saíram da barra e vivem no menu.
- Botão de menu: 46x46px. Fechado, é o outline-primary do site, com o ícone `ico-out-menu`; aberto, é o filled-primary com o `ico-out-close`. `aria-expanded`, `aria-controls` e nome "Abrir menu"/"Fechar menu".
- **Menu do tipo disclosure (não modal; decisão do Lucas):** o painel (`#site-menu-mobile`) fica dentro do cabeçalho sticky e abre e fecha só por `hidden`, sem depender de animação; fechado, fica fora do Tab. Fecha com Esc (o foco volta ao botão; com a busca do UaiUI aberta, o Esc é dela), ao escolher um link e quando a tela passa a 768px. A altura é limitada à da tela e o painel rola sozinho em telas baixas e com o texto ampliado.
- Conteúdo (decisão do Lucas): os cases publicados, na ordem da Home (Área de pagamentos, Redesign de produto; "Criando um design system" fica de fora por não estar publicado), um divisor de 3px e as seções `inHeader` (Paletaria, UaiUI), dentro de `<nav aria-label="Menu do site">`. Os rótulos vêm do YAML dos cases e de `navigation.ts`, e a ordem e a rota dos cases, de `src/utils/cases.ts`, que a Home também usa.
- **Links do menu:** `HeaderLink` mobile (44px, `text-body-accent-strong`, blue/6). O Figma usava `text/label/accent` (blue/5, 4,47:1 em 16px) e já foi corrigido. **O sublinhado** do hover e do pressed (Figma `link-button-mobile`, 2026-10-21) foi aplicado no próprio `HeaderLink` mobile: o pressed e a página atual já sublinhavam, e o hover não mudava nada visível (a cor do regular já é a do hover). Agora o hover também sublinha, só em `@media (hover: hover)`.
- **Mini-rodapé (decisão do Lucas):** abaixo do `divider-trail` (7px), os botões ícone E-mail, LinkedIn (`ico-fill-in`), GitHub (`ic-fill-gh`) e Baixar CV, de 46x46px (outline-primary do site), à esquerda, e "© 2026 Lucas Pereira", sem a versão, à direita (12px, `text-body-primary-strong`, maiúsculas), tudo numa linha. O © quebra em 2 linhas em 360px e em 3 em 320px. Com o texto ampliado, botões e © quebram linha em vez de estourar. Fecha com um divisor de 5px.
- **Fonte única dos contatos:** `src/config/contact.ts` (href, rótulo, nome acessível, classe, ícone de cada contexto, titular e ano do ©) alimenta o rodapé desktop, o rodapé mobile, o mini-rodapé e o e-mail dos cabeçalhos. Os rodapés ficaram idênticos (HTML e capturas em 360 e 1440, home e Paletaria). Nome acessível novo: "Abrir perfil do LinkedIn em nova aba" (no padrão do GitHub), usado só no mini-rodapé. Guarda: `contact.test.ts`.
- Ícones novos do Assets (`ico-out-menu` 675:441, `ico-out-close` 675:445, `ico-fill-in` 677:26, `ic-fill-gh` 677:38) e os do shell (`uai/ic-search`, `uai/ic-chevron-down`, `uai/ic-menu`, `uai/ic-arrow-left`, `uai/ic-arrow-right`): SVG em linha com `currentColor`, como os demais do site.

**Divergências do Figma que ficaram:**
- No celular, Densidade fica **acima** de "Páginas" (no Figma 667:178 vem abaixo). Com a lista de páginas abrindo logo abaixo do botão, a ordem do Figma faria a ordem do Tab divergir da visual num dos tamanhos (a densidade fica no topo no desktop). Sugestão: inverter no frame mobile.
- No celular, o subtítulo do bloco de título é o texto completo do desktop (666:90); o frame 667:214 corta a segunda frase.
- Segmentos de densidade com 44px também no desktop (o Figma desenha 40).
- A barra do bloco de código usa `--ui-fg-muted` no divisor (o Figma usa `#2A3136`, que não é token do wrapper).
- Os frames mostram o rodapé com "v.1.0.1"; o código usa `siteVersion` (o Figma será corrigido).

**Observações:**
- Com o texto a 200% em 320px, o cabeçalho mobile ainda passa 9px da largura (na `main`, com o link da Paletaria na barra, eram 136px). Em 360px não passa.
- Em `forced-colors`, o ícone de e-mail do cabeçalho (um `<img>`, `mail-on-accent.svg`) some; já era assim e ficou fora desta PR.
- Em 768px, o rodapé desktop gera rolagem horizontal (942px), como na `main`; tema à parte.
- **Escala de 4:** nenhuma exceção nova. O divisor de 3px do menu usa o `Divider.astro`.
- **Versão:** 1.1.9 para 1.2.0 (minor, seção nova).

### UaiUI — PR B (Accordion, Button e Toast) — 2026-10-21

Figma, página "UaiUI": `666:17` (Button desktop, molde das três páginas), `667:178` (mobile) e `668:351` (notas); arquivo "UaiUI – Design Tokens" (`TyB09g7o3xO98l6mcPz2Kd`), exemplos `accordion / Examples` (`33:282`) e `toast / Examples` (`69:1146`). Não há frames de Accordion nem de Toast na página do site: as duas seguem o molde de Button. Origem: `src/pages/docs/components/{accordion,button,toast}.astro`, `Example.astro`, `PropsTable.astro` e `icons.ts` do `uaiui-ds` v0.2.0. **A dependência foi atualizada para a v0.2.1 nesta mesma PR** (commit à parte): ela só acrescenta a variável `--font-transform-label` (`uppercase`) ao `tokens-wrapper.css` e o `text-transform` nos rótulos de button, accordion e toast (`.uai-button`, `.uai-accordion-trigger` e `.uai-toast__title`); nada mais mudou no pacote. Com isso os previews já saem em caixa alta, como no Figma. Nada da PR A muda (tipografia do site, tema claro, sombras do DS, densidade por `data-uaiui-density`, código monocromático, escopo sob `.uaiui-docs`).

**Rotas** (decisão do Lucas): `/projetos/uaiui/componentes/accordion/`, `/button/` e `/toast/`, em `pages/projetos/uaiui/componentes/`. Entram no grupo "Componentes" de `uaiui-nav.ts` (Toast com a marca "novo"), e com isso voltam sozinhos o menu lateral, o botão "Páginas", a busca, o pager e a seção "Componentes" da Introdução. `uaiui-nav.test.ts` segue exigindo uma página para cada link.

**CSS dos componentes:** cada página importa só o CSS do componente dela (`uaiui-ds/components/<nome>.css`), e a do Toast também o do Button, usado na ação e no fechar. O código mostrado vem do próprio pacote, com `import css from 'uaiui-ds/components/<nome>.css?raw'`; o `?raw` resolve pelo campo `exports` (testado: o texto tem o tamanho exato do arquivo do pacote), então não há cópia no portifa. Guarda (`uaiui-docs.test.ts`): só o layout e as páginas sob `pages/projetos/uaiui/` importam `uaiui-ds` (inclusive com `?raw`); cada página de componente importa só o CSS dela; Introdução, Tokens e o layout não importam CSS de componente.

**Portado:** `Example.astro` (Preview e Código), `PropsTable.astro` e `icons.ts`.
- Abas de **44px** (o site de docs do DS tinha 36), indicador de 4px na cor da marca, como no Figma (`uai/tab`). Setas, Home e End movem e ativam; a barra quebra linha com o texto ampliado.
- Ids das abas **estáveis**, derivados do título e do código (`utils/stable-id.ts`, FNV-1a); a origem usava `Math.random()`, que muda o HTML a cada build.
- O bloco de código dentro do exemplo (`CodeBlock bare`) usa a moldura do exemplo, sem borda nem sombra próprias.
- O palco não tem `overflow` próprio (rolagem interna pediria foco pelo teclado): o que não cabe quebra linha. `letter-spacing: 0`, `line-height: normal` e `text-transform: none` no exemplo, para nada do corpo da página vazar para dentro do componente (os componentes do DS trazem a tipografia deles). Palco em coluna sem `flex-wrap`: com quebra, a largura da coluna vinha do toast (400px) e ele passava da tela.
- Tabela de props com as larguras do Figma (128, 208 e 100px, com o padding dentro) e a nota "A tabela rola na horizontal…" só no celular (Figma `667:310`).
- O corpo da página quebra palavra ou trecho em `code` quando não cabe (`overflow-wrap: anywhere`); sem isso "Acessibilidade" e "Accordion" a 200% de texto passavam da tela. Preview e tabela ficam como estavam.

**Títulos do Accordion (decisão do Lucas):** o DS deixa o nível do título por conta da página. O primeiro exemplo fica logo abaixo do `h1`, então seus itens são `h2` (a regra contra pular nível vale); os exemplos dentro de uma seção "h2" usam `h3`. Os `h2` do preview **não têm `id`**, então não entram em "Nesta página", que só lê os `h2` com `id` filhos diretos do corpo (verificado no navegador e em `componentes.test.ts`).

**Toast: o anúncio vem da região viva, uma vez só (decisão do Lucas, 4 do plano).** No DS o `role="status"` e o `role="alert"` ficavam no próprio toast, que o script só escondia e mostrava; isso não seguia o que a página ensina (uma região viva já na página, em que o aviso entra) e, dentro de uma região `aria-live`, o `role` do toast pode fazer o leitor repetir. Escolha: **o toast não leva `role`**; a região leva. Neutral, success e info entram em `aria-live="polite"` (`aria-atomic="false"`); warning e error, em `role="alert"`. O preview e o código mostrado são o mesmo padrão: o código é a região polite já com o toast dentro, e no preview a região começa vazia e o botão **"Mostrar aviso"** insere exatamente esse toast. Fechar (X, "Desfazer" ou Esc) tira o aviso e **devolve o foco a "Mostrar aviso"**; um segundo clique substitui o aviso (não empilha). O toast fica no fluxo da página (nada de `position: fixed`), então não prende o foco nem cobre o conteúdo. Os toasts do exemplo "Tons" são ilustração estática, sem `role`: o X esconde o aviso e ele volta depois de 2 segundos, como no DS, com o foco indo para o palco (nunca preso). Não foi possível testar o anúncio num leitor de tela; o que foi conferido é a estrutura (região presente e vazia antes, aviso inserido nela, nenhum `role` no toast).

**Textos do DS que mudaram (decisão do Lucas), além dos da instalação:**
1. Instalação, item 1 das três páginas: "Copie `src/styles/tokens.css` (veja Tokens e temas) e importe no projeto" virou "Importe `uaiui-ds/tokens-wrapper.css` e coloque os componentes dentro do wrapper `.uaiui` (veja Tokens e temas)". No Toast, o trecho do CSS do button ficou "e o CSS do button (`uaiui-ds/components/button.css`), usado na ação e no fechar".
2. Instalação, item 2: "Copie o CSS abaixo para `<nome>.css` e importe" virou "Importe `uaiui-ds/components/<nome>.css`. O código abaixo é o conteúdo desse arquivo.".
3. Os links `/docs/tokens` e `/docs/components/button` apontam para as rotas do site.
4. Toast: o parágrafo "Feche o aviso no X: no exemplo, ele volta depois de 2 segundos." (do preview) virou "Use Mostrar aviso: o aviso entra na região viva da página e o leitor de tela o anuncia. Feche no X, em Desfazer ou com Esc: o foco volta ao botão."; a frase de 2 segundos passou para o parágrafo dos tons.
5. Toast: a linha `role` da tabela virou "região viva" (`aria-live="polite" | role="alert"`, "O toast não leva `role`"), o primeiro item de Acessibilidade diz o mesmo, e o exemplo de região tem `<div role="alert">` em vez de `<div class="toast-region" role="alert">`.
6. O resto do texto é o do DS.

**Medições** (Playwright, três densidades, Desktop 1440 e Mobile 360, nas três páginas): menor altura de `button` e botão de ícone e do cabeçalho do accordion, **54, 46 e 44px** em Desktop, Mobile e Compacto; aba, Copiar, segmento de densidade e item do menu, 44px nas três; nada abaixo de 44px. O botão `ghost` não tem padding lateral (`padding-inline: 0`), então a largura é a do rótulo (46px ou mais com os rótulos dos exemplos); um rótulo curto ("OK") ficaria abaixo de 44px: é do DS. Zoom de 200% (1440 e 768) e texto a 200% (360): sem rolagem horizontal; a 320px com texto a 200% sobram 9px, que são do cabeçalho mobile (já existia). `prefers-reduced-motion`: `transition-duration` 0s no button, no accordion e no toast.

**Toast em 320px** (texto exato "Continuar conectado", o do Figma, no toast de aviso; medido de novo com a caixa alta da v0.2.1, e os números não mudaram, porque a fonte é monoespaçada): o toast tem 229px (o que sobra na página, dentro do exemplo). O rótulo da ação **quebra em 2 linhas** nas três densidades e **nenhum pixel é cortado pela borda do toast** (0px). No Desktop a ação fica 77px mais larga que a coluna de texto (a largura da palavra mais longa mais o padding) e passa por baixo do X, sem tocá-lo, porque o X fica na linha do título; no Mobile são 31px, no Compacto 0. O corte do Figma (Mobile, 328px, "CONTINUAR CONECTAD") não se reproduz no CSS do DS: com o toast de 328px e densidade Mobile o botão ocupa a coluna inteira (190px) e o rótulo quebra em duas linhas.

**Divergências com o Figma e o que fica para o DS** (a caixa alta veio na v0.2.1, dentro desta PR; o resto não foi corrigido aqui, e a próxima tag do DS vira uma PR à parte):
- **Caixa alta: resolvida no DS v0.2.1** (`--font-transform-label` e `text-transform` nos rótulos de button, accordion e toast), e esta PR já usa essa versão. Conferido no preview: `text-transform: uppercase` nos botões, no título do accordion e no título e na ação do toast; o painel do accordion e a mensagem do toast seguem em caixa normal, como no Figma. Os previews de Button batem com os frames `666:17` (desktop) e `667:242` (celular).
- **Variante "danger" do button:** no Figma o texto não está ligado à propriedade de rótulo.
- **`forced-colors`:** os três CSS não têm regra nenhuma. Medido no preview: o botão perde a diferença entre filled, outlined e danger (só o texto distingue); no toast a barra lateral some e o ícone e a borda carregam o tom, como o DS diz; o accordion aberto e fechado se distingue pela seta.
- **Toast sem movimento:** a documentação do DS fala em "entrada e saída de 100 ms", mas `toast.css` não anima nada (nem tem regra de redução de movimento).
- **Toast no Mobile:** o X e a ação não têm regra de largura mínima; ver "Toast em 320px".
- **Botão `ghost`** com rótulo curto pode ficar abaixo de 44px de largura (acima).
- **Abas Preview e Código:** 44px (Figma `uai/tab`), não os 36px do site de docs do DS. Aprovado.
- **Título do accordion com palavra longa:** com 320px e texto a 200% (largura útil do cabeçalho de 157px), a palavra mais longa de "Quais formas de pagamento aceitam parcelamento?" ("PARCELAMENTO?", 125px) mais o padding, o espaço e a seta pedem 209px, e a seta sai da borda. O título precisa de `min-width: 0` e de quebra de palavra. Os títulos dos exemplos e os do Figma (2 linhas em 320px, altura de 76px no Desktop e no Mobile e 44px no Compacto) não chegam a isso.
- **Botão `ghost`:** o Figma dá 24px de padding lateral (`px` do botão); o CSS do DS usa `padding-inline: 0`. É a mesma causa da largura abaixo de 44px com rótulo curto.
- **Unidades em px:** os tamanhos de fonte e de espaço dos componentes são em px, então só o zoom do navegador os amplia, e não a opção de tamanho de texto. O "texto a 200%" simulado aqui (`html { font-size: 200% }`) amplia o shell da página (em rem), não os componentes.

**Contorno do `astro check`:** o texto literal `<h2>Props</h2>` derruba o `astro check` (panic do `@astrojs/compiler` 2.13.1 na conversão para TSX; o build compila normalmente). Na página de Button o título "Props" (o do DS e do Figma) vai como expressão (`{propsTitle}`), com um comentário no arquivo.

**Escala de 4:** nenhuma exceção nova. **Versão:** 1.2.0 para 1.3.0 (minor: três rotas novas com comportamento novo).


### Rodapé de 768 a 959px e cabeçalho mobile a 320px com 200% (site 1.3.2)

Dois estouros de largura que já existiam antes do UaiUI.

- **Rodapé, 768 a 959px:** a linha única (divisor fixo de 64px, quatro botões, divisor fixo de 64px e 8 gaps de 24px) soma 942px e só cabe a partir de uns 960px. De 768 a 959px os botões passam a duas linhas de dois: e-mail e LinkedIn em cima, GitHub e Baixar CV embaixo, numa grade de três colunas (botão, divisores, botão). Os dois divisores das pontas e o divisor entre os pares saem; ficam os dois de 3px, um entre os botões de cada linha. O respiro lateral é um padding de 88px (o que os divisores fixos mais o gap davam). A coluna da esquerda alinha com a borda esquerda do bloco e a da direita com a borda direita; os botões ocupam a largura da coluna, então GitHub tem a largura do e-mail e Baixar CV a do LinkedIn. Alvos de 46px de altura, como antes. A partir de 960px e abaixo de 768px nada muda. Decisão de desenho do Lucas (opção 1); o Figma não tem esse tamanho.
- **Cabeçalho mobile, 320px com 200%:** logo (54px) e a linha de menu e e-mail (220px com a raiz a 32px) mais o padding de 40px não cabem em 305px e a linha passava 9px. `.site-header-mobile__core` ganhou `flex-wrap`, `row-gap` de 16px e `min-height` no lugar de `height`: quando não cabe, o menu e o e-mail descem para uma segunda linha (o cabeçalho passa de 161 para 209px). Quando cabe, nada muda.
- **Fora do escopo (ficam para outras PRs):** a home e o case estouram a 768px (e a home a 1024px) já a 100%, e quase tudo a partir de 768px com a raiz a 200%. A lista está na PR.

**Escala de 4:** nenhuma exceção nova. **Versão:** 1.3.1 para 1.3.2 (patch).
