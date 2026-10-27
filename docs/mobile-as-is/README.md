# Color Decomposer — protótipo mobile (as-is)

Levantamento da produção para montar o protótipo no Figma. Nada no código foi alterado.

- **Página:** https://lpereira.me/ferramentas/color-decomposer/
- **Largura:** 360px (viewport 360×800, screenshot em 2x → PNG de 720px de largura)
- **Navegador:** Chromium 155.0.8059.39 via Playwright (`playwright-core`), `prefers-reduced-motion: reduce`, `prefers-color-scheme: light`, fontes aguardadas (`document.fonts.ready`)
- **Data da captura:** 2026-10-19
- **Escopo:** aba Paleta, tema Claro ("Modo de cor: Claro" selecionado por padrão)

## Estados

| # | Arquivos | Descrição |
|---|----------|-----------|
| 1 | `paleta-claro-ajustes-360.png` / `.json` | "Ajustar a cor", "Ajustes básicos" e "Ajustes avançados" abertos; "Adicionar cor de apoio" fechado; sem painel de detalhes |
| 2 | `paleta-claro-detalhe-marca-360.png` / `.json` | Estado 1 + painel de detalhes aberto no tom **100** (#E7398A), o que traz o marcador "Sua cor" |

Cabeçalho e rodapé do site aparecem só no PNG (sem medidas no JSON). O cabeçalho/rodapé da própria ferramenta (`header.top`, `footer.foot`) estão medidos.

## JSON

`meta` (página, viewport, data, navegador, fontes) + `blocks[]` na ordem do DOM, com: `selector`, `path`, `box` (x, y, w, h em px da página), `padding`/`margin` (`[top,right,bottom,left]`), `gap`, `borderRadius`, `borders`, `colors` (fundo, texto e bordas em hex; `#RRGGBBAA` quando há alpha), `text` (família, tamanho, peso, altura de linha, letter-spacing, transform) e `nonMultipleOf4`.

`nonMultipleOf4` lista largura, altura, padding, margin, gap, font-size e line-height que não são múltiplos de 4 (exceto 0, 1 e 2). x/y não são checados. Muitos itens são herdados de `line-height` fracionária (ex.: 16,9 e 18,2 px) e de textos de 13/14/15 px; os mais recorrentes: gap 6, padding vertical 10, ícones de 18 px, largura 159. Alturas como 18,19 ou 33,78 vêm do line-height em unidade relativa.

## Divergências em relação ao descrito

1. **Mini paleta com o seletor de cor ("Cor da marca")** fica fora de "Ajustar a cor", entre "Redefinir" e o bloco; não foi citada na descrição, mas está na tela nos dois estados.
2. **Rótulos extras fora do descrito:** "Modo de cor" (Claro/Escuro) e o campo de cor da marca ficam sempre visíveis acima de "Ajustar a cor".
3. **Cabeçalho do site mobile é sticky.** Nos PNGs foi capturado com a página no topo (scroll 0).
4. **Fonte Plus Jakarta Sans** é declarada, mas fica `unloaded` em 360px (nenhum bloco da ferramenta a usa); DM Sans e JetBrains Mono carregam.
5. Sem scroll horizontal (`scrollWidth` = 360).
6. O tom da cor de marca não é fixo: foi achado pelo marcador "Sua cor" (aqui, nível 100, #E7398A, com texto #1A1818).
