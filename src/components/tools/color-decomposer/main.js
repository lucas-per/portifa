// Origem: lucas-per/color-decomposer@v0.2.0, app/main.js. Mudanças da integração ao site: import do pacote
// color-decomposer e o tema derivado aplicado só no elemento raiz da ferramenta (.cd), não no <html>.
// Estrutura do Figma (2026-10-19): lista de níveis em todos os tamanhos; no computador o painel de detalhes fica
// sempre aberto ao lado da lista, no celular abre sob a linha tocada (accordion).
// PR 2: o Auto sugere uma cor próxima sem tons parecidos (auto.js). Saem a cor de apoio, a Cor viva e o "Usar sua cor no
// estado normal". PR 8: sai o "Manter minha cor exata"; a cor principal fica sempre no nível 100.
import {
  decomposeTheme, contrastRatio, PRESETS, toPrimitiveTheme, toGrayscaleTheme, toCssVariables, toPlainJson, checkToneSeparation, oklchToHex, hexToOklch
} from 'color-decomposer';
import { T, fmt, helpText } from './strings.js';
import { suggestColor } from './auto.js';
import { buildHelp } from './help.js';
import { chromeTokens, applyChrome } from './chrome.js';
import { DEFAULTS, parseHash, serialize } from './state.js';

const NAME = 'marca';
const $ = (id) => document.getElementById(id);
const ROOT = document.querySelector('.cd');
const systemMode = () => (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
const HEX6 = /^#?[0-9a-f]{6}$/i;
const toHex = (v) => (HEX6.test(v.trim()) ? `#${v.trim().replace('#', '').toLowerCase()}` : null);
const up = (hex) => hex.toUpperCase();

let state = parseHash(location.hash, systemMode());
let current = null; // último resultado válido: { theme, preset }
let lastError = '';
let tune = null; // { L, C, h, hex }: valores dos controles de claridade, intensidade e matiz

/* ---------- Motor ---------- */

// Os ajustes avançados saíram da interface (2026-10-19): ordem, saturação do escuro, falha de contraste e o token txt
// ficam no padrão do motor, que é o mesmo que a interface usava.
function buildOptions(s) {
  return {
    txtOnStrategy: s.strategy,
    accessibilityLevel: s.level
  };
}

function build(s, name = NAME) {
  const preset = PRESETS[s.preset];
  try {
    const theme = decomposeTheme({ colors: { [name]: s.color }, preset, options: buildOptions(s) });
    return { theme, preset };
  } catch (e) {
    return { error: e.message };
  }
}

/* ---------- Modelo dos tons exibidos ---------- */

const requiredRatio = () => (state.level === 'AAA' ? 7 : 4.5);

function verdictOf(ratio) {
  if (ratio >= 7) return { text: T.verdict.both, ok: true };
  if (ratio >= 4.5) return { text: T.verdict.aa, ok: true };
  return { text: T.verdict.none, ok: false };
}

function pair(group, key) {
  return { s: group.surface[key], t: group.txtOn[key], b: group.border[key] };
}

function itemsFor(tab, mode) {
  const { theme, preset } = current;
  const c = theme.colors[NAME];
  const mk = (key, num, label, title, a, extra = {}) => {
    const ratio = contrastRatio(a.s, a.t);
    return { key: String(key), num, label, title, a, ratio, ...extra };
  };
  if (tab === 'behavior') {
    return Object.entries(c[mode].behavior.level).map(([name, level]) => {
      const nice = T.behaviorNamesByPreset[preset.id]?.[name] ?? T.behaviorNames[name] ?? name;
      return mk(name, level, T.detail.behavior(nice, level), T.detail.behavior(nice, level),
        pair(c[mode].behavior, name), { name: nice, base: level === preset.palette.baseLevel });
    });
  }
  if (tab === 'grayscale') {
    return preset.neutrals.levels.map((l) => mk(l, l, T.detail.level(l), T.detail.level(l), pair(theme.grayscale[mode], l)));
  }
  const levels = preset[tab].levels;
  return levels.map((l) => {
    const base = tab === 'palette' && l === brandLevelIn(mode);
    const label = base ? `${T.detail.level(l)}, ${T.yourColor.toLowerCase()}` : T.detail.level(l);
    return mk(l, l, label, T.detail.level(l), pair(c[mode][tab], l), { base });
  });
}

/* ---------- Nível da cor principal ---------- */

// Nível onde a cor principal está na paleta (sempre o base do sistema de níveis, 100 nos dois) e o equivalente em cada modo.
function brandLevel() {
  return current.preset.palette.baseLevel;
}
function brandLevelIn(mode) {
  const { levels } = current.preset.palette;
  return mode === 'dark' ? levels[0] + levels.at(-1) - brandLevel() : brandLevel();
}

/* ---------- Tons parecidos ---------- */

function separation() {
  if (!current) return null;
  const palette = current.theme.colors[NAME][state.mode].palette.surface;
  return checkToneSeparation(palette, state.color);
}

// Estado do Auto: indisponível quando não há tons parecidos.
function autoState() {
  const sep = separation();
  const why = sep && sep.runs.length > 0 ? '' : T.tune.autoNoConflict;
  return { sep, can: !why, why };
}

// Linhas em role="status": só reescreve quando o texto muda, para o leitor de tela não repetir o mesmo aviso.
function setStatus(el, text) {
  if (el.textContent !== text) el.textContent = text;
}

/* ---------- Avisos ---------- */

function renderAlerts() {
  const host = $('alerts');
  host.replaceChildren();
  const add = (html, role) => {
    const d = document.createElement('div');
    d.className = 'notice';
    if (role) d.setAttribute('role', role);
    d.innerHTML = html;
    host.append(d);
    return d;
  };
  if (lastError) {
    add(`<p class="notice__title">${T.warnings.errorTitle}</p><p>${esc(lastError)}</p><p>${T.warnings.errorHelp}</p>`, 'alert');
    return;
  }
  const acc = [];
  const seen = new Set();
  for (const w of current.theme.warnings.filter((x) => x.type === 'accessibility' && x.mode === state.mode)) {
    const k = `${w.mode}|${w.group}|${w.level}`;
    if (!seen.has(k)) { seen.add(k); acc.push(w); }
  }
  if (acc.length) {
    const accepted = acc.every((w) => w.accepted === 'AA');
    const req = fmt(acc[0].required).replace(',0', '');
    const d = add(`<p class="notice__line">${T.warnings.short(acc.length)} <button type="button" class="link" aria-expanded="false" aria-controls="warn-list">${T.warnings.show}</button></p>
      <div id="warn-list" hidden><p>${(accepted ? T.warnings.accept : T.warnings.keep)(acc.length, req)}</p>
      <ul class="notice__list">${acc.map((w) => `<li>${T.warnings.item(T.warnings.groups[w.group], w.level, w.ratio)}</li>`).join('')}</ul></div>`, 'status');
    d.classList.add('notice--compact');
    const btn = d.querySelector('button');
    btn.addEventListener('click', () => {
      const list = d.querySelector('#warn-list');
      const open = list.hidden;
      list.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? T.warnings.hide : T.warnings.show;
    });
  }
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* ---------- Abas ---------- */

function renderTabs() {
  const host = $('tabs');
  if (!host.children.length) {
    for (const id of ['palette', 'neutrals', 'behavior', 'grayscale']) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tab'; b.role = 'tab'; b.id = `tab-${id}`; b.dataset.tab = id;
      b.setAttribute('aria-controls', 'panel');
      b.textContent = T.tabs[id];
      host.append(b);
    }
    host.addEventListener('click', (e) => { const b = e.target.closest('.tab'); if (b) setTab(b.dataset.tab); });
    host.addEventListener('keydown', (e) => {
      const tabs = [...host.children];
      const i = tabs.findIndex((t) => t.dataset.tab === state.tab);
      const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      const t = tabs[(next + tabs.length) % tabs.length];
      setTab(t.dataset.tab);
      t.focus();
    });
  }
  for (const b of host.children) {
    const on = b.dataset.tab === state.tab;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
  }
  $('panel').setAttribute('aria-labelledby', `tab-${state.tab}`);
}

function setTab(tab) {
  if (tab === state.tab) return;
  state.tab = tab;
  state.sel = '';
  render();
}

/* ---------- Lista de níveis ---------- */

// Ícone de copiar do site (24x24, currentColor) e o de confirmação, que aparece por 1,5s depois de copiar
const ICON_COPY = '<svg class="icon-copy" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path fill-rule="evenodd" clip-rule="evenodd" d="M17 21H3V7H17V21ZM5 19H15V9H5V19Z" fill="currentColor"/><path d="M21 18H19V5H6V3H21V18Z" fill="currentColor"/></svg><svg class="icon-done" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M10 15.172L19.192 5.979L20.607 7.393L10 18L3.636 11.636L5.05 10.222L10 15.172Z" fill="currentColor"/></svg>';

const narrow = () => matchMedia('(max-width: 56.25rem)').matches;

// No computador o painel fica sempre aberto: sem escolha, mostra o nível da cor principal (ou o do meio da escala)
function defaultKey(items) {
  return (items.find((it) => it.base) ?? items[Math.floor(items.length / 2)]).key;
}

function swatchHtml(it, tab) {
  const flag = it.ratio < requiredRatio() ? '<span class="swatch__flag" aria-hidden="true"></span>' : '';
  const name = tab === 'behavior' ? `<span class="swatch__name">${esc(it.name)}</span>` : '';
  return `${flag}<span class="swatch__num">${it.num}</span><span class="swatch__aa" aria-hidden="true">Aa</span>${name}`
    + `<span class="swatch__meta" aria-hidden="true"><span class="swatch__hex">${up(it.a.s)}</span><span class="swatch__ratio">${fmt(it.ratio)} para 1</span></span>`;
}

function paintSwatch(btn, it, tab) {
  for (const el of [btn, btn.parentElement]) { el.style.setProperty('--s', it.a.s); el.style.setProperty('--t', it.a.t); }
  const flag = it.ratio < requiredRatio();
  const v = verdictOf(it.ratio);
  btn.setAttribute('aria-label', T.swatchAria(it.label, up(it.a.s), up(it.a.t), it.ratio, v.text) + (flag ? ` ${T.flagBelow(state.level)}.` : ''));
  btn.innerHTML = swatchHtml(it, tab);
}

// Um só painel de detalhes: no computador fica na coluna da direita; no celular, logo abaixo da linha aberta.
const detail = document.createElement('section');
detail.className = 'detail';
detail.id = 'detail';

function flash(btn) {
  btn.classList.add('is-done');
  clearTimeout(btn.doneTimer);
  btn.doneTimer = setTimeout(() => btn.classList.remove('is-done'), 1500);
}

function renderRibbon() {
  const host = $('ribbon-host');
  const tab = state.tab;
  const items = itemsFor(tab, state.mode);
  const wide = !narrow();
  const sig = `${tab}|${state.preset}|${items.map((i) => `${i.key}:${i.num}${i.base ? '*' : ''}`).join(',')}|${wide}`;
  const focusedKey = document.activeElement?.closest?.('.swatch')?.dataset.key;

  let ribbon = host.firstElementChild;
  if (host.dataset.sig !== sig) {
    host.dataset.sig = sig;
    ribbon = document.createElement('div');
    ribbon.className = 'ribbon';
    // computador: escolher um nível troca o painel ao lado (radiogroup); celular: cada linha abre e fecha o seu (accordion)
    ribbon.setAttribute('role', wide ? 'radiogroup' : 'group');
    ribbon.setAttribute('aria-label', T.groupLabel[tab]);
    items.forEach((it, i) => {
      const cell = document.createElement('div');
      cell.className = 'cell';
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'swatch'; b.dataset.key = it.key; b.dataset.i = i;
      if (wide) b.role = 'radio'; else b.setAttribute('aria-controls', 'detail');
      cell.append(b);
      const c = document.createElement('button');
      c.type = 'button'; c.className = 'swatch__copy'; c.innerHTML = ICON_COPY;
      cell.classList.add('cell--copy');
      cell.append(c);
      ribbon.append(cell);
    });
    ribbon.addEventListener('click', (e) => {
      const c = e.target.closest('.swatch__copy');
      if (c) {
        copyText(c.dataset.hex, T.detail.copied(c.dataset.hex), T.detail.copyFail);
        flash(c);
        return;
      }
      const b = e.target.closest('.swatch');
      if (!b) return;
      // no celular, tocar na linha aberta fecha o painel
      select(!narrow() || b.getAttribute('aria-expanded') !== 'true' ? b.dataset.key : '');
    });
    ribbon.addEventListener('keydown', onRibbonKey);
    host.replaceChildren(ribbon);
  }

  const buttons = [...ribbon.querySelectorAll('.swatch')];
  items.forEach((it, i) => {
    paintSwatch(buttons[i], it, tab);
    const copy = buttons[i].parentElement.querySelector('.swatch__copy');
    if (copy) {
      copy.dataset.hex = up(it.a.s);
      copy.setAttribute('aria-label', T.detail.copyLevelAria(it.title, up(it.a.s)));
    }
  });
  const sel = state.sel || (wide ? defaultKey(items) : '');
  const selIndex = items.findIndex((it) => it.key === sel);
  buttons.forEach((b, i) => {
    const on = i === selIndex;
    b.parentElement.classList.toggle('is-selected', on);
    if (wide) {
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on || (selIndex < 0 && i === 0) ? 0 : -1;
    } else {
      b.setAttribute('aria-expanded', String(on));
      b.tabIndex = 0;
    }
    const copy = b.parentElement.querySelector('.swatch__copy');
    if (copy) copy.tabIndex = b.tabIndex; // no computador, uma só parada de Tab a mais: a do tom ativo
  });

  detail.hidden = selIndex < 0;
  if (selIndex >= 0) fillDetail(items[selIndex]);
  if (wide) $('detail-host').replaceChildren(detail);
  else {
    $('detail-host').replaceChildren();
    if (selIndex >= 0) buttons[selIndex].parentElement.after(detail); else ribbon.append(detail);
  }
  if (focusedKey) ribbon.querySelector(`.swatch[data-key="${CSS.escape(focusedKey)}"]`)?.focus({ preventScroll: true });
}

function onRibbonKey(e) {
  const buttons = [...e.currentTarget.querySelectorAll('.swatch')];
  const i = buttons.indexOf(document.activeElement);
  if (i < 0) return;
  const wide = !narrow();
  if (e.key === 'Escape') { if (!wide && state.sel) { e.preventDefault(); state.sel = ''; render(); } return; }
  const target = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: buttons.length - 1 }[e.key];
  if (target === undefined) return;
  e.preventDefault();
  const b = buttons[Math.max(0, Math.min(buttons.length - 1, target))];
  if (wide) select(b.dataset.key); // nos rádios a seta escolhe; no accordion só move o foco
  e.currentTarget.querySelector(`.swatch[data-key="${CSS.escape(b.dataset.key)}"]`)?.focus();
}

