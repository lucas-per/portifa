# Playbook: do protótipo Figma ao código

Este documento reúne os problemas recorrentes na tradução de um protótipo Figma para código de produção, e o que fazer — tanto no código quanto na configuração do próprio arquivo Figma — para reduzir a chance de repeti-los. Não é específico de um projeto: o intuito é reutilizar este arquivo (ou linkar a URL pública dele) como base de conhecimento no início de qualquer novo projeto que envolva handoff Figma → código.

Cada seção tem: o sintoma, a causa raiz, a correção no código, e — quando aplicável — o que mudar no Figma para que o problema nem apareça da próxima vez.

---

## 1. O frame do Figma não define o que acontece fora dele

**Sintoma:** o site fica perfeito na largura exata do frame (ex: 1440px) e quebra visualmente em qualquer tela maior — geralmente sobra uma margem em branco nas laterais em vez do fundo da seção se estender até a borda.

**Causa raiz:** um frame do Figma é, por definição, uma tela de largura fixa. Ele não expressa nativamente "o que acontece se a viewport for mais larga que isso" — essa é uma decisão de responsividade que fica implícita, e é fácil implementar tudo com uma largura máxima fixa no `<body>` (ou equivalente) sem perceber que isso trava a página inteira, fundo incluso.

**Correção no código — padrão fundo full-bleed + coluna centralizada:**
Para cada seção de topo (header, hero, footer etc.):
- O elemento que carrega a cor de fundo (ou borda decorativa) fica `width: 100%` — nunca com `max-width` fixo.
- Dentro dele, um container interno separado recebe `max-width` (o valor do frame) + `margin: 0 auto`, e é ele quem carrega o padding horizontal do conteúdo.
- Resultado: em telas menores que o frame, o comportamento é idêntico ao frame original (padding encostando nas bordas). Em telas maiores, o fundo esticado acompanha a viewport e o conteúdo continua centralizado, sem esticar além do que foi desenhado.

**Como decidir isso quando o Figma não é explícito:** procure o padrão predominante dentro do próprio arquivo. Se a maioria das seções já usa auto-layout "Fill container" (largura flexível) e só uma usa largura fixa, é provável que a fixa seja a exceção a corrigir, não a regra a seguir — confirme com quem projetou antes de generalizar.

**O que mudar no Figma:** ao desenhar uma seção de topo (header, hero, footer, qualquer banda full-width), usar auto-layout com **"Fill container"** na largura, não um valor fixo em pixels — mesmo sabendo que o frame de referência tem uma largura fixa. Isso comunica a intenção ("essa banda deveria acompanhar o container pai") de forma que sobrevive à leitura automatizada do arquivo (dev mode, MCP, etc.), em vez de depender de alguém inferir a intenção olhando o número.

**Variante mais simples — quando nada precisa esticar além do frame:** nem todo bloco precisa do padrão de duas camadas acima. Se o elemento não tem nenhum fundo/borda que deva continuar até a borda real da viewport (ex: uma coluna de conteúdo com sidebar, sem banda colorida associada), o sintoma aparece diferente: em vez de "falta fundo esticando", o bloco inteiro fica **grudado numa borda com um vazio grande do outro lado** — geralmente causado por um `padding` assimétrico (só `padding-left`, por exemplo) usado sozinho, sem `max-width`/`margin: auto`, pra empurrar o conteúdo pra longe da borda. A correção aqui é mais direta: aplicar `max-width` + `margin: 0 auto` + `box-sizing: border-box` **no próprio elemento**, mantendo o padding que ele já tinha (agora incluído dentro do teto de largura via `border-box`, em vez de agir sozinho). Não é preciso separar em fundo full-bleed + coluna interna quando não há fundo para esticar.

---

## 2. Nem tudo que está "solto" no frame deve virar full-bleed

**Sintoma:** ao aplicar a correção acima, um elemento decorativo estreito (ex: um divider curto entre duas seções) ou fica grudado na borda real da tela em vez de acompanhar a coluna de conteúdo, ou vice-versa — passa a ficar preso ao conteúdo quando deveria ficar solto na borda.

