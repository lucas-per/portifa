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
- `src/styles/tools/uaiui-docs.css`: todo seletor começa por `.uaiui-docs`; os globais do site de docs do DS (`*`, `html`, `body`, `a`, `h1`–`h4`, `:focus-visible`) não vieram. Cores só por tokens do wrapper (`--ui-*`, `--interface-function-*`), sem cor fixa; fontes só por `var(--font-family-*)`. Guarda: `uaiui-docs.test.ts`. **Atualizado na PR O1 (site 1.3.14, decisão do Lucas):** o CSS virou dois arquivos, `uaiui-docs.css` (chrome, que pode usar também tokens semânticos do site) e `uaiui-docs-ds.css` (exemplo, código e tabelas, só tokens do wrapper); ver a seção da PR O1, no fim. O `var-usage.test.ts` aceita os tokens do wrapper (lidos do pacote) só nos arquivos do UaiUI.
- O wrapper redeclara `--font-family-body` e `--font-family-label` com os mesmos valores do site (DM Sans e JetBrains Mono); não muda nada.
- **Tipografia:** a do site (Plus Jakarta Sans nos títulos, DM Sans no corpo, JetBrains Mono 700 nos rótulos). Os componentes do DS mantêm a tipografia e a densidade deles.
- **Cor de referência da marca UaiUI:** `#057ABD`, já nos tokens do DS.
- **Sombras:** na área do DS vale a escala do DS (2px nos componentes, 4px no layout: `--shadow-offset-component` e `--shadow-offset-layout`), não a escala de forma do site (3 e 5px). Faltavam dois valores da origem (6px no hover do card, 8px no diálogo de busca) e nenhum token novo foi criado: o diálogo usa `--shadow-offset-layout` (4px), pager e cards ficam fixos em 4px e o hover troca o fundo (`ghost-action`).
- **Foco:** dentro da área, o anel do DS (`--ui-focus-ring`, 2px e 2px de afastamento); no cabeçalho e no rodapé, o do site.

**Shell (Figma 666:17 e 667:178):**
- ~~Bloco de título: "UAIUI"~~ **(texto e subtítulo trocados na PR O2: "UaiUI design system")** (Plus Jakarta Sans 800, 36px; 32px no celular) é um `<p>`, não título; o `<h1>` é o da página ("Introdução", "Tokens e temas"), que também dá o `<title>` ("Introdução · UaiUI"). Subtítulo do Figma 666:90. A partir de 1184px, busca e densidade ficam à direita do título; de 768 a 1183px, numa linha própria abaixo do subtítulo (a linha do Figma precisa de uns 880px). ~~Busca e densidade.~~ **Desde a PR O1 (1.3.14) o cabeçalho da área só tem a busca** (a densidade foi para dentro de cada exemplo); a busca vai para o menu lateral na PR O2.
- ~~Colunas: menu lateral (240px), conteúdo (até 728px) e "Nesta página" (200px) a partir de 1280px; de 768 a 1279px, sem "Nesta página"; abaixo de 768px, uma coluna.~~ **Substituído na PR O2 (1.3.15): menu de 360px (288px de 768 a 1183px) e conteúdo até a borda direita da tela, sem terceira coluna; ver a seção da PR O2, no fim.** Padding lateral de 88px a partir de 1184px (o mesmo ponto do logo completo do cabeçalho) e 20px abaixo.
- No celular, o menu lateral vira o botão "Páginas" (com a página atual), que abre a lista no lugar, sem sobrepor o conteúdo (disclosure com `aria-expanded`, `aria-controls` e `hidden`; Esc fecha e devolve o foco). Do tablet em diante a lista fica sempre visível. A origem do DS usava uma gaveta lateral; vale o Figma.
- ~~"Nesta página" é montado no navegador a partir dos `h2` com `id`, com `aria-current` na seção visível.~~ **Removido na PR O2 (1.3.15), em todas as larguras.** Os `id` dos `h2` e os links `#id` continuam.
- **Densidade (decisão do Lucas):** ~~controle único no cabeçalho da área~~ **dentro de cada exemplo desde a PR O1 (1.3.14, Figma 704:751; seção no fim).** `fieldset` com rádios nativos, rótulos do Figma (Desktop, Mobile, Compacto), padrão Desktop (sem atributo) em qualquer tela. A escolha muda `data-uaiui-density` no wrapper e fica em `localStorage` (`uaiui-density`, com try/catch); um script inline na abertura do wrapper aplica a escolha antes da pintura (sem piscar). Cada opção tem 44px de altura (o Figma desktop desenha 40, com a borda por dentro), e o grupo quebra linha quando o texto é ampliado.
- **Busca:** diálogo modal (Ctrl/⌘ + K ou o botão), combobox com lista de resultados e a contagem num `role="status"`. Esc fecha de uma vez (no `<input type="search">` o primeiro Esc só limparia o campo), e o foco volta para quem abriu. Ganhou o botão "Fechar" (44px), para fechar no toque.
- **Código:** blocos monocromáticos, como no Figma (fundo `--ui-fg-default`, texto `--ui-bg-page`), sem o realce do `<Code>`/Shiki da origem, que traria cores fixas. "Copiar" anuncia "Código copiado." num `role="status"`.
- Tabela rola na horizontal no celular (largura mínima de 560px), numa região com foco pelo teclado.
- **Fonte de código (decisão do Lucas):** JetBrains Mono 400, só nas páginas do UaiUI (`uaiui-code-font.css`), sem preload, com `swap`. `jetbrains-mono-400.woff2` (19.664 bytes) tem o mesmo recorte de 230 caracteres do 700 (a faixa "latin" do Google Fonts, versão 2.211). Foi gerado a partir do arquivo "latin" atual do Google Fonts, que é a fonte variável 2.211 (`wght` 400 a 800), instanciado em 400 com o harfbuzz (`subset-font`, `variationAxes: { wght: 400 }`, mesmos caracteres e as features `calt ccmp frac mark`). Validação: o mesmo processo em 700 reproduz o arquivo 700 atual em 227 dos 228 glifos (no "0" a diferença é de uma unidade de arredondamento). Guarda: `fonts.test.ts` (mesmo recorte do 700, fora do `fonts.css`).

**Textos do DS (decisão do Lucas):** o conteúdo é o do DS, com duas mudanças:
- Introdução: saiu "Use o seletor no cabeçalho para ver." (do princípio "Tema e densidade por modo"), porque aqui não há seletor de tema.
- Tokens e temas: "Usar no projeto" passou a mostrar o uso por wrapper (`.uaiui`, `data-uaiui-theme`, `data-uaiui-density`), com o texto do README do DS, no lugar de `tokens.css` com `data-theme` no `<html>`; e saiu "Mude o tema no cabeçalho para ver as cores trocarem." da amostra de cores.

**Cabeçalho desktop:**
- Link "UaiUI" ao lado de Paletaria (`macroSections`, `inHeader`). **Decisão do Lucas:** não há campo novo em `navigation.ts`; `inHeader` passa a significar "barra do desktop e menu do mobile", e a barra do mobile não tem mais links de seção. ~~Não há campo novo.~~ **Atualizado na PR N (site 1.3.13):** o rótulo é "UaiUI DS", vem antes da Paletaria e ganhou o campo `accessibleName` (seção "Cabeçalho: UaiUI DS primeiro", no fim deste arquivo).
- Logo completo, padding de 88px e 56px entre links e botões a partir de **1184px** (antes 1160): com Paletaria e o rótulo antigo "UaiUI" o cabeçalho precisava de 1140px, mais 15px da barra de rolagem (com "UaiUI DS" são 1176px: ver a seção da PR N, no fim). Abaixo disso, logo reduzido, padding de 20px e **32px** entre links e botões (decisão do Lucas; com 56px sobravam 3px em 768). Folga medida com o rótulo antigo (largura útil menos a necessária, com a barra de rolagem de 15px): 27px em 768, 283px em 1024, 442px em 1183 e 29px em 1184; os valores atuais estão na tabela da PR N.
- Os links do desktop têm 24px de altura (Figma 605:861); a área de clique cresce 10px para cima e para baixo (`::before`), sem mudar o layout, e chega a 44px.

