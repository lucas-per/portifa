// Origem: lucas-per/color-decomposer@v0.2.0, app/strings.js. Divergências da tag: os textos do Auto e da Cor viva (2026-10-17);
// a nova estrutura do Figma (2026-10-19): saem os textos da escala, do "Saiba mais", dos motivos do Auto e da Cor viva,
// do aviso de tons parecidos, da cor de apoio e dos ajustes avançados; o preset "aplica" aparece como Alternativo. PR 2:
// "Manter minha cor exata", o Auto que sugere uma cor próxima e a linha do contraste; saem a Cor viva e o estado normal.
// Textos dinâmicos da interface (os fixos ficam no ColorDecomposer.astro). Escritos com a skill ux-microcopy:
// PT-BR, "você", sentence case, sem pontuação em rótulos e botões.

export const T = {
  tabs: { palette: 'Paleta', neutrals: 'Neutros', behavior: 'Comportamento', grayscale: 'Cinzas' },
  presetHelp: (pal, neu) => `${pal} tons e ${neu} neutros`,
  groupLabel: {
    palette: 'Tons da paleta, em ordem numérica',
    neutrals: 'Neutros, em ordem numérica',
    behavior: 'Tons de comportamento',
    grayscale: 'Cinzas, em ordem numérica'
  },
  behaviorNames: { lightest: 'Início da escala', active: 'Ativo', normal: 'Normal', action: 'Ação', pressed: 'Pressionado', darkest: 'Fim da escala' },
  // Rótulos que o preset Padrão troca (a chave do motor continua a do Aplica)
  behaviorNamesByPreset: { standard: { action: 'Hover' } },
  yourColor: 'Sua cor',
  tune: {
    clipped: (c) => `Essa intensidade passa do máximo possível para esta cor. Ajustamos para ${c}. Para ter mais, mude a claridade ou o matiz.`,
    // aviso falado (#live) depois do Auto: a cor nova aparece no campo e o botão fica indisponível
    autoDone: (hex) => `Auto: sua cor principal ficou ${hex}.`,
    autoNone: 'Não achamos uma cor próxima sem tons parecidos.',
    // por que o Auto não está disponível (texto visível sob o botão, ligado por aria-describedby)
    autoExact: 'Indisponível com \'Manter minha cor exata\' ligado.',
    autoNoConflict: 'Disponível quando sua cor gera tons parecidos.'
  },

  // Manter minha cor exata: onde a cor principal está (no modo escuro, o nível espelhado)
  exact: {
    on: (level) => `Ligado: sua cor está no nível ${level}.`,
    off: (level) => `Desligado: sua cor está no nível ${level}.`
  },

  // Contraste mínimo: as frases das opções do antigo select ("AA: 4,5 para 1", "AAA: 7 para 1") no formato do Figma
  contrastHelp: { AA: 'AA: contraste de 4,5 para 1 ou mais.', AAA: 'AAA: contraste de 7 para 1 ou mais.' },

  hexError: 'Esse código não funciona. Use 6 letras ou números, como #057ABD.',

  detail: {
    level: (n) => `Nível ${n}`,
    behavior: (name, level) => `${name}, nível ${level}`,
    surface: 'Superfície',
    txtOn: 'Texto sobre a superfície',
    border: 'Borda',
    textColor: 'Cor do texto',
    strategy: { 'high-contrast': 'Preto ou branco', 'brand-tint': 'Tom da cor' },
    copyLevelAria: (title, hex) => `Copiar o código do ${title.toLowerCase()}, ${hex}`,
    copyAria: (what, hex) => `Copiar ${what.toLowerCase()} ${hex}`,
    copied: (hex) => `Copiado: ${hex}`,
    copyFail: 'Não deu para copiar. Selecione o código e use Ctrl+C.',
    close: 'Fechar detalhes',
    sample: 'Texto de exemplo',
    // nível de contraste que o par alcança, na tag da amostra
    tag: (r) => `${r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : 'Abaixo do AA'} (${fmt(r)}:1)`
  },

  verdict: {
    both: 'Passa no AA e no AAA',
    aa: 'Passa no AA, mas não no AAA',
    none: 'Não passa no AA'
  },

  swatchAria: (label, surface, txtOn, ratio, verdict) =>
    `${label}. Superfície ${surface}. Texto ${txtOn}. Contraste ${fmt(ratio)} para 1. ${verdict}.`,
  flagBelow: (req) => `Abaixo de ${req}`,

  warnings: {
    accept: (n, req) => `${n} ${n === 1 ? 'tom não chega' : 'tons não chegam'} a ${req} para 1. Neles, usamos 4,5 para 1 (AA). Eles têm uma marca.`,
    keep: (n, req) => `${n} ${n === 1 ? 'tom não chega' : 'tons não chegam'} a ${req} para 1. Mantivemos o texto gerado. Eles têm uma marca.`,
    short: (n) => `${n} ${n === 1 ? 'tom abaixo' : 'tons abaixo'} do contraste pedido.`,
    show: 'Ver quais',
    hide: 'Ocultar',
    item: (group, level, ratio) => `${group[0].toUpperCase()}${group.slice(1)}, nível ${level}: ${fmt(ratio)} para 1`,
    groups: { palette: 'paleta', neutrals: 'neutros' },
    errorTitle: 'Não foi possível gerar os tons',
    errorHelp: 'Escolha outra cor ou mude o contraste mínimo para AA.'
  },

  export: {
    copied: 'Copiado para a área de transferência.',
    copyFail: 'Não deu para copiar. Selecione o texto e use Ctrl+C.',
    figmaHelp: 'Cole este arquivo no plugin Color Decomposer, dentro do Figma. Ele cria as coleções Primitivos e Semântica, cada uma com os modos Claro e Escuro.',
    downloaded: (file) => `Arquivo ${file} baixado.`
  },
};