function select(key) {
  state.sel = key;
  render();
}

/* ---------- Detalhes ---------- */

function fillDetail(it) {
  detail.setAttribute('aria-label', `Detalhes: ${it.title}`);
  const row = (what, hex) => `
    <div class="value">
      <span class="value__chip" style="--c:${hex}"></span>
      <span><span class="value__label">${what}</span><span class="value__hex">${up(hex)}</span></span>
      <button type="button" class="btn btn--icon" data-copy="${up(hex)}" aria-label="${T.detail.copyAria(what, up(hex))}">${ICON_COPY}</button>
    </div>`;
  // Texto com tom da cor (desligado = preto ou branco): a trilha ligada é a superfície do primeiro nível de Comportamento
  // (20) no claro e do último (180) no escuro, e o polegar, o texto sobre ela (escuro nos dois modos)
  const behavior = current.theme.colors[NAME][state.mode].behavior;
  const names = Object.keys(behavior.level);
  const edge = names[state.mode === 'dark' ? names.length - 1 : 0];
  const track = behavior.surface[edge];
  const thumb = behavior.txtOn[edge];
  detail.innerHTML = `
    <div class="detail__head">
      <h3 class="detail__title">${esc(it.title)}</h3>
      <button type="button" class="btn btn--quiet detail__close" data-close>${T.detail.close}</button>
    </div>
    <div class="sample" style="--s:${it.a.s};--t:${it.a.t}">
      <span class="sample__text"><span class="sample__big" aria-hidden="true">Aa</span><span class="sample__small">${T.detail.sample}</span></span>
      <span class="sample__tag">${T.detail.tag(it.ratio)}</span>
    </div>
    <label class="switch switch--end" style="--on-bg:${track};--on-fg:${thumb}">
      <input type="checkbox" role="switch" name="strategy"${state.strategy === 'brand-tint' ? ' checked' : ''}>
      <span class="switch__label">${T.detail.tintText}</span>
      <span class="switch__track" aria-hidden="true"></span>
    </label>
    <div class="values">${row(T.detail.surface, it.a.s)}${row(T.detail.txtOn, it.a.t)}${row(T.detail.border, it.a.b)}</div>`;
}

