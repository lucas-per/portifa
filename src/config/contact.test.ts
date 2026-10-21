import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { contactLinks, copyrightHolder, getContact } from './contact';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf-8');

describe('contactLinks', () => {
  it('ordem do Figma: E-mail, LinkedIn, GitHub, Baixar CV', () => {
    expect(contactLinks.map((link) => link.key)).toEqual(['email', 'linkedin', 'github', 'cv']);
  });

  it('todo contato tem nome acessível (o mini-rodapé do menu mostra só o ícone)', () => {
    for (const link of contactLinks) expect(link.ariaLabel.trim().length, link.key).toBeGreaterThan(0);
  });

  it('LinkedIn e GitHub abrem em nova aba; o CV é download', () => {
    expect(getContact('linkedin').external).toBe(true);
    expect(getContact('github').external).toBe(true);
    expect(getContact('cv').download).toBe(true);
  });

  it('o © é do Lucas Pereira', () => {
    expect(copyrightHolder).toBe('Lucas Pereira');
  });
});

describe('fonte única: os componentes não repetem URL nem rótulo de contato', () => {
  const components = [
    '../components/layout/Footer.astro',
    '../components/layout/FooterMobile.astro',
    '../components/layout/HeaderMobileMenu.astro',
    '../components/layout/HeaderMobile.astro',
    '../components/layout/Header.astro',
  ];

  for (const path of components) {
    it(`${path.split('/').pop()} lê de config/contact.ts`, () => {
      const source = read(path);
      for (const link of contactLinks) {
        expect(source, link.href).not.toContain(link.href);
        if (link.ariaLabel !== link.label) expect(source, link.ariaLabel).not.toContain(link.ariaLabel);
      }
      expect(source).not.toContain('getFullYear');
      expect(source).not.toMatch(/Lucas Pereira &middot;|&copy; \d{4}/);
    });
  }
});