**Cabeçalho mobile e menu (Figma 254:1007, 676:514 e 676:3863):**
- A barra tem o logo, o e-mail e o botão de menu, **nessa ordem** (16px entre os dois botões, como no Figma 254:1007; antes 24px). ~~Antes o menu vinha primeiro e o e-mail depois.~~ **Ordem corrigida em 2026-10-23 (site 1.3.7, decisão do Lucas):** ver "Ordem da barra mobile", abaixo. Paletaria e UaiUI saíram da barra e vivem no menu.
- Botão de menu: 46x46px. Fechado, é o outline-primary do site, com o ícone `ico-out-menu`; aberto, é o filled-primary com o `ico-out-close`. `aria-expanded`, `aria-controls` e nome "Abrir menu"/"Fechar menu".
- ~~**Menu do tipo disclosure (não modal; decisão do Lucas):** o painel fica dentro do cabeçalho sticky e abre e fecha só por `hidden`...~~ **Substituída em 2026-10-22 (site 1.3.6): painel de tela cheia, `inert` no restante** (seção "Menu mobile em tela cheia", no fim deste bloco). Seguem valendo: abre e fecha por `hidden`, sem animação; fechado, fica fora do Tab; fecha com Esc (o foco volta ao botão; com a busca do UaiUI aberta, o Esc é dela), ao escolher um link e a 768px.
- Conteúdo (decisão do Lucas; os rótulos de grupo vieram em 2026-10-22, ver abaixo): os cases publicados, na ordem da Home (Área de pagamentos, Redesign de produto; "Criando um design system" fica de fora por não estar publicado), um divisor e as seções `inHeader` (UaiUI DS, Paletaria, desde a PR N), dentro de `<nav aria-label="Menu do site">`. Os rótulos vêm do YAML dos cases e de `navigation.ts`, e a ordem e a rota dos cases, de `src/utils/cases.ts`, que a Home também usa.
- **Links do menu:** `HeaderLink` mobile (44px, `text-body-accent-strong`, blue/6). O Figma usava `text/label/accent` (blue/5, 4,47:1 em 16px) e já foi corrigido. **O sublinhado** do hover e do pressed (Figma `link-button-mobile`, 2026-10-21) foi aplicado no próprio `HeaderLink` mobile: o pressed e a página atual já sublinhavam, e o hover não mudava nada visível (a cor do regular já é a do hover). Agora o hover também sublinha, só em `@media (hover: hover)`.
- ~~**Mini-rodapé (decisão do Lucas):** E-mail, LinkedIn, GitHub e Baixar CV, "© 2026 Lucas Pereira" sem a versão, fechado por um divisor de 5px.~~ **Substituído em 2026-10-22 (Figma 695:953):** GitHub, LinkedIn e E-mail, sem o Baixar CV, e "© 2026 · V.1.3.6"; o painel termina no mini-rodapé, sem o divisor de 5px. Ver o bloco abaixo.
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
- Em `forced-colors`, o ícone de e-mail do cabeçalho (um `<img>`, `mail-on-accent.svg`) sumia no esquema claro (1,04:1); corrigido no site 1.3.3, com SVG inline (`ContactIcon`) em `currentColor`.
- Em 768px, o rodapé desktop gera rolagem horizontal (942px), como na `main`; tema à parte.
- **Escala de 4:** nenhuma exceção nova. O divisor de 3px do menu usa o `Divider.astro`.
- **Versão:** 1.1.9 para 1.2.0 (minor, seção nova).

**Menu mobile em tela cheia (Figma 695:953, `header-mobile-menu`, 360x800) — 2026-10-22, site 1.3.6.** Cinco decisões do Lucas, em que o Figma vence o que estava registrado, mais três da conversa de plano:

- **Rótulos de grupo:** "CASES" (695:1137) sobre Área de pagamentos e Redesign de produto, e "PROJETOS" (695:1139) sobre UaiUI DS e Paletaria (nessa ordem desde a PR N, site 1.3.13). JetBrains Mono Bold 12px (Mobile/Label/SM, `.text-label-sm` no mobile), `--text-label-primary` (11,17:1 sobre o fundo). Cada lista é `<ul aria-labelledby>` do rótulo e o `<nav aria-label="Menu do site">` continua. O texto dos rótulos é o único conteúdo novo; os links vêm de `navigation.ts` e dos cases.
- **Divisor entre os grupos:** 156x3px (695:1124), `--surface-bg-accent-strong`, **a partir de x=0**, fora do padding lateral (o padding de 20px é de cada grupo, não do `nav`). É proposital. Contraste de 1,98:1 com o fundo, como os outros divisores azuis do site; é decorativo (os grupos se separam pelos rótulos e listas).
- **Espaçamento do `col-links`:** 40px em cima e embaixo (`scale-x10`), 24px entre grupos e divisor (`scale-x6`), 8px entre rótulo e lista. **PROJETOS: 16px de padding-top** (decisão do Lucas) no lugar dos 14px do Figma (`scale-x3_5`, fora da escala de 4); fica 40px do divisor ao rótulo, 2px a mais que o desenho, e o rótulo e os links de Projetos ficam 2px abaixo do Figma. Os 14px do padding do link seguem a exceção de `HeaderLink`. Nenhuma exceção nova em `KNOWN_EXCEPTIONS`.
- **Mini-rodapé (substitui a decisão anterior):** fundo `--surface-bg-tertiary-subtle` (o mesmo dos rodapés; antes não tinha fundo), 78px, ícones GitHub, LinkedIn e E-mail de 46x46px (ordem de `menuFooterLinks` em `contact.ts`; o Baixar CV, oculto no Figma, não entra), e "© 2026 · V.1.3.6" (`copyrightYear` e `siteVersion`, em maiúsculas, sem o titular) à direita. Vale só para o menu; os rodapés desktop e mobile e o e-mail do cabeçalho ficam como estão. O Figma mostra "V.1.0.1"; o código usa a versão real (o Figma será corrigido). O © fica na linha dos botões se cabe inteiro e desce para a linha de baixo se não cabe (200%), sem passar da largura.
- **Fim do painel:** sem o divisor de 5px (`site-menu-mobile__bottom` removido, 695:970 oculto no Figma). O painel termina no mini-rodapé; a faixa rosa de 7px (`divider-trail`) antes dele continua.
- **Altura:** o painel ocupa a tela inteira abaixo da barra, com o mini-rodapé colado embaixo. Fica fora do fluxo (`position: absolute; top: 100%` no cabeçalho sticky) e `height: calc(100vh - 100%)`, depois `calc(100dvh - 100%)`; o `100%` é a altura do cabeçalho, que é só a barra, então vale para qualquer altura dela (62px aberta, 83px fechada, mais com o texto ampliado) e o painel não aumenta a página nem deixa vazio sob a barra. Se o conteúdo é maior que a tela (360x480, paisagem, texto ampliado), o painel rola sozinho (`overflow-y: auto`, `overscroll-behavior: contain`). Sem `max-height`: a altura já é limitada.
- **Barra com o menu aberto (Figma 695:990, 62px):** só o logo e o X, à direita. O e-mail (`display: none`, fora do Tab e da árvore de acessibilidade) e o divisor de 5px, com os 16px de gap acima dele, saem enquanto o menu está aberto; fechado, a barra é a de sempre (83px). ~~**O X muda de lugar ao abrir** (decisão do Lucas; vem do Figma, sem compensação).~~ **Substituído em 2026-10-23 (site 1.3.7): o X não muda mais de lugar** (ver "Ordem da barra mobile"). O componente `header-mobile` (254:1007) segue com 83px; a instância do frame esconde `clickable-mailto` e `divider`.
- **Sombra do X com o menu aberto (site 1.3.11, 2026-10-23):** a barra aberta tem 62px e o X termina em y=62, então a sombra de baixo (`--shadow-comp-neutral`, 3px; 5px no hover com mouse) cai para fora da barra, onde está o painel (`position: absolute`, fundo opaco, pintado depois de uma barra sem posição) e a cobria. No Figma 695:990 a instância renderiza com 65px e a sombra aparece. **Decisão:** `position: relative; z-index: 1` em `.site-header-mobile__bar`, para a barra pintar acima do painel. É só ordem de pintura: alturas (83px fechada, 62px aberta), espaçamentos, painel e foco não mudam, e a sombra, que não recebe clique, não tapa o painel. `header-mobile.test.ts` trava a regra.
- **Foco (decisão do Lucas, opção A): painel de tela cheia, `inert` no restante.** Substitui a decisão "disclosure, não modal". O painel cobre a página, e com ela por trás o Tab ia para o conteúdo escondido (medido em Chromium a 360x640: depois do último ícone o foco ia para "Ler case", com `elementFromPoint` devolvendo o painel; WCAG 2.4.11). Com o menu aberto, todos os filhos do `<body>` que não contêm o cabeçalho mobile (cabeçalho desktop, `main`, rodapés) ficam `inert`; a barra e o painel, não. Não prende o foco: depois do último ícone o Tab sai da página. O `inert` sai por Esc (o foco volta ao botão), por link, a 768px e por `pageshow` com `persisted` (página vinda do cache do histórico com o menu aberto; o estado é reiniciado). Só se desfaz o `inert` que o próprio menu pôs. Não há link de "pular para o conteúdo" no site (nem no `BaseLayout` nem nos cabeçalhos), então nada a preservar.
- **Alto contraste (`forced-colors`):** o `background-color` dos divisores é trocado pelo da página e eles somem. No menu, o divisor curto e o `divider-trail` ganham `forced-color-adjust: none` e `CanvasText` (`!important`, porque a cor vem de estilo em linha do `Divider`). **Pendência, para uma PR própria:** os demais divisores do site (rodapés, cases, cabeçalho) somem em `forced-colors`; a regra deve ir para o `Divider.astro`. Não foi corrigido aqui.
- **Texto ampliado:** os links do menu podem quebrar linha (`white-space: normal` só dentro do menu; o `HeaderLink` é `nowrap`). A 200% "Área de Pagamentos" e "Redesign de produto" estouravam o painel em 320 a 375px. O painel fica sem rolagem horizontal em 320, 360, 375, 414 e 767px, a 100% e a 200%. A página atrás, a 200%, segue com rolagem horizontal própria (553px; fora do escopo).
- **Escala de 4:** nenhuma exceção nova. **Versão:** 1.3.5 para 1.3.6 (patch).
- **Fora do escopo, só registro:** o estouro de 9px do cabeçalho mobile em 320px com texto a 200% e o layout do site a 200%.