detail.addEventListener('click', async (e) => {
  const c = e.target.closest('[data-copy]');
  if (c) {
    await copyText(c.dataset.copy, T.detail.copied(c.dataset.copy), T.detail.copyFail); // anunciado no #live (role="status")
    flash(c);
    return;
  }
  if (e.target.closest('[data-close]')) {
    const key = state.sel;
    state.sel = '';
    render();
    $('ribbon-host').querySelector(`.swatch[data-key="${CSS.escape(key)}"]`)?.focus();
  }
});
// Texto com tom da cor: vale para todos os tons. O painel é refeito a cada mudança, então o foco volta para o toggle.
detail.addEventListener('change', (e) => {
  if (e.target.name !== 'strategy') return;
  state.strategy = e.target.checked ? 'brand-tint' : 'high-contrast';
  update();
  detail.querySelector('input[name="strategy"]')?.focus();
});

/* ---------- Área de transferência e avisos falados ---------- */

let liveTimer;
function say(text) {
  const live = $('live');
  live.textContent = '';
  clearTimeout(liveTimer);
  liveTimer = setTimeout(() => { live.textContent = text; }, 30);
}

async function copyText(text, okMsg, failMsg, statusEl) {
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.append(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
  }
  const msg = ok ? okMsg : failMsg;
  if (statusEl) statusEl.textContent = msg; else say(msg);
}

