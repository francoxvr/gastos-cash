import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Términos de Servicio | Gastos Cash",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>

        <h1 className="text-2xl font-extrabold tracking-tight">Términos de Servicio</h1>
        <p className="mt-1 text-sm text-muted-foreground">Última actualización: 27 de junio de 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
          <p>
            Al usar Gastos Cash aceptás estos términos. Si no estás de acuerdo, por favor no uses
            la app.
          </p>

          <section className="space-y-2">
            <h2 className="text-base font-bold">1. Qué es Gastos Cash</h2>
            <p>
              Gastos Cash es una herramienta personal para registrar y organizar gastos e
              ingresos. No es una entidad financiera, no procesa pagos ni tiene acceso a tus
              cuentas bancarias: todos los montos los ingresás manualmente.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold">2. Tu cuenta</h2>
            <p>
              Sos responsable de mantener segura tu contraseña y de la actividad que ocurra en tu
              cuenta. Si compartís tu cuenta mediante la función de "Cuenta compartida", sos
              responsable de a quién le das ese código de invitación.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold">3. Uso aceptable</h2>
            <p>
              No está permitido usar la app para fines ilegales, intentar vulnerar su seguridad, o
              acceder a datos de otros usuarios sin autorización.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold">4. Disponibilidad y precisión</h2>
            <p>
              Hacemos lo posible para que la app funcione correctamente, pero se ofrece "tal cual"
              y sin garantías. No nos responsabilizamos por decisiones financieras tomadas en base
              a los cálculos, proyecciones o reportes de la app — son estimaciones basadas en los
              datos que vos mismo ingresás.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold">5. Publicidad</h2>
            <p>
              La app puede mostrar anuncios a través de Google AdSense. Ver la{" "}
              <Link href="/privacy" className="text-primary underline">
                Política de Privacidad
              </Link>{" "}
              para más detalles.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold">6. Cambios en el servicio</h2>
            <p>
              Podemos modificar o discontinuar funciones de la app en cualquier momento. Vamos a
              intentar avisar con anticipación los cambios importantes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold">7. Contacto</h2>
            <p>
              Consultas sobre estos términos:{" "}
              <a href="mailto:francoxvr@gmail.com" className="text-primary underline">
                francoxvr@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