### Ordem da barra mobile (site 1.3.7) — 2026-10-23

**Decisão do Lucas (Figma 254:1007, `header-mobile`, 360×83):** no `row-cta` o E-mail (`clickable-mailto`, 78×46, x=0) vem primeiro e o botão de menu (`clickable-menu`, 46×46, x=94) depois, 16px entre eles, e o menu encosta no padding direito de 20px (x=340). O código tinha o menu primeiro (por isso o X pulava ao abrir o menu, registrado na PR H). Corrigido só trocando a ordem no DOM; o CSS (`gap: 16px` no `row-cta`, `space-between` no `core`) não mudou. Coerente com o frame do menu aberto (695:953), onde o X fica em x=294 (a instância esconde o e-mail).

- **A ordem do DOM é a visual.** Fechado, o Tab vai logo → e-mail → menu; aberto, com o e-mail em `display: none`: logo → X → links do painel → ícones do mini-rodapé. Guarda: `header-mobile.test.ts`.
- **O botão de menu fica no mesmo lugar, aberto e fechado**, a 100% de texto (medido em 320, 360, 375, 414 e 767px; antes ele ia de x=145 para x=239 em 320px, por exemplo). A altura da barra segue 83px fechada e 62px aberta.
- **Limite conhecido, a 200% de texto (sem mudar o CSS; decisão do Lucas: sem `margin-left: auto` no `row-cta`):** o `core` quebra linha quando logo (54px) e `row-cta` (220px com a raiz a 32px: e-mail 126 + gap 32 + menu 62) mais o padding de 80px não cabem; isso acontece com menos de 354px de largura útil (viewport de 369px com a barra de rolagem de 15px). Abaixo disso o `row-cta` desce para a segunda linha e fica à esquerda: com o menu fechado, o menu fica em x=198 (320 e 360px), fora da extrema direita; aberto, só o X sobra e cabe ao lado do logo (x=203 em 320px, x=243 em 360px). Nessa combinação a posição do menu **difere** entre aberto e fechado; isso já era assim antes (o menu ficava em x=40) e é caso de borda. De 369px para cima (testado 375, 414 e 767px) o menu fica na extrema direita nos dois estados (x=258, 297 e 650px). Barra: 209px fechada e 124px aberta em 320 e 360px; 161px e 124px a partir de 375px.
- **Estouro de 9px do cabeçalho a 320px com 200%:** a barra não passa da largura (`maxRight` 305 de 305, fechada e aberta, antes e depois desta mudança); o do site 1.3.2 (`flex-wrap` no `core`) já o tinha resolvido, e a nota da PR do UaiUI que o cita está desatualizada. A rolagem horizontal da página a 200% (553px) vem do conteúdo, fora do escopo.
- **Foco do logo:** o link do logo não tem `:focus-visible` próprio e usa o anel padrão do navegador (1px); o e-mail e o menu usam o anel do site (2px, `--border-focus-strong`). Já era assim; só registro.
- **Escala de 4:** nenhuma exceção nova. **Versão:** 1.3.6 para 1.3.7 (patch).

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

### Ícone de e-mail do cabeçalho em alto contraste (site 1.3.3)

O ícone de e-mail dos dois cabeçalhos era um `<img>` (`mail-on-accent.svg`, traço fixo `#FDFAFA`), que o Chromium não recolore em `forced-colors`: no esquema claro ficava claro sobre branco (1,04:1) e sumia; no escuro já era visível (20,2:1). Passou a ser o SVG inline do `ContactIcon` (`mail`, `currentColor`), como no rodapé. No cabeçalho mobile, `.site-header-mobile__cta` ganhou `color: var(--text-label-neutral-1)` (antes herdava o azul de link). Decisão do Lucas: o traço passa de `#FDFAFA` para `--text-label-neutral-1` (`#fcfeff`), igual ao rótulo "Contato". O arquivo `mail-on-accent.svg` foi removido (nada mais o usava). **Escala de 4:** nenhuma exceção nova. **Versão:** 1.3.2 para 1.3.3.

### Rolagem horizontal em tablet: home e cases (site 1.3.4)

A home e os cases estouravam a largura a 100% de 768 a 1088px (documento de 1021 a 1132px). Não há desenho do Figma para 768 a 1087px; as três decisões são do Lucas e só valem nessas faixas (de 1152px para cima e abaixo de 768px nada muda).

- **Skills da home (abaixo de 1152px):** as quatro colunas pedem 1132px (palavra mais longa do título de 32px + padding, 4 colunas e 3 gaps de 40px). Viram grade de 2 colunas `minmax(0, 1fr)`, na ordem do DOM (Estratégia, Design Systems / Colaboração, Ferramentas). No celular volta a coluna única em flex.
- **Hero da home (abaixo de 960px):** "transformando" tem 455px, o avatar 260px e o gap 48px, então o hero pede 939px. O avatar desce para baixo do título, alinhado à esquerda, com o mesmo gap de 48px. O hero fica mais alto (768px: 1794 para 2022px; 832px: 1665 para 1815px; 959px: 1541 para 1690px).
- **Resumo dos cases (abaixo de 1088px):** os três cards empilham, com as mesmas regras do celular. Em vez de duplicar o CSS, o bloco de grade de `CaseSummary.astro` subiu para `max-width: 1087px`; o `padding-left` de 20px continua só no celular (767px).
- **Limite conhecido:** o piso das três colunas depende das palavras de cada case (a palavra mais longa dos títulos de 28px). Hoje: redesign 1021px, gosafe-ds 1037px, jornada-pagamentos 1059px de documento; a 1088px todos cabem. Um case novo com palavra muito longa pode precisar de um breakpoint maior. Para reavaliar: abrir o case sem a regra empilhada, medir `document.documentElement.scrollWidth` com a viewport estreitando e usar a menor largura em que ele cabe em 3 colunas como novo limite (a 1087px o novo case precisa ter `scrollWidth <= clientWidth`).
- **Escala de 4:** nenhuma exceção nova. **Versão:** 1.3.3 para 1.3.4.

### Cards de "Cases selecionados" em tablet sem palavra quebrada (site 1.3.5)

De 768 a 1016px o título dos cards da home quebrava no meio da palavra ("pagamentos", "Redesign", "produto", "Criando", "system"). Os três cards são `flex: 1 1 0%` com `min-width: 0` e gap de 40px; o texto tem `largura do card − 52px` (padding de 24px dos dois lados e borda de 2px) e o `overflow-wrap: break-word` de `.text-title-h3` quebra a palavra que não cabe. A mais larga, "pagamentos" (32px, peso 800), mede 199px e pede um card de 251px. O defeito já existia antes da PR #47.