/* ---------- Ajustes ---------- */

function setInvalid(input, on) {
  const err = $(`${input.id}-error`);
  err.hidden = !on;
  err.textContent = T.hexError;
  if (on) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
}

// "Paletas" só abre e fecha no celular. No computador o corpo fica sempre aberto (o botão está em display: none) e o
// estado escolhido no celular volta quando a janela estreita de novo.
let stageOpen = true;
const applyStage = () => { $('stage-body').hidden = narrow() && !stageOpen; };

function bindControls() {
  const hexInput = $('hex');
  hexInput.addEventListener('input', () => {
    const hex = toHex(hexInput.value);
    if (hex) { state.color = hex; setInvalid(hexInput, false); update(); }
    else if (hexInput.value.trim().replace('#', '').length >= 6) setInvalid(hexInput, true);
  });
  hexInput.addEventListener('blur', () => setInvalid(hexInput, !toHex(hexInput.value)));
  for (const id of ['tuneL', 'tuneC', 'tuneH']) {
    $(id).addEventListener('input', () => {
      tune = { ...tune, L: Number($('tuneL').value), C: Number($('tuneC').value), h: Number($('tuneH').value), snapped: false };
      const r = oklchToHex(tune.L / 100, tune.C / 100, tune.h);
      tune.hex = r.hex;
      state.color = r.hex;
      $('hex').value = up(r.hex); setInvalid($('hex'), false);
      update();
    });
  }
  // Intensidade pedida além do máximo da cor: ao soltar, o controle encaixa no valor real e o aviso continua
  $('tuneC').addEventListener('change', () => {
    const used = oklchToHex(tune.L / 100, tune.C / 100, tune.h);
    if (tune.C / 100 - used.chroma <= 0.005) return;
    tune = { ...tune, C: Math.round(used.chroma * 100), snapped: true };
    syncTune();
  });
  // Auto: troca a cor principal pela sugestão. A cor nova aparece no campo; o botão fica indisponível (sem tons parecidos)
  // e o foco continua nele, então o resultado é anunciado.
  $('auto').addEventListener('click', () => {
    if ($('auto').getAttribute('aria-disabled') === 'true') return;
    const hex = suggestColor(state.color, PRESETS[state.preset]);
    if (!hex) { say(T.tune.autoNone); return; }
    state.color = hex;
    update();
    say(T.tune.autoDone(up(hex)));
  });
  for (const name of ['mode', 'level', 'preset']) {
    for (const r of document.querySelectorAll(`input[name="${name}"]`)) {
      r.addEventListener('change', () => {
        state[name] = r.value;
        if (name === 'preset') state.sel = '';
        update();
      });
    }
  }
  $('stage-toggle').addEventListener('click', (e) => {
    stageOpen = e.currentTarget.getAttribute('aria-expanded') !== 'true';
    e.currentTarget.setAttribute('aria-expanded', String(stageOpen));
    applyStage();
  });
  $('rail').addEventListener('submit', (e) => e.preventDefault());
}