**Causa raiz:** um frame do Figma mistura, na mesma árvore, elementos que são estruturais/full-bleed por natureza (a linha divisória grossa entre duas seções, por exemplo) e elementos que pertencem à coluna de conteúdo mas foram posicionados soltos no frame (não dentro do grupo de auto-layout do conteúdo). Sem essa distinção ser explícita, o código tende a tratar todos os "elementos soltos" da mesma forma.

**Correção no código:** classificar cada elemento solto individualmente perguntando "isso é parte da moldura da página (deve reagir à largura real da tela) ou é parte do conteúdo (deve reagir à largura da coluna)?" antes de decidir onde ele mora na árvore de containers. Elementos de conteúdo — mesmo decorativos, como um divider curto — devem estar dentro do mesmo container `max-width` + padding que o texto ao redor, alinhados à mesma borda esquerda que um título ou parágrafo vizinho usaria.

**O que mudar no Figma:** agrupar esses elementos decorativos dentro do mesmo frame/auto-layout do conteúdo da seção (não deixá-los soltos como camada-irmã solta no nível do frame). Se a intenção de design é que o elemento realmente comece na borda da coluna mas antes do padding interno (ou seja, alinhado à moldura, não ao texto), isso deve estar visualmente óbvio na composição do Figma — e vale a pena registrar essa distinção explicitamente numa nota.

---

## 3. `box-sizing` — o padrão do navegador não é o que o Figma mostra

**Sintoma:** um container configurado com "largura máxima = X" e padding interno acaba renderizando visivelmente mais largo que X.

**Causa raiz:** no Figma, quando você define a largura de um frame com auto-layout e um padding interno, esse padding já está *incluído* na largura total — um frame de 1440px com 88px de padding em cada lado sempre mede 1440px de ponta a ponta, com 1264px de área útil dentro. Em CSS, o comportamento padrão do navegador é o oposto (`box-sizing: content-box`): `max-width` descreve só a área de conteúdo, e o padding é somado por cima. Um elemento com `max-width: 1440px` e `padding: 0 88px` acaba medindo **1616px** de largura real — não 1440px — porque a tradução ingênua do valor do Figma para CSS herdou uma semântica diferente da pretendida.

**Correção no código:** qualquer elemento que combine `max-width`/`width` fixo com `padding` deve declarar `box-sizing: border-box` explicitamente (ou herdar de um reset global `* { box-sizing: border-box; }`, que é a solução mais robusta se o projeto ainda não tem um). Sem isso, todo número de largura vindo do Figma que já "inclui" o padding vai overshoot no código.

**Verificação:** não confie no valor declarado no CSS — meça a largura real renderizada (`getBoundingClientRect().width` via DevTools/Playwright) em pelo menos uma viewport onde o `max-width` realmente entra em ação (ou seja, mais larga que o próprio valor).

**A mesma armadilha em `flex-basis`:** `flex-basis` também segue `box-sizing`, exatamente como `width`/`max-width` — e é fácil esquecer isso porque `flex-basis` não "parece" uma medida de largura à primeira vista. Se um elemento tem `padding` declarado E você calcula manualmente um `flex-basis` que já soma esse padding (ex: `flex-basis: calc(977px + 88px)` quando o elemento também tem `padding-right: 88px` no CSS), o padding é contado **em dobro** — o navegador já soma o padding por cima do `flex-basis` (que descreve só a área de conteúdo, em `content-box`) durante o layout. O sintoma é um item flex "encolhendo" ou crescendo de forma que não bate com a conta manual, porque a soma real dos itens da linha ficou maior do que o esperado. Regra prática: `flex-basis` deve ser só a medida do **conteúdo** do item (sem padding/border), do mesmo jeito que `width` seria em `content-box` — nunca some manualmente algo que o próprio CSS do elemento já declara como padding.

---

## 4. Resets básicos somem quando você refatora a regra que os escondia

**Sintoma:** depois de remover ou reescrever uma regra CSS "antiga" que parecia fazer só uma coisa (ex: centralizar um container), um comportamento não-relacionado quebra (ex: a página passa a ter um respiro de alguns pixels nas bordas que não deveria existir).

