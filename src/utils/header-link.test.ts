import { describe, expect, it } from 'vitest';
import { getHeaderSections } from '../config/navigation';
import { getHeaderLinkText } from './header-link';

const [decomposer] = getHeaderSections();

describe('getHeaderLinkText', () => {
  it('desktop: rótulo completo vindo de macroSections, sem aria-label', () => {
    expect(getHeaderLinkText(decomposer, false)).toEqual({ text: 'Color Decomposer' });
  });

  it('mobile: texto "Decomposer" e aria-label "Color Decomposer"', () => {
    expect(getHeaderLinkText(decomposer, true)).toEqual({
      text: 'Decomposer',
      ariaLabel: 'Color Decomposer',
    });
  });

  it('mobile sem rótulo curto: usa o rótulo completo e não põe aria-label', () => {
    expect(getHeaderLinkText({ label: 'Ferramentas' }, true)).toEqual({ text: 'Ferramentas' });
  });
});