const decimal = (n) => n.toFixed(2).replace('.', ',');

function syncTune() {
  if (!tune || tune.hex !== state.color) {
    const o = hexToOklch(state.color);
    tune = { L: Math.round(o.L * 100), C: Math.min(40, Math.round(o.C * 100)), h: Math.round(o.h) % 360, hex: state.color };
  }
  $('tuneL').value = tune.L; $('tuneC').value = tune.C; $('tuneH').value = tune.h;
  $('tuneL-out').textContent = `${tune.L}%`;
  $('tuneH-out').textContent = `${tune.h}°`;
  const L = tune.L / 100, C = tune.C / 100;
  const stops = (arr) => `linear-gradient(to right, ${arr.join(', ')})`;
  $('tuneL').style.setProperty('--track', stops([0, 0.25, 0.5, 0.75, 1].map((l) => `oklch(${l} ${C} ${tune.h})`)));
  $('tuneC').style.setProperty('--track', stops([0, 0.1, 0.2, 0.3, 0.4].map((c) => `oklch(${L} ${c} ${tune.h})`)));
  $('tuneH').style.setProperty('--track', stops(Array.from({ length: 13 }, (_, i) => `oklch(${L} ${C} ${i * 30})`)));
  const used = oklchToHex(L, C, tune.h);
  const clipped = C - used.chroma > 0.005; // só avisa quando a diferença aparece na escala do controle (0,01)
  // o valor ao lado do rótulo é o real; o controle só encaixa nele ao soltar (evento change)
  $('tuneC-out').textContent = decimal(clipped ? used.chroma : C);
  // o aviso fica depois do encaixe, até a próxima mudança; só se reescreve quando o texto muda (role="status")
  const text = clipped || tune.snapped ? T.tune.clipped(decimal(used.chroma)) : '';
  if ($('tune-note').textContent !== text) $('tune-note').textContent = text;
}

