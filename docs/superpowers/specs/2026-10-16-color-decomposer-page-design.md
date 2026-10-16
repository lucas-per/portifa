# Color Decomposer em /ferramentas/color-decomposer/ (fase 1) — Design

**Data:** 2026-10-16
**Status:** Aprovado (plano e ajustes do Lucas de 2026-10-16)
**Fontes:** `lucas-per/color-decomposer@v0.2.0` (`app/`, `src/`, `docs/estetica-do-site-design.md`), `docs/design-notes.md`, `docs/prd.md`

## Objetivo

Levar a ferramenta Color Decomposer para uma página do site, com o cabeçalho e o rodapé do site, sem redesenhar. A fase 1 integra; a fase 2 troca os componentes do app pelos do site e faz o tema derivado conversar com os tokens semânticos.

**Nenhum comportamento da ferramenta muda na fase 1:** estado na URL, teclado, exportações, avisos e textos.

**Fora de escopo:**
- Item no cabeçalho (desktop e mobile): PR 2, depois do frame do Figma que compara segunda linha, botão só com ícone e link no rodapé do mobile.
- Ajuda como página própria e o texto novo da Ajuda para devs (que ainda cita `npm run dev` do repositório da ferramenta).
- Remover o `app/` do color-decomposer.

## Decisões

**D1. O motor chega como dependência git fixada em tag.** `github:lucas-per/color-decomposer#v0.2.0`; o lockfile grava o commit (`95c7bbe`, o merge da PR #1 do color-decomposer). O pacote publica só `src/`, `LICENSE` e `README.md`. Atualizar o motor é criar tag nova lá e trocar a tag aqui.

**D2. O site é a interface oficial.** O `app/` do color-decomposer fica congelado (o README avisa) até a Ajuda para devs ser reescrita; depois sai. Os arquivos portados levam no topo a origem (`v0.2.0`, caminho no app) e a lista das mudanças da integração.

**D3. A Ajuda continua uma visão interna** (`view=ajuda` no hash, com `pushState`), como no app.

**D4. CSS isolado por prefixo.** Todo seletor do `app.css` passa a começar por `.cd`, o elemento raiz da ferramenta: `:root` e `body` viram `.cd`, `*` vira `.cd *`. Todas as regras ganham a mesma especificidade a mais, então a ordem entre elas não muda. Saem os `@font-face` (as fontes são as mesmas do site) e a regra de `html`. Estilos com escopo do Astro não servem: o JS cria a maior parte do DOM e esses elementos não recebem o atributo de escopo.

**D5. Fundo dinâmico só no `.cd`.** O bloco ocupa a largura do `<main>`, entre cabeçalho e rodapé, e recebe o que no app era do `body`. `applyChrome` recebe o elemento raiz e grava nele as variáveis, `data-theme` e `color-scheme`. O `<html>` do site não muda.

**D6. Item no cabeçalho:** fica para a PR 2 (ver "Fora de escopo").

**D7. Umami e metatags.** O `BaseLayout` ganha `path` (vira `og:url` e `canonical`; sem ele, nada muda nas outras páginas) e `umamiExcludeHash`, que só esta página usa: o app chama `history.replaceState` a cada ajuste e, sem o atributo, cada arraste de slider vira um pageview. Título e descrição são os do app. Exportar, Copiar tudo e Baixar arquivo recebem `data-umami-event`.

**D8. Mudanças inevitáveis no código do app, e só elas:** imports de `../src/index.js` passam para `color-decomposer`; `applyChrome(root, tokens, mode)`; `<main class="stage">` vira `<div>` com o mesmo id, classe e `tabindex` (a página já tem o `<main>` do layout); os `data-umami-event`.

**Celular:** o cabeçalho do site é sticky. A página ganha `scroll-padding-top` para o foco e os atalhos da Ajuda não pararem sob ele (WCAG 2.4.11).

## Escala de forma

A escala da UaiUI está em `docs/design-notes.md`. Na fase 1 o CSS do app fica literal; as divergências (sombras de 2 e 4px, botões e divisores com 2px) estão listadas lá e mudam na fase 2.

## Riscos da fase 2

1. Os componentes do site são renderizados no servidor com CSS de escopo; o DOM criado por JS precisa de classes globais (base da UaiUI) ou de `<template>` clonados.
2. Se o tema derivado for escrito em `:root`, muda cabeçalho e rodapé (faixa azul, SVGs de cor fixa, foco vermelho). Hoje o mapa de papéis está num lugar só (`chromeTokens`) e o elemento raiz é parâmetro.
3. Os pares de contraste do site só foram validados sobre o off-white; com fundo derivado, inclusive escuro, é preciso axe em várias cores.
4. Breakpoints (900 e 767px) e larguras (80rem e 1440px) a unificar.
5. Nomes curtos de variável (`--bg`, `--fg`) a prefixar ou mapear para os semânticos.
6. Duas faixas e o `h1` do app.
7. Interface em JS; portar para TS exige `src/index.d.ts` no motor.
8. CSP futura: o app monta `innerHTML` com `style="--c:…"`, que exige `style-src 'unsafe-inline'`.
