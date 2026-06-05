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
};

const FORMATO_LABEL: Record<string, string> = {
  carrusel: "Carrusel (10 slides posicionados + caption)",
  reel: "Reel (guion completo + caption)",
  post: "Post / Caption para feed",
  stories: "Secuencia de Stories (4-8 pantallas)",
  venta: "Venta Sutil (sin precio, el cliente inicia)",
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

const InputSchema = z.object({
  formato: z.enum(["carrusel", "reel", "post", "stories", "venta"]),
  estilo: z.enum(["negativo", "info-secreta", "controversial"]),
  motor: z.enum(["aspiracion", "educacion", "impacto", "reflejo"]),
  tema: z.string().min(3).max(4000),
});

export const generarContenido = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY no configurada");
    }

    const skill = SKILLS[data.formato];

    const systemPrompt = `Eres una creadora de contenido experta entrenada para alumnas de Vida Emprendedora (escuela de Reichely Portales).

Tu trabajo es generar contenido siguiendo AL PIE DE LA LETRA la skill correspondiente y las brand guidelines que recibes abajo.

# BRAND GUIDELINES (voz, tono, valores — aplican SIEMPRE)
${brandGuidelines}

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