function renderMini() {
  const { sep, can, why } = autoState();
  if (!sep) return;
  // aria-disabled: o botão continua no foco do teclado e do leitor de tela, sem executar a ação; o motivo fica à vista
  $('auto').setAttribute('aria-disabled', String(!can));
  setStatus($('auto-why'), why);
  const surface = current.theme.colors[NAME][state.mode].palette.surface;
  const levels = Object.keys(surface).map(Number).sort((x, y) => x - y);
  // mini paleta (Figma): 8 tons e o anel no nível da cor principal, na posição dele na escala (no meio com o nível 100).
  // Os tons vêm de todos os níveis menos o do anel; se há mais que 8, escolhe 8 espaçados por igual.
  const at = brandLevelIn(state.mode);
  const others = levels.filter((l) => l !== at);
  const pick = others.length <= 8 ? others : Array.from({ length: 8 }, (_, i) => others[Math.round((i * (others.length - 1)) / 7)]);
  const tones = (list) => list.map((l) => { const sw = document.createElement('i'); sw.style.setProperty('--c', surface[l]); return sw; });
  const left = pick.filter((l) => l < at), right = pick.filter((l) => l > at);
  $('mini-start').replaceChildren(...tones(left));
  $('mini-end').replaceChildren(...tones(right));
  // as faixas dividem a largura na proporção dos tons; um lado sem tons some (cor no primeiro ou no último nível)
  $('mini').style.gridTemplateColumns = `minmax(0, ${left.length}fr) 2.25rem minmax(0, ${right.length}fr)`;
  for (const [id, list] of [['start', left], ['end', right]]) { $(`mini-${id}`).hidden = !list.length; $(`mini-flags-${id}`).hidden = !list.length; }
  $('mini-mark').style.setProperty('--c', surface[at]);
  // marcação dos tons quase iguais ao vizinho, sob a faixa; a ordem é a que se vê (faixa, anel, faixa)
  const seen = [...left, at, ...right];
  const flagged = new Set(sep.tones);
  const flagFor = (l, i) => {
    const f = document.createElement('b');
    if (flagged.has(l)) {
      f.className = 'is-flag';
      if (!flagged.has(seen[i - 1])) f.classList.add('is-start');
      if (!flagged.has(seen[i + 1])) f.classList.add('is-end');
    }
    return f;
  };
  $('mini-flags-start').replaceChildren(...left.map((l, i) => flagFor(l, i)));
  $('mini-flags-mid').replaceChildren(flagFor(at, left.length));
  $('mini-flags-end').replaceChildren(...right.map((l, i) => flagFor(l, left.length + 1 + i)));
}