export function fmt(ratio) {
  return (Math.floor(ratio * 10) / 10).toFixed(1).replace('.', ',');
}

/* ---------- Ajuda ---------- */

// Recebe os presets para citar números e cores que vêm dos dados, não de cópias.
export function helpText({ standard: S, aplica: A }) {
  const n = (p) => ({ pal: p.palette.levels.length, neu: p.neutrals.levels.length });
  const s = n(S), a = n(A);
  const mir = (p) => ({ pal: p.palette.levels[0] + p.palette.levels.at(-1), neu: p.neutrals.levels[0] + p.neutrals.levels.at(-1) });
  const sm = mir(S);
  const sFirst = S.palette.levels[0], sLast = S.palette.levels.at(-1);
  const ink = { dark: S.ink.dark.toUpperCase(), light: S.ink.light.toUpperCase() };
  const base = S.palette.baseLevel;
  const hover = S.behavior.action;

  return {
    link: 'Ajuda',
    linkAria: 'Abrir a ajuda',
    back: 'Voltar para a paleta',
    title: 'Ajuda',
    docTitle: 'Ajuda · Color Decomposer',
    intro: 'Um guia de cinco passos e as respostas para as dúvidas mais comuns. A última parte é para quem usa o motor no código.',
    toc: 'Nesta página',
    openAll: 'Abrir todas',
    closeAll: 'Fechar todas',
    copy: 'Copiar',
    copied: 'Copiado.',
    copyFail: 'Não deu para copiar. Selecione o texto e use Ctrl+C.',
    codeAria: (what) => `Copiar ${what}`,
    sections: {
      quick: 'Guia rápido',
      faq: 'Perguntas frequentes',
      devs: 'Para devs'
    },
    forDesigners: 'Para quem usa a interface',
    steps: [
      {
        title: 'Escolha a cor',
        text: 'Digite o código em Cor principal. Os tons aparecem na hora, e a mini paleta ao lado do código mostra a escala. Em Refinar cor principal, ajuste claridade, intensidade e matiz.'
      },
      {
        title: 'Escolha o sistema de níveis',
        text: `Em Sistema de níveis, o Padrão tem ${s.pal} tons e ${s.neu} neutros. O Alternativo tem ${a.pal} tons e ${a.neu} neutros e segue as regras do Aplica Design System.`
      },
      {
        title: 'Leia os tons',
        text: 'As abas Paleta, Neutros, Comportamento e Cinzas mostram cada grupo. Troque entre claro e escuro em Modo de cor. Ao escolher um tom, você vê a superfície, o texto, a borda e o contraste. No celular, toque no tom para abrir os detalhes.'
      },
      {
        title: 'Ajuste se precisar',
        text: 'Se a mini paleta marcar tons parecidos, em amarelo, use o Auto: ele sugere uma cor próxima sem esse problema. Se a cor não pode mudar, ligue Manter minha cor exata.'
      },
      {
        title: 'Leve para o projeto',
        text: 'Nas abas Paleta e Neutros, cada tom tem um botão para copiar o código. Para tudo de uma vez, use Exportar tokens: JSON do Aplica Design System, variáveis CSS, JSON completo ou variables do Figma.'
      }
    ],
    faq: [
      {
        q: 'O que é um nível?',
        a: [
          `Cada tom da escala tem um número. No modo claro, quanto menor o número, mais claro o tom. No nível ${base} fica a sua cor. Com Manter minha cor exata ligado, ela vai para o nível de claridade mais próxima, sem alteração.`,
          `No modo escuro, a escala é espelhada: o nível ${sFirst} recebe a claridade que o ${sLast} tem no claro, e o contrário. A intensidade cai para 85%.`
        ]
      },
      {
        q: 'Padrão ou Alternativo: qual escolher?',
        a: [
          `O Alternativo tem ${a.pal} tons e ${a.neu} neutros e reproduz as regras do Aplica Design System (engine 3.23.4). Escolha esse se você precisa dos mesmos tokens do Aplica Design System.`,
          `O Padrão tem ${s.pal} tons e ${s.neu} neutros, uma escala menor. O tom mais escuro é menos profundo, o texto usa ${ink.dark} e ${ink.light} em vez de preto e branco, e os tons que não cabem no sRGB mantêm o matiz. Para começar, é o mais simples.`
        ]
      },
      {
        q: 'O que o Auto faz?',
        a: [
          `Em cores muito claras ou muito escuras, o nível ${base} deixa os tons vizinhos colados. O Auto troca a sua cor pela mais próxima dela que não causa esse problema, com o mesmo matiz. A cor nova aparece em Cor principal.`,
          'O botão fica indisponível quando os tons já estão bem separados ou quando Manter minha cor exata está ligado.'
        ]
      },
      {
        q: 'Para que serve Manter minha cor exata?',
        a: [
          `Para quando a cor não pode mudar. Ligado, sua cor fica exata no nível de claridade mais próxima e o resto da paleta segue as regras a partir dela. Desligado, ela fica no nível ${base}.`,
          'Os níveis de Comportamento não mudam: continuam os do sistema de níveis.'
        ]
      },
      {
        q: 'O que quer dizer a marcação amarela sob a mini paleta?',
        a: [
          'Ela marca os tons quase iguais ao vizinho: a diferença entre eles ficou pequena demais para o olho separar. Medimos a distância perceptual entre tons a 10 níveis um do outro. Amarelos, âmbar, limões e ciano costumam cair aqui.',
          'O limite foi calibrado com cores conhecidas e com o olho de quem usa. Não é um padrão de mercado. Experimente o Auto ou Manter minha cor exata.'
        ]
      },
      {
        q: 'Por que o texto no Padrão não é preto nem branco?',
        a: [
          `No Padrão, o texto escuro é ${ink.dark} e o claro é ${ink.light}. Se nenhum dos dois alcança o contraste pedido em um tom, usamos a cor mais próxima deles que alcança: um pouco mais escura ou mais clara, só o necessário.`,
          'Isso acontece em tons de claridade média. Nos tons mais escuros ou mais claros, as duas cores já passam.'
        ]
      },
      {
        q: 'O contraste mínimo é AA?',
        a: [
          'Por padrão, sim: 4,5 para 1. Em Contraste mínimo, você pode pedir AAA (7 para 1).',
          'Os detalhes de cada tom mostram o nível que ele alcança. Se o AAA for impossível em algum tom, usamos 4,5 para 1 nele e avisamos.'
        ]
      },
      {
        q: 'Como compartilho a paleta que montei?',
        a: ['A cor, o sistema de níveis, a aba e os ajustes ficam no endereço da página. Copie o endereço e quem abrir vê o mesmo resultado.']
      },
      {
        q: `Por que o nível ${hover} se chama Hover no Padrão e Ação no Alternativo?`,
        a: [
          `É o mesmo estado: um passo mais escuro que o normal, para o elemento quando o mouse está sobre ele. O Alternativo o chama de Ação, como o Aplica Design System. No Padrão usamos Hover.`,
          'Só o rótulo muda. Nos arquivos exportados, a chave continua action.'
        ]
      }
    ],
    dev: {
      quick: {
        title: 'Guia rápido',
        steps: [
          { title: 'Instale e teste', text: 'Requer Node 18 ou mais novo. O motor, em src/, não tem dependências.' },
          { title: 'Decomponha uma cor', text: 'decompose devolve paleta, neutros e comportamento, em claro e escuro. decomposeTheme junta várias cores e os cinzas.' },
          { title: 'Escolha as opções', text: 'Os nomes seguem os do Aplica. A tabela completa está no README, em Opções.' }
        ],
        setup: ['npm install', 'npm test', 'npm run dev     # interface em http://localhost:3000', 'npm run build   # gera a interface em dist/'].join('\n'),
        setupAria: 'os comandos de instalação',
        code: [
          "import { decompose, decomposeTheme, auditResult } from './src/index.js';",
          '',
          "const r = decompose({ base: '#E7398A', preset: 'standard' });",
          `r.light.palette.surface[${base}];   // '#e7398a'`,
          'r.dark.behavior.surface.action; // nível 120, no escuro',
          'r.warnings;                     // avisos de contraste, se houver',
          '',
          'const theme = decomposeTheme({',
          "  colors: { brand: '#E7398A', info: '#38C2D0' },",
          "  options: { txtOnStrategy: 'brand-tint', accessibilityLevel: 'AAA' }",
          '});'
        ].join('\n'),
        codeAria: 'o exemplo de código'
      },
      faq: {
        title: 'Perguntas frequentes',
        items: [
          {
            q: 'Como sei que o Aplica sem extensões bate com o oficial?',
            a: [
              'Três camadas de teste. O golden compara dois temas reais do repositório de exemplo do Aplica. O oráculo compara com o ColorDecomposer da engine 3.23.4 em 71 cores e 13 combinações de opções. Os invariantes cobrem nível 100 exato, ordem de claridade, espelho do escuro, bordas e contraste.',
              'Rode npm test para ver tudo.'
            ]
          },
          {
            q: 'O que é uma extensão?',
            a: [
              'Algo que não existe no Aplica e é opcional: o preset standard, brandLevel, behaviorFollowsBrand, vividChroma e anchors. O comportamento padrão não muda, e sem extensões o resultado é idêntico ao oficial.'
            ]
          },
          {
            q: 'Posso criar meu próprio preset?',
            a: [
              'Sim. Um preset é um objeto de dados, sem código: níveis e claridades da paleta e dos neutros, o nível base, os níveis de comportamento e, se quiser, ink e gamutMap. Passe o objeto em preset. O modelo está em src/presets.js.'
            ]
          },
          {
            q: 'Quais formatos de exportação existem?',
            a: [
              'toPrimitiveTheme e toGrayscaleTheme (tokens do Aplica), toCssVariables (variáveis CSS), toPlainJson (JSON completo) e toFigmaJson (variables do Figma). auditResult lista o contraste de cada par de superfície e texto.'
            ]
          },
          {
            q: 'Como uso no Figma?',
            a: [
              'Em Exportar tokens, escolha Variables do Figma e copie o arquivo. No Figma desktop, importe o plugin de figma-plugin/manifest.json em Plugins, Desenvolvimento, e cole o arquivo. Rodar de novo atualiza as variables, sem duplicar.',
              'A lógica foi testada num arquivo do Figma. A interface do plugin ainda não foi aberta lá.'
            ]
          },
          {
            q: 'O que não está implementado?',
            a: [
              'A camada mapping (brand, interface, product), que faz parte do gerador de temas completo do Aplica e fica fora do escopo do decomposer.'
            ]
          }
        ]
      }
    }
  };
}
