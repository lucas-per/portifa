// Origem: lucas-per/color-decomposer@v0.2.0, app/state.js. Divergência da tag (2026-10-19): saíram os ajustes que a
// interface não tem mais (ajustes avançados e a "Cor própria" do texto; na PR 2, cor de apoio, Cor viva e "Usar sua cor no
// estado normal"); um endereço antigo com eles abre no padrão. PR 8: sai também o "Manter minha cor exata" (`exact`), e
// o `lvl` antigo (nível escolhido pelo Auto de antes) passa a ser ignorado, sem aviso: a cor principal fica sempre no nível 100.
// Estado da interface e sua cópia na URL (para você compartilhar ou voltar ao mesmo ponto).

export const DEFAULTS = {
  color: '#057abd',
  preset: 'standard',
  strategy: 'high-contrast',
  level: 'AA',
  mode: 'light',
  tab: 'palette',
  sel: '',
  view: ''
};

const ENUMS = {
  preset: ['standard', 'aplica'],
  strategy: ['high-contrast', 'brand-tint'],
  level: ['AA', 'AAA'],
  mode: ['light', 'dark'],
  tab: ['palette', 'neutrals', 'behavior', 'grayscale'],
  view: ['', 'ajuda']
};
const HEX = /^#[0-9a-f]{6}$/;

export function parseHash(hash) {
  const s = { ...DEFAULTS };
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  for (const key of Object.keys(DEFAULTS)) {
    if (!p.has(key)) continue;
    const v = p.get(key);
    const def = DEFAULTS[key];
    if (ENUMS[key]) { if (ENUMS[key].includes(v)) s[key] = v; continue; }
    if (key === 'color') { if (HEX.test(`#${v}`)) s[key] = `#${v}`; continue; }
    if (key === 'sel') s[key] = v.slice(0, 40);
  }
  return s;
}

export function serialize(state) {
  const p = new URLSearchParams();
  for (const [key, def] of Object.entries(DEFAULTS)) {
    const v = state[key];
    if (v === def) continue;
    if (typeof v === 'string' && v.startsWith('#')) p.set(key, v.slice(1));
    else p.set(key, String(v));
  }
  const q = p.toString();
  return q ? `#${q}` : '';
}