- **Correção (layout):** o bloco que empilha os cards (`flex-direction: column`, gap de 32px) passou de `max-width: 767px` para `max-width: 1087px`, sem duplicar CSS. É só layout: o bloco não tinha padding, fonte nem largura, então o padding de 24px do card e a tipografia seguem como estão. Abaixo de 768px nada muda; de 1088px para cima (card de 272px) também não.
- **Layout de tablet para o Figma (768 a 1087px):** 1 coluna, cards com a largura total do conteúdo (viewport − 176px: 577px a 768px), gap de 32px, o resto do card igual.
- **Por que 1088px e não 1024px:** a 1024px com barra de rolagem de 17px o card tem 250px, menos que os 251px de "pagamentos".
- **Não foi usado** `overflow-wrap`/`hyphens` nem redução da fonte (24px ainda quebraria a 768px, com card de 166px).
- **Limite conhecido:** o piso depende da palavra mais larga dos títulos. Ao incluir um case novo, medir se `card >= largura da palavra mais larga + 52px` na menor largura de 3 colunas (card de 272px a 1088px; o card é `(viewport − barra − 256px) / 3`); se não, subir o corte de 1087px.
- **Cabeçalho:** os links do desktop têm 24px de caixa e 44px de área de clique (`::before`, medida com `elementFromPoint`: 108×44 e 60×44); não é defeito e ficou como está.
- **Escala de 4:** nenhuma exceção nova. **Versão:** 1.3.4 para 1.3.5.

### Hover só com mouse nos botões do cabeçalho mobile (site 1.3.8)

- **Causa:** no toque o navegador mantém o `:hover` no último elemento tocado. Sem `@media (hover: hover)`, depois de tocar no botão de menu ele ficava 2px acima e à esquerda do botão de e-mail, com a sombra de 5px, até um toque em outro lugar ou um recarregamento. Acontecia em todos os botões com `transform` no hover: menu, e-mail e os três ícones do mini-rodapé do menu.
- **Decisão:** o hover dos controles com `transform` ou sombra só vale em `@media (hover: hover)`, o mesmo padrão do `HeaderLink`. Aqui: `.site-header-mobile__cta`, `.site-header-mobile__menu` (fechado e `aria-expanded='true'`) e `.site-menu-mobile__icon-button`. Com mouse nada muda; no toque o botão não se move.
- **Cascata:** o bloco de hover fica antes do `:active`, que precisa vencê-lo. Com o menu aberto o `[aria-expanded='true']:hover` tem especificidade (0,3,0) e quem o vence é o `[aria-expanded='true']:active`, também (0,3,0), que vem depois. `header-mobile.test.ts` trava isso (bloco único, ordem das regras e nenhum `:hover` fora dele).
- **Fora desta correção:** `Button.astro` e os demais botões do site seguem como estavam. A generalização, com um teste global, veio na 1.3.9 (seção abaixo).

### Hover só com mouse no site inteiro (site 1.3.9)

- **Regra:** todo `:hover` que muda o visual (cor, fundo, sombra, deslocamento, sublinhado, borda) fica dentro de `@media (hover: hover)`, sem exceções. Vale também para os resets que só existem para anular um hover (`.btn:disabled:hover`, `.btn--icon:hover`, o reset do ghost). Com mouse nada muda; no toque o estado não fica preso no último elemento tocado.
- **Alcance:** `Button.astro` (as três variantes e o `translate`), `HeaderLink.astro` (cor), `uaiui-docs.css` (busca, segmentos, menu de páginas, links do menu lateral, copiar, cards, abas, pager, resultados da busca, links do corpo e do índice) e `color-decomposer.css` (`.btn`, resets do ghost, desativado e ícone, abas). Nenhum hover abre conteúdo, então nada precisou ficar de fora.
- **Cascata:** cada bloco ficou onde a regra estava, sem juntar no fim do arquivo, porque a ordem importa com especificidade igual. O `:active` continua depois do hover e vence; o item atual, o segmento marcado, a aba selecionada e o resultado selecionado da UaiUI docs continuam depois do hover. Seletores agrupados (`.header-link`, `.pages-toggle`, `.search-results`) foram separados: o hover vai para a media e o resto fica como era. No Color Decomposer o reset do ghost no hover e o `color: var(--muted)` ficam em blocos de media separados (o teste do ghost depende disso), logo depois do `.btn:hover`.
- **`forced-colors` da UaiUI docs:** `.nav-link:not([aria-current]):not(:hover)` virou `.nav-link:not([aria-current])` (borda `Canvas`). A borda do hover volta com `.nav-link:not([aria-current]):hover` dentro de `@media (hover: hover)`, no mesmo bloco `forced-colors`, depois da regra base e com especificidade maior. No toque a borda forte não fica presa; o item atual não é afetado.
- **Teste:** `src/styles/hover-media.test.ts` varre os `.css` e os blocos `<style>` dos `.astro` de `src/` e falha se um seletor com `:hover` (em qualquer posição, inclusive em `:not()`) estiver fora de `@media (hover: hover)`, aninhado ou combinado com `and`. `KNOWN_EXCEPTIONS` começa vazia e só pode encolher. Tem autoteste do parser. Os testes de `color-decomposer.test.ts` (ghost) e `header-mobile.test.ts` continuam valendo.
- **Pendência do `uaiui-ds` (v0.3.2), resolvida na v0.3.3 (site 1.3.10):** na v0.3.2 o pacote não tinha nenhum `@media (hover: hover)`. `button.css` (`.uai-button:hover`: fundo, cor, sombra e `translateY(-2px)`, mais o reset do ghost e o bloco `forced-colors`) e `accordion.css` (`.uai-accordion-trigger:hover`, mais o `forced-colors`) deixavam o hover preso no toque nas páginas `/projetos/uaiui/componentes/{button,accordion,toast}`. A v0.3.3 (commit `1ad90a9`) põe o hover em `@media (hover: hover)` e ajusta os blocos `forced-colors`; sem mudança de token nem de tamanho. O teste global não olha `node_modules`.
- **Versão:** 1.3.8 para 1.3.9. Depois, 1.3.10: atualização do `uaiui-ds` para a v0.3.3 (só `package.json`, `pnpm-lock.yaml` e esta nota).

### Bordas e sombras de cards accent, imagens e avatar; tag LEGADA (site 1.3.12)

- **Decisão (o código foi primeiro; Figma e código alinhados em 2026-10-25):** a borda dos cards accent e das imagens/avatar passa para a família da sombra, escurecida para chegar a 3:1 contra os fundos. Os cards neutros ficam como estão (`grey/8`, 12,71:1 sobre `yellow/1`). Depois do merge o Lucas reapontou no Figma `layout/border/accent/subtle` para `blue/5` e `component/tag/border/subtle` para `red/6` e ligou os frames mobile às variáveis (cards accent, imagens e o card de Pagamentos da home, agora com borda e sombra accent). Nenhum valor de token mudou por causa disso.
- **Tokens reapontados, sem renomear nem criar token novo:** `--border-accent-subtle` de `blue-3` para `blue-5`, `--tag-border-subtle` de `red-3` para `red-6` e `--shadow-layout-img` de `red-3` para `red-4` (a sombra segue o Figma, `shadow/img` → `red/4`). "subtle" deixou de descrever o valor nos dois primeiros; o nome não mudou de propósito. `--border-accent-strong` (`blue-4`: header e indicador do menu lateral), `--border-focus-strong` e `--tag-bg-primary` não mudaram.
- **Consumidores:** `--border-accent-subtle` não tinha nenhum e agora é usado pelo card accent da home (`CaseCard`), por `.case-problems__card` e por `.case-discovery-topics__consolidation`. `--tag-border-subtle` já era usado pelo `Tag` `secondary outlined` (só a tag LEGADA) e agora também pelo avatar do Hero e pelas imagens dos cases (Contexto, Discovery, Delivery, fluxos do Delivery e tópicos do Discovery). O `uaiui-ds` v0.3.3 não define nem consome nenhum dos dois.
- **Contraste das bordas (3:1, WCAG 1.4.11):** sobre `yellow/1` (`#fcfbf2`), `grey/1` (card neutro) e o bege do avatar (`#f5f0e8`): `blue/5` 4,47, 4,59 e 4,09; `red/6` 4,97, 5,10 e 4,55. Os candidatos mais claros não serviam: `blue/4` 2,91, 2,99 e 2,67; `red/5` 3,07, 3,15 e **2,81** (falha no avatar); `red/4` 2,25, 2,31 e 2,06. Por isso `red/6` e não `red/5`. As bordas não ficam abaixo de 3:1, então esta mudança não entra nas divergências conhecidas.
- **Tag LEGADA:** a borda `secondary outlined` passa de `red-3` para `red-6` (1,29:1 para 3,80:1 contra o próprio fundo `red-2`). É a única variante de `Tag` que muda; as filled (`primary`, `secondary`) não usam esse token. A posição vertical sobre a imagem passa de 4px para 8px (`top: var(--scale-x2)`), como no Figma desktop (573:690 e 573:764). A tag LEGADA do Figma mobile também está a 8px (y=8), então Figma e código estão alinhados desde 2026-10-25; o CSS é um só e vale 8px nos dois tamanhos.
- **Medido (1440, 768 e 320px; texto a 200% com a raiz a 200%):** a tag fica sempre dentro da imagem, a 8px do topo e da esquerda (16px a 200%), sem cortar e sem encostar no texto ao lado. A largura da imagem mais estreita (120px a 768px) comporta a tag de 55px; a 200% a tag tem 106px e a imagem 131px ou mais.
- **`forced-colors`:** sem mudança. Borda de 2px em cor do sistema e sombra `none`, antes e depois, em todos os elementos alterados e na tag.
- **Largura e escala:** bordas seguem em 2px (linha 323); nenhuma exceção nova em `KNOWN_EXCEPTIONS`; `top: 8px` é múltiplo de 4.
- **Versão:** 1.3.11 para 1.3.12.

