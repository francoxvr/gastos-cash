import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Política de Privacidad | Gastos Cash",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>

        <h1 className="text-2xl font-extrabold tracking-tight">Política de Privacidad</h1>
        <p className="mt-1 text-sm text-muted-foreground">Última actualización: 27 de junio de 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
          <p>
            Gastos Cash ("la app", "nosotros") respeta tu privacidad. Esta política explica qué
            información recolectamos, cómo la usamos y qué opciones tenés al respecto.
          </p>

          <section className="space-y-2">
            <h2 className="text-base font-bold">1. Información que recolectamos</h2>
            <p>
              Al crear una cuenta recolectamos tu <strong>email</strong> (o tu cuenta de Google si
              elegís ese método de acceso) para identificarte y permitirte iniciar sesión.
            </p>
            <p>
              Los datos financieros que ingresás de forma voluntaria — gastos, ingresos,
              categorías, presupuestos, metas de ahorro, notas y etiquetas — se almacenan
              asociados a tu cuenta para que puedas verlos y gestionarlos. No vendemos ni
              compartimos esta información con terceros con fines comerciales.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold">2. Dónde se almacenan los datos</h2>
            <p>
              Usamos <strong>Firebase</strong> (Authentication y Firestore), un servicio de Google
              Cloud, para autenticar usuarios y almacenar la información de la app. Google procesa
              estos datos según sus propias políticas de privacidad como proveedor de
              infraestructura.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold">3. Publicidad (Google AdSense)</h2>
            <p>
              Esta app muestra anuncios a través de <strong>Google AdSense</strong>. Google y sus
              socios publicitarios pueden usar cookies y identificadores de dispositivo para
              mostrar anuncios basados en tus visitas a este y otros sitios. Podés revisar u
              optar por no recibir publicidad personalizada desde la{" "}
              <a
                href="https://adssettings.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                configuración de anuncios de Google
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold">4. Cuentas compartidas</h2>
            <p>
              Si activás la función de cuenta compartida, los integrantes que se unan con tu
              código de invitación podrán ver los gastos, categorías y monedas de ese hogar
              compartido. Cada usuario sigue identificado por su propio email.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold">5. Tus derechos</h2>
            <p>
              Podés eliminar todos tus gastos desde Ajustes en cualquier momento. Si querés
              eliminar tu cuenta por completo o solicitar una copia de tus datos, escribinos al
              email de contacto debajo.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold">6. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política ocasionalmente. Si hacemos cambios importantes, lo
              vamos a indicar actualizando la fecha al inicio de esta página.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold">7. Contacto</h2>
            <p>
              Para consultas sobre privacidad o tus datos, escribinos a{" "}
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