**Causa raiz:** regras antigas às vezes resolvem dois problemas ao mesmo tempo sem deixar isso óbvio — por exemplo, `margin-inline: auto` centraliza um elemento com largura fixa, mas também *mascara* a margem padrão que o navegador aplica a certas tags (como o `<body>`, que tradicionalmente vem com `margin: 8px` do user-agent stylesheet). Ao remover a regra de centralização por não precisar mais dela, a margem do navegador volta a aparecer, sem relação nenhuma com a mudança que motivou a remoção.

**Correção no código:** ao remover ou reescrever qualquer regra de layout de alto nível (`body`, containers-raiz, wrappers globais), verificar explicitamente se ela também fazia um reset implícito (margin, padding, box-sizing) e substituir por um reset explícito equivalente, em vez de assumir que "os valores padrão do navegador são zero" — quase nunca são.

**4.1 — O inverso também acontece: adicionar `max-width`/`margin: auto` numa regra base sem revisar as media queries que já a sobrescrevem parcialmente.** Ao aplicar a correção da seção 1 (`max-width` + `margin: 0 auto` num seletor, para centralizar acima do frame de referência), é comum esse seletor já ter uma media query mobile que sobrescreve *outra* propriedade dele (tipicamente `padding`, pra um valor diferente no mobile) sem tocar em `max-width`/`margin`. O resultado não quebra visualmente no mobile isolado (o valor herdado geralmente não causa overflow visível numa tela estreita), mas fica um resíduo morto no computed style — e é fácil de esquecer porque nada "parece" errado até alguém auditar. **Correção:** sempre que adicionar `max-width`/`margin: auto` numa regra que já tem uma media query menor sobrescrevendo parte dela, resetar explicitamente as duas propriedades (`max-width: none; margin: 0;`) junto do resto da regra mobile, mesmo sem sintoma visual — mesmo padrão que o elemento-irmão análogo já deveria seguir (ex: `.case-layout__content-inner` → `.case-header__inner`).

---

## 5. Interações e timing que um frame estático não mostra

Figma (fora de smart-animate simples) não simula bem: scroll, offsets calculados dinamicamente, ou o momento exato em que um elemento colapsa/expande. Dois padrões de bug que aparecem com frequência:

**5.1 — Calcular offset de scroll antes de uma mudança de layout terminar.** Se clicar em uma âncora precisa, ao mesmo tempo, colapsar algum elemento (um accordion sticky, por exemplo) e rolar até uma posição que depende da altura *pós-colapso* desse elemento, o salto nativo do navegador (`scrollIntoView`, `#hash`) calcula a posição de destino **antes** do colapso terminar de aplicar — o resultado esconde o conteúdo atrás do elemento ainda expandido. Correção: colapsar primeiro de forma síncrona, forçar um reflow (ler `getBoundingClientRect()` do elemento já colapsado), *depois* calcular e aplicar o scroll manualmente.

**5.2 — Elemento perde a largura ao ser movido entre containers flex.** Um wrapper que antes vivia fora de um container flex, e passa a ser filho direto dele, pode encolher para o tamanho do próprio conteúdo em vez de manter a largura total esperada — comportamento padrão de `align-items: flex-start` num container flex. Correção: dar `width: 100%` explícito a qualquer wrapper estrutural que precise preencher o espaço disponível, em vez de confiar no fluxo padrão.

**5.3 — Offsets calculados matematicamente corretos podem parecer visualmente errados.** Um offset de scroll calculado a partir da altura exata de um elemento sticky deixa o conteúdo colado sem respiro nenhum. Vale adicionar uma folga deliberada (um valor de espaçamento da escala do projeto) por cima do cálculo, mesmo que o número "correto" já dê conta da sobreposição.

**O que fazer no Figma:** para interações que não são só "ir de A para B" (sticky, colapso, offsets de scroll compensando um header fixo), documentar o comportamento esperado em texto (comentário no Figma ou nota complementar), já que a composição estática não vai deixar isso implícito de forma confiável para quem for implementar depois.

---

## 6. Rigor de verificação

