import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Cargar skills como texto (bundleadas en server runtime)
import carruselesSkill from "../../skills/carruseles-skill.md?raw";
import reelsSkill from "../../skills/reels-skill.md?raw";
import storiesSkill from "../../skills/stories-skill.md?raw";
import postSkill from "../../skills/social-media-post-skill.md?raw";
import ventaSutilSkill from "../../skills/venta-sutil-skill.md?raw";
import brandGuidelines from "../../skills/BRAND_GUIDELINES_SHARED.md?raw";

const SKILLS: Record<string, string> = {
  carrusel: carruselesSkill,
  reel: reelsSkill,
  stories: storiesSkill,
  post: postSkill,
  venta: ventaSutilSkill,
  // "email" no tiene skill .md propia — se construye inline (ver buildEmailSkillPrompt)
};

const FORMATO_LABEL: Record<string, string> = {
  carrusel: "Carrusel (10 slides posicionados + caption)",
  reel: "Reel (guion completo + caption)",
  post: "Post / Caption para feed",
  stories: "Secuencia de Stories (4-8 pantallas)",
  venta: "Venta Sutil (sin precio, el cliente inicia)",
  email: "Email (estructura de 8 partes + alter ego)",
};

const ESTILO_LABEL: Record<string, string> = {
  negativo: "Negativo — ataca un error o hábito destructivo y muestra la corrección",
  "info-secreta": "Info Secreta — revela algo que la audiencia no sabe y le da ventaja",
  controversial: "Controversial — desafía una creencia común con una postura contraria",
};

const MOTOR_LABEL: Record<string, string> = {
  aspiracion: "Aspiración — 'Quiero ser o tener esto'",
  educacion: "Educación — 'No sabía esto'",
  impacto: "Impacto — 'Esto me afecta directamente'",
  reflejo: "Reflejo — 'Esto soy yo'",
};

const ALTER_EGO_LABEL: Record<string, string> = {
  "la-virgo": "La Virgo — precisa, analítica, un poco perfeccionista",
  "la-procrastinadora": "La Procrastinadora — se reconoce en dejarlo todo para luego",
  "la-musa": "La Musa — creativa, emocional, inspiradora",
  "la-loca-del-cono": "La Loca del Coño — directa, sin filtro, irreverente",
  "la-bruji": "La Bruji — intuitiva, espiritual, conecta con el instinto",
};

// ---------------------------------------------------------------------------
// Voz de marca.
//
// IMPORTANTE — corrección: este generador NO tiene una marca/escuela
// llamada "Vida Emprendedora" con "alumnas". Eso no existe (confirmado por
// la usuaria) — era un error que quedó de una versión anterior, mezclado
// probablemente con contenido del OTRO repo (generador-contenido-alumnas,
// ese sí para estudiantes). Aquí solo hay dos marcas reales bajo las que
// Reichely publica contenido propio: Reichelypunto2.0 (personal) y
// Keles & Reichel (K&R, marca conjunta). "rrss" (Vender en RRSS sin
// Complicaciones / Maricarmen) es un tercer caso ya existente en el
// artefacto original — se deja tal cual, no forma parte de esta corrección.
// ---------------------------------------------------------------------------

function brandVoiceBlock(marca: string): string {
  if (marca === "rrss") {
    return `Eres la estratega de contenido digital de "Vender en RRSS sin Complicaciones", una academia digital para emprendedoras que quieren vender con estructura.

REGLAS ABSOLUTAS:
- Español de España únicamente. Nunca latinoamericanismos.
- Tono adulto, directo, sin fluff, sin corporate speak.
- Autoridad demostrada, nunca declarada.
- CTA siempre incluido. Es obligatorio, nunca opcional.
- Posiciona sin enseñar. Habla del problema, no de la solución.
- Abre bucles mentales. No los cierres.
- Sin clichés de coaching: nada de "paso a paso", "transforma tu vida", "empoderarte", "potencial", "viaje".
- Sin negritas, sin cursivas, sin emojis excesivos.
- Sin párrafos largos. Sin motivación vacía.
- Firma emails siempre: Hasta luego, Maricarmen 👋🏼`;
  }
  if (marca === "kr") {
    return `Eres la estratega de contenido digital de Keles & Reichel, un programa de acompañamiento para emprendedoras. Voz siempre en plural (Keles & Reichel).

REGLAS ABSOLUTAS:
- Español de España únicamente. Nunca latinoamericanismos.
- Tono adulto, directo, sin fluff, sin corporate speak.
- Autoridad demostrada, nunca declarada.
- CTA siempre incluido. Es obligatorio, nunca opcional.
- Posiciona sin enseñar. Habla del problema, no de la solución.
- Abre bucles mentales. No los cierres.
- Sin clichés de coaching: nada de "paso a paso", "transforma tu vida", "empoderarte", "potencial", "viaje".
- Sin negritas, sin cursivas, sin emojis excesivos.
- Sin párrafos largos. Sin motivación vacía.
- Firma emails siempre: Keles & Reichel 💋
- Enlace podcast siempre: Escúchalo aquí (hipervínculo)`;
  }
  // reichelypunto (default) — marca personal de Reichely. Usa el framework
  // compartido de motores/hooks/estilos/validación (BRAND_GUIDELINES_SHARED.md);
  // esa guía es metodología genérica de copywriting, no es exclusiva de
  // ninguna escuela ni implica que exista una.
  return brandGuidelines;
}