### Cabeçalho: UaiUI DS primeiro, nome acessível e gap do logo (site 1.3.13)

Figma `98:398` (header-desktop, link-uaiui `664:363`), `695:953` (menu mobile, link-uaiui `695:961`) e `676:514` (componente do menu): o link da UaiUI passa a se chamar **UaiUI DS** e vem **antes** da Paletaria, no desktop e no menu mobile. O texto-fonte do Figma tem "ds" em minúscula e a caixa alta vem do `textCase`; no código o texto é "UaiUI DS" e a caixa alta é CSS (`.text-label-md { text-transform: uppercase }`), então no DOM não há texto em caixa alta.

- **Ordem (decisão do Lucas):** uma só para o desktop e o mobile, na própria lista `macroSections` (UaiUI DS, depois Paletaria). Os únicos consumidores de `macroSections` e `getHeaderSections()` são `Header.astro` e `HeaderMobileMenu.astro` (mais os testes); o rodapé não lê a lista e o site não tem sitemap gerado. Guarda em `navigation.test.ts` e `header-link.test.ts`.
- **Rótulo:** `label` e `shortLabel` da seção `uaiui` são "UaiUI DS". Nenhum outro lugar usa esses campos; o título das páginas ("· UaiUI"), o bloco "UAIUI" da documentação e o "UaiUI" de `UaiuiDocsLayout.astro` continuam como estavam (PR O). Medido: o texto tem 96x20px no desktop (Figma 96x24 com a altura do link) e 76,8x16px no mobile (Figma 77x16).
- **Nome acessível (decisão do Lucas):** "UaiUI DS, design system", para expandir a sigla. Campo novo e opcional `accessibleName` em `MacroSection` (decisão de configuração do Lucas; só ele existe de novo), lido por `getHeaderLinkText` e válido no desktop e no menu mobile. A Paletaria segue sem `aria-label`. O nome começa pelo texto visível (WCAG 2.5.3, rótulo no nome), o que um teste confere para toda seção do cabeçalho, sem diferença de caixa. O leitor de tela ainda lê "UaiUI DS" antes de "design system"; não foi testado com leitor de tela.
- **Ordem do Tab com o menu aberto (medida):** logo, X, Área de pagamentos, Redesign de produto, UaiUI DS, Paletaria, GitHub, LinkedIn e e-mail. O e-mail da barra fica fora do Tab com o menu aberto.
- **Versão:** 1.3.12 para 1.3.13.

**Folga do cabeçalho desktop com "UaiUI DS" e o gap de 16px (PR N, decisão do Lucas: opção A).** "UAIUI DS" tem 96px (antes "UAIUI", 60px): +36px. O cabeçalho passa a precisar de **762px** no tablet (768 a 1183px) e de **1176px** a partir de 1184px. Medido (Playwright, Chromium; largura máxima de `.site-header__inner` contra a largura útil da página; barra de 15px é a do Chromium no Linux):

| Largura | Rótulo antigo (com / sem barra) | UaiUI DS, gap 32px (com / sem) | **UaiUI DS, gap 16px (com / sem)** |
|---|---|---|---|
| 768 | 27 / 42 | −9 / 6 | **7 / 22** |
| 820 | 79 / 94 | 43 / 58 | **59 / 74** |
| 1024 | 283 / 298 | 247 / 262 | **263 / 278** |
| 1183 | 442 / 457 | 406 / 421 | **422 / 437** |
| 1184 | 29 / 44 | −7 / 8 | **9 / 24** |
| 1191 | 36 / 51 | 0 / 15 | **16 / 31** |
| 1216 | 61 / 76 | 25 / 40 | **41 / 56** |
| 1280 | 125 / 140 | 89 / 104 | **105 / 120** |
| 1440 | 285 / 300 | 249 / 264 | **265 / 280** |

Com barra de 17px (Windows), tire 2px de cada valor "com barra": 5px em 768, 7px em 1184 e 14px em 1191.

- **Falha sem a correção:** não havia rolagem horizontal. O "Sobre mim" encolhia e quebrava em duas linhas (70px de altura contra 54px) e o cabeçalho crescia 16px, em 768px (−9px) e em 1184px (−7px), com barra.
- **Decisão:** o `gap` de `.site-header__inner` passou de 32px para 16px (`var(--scale-x4)`), uma só linha, nas duas faixas. Não há B (subir o ponto de 1184px, que também define o padding de 88px da UaiUI docs), C (40px entre links e botões), D (padding de 80px) nem T2 a T4 (gaps do tablet).
- **O 32px era só o mínimo entre o logo e os links:** o `space-between` reparte o resto, então em 1440px a distância é a mesma de antes (os botões não se mexem: "Sobre mim" e "Contato" ficam nas mesmas posições antes e depois, em 768, 1184, 1191 e 1440px). A distância visual só cai nas pontas de cada faixa: 23px com barra de 15px e 21px com 17px em 768px (eram 32px mínimos), e 25px em 1184px; ela volta aos 32px ou mais a partir de uns 777px e 1191px.
- **Medido na build:** "Sobre mim" em uma linha (54px de altura) em 768 (barras de 15px, de 17px e sem barra), 777, 1184, 1191 e 1440px; o cabeçalho mantém 127px de altura a partir de 1184px (123px no tablet, como antes) e `scrollWidth` igual ao `clientWidth` em todas as larguras. `aria-current` (página e "true" nas páginas internas da UaiUI) e o sublinhado seguem como estavam.
- **Fora do escopo:** o cabeçalho desktop **já transbordava a 200% de texto** (raiz a 200%, em todas as larguras: folga de −194px a −767px com o rótulo antigo), e continua transbordando (−219px a −807px; o novo rótulo soma 72px e o gap de 16px devolve 32px). Não foi tratado nesta PR.
- **Menu mobile (320 e 360px, 100% e 200%):** "UAIUI DS" tem 76,8x16px (153,6x32px a 200%), os links têm 44px (88px a 200%), o painel não ganhou rolagem horizontal (`scrollWidth` igual ao `clientWidth`) e o documento fica igual ao da `main`.

### UaiUI — PR O1 (densidade dentro do exemplo e duas zonas de CSS) — site 1.3.14

Primeira de três PRs que refazem as páginas da documentação da UaiUI pelo Figma `666:17` (Button, desktop): O1 (esta), O2 (shell) e O3 (conteúdo). O mobile `667:178` está desatualizado e não é usado. Plano e decisões do Lucas na conversa; aqui só o que a O1 fez.

**Duas zonas de CSS (decisão do Lucas):** `uaiui-docs.css` é o **chrome** (cabeçalho da área, menu, títulos, divisores, callouts, paginação, busca e o controle de densidade) e `uaiui-docs-ds.css` é a **zona do DS** (exemplo, abas, palco, bloco de código e tabelas). Só o `UaiuiDocsLayout.astro` importa os dois, o do DS depois. Cada arquivo tem a sua regra, guardada por `uaiui-docs.test.ts`:
- **Chrome:** tokens do wrapper (`--ui-*`, `--interface-function-*`) e tokens semânticos do site (`--surface-*`, `--text-*`, `--border-*`, `--icon-*`, `--button-*`, `--tag-*`, `--shadow-*`); nunca primitivos de cor (`--blue-5`…) nem cor fixa.
- **DS:** só tokens do wrapper e sombras na escala do DS (`--shadow-offset-layout`, 4px); nenhum token semântico do site (o teste lê `semantics.css` e `tokens-wrapper.css` para saber quais são). A lista de seletores de cada zona também é conferida.
- `--uaiui-docs-layout-shadow` é declarada nos dois arquivos (o `var-usage.test.ts` confere por arquivo), e `var-usage.test.ts` ganhou o caminho do arquivo novo. Nenhum token foi criado, renomeado ou removido e o pacote `uaiui-ds` não mudou.
- A divisão não mudou nenhuma regra: o resto do CSS foi movido como estava (só o palco e a densidade mudaram).

