import type { PublicPath } from 'wxt/browser';
import type { Locale } from '@/lib/schemas';

/** Keep in sync with `--font-sans` / `--font-fa` in globals.css (canvas can't read CSS vars). */
export const APP_FONT_STACK: Record<Locale, string> = {
  fa: '"Vazir", "Montserrat", ui-sans-serif, system-ui, sans-serif',
  en: '"Montserrat", ui-sans-serif, system-ui, sans-serif',
};

type FontFaceDef = {
  family: 'Vazir' | 'Montserrat';
  path: PublicPath;
  weight: number;
};

const FONT_FACES: FontFaceDef[] = [
  { family: 'Vazir', path: '/fonts/vazir/Vazir-Thin-FD-WOL.woff2', weight: 100 },
  { family: 'Vazir', path: '/fonts/vazir/Vazir-Light-FD-WOL.woff2', weight: 300 },
  { family: 'Vazir', path: '/fonts/vazir/Vazir-Regular-FD-WOL.woff2', weight: 400 },
  { family: 'Vazir', path: '/fonts/vazir/Vazir-Medium-FD-WOL.woff2', weight: 500 },
  { family: 'Vazir', path: '/fonts/vazir/Vazir-Bold-FD-WOL.woff2', weight: 700 },
  { family: 'Vazir', path: '/fonts/vazir/Vazir-Black-FD-WOL.woff2', weight: 900 },
  { family: 'Montserrat', path: '/fonts/montserrat/Montserrat-Thin.woff2', weight: 100 },
  { family: 'Montserrat', path: '/fonts/montserrat/Montserrat-Light.woff2', weight: 300 },
  { family: 'Montserrat', path: '/fonts/montserrat/Montserrat-Regular.woff2', weight: 400 },
  { family: 'Montserrat', path: '/fonts/montserrat/Montserrat-Medium.woff2', weight: 500 },
  { family: 'Montserrat', path: '/fonts/montserrat/Montserrat-SemiBold.woff2', weight: 600 },
  { family: 'Montserrat', path: '/fonts/montserrat/Montserrat-Bold.woff2', weight: 700 },
];

let registered = false;

/**
 * Registers app fonts on the document via the FontFace API.
 * `@font-face` inside a shadow root is ignored and relative URLs would resolve
 * against the host page, so fonts are added with absolute extension URLs instead.
 */
export function registerAppFonts() {
  if (registered || typeof document === 'undefined' || !('fonts' in document)) {
    return;
  }
  registered = true;

  for (const face of FONT_FACES) {
    try {
      const url = browser.runtime.getURL(face.path);
      const font = new FontFace(face.family, `url("${url}") format("woff2")`, {
        weight: String(face.weight),
        style: 'normal',
        display: 'swap',
      });
      document.fonts.add(font);
      font.load().catch(() => {
        // Missing/blocked file — the CSS fallback stack takes over.
      });
    } catch {
      // FontFace unsupported or URL resolution failed — fall back to system fonts.
    }
  }
}