function syncControls() {
  $('hex').value = up(state.color);
  if (document.activeElement !== $('hex')) setInvalid($('hex'), false);
  syncTune();
  for (const name of ['mode', 'level', 'preset']) document.querySelector(`input[name="${name}"][value="${state[name]}"]`).checked = true;
  setStatus($('level-help'), T.contrastHelp[state.level]);
  const preset = PRESETS[state.preset];
  $('preset-help').textContent = T.presetHelp(preset.palette.levels.length, preset.neutrals.levels.length);
}

/* ---------- Exportação ---------- */

const exp = { name: 'marca' };
const slug = (s) => String(s).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'marca';

function exportFile(format, name) {
  const { theme, error } = build(state, name);
  if (error) return { text: error, file: 'erro.txt' };
  if (format === 'css') return { text: toCssVariables(theme), file: `${name}.css` };
  if (format === 'json') return { text: toPlainJson(theme), file: `${name}-decomposicao.json` };
  const prim = toPrimitiveTheme(theme);
  const gray = toGrayscaleTheme(theme)._color_palette.mode;
  for (const m of ['light', 'dark']) prim._color_palette.mode[m].grayscale = gray[m].grayscale;
  return { text: `${JSON.stringify(prim, null, 2)}\n`, file: `${name}-tokens-aplica.json` };
}