**6.1 — Screenshot prova que renderizou, não prova a métrica.** Um screenshot mostra se algo *parece* certo; não prova se uma largura bate com um valor exato, nem revela um offset de poucos pixels que passa despercebido. Sempre que a tarefa envolver um valor numérico exato (largura, posição, alinhamento), medir via inspeção de DOM (`getBoundingClientRect()`, computed styles) — um script Playwright rodando `page.evaluate()` é suficiente e barato — em vez de confiar só na inspeção visual do screenshot. Antes de usar um screenshot como evidência (de que um bug existe OU de que foi corrigido), verificar se as duas cores/estados em comparação são sequer **diferenciáveis visualmente**. Um fundo com a mesma cor que o fundo padrão da página, por exemplo, renderiza identicamente estando 100% correto (full-bleed) ou incorreto (preso a um `max-width`, com a cor da página vazando ao redor) — a prova só existe via medição de DOM, nunca pela imagem, mesmo com o olho mais treinado.

**6.2 — Testar em pelo menos duas larguras, uma delas fora do range do frame.** Se o frame de referência é 1440px, o teste mínimo é: uma largura ≤1440 (deve reproduzir o frame) e uma >1440 (onde o comportamento responsivo implícito — que o Figma não desenha — entra em ação). Testar só na largura exata do frame não pega nenhum dos problemas das seções 1–3 deste documento.

**6.3 — Uma verificação "já está correto" não sobrevive a uma correção feita depois, em elemento irmão.** Ao corrigir um bug estrutural que afeta N elementos parecidos (ex: 5 seções que deveriam seguir o mesmo padrão de layout) e um deles já havia sido avaliado como "correto" numa rodada anterior — sem o bug ainda ter sido descoberto —, essa conclusão antiga não é confiável. Reexecutar a mesma verificação rigorosa no elemento "já correto" depois que o bug sistêmico for corrigido nos outros, antes de dar a tarefa como concluída.

---

## 7. Quando o próprio Figma está errado

Nem toda divergência entre Figma e bom senso de UX deve virar "seguir o Figma cegamente". Um exemplo real: um breadcrumb mobile tinha o destaque visual (cor + underline) no texto não-clicável (o título da página atual) em vez de no link clicável ("Início") — o inverso do que qualquer usuário esperaria de um breadcrumb.

**Como tratar:** se a divergência for uma escolha de design defensável (cor, espaçamento, copy), o Figma prevalece — é a fonte de verdade mais atualizada, e documentação escrita (PRD, specs) pode estar desatualizada. Mas se for um erro que contraria a expectativa básica de uso (uma affordance de clique no elemento errado, texto ilegível, etc.), vale confirmar com quem decide o produto, implementar o comportamento correto no código, e **documentar a divergência explicitamente** (o que mudou e por quê) em vez de silenciosamente ignorar o Figma ou silenciosamente deixar o bug. O Figma deve ser atualizado depois para não ficar permanentemente dessincronizado da fonte real.

---

## 8. Configuração do Figma — o que fazer no arquivo para atenuar esses problemas

- **Auto Layout com "Fill container" em vez de largura fixa**, sempre que a intenção for "essa camada acompanha o pai" — não force quem for implementar a *adivinhar* isso pelo contexto. Reserve largura fixa para elementos que realmente devem ter um teto de largura absoluto.
- **Todo valor de espaçamento (padding, gap) deve ser uma Variable**, não um número solto — isso garante que ferramentas de extração automatizada (dev mode, MCP, etc.) devolvam o token e não um valor mágico, e que o mesmo espaçamento usado em duas seções diferentes seja reconhecidamente "o mesmo número" em vez de duas coincidências.
- **Desenhar frames separados por breakpoint** (mobile / tablet / desktop) quando o layout muda de forma estrutural entre eles, em vez de confiar em nomenclatura ou anotação solta — um frame dedicado é a única forma de garantir que o layout de cada breakpoint foi de fato *desenhado*, não inferido por quem implementa.
- **Desenhar (ou pelo menos anotar) o que acontece além do maior frame.** Se o frame desktop for 1440px, deixar explícito — em nota, ou com um segundo frame maior mostrando o comportamento — o que deveria acontecer numa tela de 1920px ou mais: o conteúdo estica, ou fica centralizado com fundo estendido? Essa é a pergunta que mais frequentemente fica sem resposta e vira bug de produção.
- **Nomenclatura de camada que comunica comportamento, não só aparência.** Prefixos consistentes (`row-*`/`col-*` para direção de layout, `hidden-mobile-*`/`stack-mobile-*` para comportamento responsivo, `clickable-*`/`non-clickable-*` para affordance) reduzem ambiguidade na hora de traduzir para código — o nome da camada já responde perguntas que, de outra forma, exigiriam inferência ou uma pergunta extra para quem projetou.
- **Registrar decisões que a composição estática não comunica** (interações, timing, estados) num documento complementar versionado junto do código, referenciando o nome exato da camada no Figma — isso evita que a mesma dúvida precise ser resolvida de novo a cada nova sessão de implementação. Esse tipo de arquivo (um "notas de design por camada") deve ser tratado como parte do handoff, não como documentação opcional.
- **Manter a hierarquia de auto-layout do Figma o mais próxima possível da hierarquia real de containers HTML pretendida** (`row`/`col`/`wrap` do Figma → elemento equivalente no código, na mesma posição da árvore). Uma implementação que "achata" a estrutura do Figma em divs reconstruídas de memória tende a parecer certa isoladamente, mas quebra de forma sutil quando o conteúdo muda (texto mais longo, mais itens, alturas diferentes).