**Densidade dentro do exemplo (Figma 704:751; decisão do Lucas):**
- Cada `Example` tem o seu controle, **dentro do painel Preview, abaixo do palco**: some com a aba Código. A Introdução e Tokens e temas não têm exemplo e ficam sem controle.
- Rádios nativos, um `fieldset` por exemplo, com `name` próprio (`<id do exemplo>-densidade`): rádios de exemplos diferentes com o mesmo `name` formam um grupo só e quebram o Tab e as setas (medido: um tabstop por grupo e setas dentro do grupo). A escolha vale para a página toda: o script marca a mesma opção em **todos** os grupos, muda `data-uaiui-density` no wrapper e salva em `localStorage` (`uaiui-density`, a mesma chave de antes; Desktop remove a chave). A opção salva é aplicada antes da pintura: o atributo no início do wrapper e os rádios num script inline no fim dele.
- **Aviso:** a mudança é anunciada no `role="status"` da página ("Densidade da página: Mobile."), como o "Código copiado.".
- **Visual (tokens do site, como no desenho):** legenda "DENSIDADE" JetBrains Mono Bold 12 em caixa alta, `--text-body-neutral-subtle` (5,78:1 sobre `#fcfeff`); três opções do botão ghost do site (JetBrains Mono Bold 16, `--text-label-primary`), cada uma com 12px de padding lateral, 46px de altura (8 + 24 + 8 e a borda de 3px) e o sublinhado de 2px (48px no total, em todas, para a opção marcada não "pular"). Marcada: texto `--text-label-accent` (`blue/5`, **4,59:1** sobre `#fcfeff`, como no Figma) e sublinhado `--border-accent-subtle` (`blue/5`; o `border-accent-strong` dava 2,99:1). Medido: 97,2x48, 87,6x48 e 106,8x48px; todas acima de 44px.
- **Hover (só com mouse):** fundo e borda do hover do ghost (`--button-bg-primary-outline-hovered` e `--button-border-primary-subtle`, purple-2), **só nas opções não marcadas**: o texto accent sobre o purple-2 daria 2,96:1. O headless não tem hover; a regra foi medida copiando-a para fora do `@media`.
- **Foco:** o anel do DS, em volta da opção inteira. **forced-colors:** as bordas transparentes viram `CanvasText` nesse modo, então ficam em `Canvas`; a opção marcada usa `Highlight` no texto e no sublinhado (medido: marcada `Highlight`, as outras `Canvas`, e o anel de foco aparece).
- O Figma pinta a borda do ghost inativo em `#fcfbf2` (quase invisível sobre `#fcfeff`); no código ela é transparente.
- Palco: 32/24/48/24 no desktop (Figma 666:140) e 24/16/32/16 abaixo de 768px (sem molde; o controle ocupa 0/16/24/16 no celular e 0/24/32/24 do tablet em diante). A 320px a terceira opção ("Compacto") vai para a linha de baixo (a largura útil é de 229px).
- **Cabeçalho da área:** perde a densidade. O contêiner de ferramentas só tem a busca e não aparece abaixo de 768px (nesse tamanho a busca é o botão da lupa ao lado de "Páginas"): sem ele sobrava um vão de 16px. O que é do shell (a busca no menu, o bloco de título, o menu) fica para a O2.

**Medido (Playwright, Chromium; antes é a `main`, depois é a O1):** a altura do bloco de título foi de 350 para 222px a 320px, de 282 para 198px a 360px, de 292 para 288px a 768px e de 223 para 220px a 1440px. `scrollWidth` de todas as páginas, em 320, 360, 768 e 1440px a 100% e a 200% de texto, idêntico antes e depois (falhas que já existiam e seguem: Tokens e Toast a 320px a 200%, e todas as páginas a 768 e 1440px a 200%).

**Escala de 4:** nenhuma exceção nova (as medidas de 46 e 48px vêm do conteúdo e das bordas, não de largura ou altura declarada). **Contraste:** nada abaixo de 4,5:1 no texto. **Versão:** 1.3.13 para 1.3.14.

**Com só a O1 no ar:** a densidade sai do cabeçalho da área e vai para o fim do Preview de cada exemplo (Accordion, Button e Toast); a Introdução e Tokens e temas perdem o controle; o palco ganha folga embaixo; o bloco de título fica mais baixo no celular. O resto (menu, busca, títulos, paginação, callouts, tabela) continua como estava até a O2 e a O3.

### UaiUI — PR O2 (shell da documentação: cabeçalho, menu, divisores e paginação) — site 1.3.15

Segunda das três PRs pelo Figma `666:17` (Button, desktop; sessão de leitura, sem editar). Só o shell: callouts coloridos, tabela, ritmo e gaps das seções, cards da Introdução e amostra de cores ficam para a O3. O cabeçalho do site (PR N) não mudou. Plano e decisões do Lucas na conversa; aqui só o que a O2 fez.

**Cabeçalho da área (666:70):** "UaiUI design system" (`<p>`, Plus Jakarta Sans ExtraBold 36, caixa alta, `--text-body-primary-strong`; o `<h1>` continua o da página) e o subtítulo novo "Meu sistema de design multitema e agnóstico para projetos pessoais, estudos e em breve disponível no GitHub." (DM Sans 24, `--text-body-neutral-strong`), padding 48/88/48/88 e gap 24 em 1184px ou mais. Sem busca e sem densidade. Divisor de 3px de largura total sob ele (`--surface-bg-accent-strong`), a 127 + 200px = 327px da página (o Figma tem 201px de altura: arredondamento do texto). Tablet: 36 e 20px, padding 48/20; celular: 32 e 16px, padding 32/20, gap 16 (sem molde). O vão do contêiner de ferramentas, que a O1 deixou, acabou junto com a busca. `overflow-wrap: anywhere` no título para o texto a 200%.

**Grade (666:91, 666:92, 666:119):**
- **Desktop (1184px ou mais):** menu de 360px (88 de padding à esquerda, campo fluido de 221px, 48 à direita e a linha vertical de 3px) e conteúdo na coluna que sobra, **até a borda direita da tela**. Acima de 1440px a grade de 1440 continua centralizada: uma primeira coluna vazia (`max(0px, (100% - 1440px) / 2)`) empurra o menu e o conteúdo, a linha vertical acompanha o menu, e o fundo `--surface-bg-neutral-subtle` do conteúdo vai até a borda (medido a 1920px: menu em x=232,5, linha em 589,5 a 592,5 e conteúdo de 592,5 a 1905). O cabeçalho da área, com o divisor, e o site usam o mesmo box de 1440px.
- **Tablet (768 a 1183px):** menu de 288px (20 à esquerda, 32 à direita e a linha de 3px: campo de 233px), conteúdo com recuo de 32 e 20 à direita. **Celular:** uma coluna, sem linha vertical; o conteúdo também tem o fundo `neutral/subtle`, de ponta a ponta, e o recuo é o gutter de 20px.
- Conteúdo: padding 40/88/88/48 em 1440px (o texto numa coluna de até 944px, que vem do `max-width` de cada bloco); título, corpo e paginação com `max-width: 944px`.
- O fundo da área passou a ser o do site (off-white); antes era `--ui-bg-page` em tudo.
- **Linha vertical (704:734) e divisores:** pseudo-elementos com fundo; em `forced-colors` ganham `forced-color-adjust: none` e `CanvasText`. A linha do menu é `nav::after`, na altura toda do shell; o menu em si é `position: sticky` (top 40px, `max-height` da janela e rolagem própria, com 4px de folga em volta para o anel de foco não ser cortado).

