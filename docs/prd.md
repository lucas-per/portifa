# PRD — Site Pessoal (Portfólio)

**Autor:** Lucas
**Tipo de documento:** PRD para implementação via Claude Code (código próprio)
**Status:** V1 em definição
**Plataforma de implementação:** Claude Code, com design realizado no Figma e lido via Figma MCP — ver seção 6.8

---

## 1. Objetivo

Construir um site pessoal que sirva como principal ativo de portfólio, evidenciando a atuação como Product Designer Sênior/Especialista, com foco em cases reais, resultados mensuráveis e facilidade de contato profissional.

A arquitetura de código e de conteúdo deve ser pensada para dois horizontes:
- **Curto prazo:** evolução incremental em três versões (V1 → V3).
- **Médio/longo prazo:** substituição futura dos tokens e componentes legados pelo Design System próprio (**UaiUI DS**), a ser retomado após a V3. O código deve minimizar o esforço dessa migração.

---

## 2. Arquitetura da Informação

| Seção | Descrição | Versão de entrada |
|---|---|---|
| Portfólio/Home | Atuação profissional + apresentação pessoal + cases | V1 |
| Artigos | Textos sobre temas de Design em estudo | V2 |
| Projetos | Soluções autorais prontas para uso | V2 |
| Fotos | Fotografia autoral | V3 |

**Requisito de arquitetura:** a IA deve ser tratada como uma lista extensível de macro-seções, não como um conjunto fixo. Novas seções (além das 4 previstas) devem poder ser adicionadas sem refatoração estrutural — isso deve orientar a modelagem de navegação, rotas e content types desde o V1.

---

## 3. Versionamento

### V1 — Portfólio
Site com uma única macro-seção ativa: Portfólio/Home. Não inclui, ainda, Participações em comunidades/projetos nem Prova social — ambos migrados para o V2 (ver seção 5).

### V2 — Artigos + Projetos
Adição das seções de conteúdo recorrente (Artigos) e vitrine de soluções (Projetos).

### V3 — Fotos
Adição da seção de fotografia autoral.