---

## 9. Uma linha com preenchedores full-bleed nas duas pontas + conteúdo centralizado no meio

**Sintoma:** uma seção precisa de dois blocos decorativos que preenchem o espaço sobrando entre a coluna de conteúdo e a borda real da tela (ex: linhas divisórias ornamentais dos dois lados de uma barra de botões), mas eles ficam pequenos ou desaparecem incorretamente, ou deslocam o conteúdo central para fora do alinhamento com o resto da página.

**Causa raiz — duas armadilhas comuns na mesma implementação:**
1. O elemento "flexível" precisa de `flex: 1 1 0` (flex-basis **zero**) para crescer/encolher proporcionalmente a partir de nada — `flex: 1` sozinho tem `flex-basis: auto`, que parte do tamanho do conteúdo, não de zero, e pode não encolher até desaparecer quando deveria. Combine com `min-width: 0` para permitir encolher além do tamanho mínimo do conteúdo (relevante quando o "conteúdo" tem alguma largura intrínseca, como bordas ou padding).
2. Se o container flex pai tem `gap` (comum quando essa linha antes tinha só os botões, sem os preenchedores full-bleed), esse gap continua reservando espaço ao redor de um item flex mesmo quando ele encolhe até **largura zero** — um gap "residual" nas duas pontas empurra a zona de conteúdo central para fora do alinhamento esperado com o resto da página, mesmo com os preenchedores corretamente configurados. **`gap` não é opcional/inofensivo quando um dos itens pode chegar a zero** — remova o gap do container externo e recrie o espaçamento necessário como `padding` dentro da própria zona de conteúdo (ou um gap num container interno separado, só entre os elementos que de fato precisam dele).

**Correção no código — padrão de 3 partes lado a lado, dentro de um container full-bleed (`width: 100%`, sem `max-width`, sem `gap` no nível externo):**
- Preenchedor esquerdo: `flex: 1 1 0; min-width: 0;`
- Zona de conteúdo central: `flex: 0 1 <largura-do-frame>px` (ex: `1440px`) **+** `max-width` igual, `box-sizing: border-box`, `padding` horizontal e `margin: 0 auto` — o mesmo container centralizado usado no resto do site (ver seção 1). O `gap`/gutter entre os elementos internos (botões, dividers menores) vive só aqui dentro, não no container externo.
- Preenchedor direito: espelho do esquerdo.

Nas larguras ≤ frame de referência, os dois preenchedores encolhem a zero e a zona central ocupa 100% da linha — resultado idêntico ao layout original de largura única. Acima do frame, o espaço excedente é dividido igualmente entre os dois preenchedores.

**Verificação:** medir via DOM a largura de cada preenchedor (deve ser exatamente `0` na largura do frame de referência) e a posição (`left`/`right`) do primeiro e do último elemento de conteúdo da zona central — devem bater exatamente com a posição de um elemento de conteúdo equivalente em outra seção da página (ex: um heading), em qualquer largura testada.

