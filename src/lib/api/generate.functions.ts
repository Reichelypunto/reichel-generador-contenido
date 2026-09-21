import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

const MODEL = "google/gemini-2.5-pro";
const LIMITE_DIARIO = 30;
const MAX_TEMA = 4000;
const MAX_PROMPT = 24000;

// ---------------------------------------------------------------------------
// Marca propia de cada alumna (sustituye a las 3 marcas fijas anteriores).
// Se lee SIEMPRE del perfil en la base de datos, nunca de lo que envíe el
// navegador, para que nadie pueda escribir con la voz de otra.
// ---------------------------------------------------------------------------

type Perfil = {
  marca_nombre: string | null;
  marca_handle: string | null;
  marca_negocio: string | null;
  marca_audiencia: string | null;
  marca_tono: string | null;
  marca_genero: string | null;
  marca_persona: string | null;
  marca_idioma: string | null;
  marca_cta: string | null;
  marca_firma: string | null;
  marca_evitar: string | null;
};

function brandVoiceBlock(p: Perfil): string {
  const nombre = (p.marca_nombre || "").trim() || "la marca de la usuaria";
  const plural = p.marca_persona === "nosotras";
  const latam = p.marca_idioma === "Latam";
  const genero = p.marca_genero || "femenino";

  const gen =
    genero === "femenino"
      ? 'GÉNERO (obligatorio): la audiencia son mujeres. Usa SIEMPRE formas femeninas al dirigirte a la lectora ("lista", "convencida", "todas"). Nunca el masculino genérico.'
      : genero === "masculino"
        ? "GÉNERO (obligatorio): la audiencia son hombres. Usa formas masculinas al dirigirte al lector."
        : 'GÉNERO: audiencia mixta. Usa formulaciones neutras cuando sea natural ("quien", "las personas que"), sin dobletes forzados ni "e" inclusiva.';

  const limpio = latam
    ? "IDIOMA LIMPIO: español neutro de Latinoamérica, sin regionalismos muy marcados. Prohibido inventar verbos a partir del inglés."
    : "IDIOMA LIMPIO (obligatorio): español de España. Prohibido cualquier anglicismo o latinoamericanismo, y prohibido inventar verbos a partir del inglés (\"trackear\", \"stalkear\", \"chequear\"…).";

  return [
    `Marca: ${nombre}${p.marca_handle ? ` (${p.marca_handle})` : ""}${plural ? ' — voz en plural ("nosotras")' : " — voz en primera persona del singular"}.`,
    `Idioma: ${latam ? "español neutro latinoamericano" : "español de España"}.`,
    p.marca_negocio ? `A QUÉ SE DEDICA: ${p.marca_negocio}` : "",
    p.marca_audiencia ? `AUDIENCIA: ${p.marca_audiencia}` : "",
    `TONO: ${p.marca_tono || "directo, adulto y cercano"}`,
    "REGLAS: tono adulto directo. CTA siempre. Posiciona sin enseñar. Sin clichés de coaching. Prohibidas negritas, cursivas y markdown inline salvo que el formato lo pida. Sin metadatos ni meta-comentarios.",
    p.marca_cta ? `CTA HABITUAL: cuando el formato lo permita, cierra con este tipo de llamada a la acción: ${p.marca_cta}` : "",
    p.marca_firma ? `FIRMA: ${p.marca_firma}` : "",
    p.marca_evitar ? `PALABRAS, TEMAS O ENFOQUES A EVITAR (obligatorio): ${p.marca_evitar}` : "",
    gen,
    limpio,
    "AUDIENCIA CONCRETA: escribes para UNA persona real de esa audiencia, con situaciones que reconocería literalmente como suyas.",
    "GRAMÁTICA: cada frase debe ser completa y correcta en español. Nunca sacrifiques la corrección por sonar más corto.",
    "",
    "# METODOLOGÍA DE REFERENCIA",
    brandGuidelines,
  ]
    .filter(Boolean)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Email — no hay skill .md todavía; instrucciones inline con alter ego.
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

// ---------------------------------------------------------------------------
// Utilidades compartidas: perfil, límite diario y llamada a la IA.
// ---------------------------------------------------------------------------

const PERFIL_COLS =
  "marca_nombre, marca_handle, marca_negocio, marca_audiencia, marca_tono, marca_genero, marca_persona, marca_idioma, marca_cta, marca_firma, marca_evitar";

async function leerPerfil(supabase: any, userId: string): Promise<Perfil> {
  const { data, error } = await supabase.from("perfiles").select(PERFIL_COLS).eq("id", userId).maybeSingle();
  if (error) throw new Error("No se ha podido leer tu marca. Vuelve a intentarlo.");
  return (data ?? {}) as Perfil;
}

async function comprobarLimite(supabase: any, userId: string) {
  const desde = new Date();
  desde.setUTCHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from("generaciones")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", desde.toISOString());
  if (error) return; // si el contador falla, no bloqueamos la generación
  if ((count ?? 0) >= LIMITE_DIARIO) {
    throw new Error(
      `Has llegado a tus ${LIMITE_DIARIO} generaciones de hoy. Vuelve mañana y tendrás otras ${LIMITE_DIARIO}.`,
    );
  }
}

async function registrarGeneracion(supabase: any, userId: string, formato: string) {
  await supabase.from("generaciones").insert({ user_id: userId, formato });
}

async function llamarIA(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY no configurada");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
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
  return json?.choices?.[0]?.message?.content ?? "";
}

// ---------------------------------------------------------------------------
// Formatos de texto (Reel, Post/Caption, Stories, Venta Sutil, Email).
// Mismo flujo de siempre, con la marca de la alumna en vez de las 3 fijas.
// ---------------------------------------------------------------------------

const InputSchema = z.object({
  formato: z.enum(["carrusel", "reel", "post", "stories", "venta", "email"]),
  estilo: z.enum(["negativo", "info-secreta", "controversial"]),
  motor: z.enum(["aspiracion", "educacion", "impacto", "reflejo"]),
  alterEgo: z.enum(["la-virgo", "la-procrastinadora", "la-musa", "la-loca-del-cono", "la-bruji"]).optional(),
  tema: z.string().min(3).max(MAX_TEMA),
});

export const generarContenido = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    await comprobarLimite(supabase, userId);
    const perfil = await leerPerfil(supabase, userId);

    const skill = data.formato === "email" ? buildEmailSkillPrompt(data.alterEgo) : SKILLS[data.formato];
    const voz = brandVoiceBlock(perfil);

    const systemPrompt = `Eres la estratega de contenido de ${
      (perfil.marca_nombre || "").trim() || "la marca de la usuaria"
    }. Generas contenido siguiendo AL PIE DE LA LETRA la skill correspondiente y la voz de marca que recibes abajo.

# VOZ DE MARCA (aplica SIEMPRE)
${voz}

# SKILL ACTIVA — ${FORMATO_LABEL[data.formato]}
${skill}

# REGLAS DE EJECUCIÓN
- Estilo de ejecución: ${ESTILO_LABEL[data.estilo]}
- Motor viral: ${MOTOR_LABEL[data.motor]}
- Entrega el contenido FINAL listo para publicar, sin meta-comentarios ni explicaciones.
- Respeta exactamente la estructura definida en la skill (número de slides, formato de guion, etc.).`;

    const userPrompt = `TEMA / INSIGHT DE ENTRADA:\n\n${data.tema}\n\nGenera el contenido completo ahora.`;

    const contenido = await llamarIA(systemPrompt, userPrompt);
    await registrarGeneracion(supabase, userId, data.formato);

    return { contenido };
  });

// ---------------------------------------------------------------------------
// Carrusel: el editor construye sus propios prompts (sysP / buildCarruselP)
// y los envía tal cual. Aquí solo se comprueba el acceso, el límite y la
// longitud, y se llama al mismo modelo.
// ---------------------------------------------------------------------------

const CarruselSchema = z.object({
  system: z.string().min(10).max(MAX_PROMPT),
  prompt: z.string().min(10).max(MAX_PROMPT),
});

export const generarCarrusel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CarruselSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    await comprobarLimite(supabase, userId);
    const contenido = await llamarIA(data.system, data.prompt);
    await registrarGeneracion(supabase, userId, "carrusel");

    return { contenido };
  });

export const generacionesHoy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const desde = new Date();
    desde.setUTCHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("generaciones")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", desde.toISOString());
    return { usadas: count ?? 0, limite: LIMITE_DIARIO };
  });