// ---------------------------------------------------------------------------
// Email — no hay skill .md todavía; instrucciones inline (adaptadas de
// content-generator.tsx) con soporte de alter ego.
// ---------------------------------------------------------------------------

function buildEmailSkillPrompt(alterEgo: string | undefined): string {
  const alterEgoLine = alterEgo
    ? `ALTER EGO PARA ESTE EMAIL: ${ALTER_EGO_LABEL[alterEgo] ?? alterEgo}`
    : "ALTER EGO PARA ESTE EMAIL: (no especificado — elige el tono más adecuado al tema)";

  return `# Email — Generador de Emails v1

${alterEgoLine}

ASUNTO: Elige el más potente según el alter ego:
- Frase corta con peso (no más de 6 palabras)
- Pregunta que incomoda
- Nombre propio + algo que le duele
- Lo cotidiano que no lo parece
Sin clickbait vacío. Sin exclamaciones.

PREENCABEZADO: Tensa el asunto. No lo repite. No lo explica.

ESTRUCTURA DEL EMAIL (8 partes, sin títulos):
1. Apertura: una línea. Sin "Hola". Sin nombre. Directo al tema.
2. Tensión: el problema desde dentro. Cómo se siente, no qué hace mal.
3. Identificación: describe a la lectora en su situación exacta. Que se vea.
4. Sarcasmo elegante: una línea que duele pero hace gracia. Filtro de clientes.
5. Giro: la perspectiva que no esperaba. Contraintuitivo.
6. Tip que abre: da algo útil pero que abre más preguntas de las que cierra.
7. CTA integrado en texto natural. Nunca botón.
8. Cierre incómodo: última línea que queda dando vueltas.

PROHIBIDO: "postureo" / párrafos de más de 4 líneas / motivación vacía / latinoamericanismos / botones de CTA

Luego genera 3 VARIACIONES DE ASUNTO para A/B testing:
[Tipo de asunto] | [Asunto] | [Preencabezado]`;
}

const InputSchema = z.object({
  formato: z.enum(["carrusel", "reel", "post", "stories", "venta", "email"]),
  estilo: z.enum(["negativo", "info-secreta", "controversial"]),
  motor: z.enum(["aspiracion", "educacion", "impacto", "reflejo"]),
  marca: z.enum(["reichelypunto", "rrss", "kr"]).default("reichelypunto"),
  alterEgo: z.enum(["la-virgo", "la-procrastinadora", "la-musa", "la-loca-del-cono", "la-bruji"]).optional(),
  tema: z.string().min(3).max(4000),
});

export const generarContenido = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY no configurada");
    }

    const isReichelypunto = data.marca === "reichelypunto";
    const skill = data.formato === "email" ? buildEmailSkillPrompt(data.alterEgo) : SKILLS[data.formato];
    const voz = brandVoiceBlock(data.marca);

    const systemPrompt = `${
      isReichelypunto
        ? "Eres una creadora de contenido experta escribiendo para Reichelypunto2.0 (@reichelypunto2.0), la marca personal de Reichely Portales en Instagram."
        : "Eres una creadora de contenido experta trabajando para el equipo de Reichely Portales."
    }

Tu trabajo es generar contenido siguiendo AL PIE DE LA LETRA la skill correspondiente y la voz de marca que recibes abajo.

# VOZ DE MARCA (aplica SIEMPRE)
${voz}

# SKILL ACTIVA — ${FORMATO_LABEL[data.formato]}
${skill}

# REGLAS DE EJECUCIÓN
- Estilo de ejecución: ${ESTILO_LABEL[data.estilo]}
- Motor viral: ${MOTOR_LABEL[data.motor]}
- Entrega el contenido FINAL listo para publicar, sin meta-comentarios ni explicaciones.
- Respeta exactamente la estructura definida en la skill (número de slides, formato de guion, etc.).
- Voz cálida, cercana, de mujer a mujer. Nada de corporativo ni gurú.`;

    const userPrompt = `TEMA / INSIGHT DE ENTRADA:\n\n${data.tema}\n\nGenera el contenido completo ahora.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 429) throw new Error("Demasiadas peticiones. Espera un momento y vuelve a intentar.");
      if (response.status === 402) throw new Error("Se han agotado los créditos de IA. Avisa a Reichely.");
      throw new Error(`Error IA (${response.status}): ${errText.slice(0, 200)}`);
    }

    const json = await response.json();
    const contenido = json?.choices?.[0]?.message?.content ?? "";

    return { contenido };
  });