**Menu (666:92):**
- **Busca (703:2050):** primeiro item do `<nav aria-label="Documentação do UaiUI DS">`, 44px, borda de 2px `--border-neutral-strong`, fundo `--surface-bg-neutral-subtle`, texto DM Sans 14 `--text-body-neutral-subtle` com reticências (o Figma também corta: "Buscar na documen…"; **na O3 o texto visível virou "Buscar"**, com o `aria-label` "Buscar na documentação"), ícone `--icon-neutral-3`. `aria-keyshortcuts="Control+K Meta+K"` (e na lupa do celular); o `<kbd>Ctrl K</kbd>` fica no HTML com `hidden`, como o Figma o deixa oculto. Hover (só com mouse): fundo purple-2 (`--button-bg-primary-outline-hovered`) e texto `--text-body-neutral-strong` (11,30:1). **Só a partir de 768px**; abaixo disso a lupa ao lado de "Páginas" continua e o campo do menu não aparece (`display: none`, fora do Tab e da árvore de acessibilidade), para não haver dois controles da mesma função.
- **Rótulo do grupo:** DM Sans Medium 12, caixa alta, `--text-body-neutral-subtle`, `letter-spacing` do corpo (`--letter-spacing-comfortable`). Antes era JetBrains Mono Bold.
- **Item (704:670):** JetBrains Mono Bold 16, caixa alta, `--text-label-primary`, 46px (8 + 24 + 8 e a borda de 3px, sem altura declarada), 4px entre itens, 32px entre grupos e entre a busca e o primeiro grupo, 40px acima da busca. Hover (só com mouse): o do botão ghost do site, **só nos não ativos** (fundo purple-2, `--button-bg-primary-outline-hovered`, e borda `--button-border-primary-subtle`): o texto `--text-label-primary` sobre purple-2 tem 7,40:1. A área clicável e o anel de foco acompanham o texto e a tag.
- **Item atual:** texto `--text-body-accent-strong` (`blue/6`, 6,48:1; o Figma usa `blue/5`, 4,47:1, que reprova), indicador de 3px na borda esquerda do item em `--border-accent-subtle` (`blue/5`, 4,47:1 sobre o off-white; o Figma usa `blue/4`, 2,91:1), 12px do indicador ao texto (o texto avança 15px em relação aos outros: 3 do indicador e 12 do espaço, como o Figma). O indicador é a borda do item, então persiste em `forced-colors` (borda e texto em `Highlight`). Não muda no hover.
- **Tag "novo" (704:728):** a `secondary outlined` do site (`--tag-bg-secondary`, `--tag-border-subtle`, `--text-label-extra-1`, 6,17:1), 16px do texto, 40,8x20px.
- **Celular:** o painel aberto pelo botão "Páginas" tem a mesma lista com os mesmos itens; o fundo, a borda e a sombra do painel não mudaram.

**Textos e títulos:** h1 `--text-body-primary-strong` (ExtraBold 32 no desktop), linha de apoio `--text-body-neutral-strong` (20px), h2 `--text-body-primary-strong` (Bold 28), todos como chrome, com tokens do site (decisão do Lucas). O `<title>` termina em "· UaiUI DS" ("Button · UaiUI DS"). O texto das páginas que diz "UaiUI" não mudou.

**Divisor entre seções:** `h2::before` de 156×3px em `--surface-bg-accent-strong`, **na borda esquerda da coluna do conteúdo** (fora do recuo de 48px, Figma 704:749), no lugar da linha de 2px acima de cada `h2`. Vale também para o primeiro `h2` das páginas sem exemplo (Introdução e Tokens), entre o título e a primeira seção. O espaçamento ficou como estava (16px de `gap` mais 32px de margem acima e 24px entre o divisor e o título; o primeiro `h2` fica sem a margem). O ritmo de 40px do Figma em volta do divisor entra na O3. **No celular** o divisor também sai para a borda esquerda da coluna, que ali é a borda da tela (como o divisor do menu mobile do site, que começa em x=0); o `scroll-margin-top` do `h2` (altura do cabeçalho sticky + 8px) mantém o divisor visível numa âncora `#id`.

**Paginação (666:215):** cartões de 240×94px (medido 240×93,7) a partir de 768px, fluidos no celular e em coluna; borda de 2px `--border-accent-subtle`, fundo `--surface-bg-off-white-primary`, sombra `--shadow-layout-accent` (5px; a de 4px do DS, da PR A, saiu), rótulo (14px) e título (DM Sans SemiBold 20) em `--text-body-accent-strong` (6,48:1), ícone `--icon-accent`. Hover (só com mouse): `--surface-bg-accent-subtle` (6,65:1). Os cartões quebram linha a 200% de texto em vez de passar da tela.

**"Nesta página" removido, em todas as larguras (decisão do Lucas):** saíram o `<nav data-toc>` do layout, a montagem e o `IntersectionObserver` do `docs.ts`, as regras `.uaiui-docs__toc*`, o bloco de 1280px (grade de 240 + 728 + 200) e o `forced-colors` do `aria-current` do índice, a asserção do script em `componentes.test.ts` e o comentário do `accordion.astro`. Ficam os `id` dos `h2` (os links `#id` funcionam), o `role="status"` e o `scroll-margin`. **Fora do escopo:** o "Nesta página" dos cases (`SideMenu.astro`, `CaseAccordion.astro`) e o do Color Decomposer.

**Contrastes medidos (WCAG, a partir dos primitivos; ver o teste de contraste do `uaiui-docs.test.ts`):** item do menu 11,17:1; item no hover (purple-2) 7,40:1; item atual 6,48:1; paginação 6,48:1 e, no hover, 6,65:1; rótulo de grupo 5,63:1; busca 5,78:1 e, no hover, 11,30:1; tag 6,17:1; título da área 11,17:1; h1 e h2 11,47:1; subtítulo 17,06:1. Bordas e indicadores: indicador do item e borda da paginação 4,47:1 e 4,59:1; borda da busca 12,71:1; borda da tag 4,97:1.

**Divergências conhecidas (decorativas, abaixo de 3:1):** o divisor de 3px sob o cabeçalho, a linha vertical, o divisor curto das seções (`--surface-bg-accent-strong`, 1,98:1 sobre o off-white e 2,04:1 sobre o `neutral/subtle`) e a sombra da paginação (`blue/4`, 2,91:1) não carregam informação sozinhos (o menu tem rótulos e o `h2` tem o título), como os divisores azuis do menu mobile do site (1,98:1).

**Divergências do Figma (a corrigir lá):**
- O item atual do menu usa texto `blue/5` e indicador `blue/4`: o código usa `blue/6` e `blue/5` (contraste).
- O rótulo da paginação usa `blue/5` (4,47:1): o código usa `blue/6`.
- A busca do menu mostra "Buscar na documen…" (o texto não cabe em 221px). Sugestão para o Figma: texto mais curto ("Buscar") ou o campo mais largo.
- O Figma só existe em 1440px: o fundo do conteúdo a 1920px, o tablet e o celular (menu de 288px, recuos, paginação em coluna) não têm molde. O frame mobile `667:178` continua desatualizado.
- As larguras de 221 (campo da busca), 261 e 451 (tabela) e 46 (item) não são múltiplos de 4; o campo e o item são fluidos (a largura vem do menu e a altura de 46px do conteúdo). Nenhuma exceção nova em `KNOWN_EXCEPTIONS`: as classes e os pseudo-elementos de 3px (divisor sob o cabeçalho, `h2::before` e `nav::after`) entram em `SHAPE_CLASSES`/`SHAPE_SELECTORS`, no `spacing-scale.test.ts`; o indicador do item é uma borda.

**Escala de 4:** o resto do CSS usa só tokens de escala; `calc(... + 3px)` nos paddings do menu é a linha vertical de 3px (campo de 233 e 221px). **Medido (Playwright, Chromium; antes é a `main`, depois é a O2):** nenhuma rolagem horizontal em 320, 360, 768, 1024, 1184, 1440 e 1920px a 100% de texto, nas cinco páginas, antes e depois; a 200%, nada pior que antes (Tokens a 320px ficou menor, e o pager em 768px, que passava da tela em 121 a 135px, agora quebra linha). Sobram as falhas que já existiam: Toast a 320px (o ícone de fechar do DS, no preview) e o cabeçalho do site a 200% em 768px ou mais. **Versão:** 1.3.14 para 1.3.15.

**Com a O2 no ar:** o cabeçalho da área vira "UaiUI design system" com o divisor de 3px; a busca fica no topo do menu (a lupa só no celular); o menu ganha itens em JetBrains Mono, o indicador do item atual e a tag nova; os `h2` abrem com o divisor curto em vez da linha de 2px; a paginação passa a ter os cartões azuis com sombra de 5px; o fundo do conteúdo vai até a borda direita; o "Nesta página" some. Callouts, tabelas, ritmo e cards continuam como estavam até a O3.

### UaiUI — PR O3 (conteúdo das páginas: callouts, tabela, ritmo, títulos e cards) — site 1.4.0

Última das três PRs pelo Figma `666:17` (Button, desktop; sessão de leitura, sem editar: callouts 666:160 e 666:162, tabela 666:166, seções 666:141, 666:151, 666:164 e 666:212, título 666:120, divisores 704:749, 704:807, 704:808 e 704:809). Só CSS, os modificadores dos callouts nas páginas e o texto da busca. Nenhum texto de conteúdo das páginas mudou, nenhum token novo, o pacote `uaiui-ds` ficou como estava e `KNOWN_EXCEPTIONS` não ganhou nada. Plano e respostas do Lucas na conversa; aqui só o que a O3 fez.

