import { supabase } from "@/integrations/supabase/client";

export type PerfilMarca = {
  nombre: string;
  marca_nombre: string;
  marca_handle: string;
  marca_color: string;
  marca_color_oscuro: string;
  marca_negocio: string;
  marca_audiencia: string;
  marca_tono: string;
  marca_genero: string;
  marca_persona: string;
  marca_idioma: string;
  marca_cta: string;
  marca_firma: string;
  marca_evitar: string;
  avatar_url: string | null;
};

export const PERFIL_VACIO: PerfilMarca = {
  nombre: "",
  marca_nombre: "",
  marca_handle: "",
  marca_color: "#a3134b",
  marca_color_oscuro: "#0e2e64",
  marca_negocio: "",
  marca_audiencia: "",
  marca_tono: "Directo, adulto y cercano",
  marca_genero: "femenino",
  marca_persona: "yo",
  marca_idioma: "España",
  marca_cta: "",
  marca_firma: "",
  marca_evitar: "",
  avatar_url: null,
};

const CAMPOS =
  "nombre, marca_nombre, marca_handle, marca_color, marca_color_oscuro, marca_negocio, marca_audiencia, marca_tono, marca_genero, marca_persona, marca_idioma, marca_cta, marca_firma, marca_evitar, avatar_url";

export async function cargarPerfil(userId: string): Promise<PerfilMarca> {
  const { data } = await supabase.from("perfiles").select(CAMPOS).eq("id", userId).maybeSingle();
  const row = (data ?? {}) as Record<string, unknown>;
  const out = { ...PERFIL_VACIO };
  for (const k of Object.keys(PERFIL_VACIO) as (keyof PerfilMarca)[]) {
    const v = row[k];
    if (v !== null && v !== undefined && v !== "") (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

export async function guardarPerfil(userId: string, perfil: Partial<PerfilMarca>) {
  const { error } = await supabase.from("perfiles").update(perfil).eq("id", userId);
  if (error) throw new Error(error.message);
}

export function marcaCompleta(p: PerfilMarca) {
  return Boolean(p.marca_nombre.trim());
}

/** Reduce una foto a 400px y la devuelve como texto, lista para guardar. */
export function fotoAMiniatura(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se ha podido leer la foto"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Esa imagen no se puede usar"));
      img.onload = () => {
        const size = 400;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const escala = Math.max(size / img.width, size / img.height);
        const w = img.width * escala;
        const h = img.height * escala;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function cargarImagen(src: string | null): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
