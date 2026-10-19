// Origem: lucas-per/color-decomposer@v0.2.0, app/state.js. Divergência da tag (2026-10-19): saíram os ajustes que a
// interface não tem mais (ajustes avançados e a "Cor própria" do texto; na PR 2, cor de apoio, Cor viva e "Usar sua cor no
// estado normal"); um endereço antigo com eles abre no padrão. O `lvl` antigo (nível escolhido pelo Auto de antes, que
// mantinha a cor exata) liga o "Manter minha cor exata".
// Estado da interface e sua cópia na URL (para você compartilhar ou voltar ao mesmo ponto).

export const DEFAULTS = {
  color: '#057abd',
  preset: 'standard',
  strategy: 'high-contrast',
  level: 'AA',
  mode: 'light',
  tab: 'palette',
  exact: false,
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

export function parseHash(hash, systemMode) {
  const s = { ...DEFAULTS, mode: systemMode };
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  for (const key of Object.keys(DEFAULTS)) {
    if (!p.has(key)) continue;
    const v = p.get(key);
    const def = DEFAULTS[key];
    if (ENUMS[key]) { if (ENUMS[key].includes(v)) s[key] = v; continue; }
    if (typeof def === 'boolean') { s[key] = v === '1'; continue; }
    if (key === 'color') { if (HEX.test(`#${v}`)) s[key] = `#${v}`; continue; }
    if (key === 'sel') s[key] = v.slice(0, 40);
  }
  if (!p.has('exact') && p.get('lvl') && Number.isFinite(Number(p.get('lvl')))) s.exact = true;
  return s;
}

export function serialize(state, systemMode) {
  const p = new URLSearchParams();
  for (const [key, def] of Object.entries(DEFAULTS)) {
    const v = state[key];
    const baseline = key === 'mode' ? systemMode : def;
    if (v === baseline) continue;
    if (typeof v === 'boolean') p.set(key, v ? '1' : '0');
    else if (typeof v === 'string' && v.startsWith('#')) p.set(key, v.slice(1));
    else p.set(key, String(v));
  }
  const q = p.toString();
  return q ? `#${q}` : '';
}
