import { describe, expect, it } from 'vitest';
import pkg from '../../package.json';
import { siteVersion } from './version';

describe('siteVersion', () => {
  it('usa o formato do Figma, "v." seguido de semver', () => {
    expect(siteVersion).toMatch(/^v\.\d+\.\d+\.\d+$/);
  });

  it('vem do version do package.json', () => {
    expect(siteVersion).toBe(`v.${pkg.version}`);
  });
});
