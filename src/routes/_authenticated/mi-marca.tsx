import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSupabaseAuthReady } from "@/hooks/use-supabase-auth-ready";
import { cargarPerfil, guardarPerfil, fotoAMiniatura, PERFIL_VACIO, type PerfilMarca } from "@/lib/marca";

export const Route = createFileRoute("/_authenticated/mi-marca")({
  head: () => ({
    meta: [
      { title: "Mi marca — Generador de contenido" },
      { name: "description", content: "Define tu marca: nombre, colores, voz, público, llamada a la acción y palabras a evitar." },
      { property: "og:title", content: "Mi marca — Generador de contenido" },
      { property: "og:description", content: "Define tu marca y todo el contenido se escribirá con tu voz." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MiMarcaPage,
});

function MiMarcaPage() {
  const navigate = useNavigate();
  const { isReady, user } = useSupabaseAuthReady();
  const [p, setP] = useState<PerfilMarca>(PERFIL_VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      navigate({ to: "/", replace: true });
      return;
    }
    let cancel = false;
    void cargarPerfil(user.id).then((perfil) => {
      if (!cancel) {
        setP(perfil);
        setCargando(false);
      }
    });
    return () => {
      cancel = true;
    };
  }, [isReady, user, navigate]);

  const set = (k: keyof PerfilMarca) => (v: string) => setP((prev) => ({ ...prev, [k]: v }));

  async function onFoto(file: File | undefined) {
    if (!file) return;
    try {
      const mini = await fotoAMiniatura(file);
      setP((prev) => ({ ...prev, avatar_url: mini }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido usar esa foto");
    }
  }

  async function onGuardar() {
    if (!user) return;
    setGuardando(true);
    setError("");
    try {
      await guardarPerfil(user.id, p);
      setMensaje("Guardado");
      setTimeout(() => setMensaje(""), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido guardar");
    } finally {
      setGuardando(false);
    }
  }

  if (!isReady || cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-5 sm:px-6 py-10 pb-24 space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3">Tu voz</p>
          <h1 className="text-4xl serif text-foreground leading-tight">Mi marca</h1>
          <p className="text-sm text-muted-foreground mt-3">
            Todo lo que generes se escribirá con esto. Puedes cambiarlo cuando quieras.
          </p>
        </div>

        <Bloque titulo="Identidad">
          <Campo label="Nombre de tu marca" valor={p.marca_nombre} onChange={set("marca_nombre")} placeholder="Ej: Laura Sánchez" />
          <Campo label="Tu @ en redes" valor={p.marca_handle} onChange={set("marca_handle")} placeholder="@tumarca" />
          <div className="grid grid-cols-2 gap-4">
            <Color label="Color principal" valor={p.marca_color} onChange={set("marca_color")} />
            <Color label="Color oscuro" valor={p.marca_color_oscuro} onChange={set("marca_color_oscuro")} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">Tu foto (opcional)</p>
            <div className="flex items-center gap-4">
              {p.avatar_url ? (
                <img src={p.avatar_url} alt="Tu foto" className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/30" />
              ) : (
                <div className="w-16 h-16 rounded-full border border-dashed border-border" />
              )}
              <label className="text-sm text-primary cursor-pointer underline underline-offset-4">
                Subir foto
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFoto(e.target.files?.[0])} />
              </label>
              {p.avatar_url && (
                <button className="text-sm text-muted-foreground" onClick={() => setP((prev) => ({ ...prev, avatar_url: null }))}>
                  Quitar
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">Si no subes ninguna, las slides salen sin foto.</p>
          </div>
        </Bloque>

        <Bloque titulo="Tu voz">
          <Campo label="A qué te dedicas" valor={p.marca_negocio} onChange={set("marca_negocio")} area placeholder="Qué vendes y a quién ayudas" />
          <Campo label="A quién le hablas" valor={p.marca_audiencia} onChange={set("marca_audiencia")} area placeholder="Describe a esa persona concreta" />
          <Campo label="Tono" valor={p.marca_tono} onChange={set("marca_tono")} placeholder="Directo, adulto y cercano" />
          <Opciones
            label="Tu público es…"
            valor={p.marca_genero}
            onChange={set("marca_genero")}
            opciones={[["femenino", "Mujeres"], ["masculino", "Hombres"], ["mixto", "Mixto"]]}
          />
          <Opciones
            label="Hablas en…"
            valor={p.marca_persona}
            onChange={set("marca_persona")}
            opciones={[["yo", "Singular (yo)"], ["nosotras", "Plural (nosotras)"]]}
          />
          <Opciones
            label="Español de…"
            valor={p.marca_idioma}
            onChange={set("marca_idioma")}
            opciones={[["España", "España"], ["Latam", "Latinoamérica"]]}
          />
        </Bloque>

        <Bloque titulo="Cierre">
          <Campo label="Tu llamada a la acción habitual" valor={p.marca_cta} onChange={set("marca_cta")} area placeholder="Ej: Comenta la palabra INFO y te escribo" />
          <Campo label="Tu firma" valor={p.marca_firma} onChange={set("marca_firma")} placeholder="Ej: Un abrazo, Laura" />
          <Campo label="Palabras o temas a evitar" valor={p.marca_evitar} onChange={set("marca_evitar")} area placeholder="Separadas por comas" />
        </Bloque>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-4">
          <button
            onClick={onGuardar}
            disabled={guardando}
            className="flex-1 py-4 rounded-xl text-primary-foreground font-medium tracking-wide transition-all hover:opacity-95 disabled:opacity-50"
            style={{ background: "var(--gradient-primary)" }}
          >
            {guardando ? "Guardando…" : "Guardar mi marca"}
          </button>
          <Link to="/generador" className="text-sm text-muted-foreground hover:text-primary">
            Volver
          </Link>
        </div>
        {mensaje && <p className="text-sm text-primary text-center">{mensaje}</p>}
      </main>
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-[var(--shadow-card)] space-y-4">
      <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{titulo}</h2>
      {children}
    </section>
  );
}

function Campo({
  label,
  valor,
  onChange,
  placeholder,
  area,
}: {
  label: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  area?: boolean;
}) {
  const clase =
    "w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition text-[15px]";
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">{label}</p>
      {area ? (
        <textarea rows={3} value={valor} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`${clase} resize-none leading-relaxed`} />
      ) : (
        <input value={valor} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={clase} />
      )}
    </div>
  );
}

function Color({ label, valor, onChange }: { label: string; valor: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">{label}</p>
      <div className="flex items-center gap-3">
        <input type="color" value={valor} onChange={(e) => onChange(e.target.value)} className="w-12 h-10 rounded border border-input bg-background" />
        <input value={valor} onChange={(e) => onChange(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-background border border-input text-sm" />
      </div>
    </div>
  );
}

function Opciones({
  label,
  valor,
  onChange,
  opciones,
}: {
  label: string;
  valor: string;
  onChange: (v: string) => void;
  opciones: [string, string][];
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {opciones.map(([id, texto]) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`rounded-full px-4 py-2 text-sm border transition ${
              valor === id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {texto}
          </button>
        ))}
      </div>
    </div>
  );
}
