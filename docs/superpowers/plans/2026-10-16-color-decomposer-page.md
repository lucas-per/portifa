# Color Decomposer em /ferramentas/color-decomposer/ (fase 1) — Plano de Implementação

**Goal:** Página da ferramenta com cabeçalho e rodapé do site, sem link no cabeçalho, sem mudar o comportamento da ferramenta.

**Spec:** `docs/superpowers/specs/2026-10-16-color-decomposer-page-design.md`

**Branch:** `feat/color-decomposer-page`, a partir da `main`. Sem push na `main` e sem merge.

## Tasks

- [x] **1. Dependência.** `pnpm add github:lucas-per/color-decomposer#v0.2.0`; conferir que o lockfile aponta para o commit de merge da tag e que só `src/`, `LICENSE`, `README.md` e `package.json` chegam ao `node_modules`. Versão do site: 1.1.0 (minor, página nova).
- [x] **2. JS.** Copiar `main`, `state`, `strings`, `help` e `chrome.js` da tag para `src/components/tools/color-decomposer/`, com o cabeçalho de origem. Só `main.js` e `chrome.js` mudam (imports e `applyChrome` com elemento raiz).
- [x] **3. Markup.** `ColorDecomposer.astro` com o `<body>` do `index.html` dentro de `<div class="cd" data-theme="light">`; `<main class="stage">` vira `<div>`; `data-umami-event` nos três botões de exportação; `<script>` importa `main.js`.
- [x] **4. CSS.** `src/styles/tools/color-decomposer.css` gerado do `app.css` com todo seletor prefixado por `.cd`, sem `@font-face` e sem a regra de `html`. Conferir com `diff` que o resto é idêntico.
- [x] **5. Layout e página.** `BaseLayout`: props `path` e `umamiExcludeHash`. `src/pages/ferramentas/color-decomposer/index.astro` com título e descrição do app e `scroll-padding-top` no celular.
- [x] **6. Testes.** `state.test.ts` (hashes de referência, ida e volta, valores inválidos); `color-decomposer.test.ts` (todo seletor começa por `.cd`, sem `@font-face`); `var-usage.test.ts` aceita, só no CSS da ferramenta, as variáveis declaradas nele e as definidas em tempo de execução.
- [x] **7. Navegador, local.** Comparar app (tag) e página com os mesmos hashes em 1440, 820 e 375px: estilo computado de cada elemento, textos, rótulos dos tons, variáveis do tema, hash, título, as quatro exportações, teclado e Ajuda. Umami com o script real e `/api/send` interceptado: arrastar slider não gera requisição; controle sem `data-exclude-hash`. axe em claro, escuro e mobile. Cabeçalho, rodapé e `<html>` iguais aos da home no modo escuro da ferramenta.
- [x] **8. Docs.** Escala de forma e entrada da página em `docs/design-notes.md`; esta spec e este plano.
- [x] **9. Preview do Cloudflare.** Repetir as verificações do passo 7 no preview da branch e capturar 1440, 1024, 820 e 375px.
