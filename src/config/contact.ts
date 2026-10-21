export type ContactLink = {
  key: 'email' | 'linkedin' | 'github' | 'cv';
  href: string;
  /** Texto visível nos rodapés. */
  label: string;
  /**
   * Nome acessível. Obrigatório quando o link aparece só com ícone (mini-rodapé
   * do menu mobile); nos rodapés, só entra quando o texto visível não basta.
   */
  ariaLabel: string;
  /** Usar o nome acessível também nos rodapés, onde o texto é visível. */
  ariaLabelWithText?: boolean;
  /** Classe de clique (camada do Figma). */
  className: string;
  external?: boolean;
  download?: boolean;
  /** Ícone nos rodapés (LinkedIn e GitHub com a seta de "abre fora"). */
  footerIcon: 'mail' | 'external' | 'download';
  /** Ícone no mini-rodapé do menu mobile (marcas do LinkedIn e do GitHub). */
  menuIcon: 'mail' | 'linkedin' | 'github' | 'download';
};

/**
 * Fonte única dos contatos: rodapé desktop, rodapé mobile e mini-rodapé do
 * menu mobile. Ordem do Figma nos três: E-mail → LinkedIn → GitHub → Baixar CV.
 */
export const contactLinks: ContactLink[] = [
  {
    key: 'email',
    href: 'mailto:oi@lpereira.me',
    label: 'oi@lpereira.me',
    ariaLabel: 'Enviar e-mail para oi@lpereira.me',
    className: 'clickable-mailto-footer',
    footerIcon: 'mail',
    menuIcon: 'mail',
  },
  {
    key: 'linkedin',
    href: 'https://www.linkedin.com/in/lucasvalimpereira/',
    label: 'LinkedIn',
    ariaLabel: 'Abrir perfil do LinkedIn em nova aba',
    className: 'clickable-link-external-linkedin',
    external: true,
    footerIcon: 'external',
    menuIcon: 'linkedin',
  },
  {
    key: 'github',
    href: 'https://github.com/lucas-per',
    label: 'GitHub',
    ariaLabel: 'Abrir perfil do GitHub em nova aba',
    ariaLabelWithText: true,
    className: 'clickable-link-external-github',
    external: true,
    footerIcon: 'external',
    menuIcon: 'github',
  },
  {
    key: 'cv',
    href: '/cv-lucas-pereira.pdf',
    label: 'Baixar CV',
    ariaLabel: 'Baixar CV',
    className: 'clickable-download-cv',
    download: true,
    footerIcon: 'download',
    menuIcon: 'download',
  },
];

/** Titular e ano do ©, nos rodapés e no mini-rodapé (o ano é o do build). */
export const copyrightHolder = 'Lucas Pereira';
export const copyrightYear = new Date().getFullYear();

export function getContact(key: ContactLink['key']): ContactLink {
  return contactLinks.find((link) => link.key === key)!;
}
