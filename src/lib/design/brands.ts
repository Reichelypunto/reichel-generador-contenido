/**
 * brands.ts
 *
 * Registro de marcas — tokens de diseño (paleta, tipografía, identidad IG)
 * para cada marca que usa el generador.
 *
 * v3: paleta y tipografía reales de Vida Emprendedora / Reichelypunto2.0,
 * tomadas directamente del brandboard de la usuaria (ya no son valores
 * inventados/aproximados). Se añade `heading`/`body` POR MARCA en vez de
 * una única tipografía global — cada marca puede tener su propia pareja de
 * fuentes. Y `counterStyle` para permitir variantes de layout (contador
 * tipográfico vs. barra de progreso) sin tocar el motor de render.
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
    // Antic Didone es del brandboard (Google Fonts, gratis). Fraunces se
    // eligió como titular definitivo en vez de "Romana Bold" del brandboard
    // original — Romana no está en Google Fonts y no era legal descargarla
    // de sitios de "fuentes gratis" de terceros; Reichel confirmó Fraunces.
    heading: "'Fraunces', Georgia, serif",
    body: "'Antic Didone', Georgia, serif",
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
    // tomado de content-generator.tsx: BRANDS.kr
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
  googleFontsUrl:
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,900&family=Antic+Didone&display=swap",
} as const;

export function getBrandTokens(brandId: BrandId | undefined): BrandTokens {
  return BRAND_REGISTRY[brandId ?? "vida-emprendedora"];
}