function refreshExport() {
  const name = slug($('export-name').value || exp.name);
  const format = document.querySelector('input[name="format"]:checked').value;
  const { text } = exportFile(format, name);
  $('export-preview').value = text;
  $('export-status').textContent = '';
}

function bindExport() {
  const dlg = $('export');
  $('open-export').addEventListener('click', () => {
    $('export-name').value = exp.name;
    refreshExport();
    dlg.showModal();
  });
  $('export-name').addEventListener('input', () => { exp.name = slug($('export-name').value); refreshExport(); });
  for (const r of document.querySelectorAll('input[name="format"]')) r.addEventListener('change', refreshExport);
  $('export-copy').addEventListener('click', () => copyText($('export-preview').value, T.export.copied, T.export.copyFail, $('export-status')));
  $('export-download').addEventListener('click', () => {
    const format = document.querySelector('input[name="format"]:checked').value;
    const { text, file } = exportFile(format, slug($('export-name').value || exp.name));
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: file });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('export-status').textContent = T.export.downloaded(file);
  });
}

/* ---------- Ajuda ---------- */

// A ajuda é uma visão da mesma página: `view=ajuda` no endereço. Abrir cria uma entrada no histórico,
// então o botão Voltar do navegador também fecha a ajuda.
let helpBuilt = false;
let helpPushed = false;
const APP_TITLE = document.title;

function applyView({ focus = false } = {}) {
  const open = state.view === 'ajuda';
  if (open && !helpBuilt) {
    buildHelp($('help'), helpText({ standard: PRESETS.standard, aplica: PRESETS.aplica }), copyText);
    helpBuilt = true;
  }
  $('help').hidden = !open;
  document.querySelector('.shell').hidden = open;
  $('open-help').setAttribute('aria-expanded', String(open));
  document.title = open ? helpText({ standard: PRESETS.standard, aplica: PRESETS.aplica }).docTitle : APP_TITLE;
  if (!focus) return;
  window.scrollTo(0, 0);
  (open ? $('help-title') : $('open-help')).focus({ preventScroll: true });
}

function bindHelp() {
  $('open-help').addEventListener('click', () => {
    state.view = 'ajuda';
    const hash = serialize(state, systemMode());
    try { history.pushState(null, '', hash || location.pathname + location.search); helpPushed = true; } catch { helpPushed = false; }
    applyView({ focus: true });
  });
  $('help').addEventListener('click', (e) => {
    if (!e.target.closest('#help-back')) return;
    if (helpPushed) { helpPushed = false; history.back(); return; }
    state.view = '';
    render();
    applyView({ focus: true });
  });
  addEventListener('popstate', () => {
    state.view = parseHash(location.hash, systemMode()).view;
    helpPushed = false;
    applyView({ focus: true });
  });
}

/* ---------- Ciclo principal ---------- */

function render() {
  renderTabs();
  renderAlerts();
  renderMini();
  renderRibbon();
  const hash = serialize(state, systemMode());
  history.replaceState(null, '', hash || location.pathname + location.search);
}

function update() {
  const r = build(state);
  if (r.error) {
    lastError = r.error;
  } else {
    lastError = '';
    current = r;
    applyChrome(ROOT, chromeTokens(r.theme, NAME, state.mode, r.preset), state.mode);
  }
  if (!current) { current = build(DEFAULTS); }
  syncControls();
  render();
}

bindControls();
bindExport();
bindHelp();
matchMedia('(max-width: 56.25rem)').addEventListener('change', () => { applyStage(); $('ribbon-host').dataset.sig = ''; update(); });
update();
applyView();
