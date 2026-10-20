import { describe, expect, it } from 'vitest';
import { getHeaderSections } from '../config/navigation';
import { getHeaderLinkText } from './header-link';

const [decomposer] = getHeaderSections();

describe('getHeaderLinkText', () => {
  it('desktop: rótulo completo vindo de macroSections, sem aria-label', () => {
    expect(getHeaderLinkText(decomposer, false)).toEqual({ text: 'Paletaria' });
  });

  it('mobile: rótulo curto igual ao completo, então sem aria-label', () => {
    expect(getHeaderLinkText(decomposer, true)).toEqual({ text: 'Paletaria' });
  });

  it('mobile com rótulo curto diferente: texto curto e aria-label com o rótulo completo', () => {
    expect(getHeaderLinkText({ label: 'Nome completo', shortLabel: 'Nome' }, true)).toEqual({
      text: 'Nome',
      ariaLabel: 'Nome completo',
    });
  });

  it('mobile sem rótulo curto: usa o rótulo completo e não põe aria-label', () => {
    expect(getHeaderLinkText({ label: 'Ferramentas' }, true)).toEqual({ text: 'Ferramentas' });
  });
});