**Refinamento — quando o padding da zona de conteúdo cria uma "costura" visível:** se o preenchedor full-bleed da ponta é ele mesmo um elemento decorativo com conteúdo visual (ex: linhas divisórias), colocar um `padding` vazio na zona de conteúdo entre ele e o primeiro elemento real (botão, texto) cria uma quebra visual — o preenchedor "para" na borda da zona de conteúdo e só depois, atravessando um vão em branco, o conteúdo começa. Nesses casos, trocar o padding por um elemento igual ao preenchedor mas de **largura fixa** (`flex: 0 0 <valor>px`, sem crescer/encolher), inserido como o primeiro/último filho da própria zona de conteúdo, e deixar o `gap` que já existe entre os filhos internos criar o respiro final. A soma "largura fixa + gap" deve bater com o padding que ela substitui (ex: divider de 64px + gap de 24px = 88px de respiro total) — assim o preenchedor full-bleed emenda direto no divider fixo, sem vão em branco, e a posição do primeiro/último elemento de conteúdo real não muda.

---

## 10. Centralizar uma coluna cujo fundo, ao mesmo tempo, precisa continuar até a borda real (bleed assimétrico)

**Sintoma:** uma linha tem um elemento de largura fixa (ex: menu lateral) que precisa ficar centralizado dentro de uma coluna de largura X, e ao lado dele um bloco de conteúdo com fundo colorido que — diferente do menu — precisa continuar até a borda real da viewport, não parar no limite de X. Capar a linha inteira em `max-width: X` (seção 1) resolve a centralização do menu mas quebra o bleed do fundo; deixar a linha sem `max-width` resolve o bleed mas perde a centralização.

**Causa raiz:** os dois requisitos parecem contraditórios porque foram tratados como se precisassem do mesmo mecanismo (`max-width` na linha inteira), quando na verdade só o menu precisa de um teto de largura — o bloco de fundo quer exatamente o oposto (nenhum teto).

**Correção no código:** ao invés de capar o container da linha, mantenha-o full-bleed (`width: 100%`, sem `max-width`) e insira um **gutter invisível** (`div` vazio) como primeiro filho, com `flex: 1 1 <valor-do-padding-que-ele-substitui>px` (ex: `88px`) — a mesma técnica dos preenchedores da seção 9, mas usado de um lado só. O elemento de fundo (o último da linha) recebe `flex: 1 1 <largura-do-miolo>px` (sem padding somado ao basis — ver a armadilha de `flex-basis` acima) e **sem** `max-width`. Como os dois têm o mesmo `flex-grow`, crescem na mesma proporção acima da largura de referência: o gutter absorve metade do espaço excedente (empurrando o menu pra posição centralizada, idêntica à que teria dentro de uma coluna capada) e o bloco de fundo absorve a outra metade — mas, como não tem teto, continua crescendo até preencher o resto da linha, chegando exatamente na borda real. Nenhum cálculo com `vw`/`calc(50vw - ...)` é necessário (evita o efeito colateral clássico de barra de rolagem vertical inflar `100vw` além da área visível) — é só aritmética de `flex-grow`/`flex-basis`.

**Verificação:** medir, na largura de referência, se o gutter e a posição dos elementos fixos batem com o layout anterior (idêntico); acima dela, medir se o **fim do bloco de fundo** bate exatamente com a largura da viewport (não com a largura de referência), e se a posição do conteúdo real dentro do bloco de fundo não mudou.

**Atenção no responsivo:** se a linha muda para `flex-direction: column` em telas menores (layout empilhado), o `flex-basis` em pixels definido para o modo `row` passa a ser lido como **altura**, não largura, no modo `column` — reset explícito do gutter (`display: none`) e do bloco de fundo (`flex: 1` simples, sem basis fixo) na media query correspondente é obrigatório, não opcional.

---

## 11. Dimensão fixa em px, herdada do Figma, some/sobrepõe sob zoom ou fonte ampliada (WCAG 1.4.4 / 1.4.10)

**Sintoma:** com a fonte do sistema ou o zoom do navegador aumentados (testado a 200%), um texto curto dentro de uma linha flex (ex: o valor de uma métrica, "+15%") passa a se sobrepor visualmente ao texto vizinho (o label, "Boletos pagos") em vez de a linha crescer ou os dois textos se reorganizarem. Em telas menores/DevTools a olho nu pode passar despercebido porque só aparece em fonte grande.

