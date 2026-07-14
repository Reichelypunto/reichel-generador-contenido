/**
 * brands.ts
 *
 * Registro de marcas — tokens de diseño (paleta, tipografía, identidad IG)
 * para cada marca que usa el generador.
 *
 * v4: dos arreglos de fondo sobre la v3.
 *
 * 1) Antic Didone nunca llegaba a cargarse en el preview real (styles.css
 *    nunca importaba esa fuente ni Fraunces — solo lo hacía el HTML
 *    standalone de carousel-design.ts, que no es lo que se ve en pantalla).
 *    Resultado: el body siempre caía a Georgia. Se sustituye por Outfit,
 *    que es el pairing oficial de la spec para titulares tipo Fraunces y,
 *    a diferencia de Antic Didone, es legible en los tamaños pequeños
 *    (tag, contador, handle) donde antes se veía apretado.
 *
 * 2) El degradado de la última slide mezclaba tres tonos sin relación
 *    entre sí (marrón oscuro + magenta + azul del brandboard), lo que daba
 *    el efecto "turbio" señalado. Se añade deriveGradientLight(), que
 *    calcula el tercer tono aclarando el PRIMARY vía HSL en vez de usar
 *    un color de marca no relacionado — el degradado queda tonal
 *    (oscuro → primario → primario aclarado), como en la spec original.
 *    brand.LIGHT se conserva tal cual para usos de acento (p. ej. el color
 *    del tag sobre fondos oscuros), donde sí es un tono real de marca.
 *
 * Colócalo en: src/lib/design/brands.ts
 */

export type BrandId = "vida-emprendedora" | "rrss" | "kr";
export type CounterStyle = "bar" | "numeral";

export interface BrandTokens {
  id: BrandId;
  /** Nombre mostrado en el lockup del primer slide */
  name: string;
  /** Handle de Instagram mostrado en la cabecera del carrusel */
  handle?: string;
  /** Firma a usar en emails/captions de esta marca */
  signature: string;
  PRIMARY: string;
  LIGHT: string;
  DARK: string;
  LIGHT_BG: string;
  /** Segundo tono claro para alternar y evitar que todos los slides claros sean idénticos */
  LIGHT_BG_ALT: string;
  LIGHT_BORDER: string;
  DARK_BG: string;
  /** Tipografía de titulares (copy de los slides) */
  heading: string;
  /** Tipografía de cuerpo (tag, handle, caption) */
  body: string;
  counterStyle: CounterStyle;
}

export const BRAND_REGISTRY: Record<BrandId, BrandTokens> = {
  "vida-emprendedora": {
    id: "vida-emprendedora",
    // En Instagram Reichely no publica como "Vida Emprendedora" sino con su
    // identidad personal — el lockup y la cabecera reflejan eso.
    name: "Reichelypunto2.0",
    handle: "@reichelypunto2.0",
    signature: "Un abrazo,\nReichely",
    // Paleta real del brandboard: f4f4f2 / fcf2e6 / 392e2e / 5875a5 / a3134b.
    PRIMARY: "#a3134b",
    LIGHT: "#5875a5",
    DARK: "#392e2e",
    LIGHT_BG: "#fcf2e6",
    LIGHT_BG_ALT: "#f4f4f2",
    LIGHT_BORDER: "#e9dcc0",
    DARK_BG: "#392e2e",
    // Fraunces (titular) + Outfit (cuerpo/tag/contador). Romana Bold del
    // brandboard original no está en Google Fonts y no era legal
    // descargarla de sitios de terceros; Reichel confirmó Fraunces.
    // Antic Didone se descarta: nunca llegó a cargar en el preview real
    // (ver nota de v4 arriba) y además no es legible en tamaños pequeños.
    heading: "'Fraunces', Georgia, serif",
    body: "'Outfit', system-ui, sans-serif",
    counterStyle: "numeral",
  },
  rrss: {
    id: "rrss",
    name: "Vender en RRSS sin Complicaciones",
    signature: "Hasta luego, Maricarmen 👋🏼",
    // tomado de content-generator.tsx: BRANDS.rrss
    PRIMARY: "#392e2e",
    LIGHT: "#7a5c5c",
    DARK: "#211a1a",
    LIGHT_BG: "#f5efef",
    LIGHT_BG_ALT: "#f5efef",
    LIGHT_BORDER: "#e6dcdc",
    DARK_BG: "#1a1414",
    heading: "'Cormorant Garamond', Georgia, serif",
    body: "'DM Sans', system-ui, sans-serif",
    counterStyle: "bar",
  },
  kr: {
    id: "kr",
    name: "Keles & Reichel",
    signature: "Keles & Reichel 💋",
    // Paleta propia de K&R — tomada de content-generator.tsx: BRANDS.kr.
    // Es una familia de azules independiente de la magenta de Vida
    // Emprendedora, no una aproximación: PRIMARY #0e2e64, LIGHT #2a5298,
    // DARK #071b3d ya son, de por sí, tonal (oscuro→medio→claro dentro del
    // mismo azul), así que este degradado nunca tuvo el problema "turbio"
    // que sí tenía vida-emprendedora.
    PRIMARY: "#0e2e64",
    LIGHT: "#2a5298",
    DARK: "#071b3d",
    LIGHT_BG: "#edf1f9",
    LIGHT_BG_ALT: "#edf1f9",
    LIGHT_BORDER: "#dde5f2",
    DARK_BG: "#0a1a33",
    heading: "'Cormorant Garamond', Georgia, serif",
    body: "'DM Sans', system-ui, sans-serif",
    counterStyle: "bar",
  },
};

export const FONTS = {
  // Se listan aquí TODAS las familias que puede necesitar cualquier marca,
  // para cargarlas de una vez en el <head> sin importar cuál esté activa.
  // (Antic Didone se retira: ninguna marca la usa ya — ver nota v4.)
  googleFontsUrl:
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,900&family=Outfit:wght@400;500;600;700&display=swap",
} as const;

export function getBrandTokens(brandId: BrandId | undefined): BrandTokens {
  return BRAND_REGISTRY[brandId ?? "vida-emprendedora"];
}

// ---------------------------------------------------------------------------
// Derivación de color — arregla el degradado "turbio"
// ---------------------------------------------------------------------------

/** Convierte #rrggbb a [h, s, l] (h en grados 0-360, s/l en 0-1). */
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Aclara un color hex un `amount` (0-1) de luminosidad, manteniendo su matiz
 * y saturación. Se usa para derivar el tercer tono del degradado a partir
 * del PRIMARY de la marca, en vez de mezclar un color de marca sin relación.
 */
export function deriveGradientLight(primaryHex: string, amount = 0.28): string {
  const [h, s, l] = hexToHsl(primaryHex);
  const newL = Math.min(1, l + amount);
  return hslToHex(h, s, newL);
}
