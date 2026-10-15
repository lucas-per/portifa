import pkg from '../../package.json';

/**
 * Versão do site, lida do package.json no build (fonte única). O prefixo
 * "v." segue o texto do Figma (88:720). Semver manual a cada PR que vai
 * para a main: patch para correções e ajustes de texto, minor para seções
 * ou cases novos, major para redesign.
 */
export const siteVersion = `v.${pkg.version}`;