**Causa raiz:** um valor como `min-width: 68px` (ou uma largura/altura fixa equivalente) extraído do Figma descreve o tamanho do texto *no tamanho de fonte em que o frame foi desenhado* — não é um piso de verdade, é a medida do conteúdo original. Quando o item é um flex child e o texto cresce (fonte do usuário, zoom), o `min-width` fixo passa a ser **menor** que o `min-content` real do texto; sem `flex-shrink: 0`, o algoritmo de flex ainda assim encolhe o item até esse piso baixo demais, e como não há `overflow: hidden` em lugar nenhum da árvore, o texto não é cortado — ele **vaza visualmente por cima do vizinho**, porque o vizinho começa a ser desenhado logo depois da borda (agora pequena demais) do item anterior.

**Correção no código:** para um item flex cujo conteúdo é um texto que não pode/deve quebrar sozinho (uma única "palavra" como um valor percentual) e que fica lado a lado com outro texto na mesma linha:
- Trocar `min-width: <px fixo>` por `flex-shrink: 0` — o item sempre ocupa sua largura natural (a do próprio texto, em qualquer tamanho de fonte), nunca encolhe abaixo dela.
- Adicionar `flex-wrap: wrap` no container da linha — se os dois itens não couberem lado a lado (fonte grande + card estreito), o segundo item quebra para a linha de baixo em vez de sobrepor o primeiro.
- Nunca usar `height`/`min-height` fixo em px num container que envolve texto — deixar a altura `auto` (crescer com o conteúdo via flex/auto-layout normal) nos dois breakpoints.

**O que mudar no Figma:** ao anotar/medir um item de texto curto dentro de um auto-layout horizontal, preferir não fixar largura mínima nenhuma (deixar "Hug contents") — se uma largura mínima é mesmo necessária para alinhamento visual entre linhas (ex: valores de tamanhos diferentes alinhados numa coluna), documentar que é só uma referência visual no tamanho de fonte padrão, não uma restrição rígida a ser copiada literalmente para `min-width` no CSS.

**Verificação:** carregar a página com `html { font-size: 200% }` (equivalente a 200% de zoom/fonte do navegador) via Playwright, tanto no breakpoint desktop quanto no mobile, e medir `scrollWidth`/`clientWidth`/`getBoundingClientRect()` de cada filho da linha — nenhum filho deve ter `scrollWidth > clientWidth`, e o `right` de cada filho não deve ultrapassar o `right` do container da linha. Um screenshot nessa condição confirma visualmente (texto sobreposto é óbvio), mas a medição de DOM é o que prova a ausência do problema em todos os casos, não só no que apareceu no screenshot.

### 11.1 Variante da seção 11: o item não cresce, mas o vizinho sim

**Sintoma:** um elemento de tamanho fixo (ex: uma logo em SVG, com dimensões travadas) fica cada vez mais perto — ou colide com — um vizinho na mesma linha flex quando a fonte do sistema aumenta, mesmo o elemento fixo não crescendo nem um pixel.

**Causa raiz:** a seção 11 cobre o caso onde o próprio item que está encolhendo tem uma medida fixa baseada no texto que ele contém. Existe uma variante: numa linha `justify-content: space-between` sem `flex-wrap`, se o **outro** elemento da linha (ex: um botão com padding/gap em `rem`) cresce com a fonte, o espaço total ocupado pela linha aumenta mesmo que o elemento fixo não mude — e sem `flex-wrap: wrap`, o excesso vira overflow em vez de reorganizar.

**Correção no código:** o mesmo `flex-wrap: wrap` da seção 11 resolve — mas o diagnóstico é diferente: antes de mexer no elemento que "parece" estar sendo espremido, medir qual elemento da linha está de fato crescendo (pode não ser o mesmo que está colidindo).

---

## 12. Flash de fonte customizada infla o viewport de layout no mobile Safari

**Sintoma:** um carregamento pontual (rede lenta, cache frio) mostra um espaço em branco ao lado de um texto/título que desaparece depois de um reload — reproduzível só nessa janela de tempo específica, nunca de forma consistente.

**Causa raiz:** antes da fonte customizada (`@font-face`) carregar, o texto renderiza com a fonte de fallback do sistema, que pode medir mais largo. Isso é normal e geralmente inofensivo — mas no Safari mobile, se esse texto momentaneamente mais largo causa overflow, o "layout viewport" (usado por unidades como `100vw`) se expande pra acomodar, e não encolhe de volta automaticamente depois que a fonte troca e o texto normaliza.