### V4 — Transições e refinamentos de UI
Adição de transições e microinterações de UI, com base nas referências:
- [transitions.dev](https://transitions.dev/) — biblioteca de transições essenciais para web (copiar/colar ou via skill de agente de código), cobrindo microinterações como transição de cards, morph de ícones, estados de erro, reveal de texto, entre outras
- [gsap.com](https://gsap.com/) — biblioteca de animação JavaScript mais robusta, indicada para transições mais complexas/coreografadas

**Citação rotativa no Footer:** uma frase (com autor opcional) exibida no Footer, sorteada aleatoriamente a cada carregamento de página — mesmo mecanismo usado pelo site [orbita.social.br](https://orbita.social.br). Implementação prevista:
- Lista de citações mantida como array/JSON no próprio repositório (`{texto, autor}`), sem depender de API externa nem de painel administrativo
- Sorteio no client, via pequeno island com JS, para que a frase troque a cada carregamento (equivalente ao comportamento do site de referência) — alternativa mais simples seria sortear no build, trocando a cada deploy em vez de a cada carregamento, mas isso muda o comportamento observado na referência

**Ordem em relação à migração UaiUI DS:** ainda não definida se o V4 ocorre antes ou depois da migração descrita abaixo — a decidir mais perto do momento.

**Ponto de atenção:** transições/animações devem respeitar o requisito de performance (seção 6.1) e a preferência `prefers-reduced-motion` do usuário, por acessibilidade.

### Migração para UaiUI DS
Retomada do projeto do Design System próprio, sem uma versão numerada associada — depende da conclusão da UaiUI DS, não de um marco de conteúdo do site. Substituição dos tokens e componentes do site legado pelos da UaiUI DS, com o mínimo de retrabalho possível (ver seção 6.5).

---

## 4. Requisitos Funcionais — V1

### 4.1 Sobre mim
- Foto
- Resumo da experiência profissional

### 4.2 Cases

**Card na página inicial** (ver referência visual anexada — seção "Cases selecionados"): versão enxuta, não o detalhamento completo.
- **Tags temáticas** ou selo de status **"Em breve"** (case ainda não publicado — nesse caso, as tags não aparecem)
- **Título do case**
- **Descrição curta** (uma frase resumindo o case, não a estrutura Desafio/Solução/Resultado)
- **CTA** "Ler case" → leva para a página dedicada

**Página dedicada do case** (destino do CTA acima): estrutura de conteúdo a ser definida no protótipo do Figma — não detalhada neste PRD para não antecipar uma decisão que ainda está em aberto.

**Metadados por case:** as mesmas tags temáticas exibidas no card (ex: "Discovery", "Delivery", "Gestão", "B2B", "B2C"). Não funcionam como filtro na página inicial no V1, mas a estrutura de dados deve prever isso, pensando na integração futura com Artigos e Projetos (V2).

**Tempo de leitura:** a página dedicada de cada case deve exibir tempo estimado de leitura. Cálculo: contagem de palavras ÷ ~200-238 wpm (palavras por minuto), arredondado para cima. Essa mesma regra se aplica aos Artigos (V2) — ver seção 5.

### 4.3 Skills & Expertise
Lista das principais ferramentas e tecnologias utilizadas no processo de design, além de algumas habilidades profissionais em destaque.

### 4.4 Contato
- Link para o perfil do LinkedIn (obrigatório)
- Formulário de contato
- E-mail direto
- **Fora de escopo:** telefone e WhatsApp não devem ser divulgados em nenhum canal do site
- CV disponível para download, no Footer (não depende de navegação até o LinkedIn)
  - Arquivo PDF estático versionado no próprio repositório (GitHub) — sem CMS/painel administrativo. Atualizar o CV significa substituir o arquivo e rodar o mesmo pipeline de deploy do site (GitHub Actions → Cloudflare Pages)
  - Servido como asset estático direto (sem processamento via JS), alinhado ao requisito de performance da seção 6.1

---

## 5. Requisitos Funcionais — V2 e V3 (visão prévia)

| Versão | Seção | Observações |
|---|---|---|
| V2 | Artigos | Exibir tempo estimado de leitura, mesma regra da seção 4.2. Avaliar CMS leve, sem depender de novo deploy a cada publicação |
| V2 | Projetos | Reutilizar o mesmo padrão de metadados/tags dos cases do Portfólio |
| V2 | Participações em comunidades e projetos | Bloco de participações relevantes (comunidades de design, projetos colaborativos, etc.) |
| V2 | Prova social | Depoimentos/recomendações (fonte sugerida: LinkedIn) e logos de empresas/clientes (sujeito à autorização de divulgação) |
| V3 | Fotos | Formato de exibição a definir na fase de design da V3 |

---

## 6. Requisitos Não-Funcionais

### 6.1 Performance
Velocidade é fator crítico do produto, não um "nice to have". Deve orientar decisões de imagem (formatos modernos, lazy loading), fontes e peso geral de bundle desde a escolha do framework/stack de implementação.

### 6.2 Acessibilidade e sistema de cores
- Suporte a light e dark mode
- Paleta definida em **OKLCH**
- **Proibido uso de branco absoluto (#FFFFFF) e preto absoluto (#000000)** — critério específico para não prejudicar a leitura de pessoas com astigmatismo

### 6.3 Compatibilidade entre navegadores
- Suporte alvo: últimas 2 versões principais de **Chrome/Edge (Chromium)**, **Firefox** e **Safari**
- **OKLCH tem ~90–95% de suporte global** (Chrome/Edge 111+, Firefox 113+, Safari 15.4+). Decisão sobre a fatia sem suporte: **degradação aceitável** — sem fallback explícito via `@supports`; navegadores fora do alvo podem exibir cor levemente diferente, mas o site continua funcional
- **Implementação técnica: Browserslist**, configurado no repositório (`.browserslistrc` ou chave `browserslist` no `package.json`) com o alvo acima, alimentando o Autoprefixer no build (prefixos de vendor automáticos). Gratuito, sem serviço externo — configuração única
- **Pré-condição para esse requisito (e os demais deste PRD) funcionarem na prática ao longo das iterações:** este PRD e o `design-notes.md` devem viver dentro do repositório do projeto (ex: `/docs/`), não apenas como arquivos avulsos na conversa — é isso que garante que fiquem disponíveis como contexto automático em qualquer sessão futura de implementação

### 6.4 Internacionalização (i18n)
Multi-idioma não entra como funcionalidade em nenhuma das três versões previstas, mas a arquitetura de conteúdo (rotas, content types, textos) deve ser preparada desde o V1 para suportar múltiplos idiomas sem refatoração estrutural futura.

### 6.5 Arquitetura de tokens e componentes
Preparação para a substituição futura pela UaiUI DS (que provavelmente será construída em **Angular**):
- **Framework escolhido: Astro.** Suporta renderização de componentes de outros frameworks como "islands" (parciais hidratados), incluindo Angular via integração mantida pelo time do AnalogJS (`@analogjs/astro-angular`). Isso significa que, quando a UaiUI DS estiver pronta, seus componentes Angular podem ser inseridos como islands, substituindo os componentes atuais um a um — sem reescrever o site inteiro.
- **CSS: puro (vanilla)**, aproveitando o escopo automático por componente já nativo do Astro. Sem framework utilitário (ex: Tailwind).
- **Hospedagem de código: GitHub**, com deploy via **GitHub Actions** para CI/CD, usando a integração automática nativa do Cloudflare Pages com GitHub — sem necessidade do passo extra de Wrangler CLI que o Codeberg exigiria. (Decisão revertida do Codeberg: a nova política de Termos de Uso do Codeberg, de julho de 2026, desencoraja/proíbe projetos "escritos e mantidos com uso pesado de LLMs" — caso deste projeto, construído via Claude Code.)
- Tokens de design (cor, tipografia, espaçamento) devem ser centralizados e nomeados de forma abstrata (ex: `color.surface.primary`, não `color.blue.500`), facilitando o remapeamento posterior
- Componentes devem ser desacoplados o suficiente para permitir troca isolada, sem exigir reescrita de páginas inteiras
- Documentar decisões de nomenclatura para acelerar o mapeamento tokens legados → tokens UaiUI DS quando a migração ocorrer
- **Nota de risco:** a integração Astro-Angular é mantida pela comunidade, não pelo core do Astro. Reavaliar maturidade/compatibilidade de versões no momento da migração pós-V3.

### 6.6 SEO e compartilhamento
- Meta tags e Open Graph configurados desde o V1 (título, descrição, imagem de preview)
- URLs amigáveis para os cases (ex: `/cases/nome-do-projeto`), já compatíveis com a futura estrutura de Projetos (V2)

### 6.7 Analytics
**Decidido: Umami Cloud, plano Hobby (gratuito).**
- 100 mil eventos/mês, 3 sites, sem necessidade de cartão de crédito — suficiente para o volume de tráfego esperado de um portfólio pessoal
- Sem cookies, sem coleta de dados pessoais identificáveis
- Sem infraestrutura própria para manter (diferente do self-host, que exigiria VPS + Docker + PostgreSQL + manutenção contínua — avaliado e descartado por complexidade desnecessária nesse estágio)
- Script leve, compatível com a exigência de performance da seção 6.1

### 6.8 Fluxo de design e implementação (processo, não produto)

**Decisão revisada:** o rascunho no Google AI Studio e o teste com Lovable foram descartados — resultado visual insatisfatório em ambos. O design nasce diretamente no Figma.

1. **Design no Figma:** Lucas desenha a V1 diretamente no Figma (plano Professional/Full), usando a referência de estilo da seção 7 e os requisitos funcionais das seções 4 e 6.
2. **Leitura via Figma MCP:** o Claude Code se conecta ao arquivo Figma através do conector MCP oficial (`get_design_context`, `get_variable_defs`, `get_screenshot`) para extrair estrutura, variáveis e hierarquia visual diretamente do design já validado.
3. **Implementação no Claude Code:** construção do componente/página em Astro, traduzindo as variáveis do Figma para a arquitetura de tokens definida na seção 6.5 (nomenclatura abstrata, OKLCH, componentes desacoplados para a futura migração à UaiUI DS).

Esse fluxo elimina a etapa de geração de rascunho por IA (AI Studio/Lovable) do processo — o Figma já cumpre o papel de validar a decisão visual antes do código, com a vantagem de ser a ferramenta que Lucas já domina e usa profissionalmente.

---

## 7. Referência de estilo

**Direção: neo-brutalismo** (substitui a referência anterior, plau.design — mudança de direção visual do projeto).

Características observadas a considerar no design:
- Bordas grossas e sólidas, cantos retos (sem arredondamento)
- Sombras duras (`box-shadow` sem blur, deslocado, tipo "cartaz colado")
- Cores chapadas e saturadas, alto contraste
- Microinterações diretas e rápidas: elemento "levanta" no hover, "afunda" no active (ver padrão de interação de botões no `design-notes.md`)
- Tipografia com peso forte, sem meio-tom — reforça o caráter "cru" da estética

Essa referência deve orientar a fase de design visual, sem implicar em replicar um site específico — o objetivo é capturar a linguagem do estilo (bordas, sombra, contraste, interação direta), adaptada aos requisitos de acessibilidade já definidos (seção 6.2).

### 7.1 Princípios para evitar clichês de design gerado por IA

Ao gerar rascunhos ou implementar (Claude Code), evitar os três padrões visuais que ferramentas de IA generativa produzem por padrão quando não há uma direção clara:
- Fundo creme (próximo de #F4F1EA) com serifada de alto contraste e acento terracota
- Fundo quase preto com um único acento neon (verde-ácido ou vermelho vivo)
- Layout estilo jornal, com regras finas (hairlines) e colunas densas, sem cantos arredondados

Como a referência de estilo (neo-brutalismo, seção 7) já define uma direção própria — bordas grossas, sombra dura, cor chapada, interação direta —, essa direção deve prevalecer sobre qualquer um dos três padrões acima. **Nota de atenção:** o segundo clichê (fundo quase preto + acento neon) pode parecer próximo do neo-brutalismo à primeira vista — a diferença está em fundo predominantemente claro com contorno preto (neo-brutalismo) vs. fundo escuro com um único acento vibrante (clichê de IA). Não confundir os dois na hora de gerar ou avaliar um rascunho.

### 7.2 Restrição tipográfica
**Não combinar fontes serifadas com não-serifadas no mesmo sistema tipográfico.** A hierarquia de texto (display, corpo, legendas/dados) deve ser construída dentro de uma única categoria — todas serifadas ou todas não-serifadas —, variando peso, tamanho e espaçamento para criar contraste, em vez de misturar categorias.

---

## 8. Fora de escopo (V1)

- Newsletter/inscrição por e-mail — sem conteúdo recorrente ainda no V1 (Artigos só entra no V2), seria atrito sem retorno
- Multi-idioma como funcionalidade ativa — arquitetura preparada, mas sem implementação
- Telefone/WhatsApp como canal de contato
- Filtro funcional de tags nos cases — estrutura de dados prevista, UI de filtro não

---

## 9. Abertos / Decisões pendentes

- ~~Escolha final da solução low-code~~ — **Decidido:** implementação via Claude Code, com rascunho visual no Google AI Studio (ver seção 6.8)
- ~~Framework específico~~ — **Decidido:** Astro (ver justificativa na seção 6.5 — compatibilidade futura com componentes Angular da UaiUI DS)
- ~~Hospedagem~~ — **Decidido:** Cloudflare Pages (gratuito, sem limite de banda). Código versionado no **GitHub**, deploy via **GitHub Actions**, usando a integração nativa do Cloudflare Pages (ver seção 6.5)
- ~~Ferramenta de analytics~~ — **Decidido:** Umami Cloud, plano Hobby (ver seção 6.7)
- Formato de exibição da seção Fotos (V3) — a definir na fase de design daquela versão
