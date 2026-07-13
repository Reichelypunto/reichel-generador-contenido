/**
 * brands.ts
 *
 * Registro de marcas soportadas por el generador. Vida Emprendedora es la
 * marca "alumnas" original (gated por login de Supabase). RRSS y Keles &
 * Reichel son de uso privado (tú / tu equipo) — sin gate de alumnas — y
 * vienen del artefacto "content-generator.tsx" (Claude.ai) que solo hacía
 * texto. Aquí les damos la misma capa visual + export a PNG que ya tiene
 * Vida Emprendedora.
 *
 * Colócalo en: src/lib/design/brands.ts
 */

export type BrandId = "vida-emprendedora" | "rrss" | "kr";

export interface BrandTokens {
  id: BrandId;
  /** Nombre mostrado en el header del marco IG y en el slide 1 */
  name: string;
  /** Handle de Instagram, si lo tiene. Si no, se muestra `name`. */
  handle?: string;
  /** Firma a usar en emails/captions de esta marca */
  signature: string;
  PRIMARY: string;
  LIGHT: string;
  DARK: string;
  LIGHT_BG: string;
  LIGHT_BORDER: string;
  DARK_BG: string;
}

export const BRAND_REGISTRY: Record<BrandId, BrandTokens> = {
  "vida-emprendedora": {
    id: "vida-emprendedora",
    name: "Vida Emprendedora",
    handle: "@reichelypunto",
    signature: "Un abrazo,\nReichely",
    // tomado de src/styles.css — paleta real de la app
    PRIMARY: "#a3134b",
    LIGHT: "#c9527f",
    DARK: "#6e0d34",
    LIGHT_BG: "#f9f2e2",
    LIGHT_BORDER: "#e9dcc0",
    DARK_BG: "#211018",
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
    LIGHT_BORDER: "#e6dcdc",
    DARK_BG: "#1a1414",
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
    LIGHT_BORDER: "#dde5f2",
    DARK_BG: "#0a1a33",
  },
};

// Tipografía compartida por las tres marcas (Cormorant Garamond + DM Sans),
// ya usada tanto en styles.css como en content-generator.tsx.
export const FONTS = {
  heading: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
  googleFontsUrl:
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap",
} as const;

export function getBrandTokens(brandId: BrandId | undefined): BrandTokens {
  return BRAND_REGISTRY[brandId ?? "vida-emprendedora"];
}