**Correção no código:** `<link rel="preload" as="font" ...>` no `<head>` para fontes usadas acima da dobra, e considerar `font-display: optional` (em vez de `swap`) para textos onde a troca de fonte pode causar reflow visível — aceita ficar na fonte de fallback antes de trocar, em vez de trocar e potencialmente causar o salto.

**Verificação:** throttling de rede (Slow 3G) no DevTools — sem isso, o bug não reproduz de forma confiável.

---

## 13. Variáveis duplicadas/órfãs no Figma antes de criar um Mode

**Sintoma:** um valor de espaçamento vem "solto" (sem nome de token reconhecível) ao extrair o design, mesmo parecendo bater com um valor da escala oficial.

**Causa raiz:** arquivos que passaram por retrabalho acumulam variáveis duplicadas — a mesma medida definida duas vezes em coleções diferentes (uma ativa, uma órfã/legada de uma biblioteca desconectada), ou nomeada fora do padrão (`dimension/scale-x3` ao lado de `size/scale-x3`, mesmo valor). Isso passa despercebido porque visualmente não muda nada.

**Correção:** antes de montar uma camada semântica de token com Modes (responsivo, tema, etc.), auditar o arquivo procurando por bindings de variável fora da coleção principal — sem essa limpeza, um Mode herda a inconsistência (parte dos elementos escuta o token certo, parte não, e o Mode não afeta essa segunda parte).

---

## 14. Checklist rápido antes de dar uma tarefa de layout como concluída

- [ ] O fundo de cada seção de topo é `width: 100%`? O conteúdo interno tem `max-width` + `margin: 0 auto`?
- [ ] Todo elemento que combina `max-width`/`width` fixo com `padding` tem `box-sizing: border-box`?
- [ ] Algum `flex-basis` calculado manualmente soma um `padding` que o elemento já declara separadamente (dobrando a contagem)?
- [ ] Algum elemento precisa ficar centralizado enquanto um vizinho no mesmo container precisa fazer bleed até a borda real? Se sim, nenhum dos dois deveria estar dentro de um `max-width` compartilhado.
- [ ] Alguma regra de reset (margin, padding, box-sizing) foi removida/reescrita sem um substituto explícito?
- [ ] Ao adicionar `max-width`/`margin: auto` numa regra pra centralizar acima do frame, alguma media query menor que já sobrescreve outra propriedade dessa mesma regra ficou sem resetar essas duas?
- [ ] Cada elemento "solto" no frame foi classificado como estrutural (acompanha a viewport) ou de conteúdo (acompanha a coluna) — nenhum foi tratado por padrão/adivinhação?
- [ ] Algum container flex com `gap` tem um item que pode encolher até largura zero? Se sim, o gap não deveria estar nesse nível.
- [ ] A verificação usou medição de DOM real (não só screenshot) em pelo menos uma largura acima do maior frame de referência?
- [ ] Algum elemento "já dado como correto" antes de uma correção sistêmica foi reexaminado depois dela?
- [ ] Toda divergência intencional em relação ao Figma está documentada (o quê, por quê, e se o Figma precisa ser atualizado)?
- [ ] Algum item flex com texto tem `min-width`/`min-height`/`height` fixo em px herdado do Figma? Testar com `html { font-size: 200% }` (desktop e mobile) e medir `scrollWidth` vs `clientWidth` de cada filho da linha.
- [ ] Numa linha flex sem wrap, o elemento que parece "espremido" foi confirmado como a causa, ou pode ser um vizinho crescendo (padding/gap em `rem`) empurrando o espaço disponível?
- [ ] Fontes customizadas usadas acima da dobra têm `preload`? A estratégia de `font-display` foi escolhida deliberadamente (não só o padrão do framework)?
- [ ] Alguma variável usada no arquivo Figma vem de uma coleção diferente de `primitives`/da coleção principal do projeto? Auditar antes de criar Modes.
- [ ] Antes de usar um screenshot como prova, os dois estados comparados são visualmente diferenciáveis (cores diferentes, não a mesma cor de fundo em ambos os casos)?