**Callouts (666:160, 666:162):** três variantes da mesma classe, pelo modificador no HTML (sem ler o texto): `uaiui-docs__callout--use` ("Quando usar", fundo `--surface-bg-quaternary-subtle`, verde), `uaiui-docs__callout--avoid` ("Quando não usar", `--surface-bg-tertiary-subtle`, rosa) e o neutro, sem modificador (`--ui-bg-panel`). Borda de 2px com 8px à esquerda em `--border-neutral-strong` (decisão do Lucas; o Figma usa `#13191e`, que ele religa à variável), texto `--text-body-neutral-strong`, padding 16/20, código em linha em 0,875em com `letter-spacing: 0` (o Figma alterna 12 e 14px). **Mapa:** Button, Accordion e Toast têm um de usar e um de não usar cada (6); Introdução ("Esta é a primeira versão…") e Tokens e temas ("Só entram no arquivo…") têm um neutro cada (2). Accordion e Toast não têm callout neutro. O significado não depende da cor: o texto abre com "Quando usar." / "Quando não usar." e, em `forced-colors`, o fundo some e as bordas de 2px e de 8px ficam em `CanvasText` (medido: 8px sólido, preto, e fundo branco).

**Tabela (666:166), a das props, a "Anatomia" do Toast e "Camadas" de Tokens e temas** (zona do DS, só `--ui-*`): borda externa de 2px em `--ui-border-strong`; cabeçalho (`--ui-bg-panel`, JetBrains Mono Bold 12 em caixa alta) com a borda de baixo em `--ui-border-strong` (no lugar do `#2a3136` do Figma, decisão 15); linhas separadas por `--ui-border-field` (o `#7a8289`), sem linha depois da última; `letter-spacing: 0` no código das células. Colunas **fluidas** (`table-layout: auto`, sem largura nem percentual): saíram os 128/208/100px da O1. Para a tabela de props ficar parecida com o Figma (128/261/100/451) sem fixar nada, o código das três primeiras colunas não quebra (`white-space: nowrap`) e a descrição fica com o resto, com `min-width: 320px` (múltiplo de 4) para não ficar estreita no celular; a tabela rola e a região continua com `tabindex="0"`, `role="region"` e rótulo. Medido a 1440px: 106/238/83/498 (Figma 128/261/100/451); a 320px a tabela tem 779px de largura e rola dentro dos 265px da região.

**Ritmo (704:749, 704:807 a 704:809, col-intro 704:748):** 40px acima do divisor curto e 40px entre o divisor e o título, 24px do título ao primeiro bloco da seção (decisão 10, em todas as seções, também a "Uso", que no Figma tem o título a 24px do topo e 16px até o código), 16px entre os blocos de uma mesma seção, 40px do último bloco à paginação e **88px** (`--scale-x20`) da paginação ao fim do conteúdo a partir de 768px (64px no celular; o Figma tem 88). O título da página fica a **24px** do primeiro bloco quando ele é o exemplo (o `col-intro` do Figma) e a **40px** quando é um divisor (Introdução e Tokens e temas). Medido (1440px, 320px e 768px, cinco páginas): 40/40/24 em todas as seções, 24 ou 40 do título da página, 40 até a paginação, 88 e 64 no fim. A "Instalação" em 16px é o padrão do corpo (sem regra).

**h3 dos exemplos:** o estilo do h2 em escala menor: Plus Jakarta Sans Bold, `--text-body-primary-strong` (11,47:1), line-height compacto, **20px no celular e 24px a partir de 768px** (o h2 tem 24 e 28px). O Figma 666:17 não tem h3: a escala é nossa.

**Cards da Introdução:** o visual dos cartões da paginação: padding 16, borda `--border-accent-subtle`, fundo `--surface-bg-off-white-primary`, sombra `--shadow-layout-accent` (5px), hover só com mouse em `--surface-bg-accent-subtle`; nome em DM Sans SemiBold 20 em `--text-body-accent-strong` (blue/6, 6,48:1) e descrição em 16px `--text-body-neutral-strong`. O `a` do corpo tinha maior especificidade e pintava o card na cor de link: a descrição agora declara a cor, e o nome usa o seletor `.uaiui-docs__body .uaiui-docs__card h3` para ganhar do h3 do corpo.

**Amostra de cores:** sem mudança de visual; conferido nas capturas que o fundo `neutral/subtle` do conteúdo e os tokens novos do chrome não a quebram (a borda de 2px de cada amostra continua separando as cores do fundo).

**Busca do menu:** o texto visível passa a "Buscar" e o botão do menu ganha `aria-label="Buscar na documentação"` (o nome acessível começa pelo texto visível, WCAG 2.5.3); a lupa do celular continua com o `aria-label` dela. Com isso o texto não é mais cortado em 221px.

**Contrastes medidos (WCAG, a partir dos primitivos; testes em `uaiui-docs.test.ts`):** callout verde 14,85:1; callout rosa 16,66:1; callout neutro (`--ui-bg-panel`, `#d6dee6`) 13,03:1; h3 11,47:1; nome do card 6,48:1 e, no hover, 6,65:1; descrição do card 17,06:1 e, no hover, 17,51:1; tabela: texto 17,51:1 sobre a página e 13,03:1 sobre o cabeçalho. Bordas: callouts 11,07:1 (verde) e 12,41:1 (rosa); borda do card sobre o `neutral/subtle` 4,59:1; linhas da tabela (`--ui-border-field`) 3,86:1 e borda forte 17,51:1.

**Divisores e sombras (decorativos, abaixo de 3:1):** continuam os da O2 (divisores azuis 1,98:1 e 2,04:1, sombra `blue/4` 2,91:1).

**Medido (Playwright, Chromium; antes é a `main` `6d8f918`):** nenhuma rolagem horizontal a 100% de texto em 320, 360, 768, 1024, 1184, 1440 e 1920px nas cinco páginas; a 200% nenhum elemento da área passa da largura útil, fora o ícone de fechar do Toast a 320px (328 contra 305, que já era assim na `main`, está no DS); o cabeçalho do site a 200% em 768px ou mais continua passando da tela, como antes. Tab (1440): cabeçalho do site, "Buscar na documentação", itens do menu, abas, controles do exemplo (mesma ordem visual); Ctrl K abre a busca com o foco no campo. Foco da tabela e do card: anel de 2px.

**Divergências que continuam entre o Figma e o código (fechamento do registro da PR O; o Figma será ajustado pelo Lucas):**
- Stroke dos callouts em `#13191e`: religar a `--border-neutral-strong`.
- Cabeçalho da tabela com borda inferior `#2a3136`: usar o equivalente a `--ui-border-strong` (e as linhas a `--ui-border-field`, o `#7a8289`).
- Larguras da tabela 128/261/100/451 (e 221 do campo e 46 do item): fluidas no código; no Figma as colunas vêm do conteúdo.
- Código das células da tabela com 1px de espaçamento entre letras (no Figma): 0 no código, como o código em linha.
- Código dos callouts com 12 e 14px misturados: 14px (0,875em) em todos.
- Seção "Uso" com título a 24px do topo e 16px até o primeiro bloco: 0 e 24px, como as outras (decisão 10).
- Busca do menu com "Buscar na documentação" cortada: texto visível "Buscar" (`aria-label` "Buscar na documentação").
- Item atual do menu com texto `blue/5` e indicador `blue/4`, e rótulo da paginação em `blue/5`: o código usa `blue/6` e `blue/5` (contraste).
- Sem molde no Figma: h3 dos exemplos (20 e 24px), cards da Introdução, amostra de cores e os frames de 1920px, tablet e celular (o frame mobile `667:178` continua desatualizado).
- Decorativos abaixo de 3:1: divisores azuis, linha vertical do menu e sombra da paginação (ver a O2).

**Escala de 4:** nenhum valor novo fora da escala; o único literal novo é o `min-width: 320px` da descrição (múltiplo de 4). **Versão:** 1.3.15 para 1.4.0.

**Com a O3 no ar:** os callouts de "Quando usar" ficam verdes e os de "Quando não usar" rosa (os neutros seguem cinza-azulados); as tabelas ganham borda de 2px, cabeçalho e linhas pelos tokens do DS e colunas pelo conteúdo; as seções passam a ter 40px em volta do divisor e 24px até o conteúdo, com 88px no fim da página no desktop; os títulos dos exemplos acompanham os das seções; os cards da Introdução ficam iguais aos da paginação; a busca do menu mostra "Buscar".

**Lembrete:** atualizar este arquivo (`docs/design-notes.md`) também no projeto do Claude Desktop.
