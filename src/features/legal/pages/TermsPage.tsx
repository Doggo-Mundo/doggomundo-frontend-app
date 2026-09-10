import { LegalPageLayout } from "@/features/legal/components/LegalPageLayout";

/**
 * F-G.2: placeholder de Términos y condiciones. Contenido operativo
 * (NO revisado por abogado). El despacho legal entregará el copy
 * definitivo; al reemplazar, actualizar `version` y `effectiveDate`
 * aquí y bumpear `LEGAL_DOC_VERSIONS["terms_and_conditions"]` en
 * settings del backend para forzar re-aceptación.
 */
export function TermsPage() {
  return (
    <LegalPageLayout
      title="Términos y condiciones"
      version="1.0"
      effectiveDate="2026-09-09"
    >
      <h2>1. Qué es Doggo Mundo</h2>
      <p>
        Doggo Mundo es una plataforma que conecta a personas con
        servicios para sus mascotas — autolavado, grooming,
        veterinaria, day care, retail y experiencias — operados
        por Doggo Mundo o por partners autorizados. Al crear una
        cuenta aceptas estos Términos; si no estás de acuerdo,
        no uses la plataforma.
      </p>

      <h2>2. Uso de la cuenta</h2>
      <p>
        Debes tener 18 años o más para registrarte. Eres
        responsable de mantener tus credenciales seguras y de
        cualquier actividad realizada bajo tu cuenta. Nos
        avisas de inmediato si sospechas acceso no autorizado.
      </p>

      <h2>3. Reservas y cancelaciones</h2>
      <p>
        Al reservar un servicio te comprometes a presentarte en
        el horario acordado con tu mascota. Puedes cancelar o
        reagendar con al menos 24 horas de anticipación desde la
        misma app. Cancelaciones tardías o inasistencias
        (no-show) pueden causar cargo penal según la política de
        la unidad de negocio.
      </p>

      <h2>4. Pago</h2>
      <p>
        Los pagos se procesan a través de un proveedor externo
        (Stripe) que cumple con estándares PCI. Doggo Mundo nunca
        almacena datos completos de tu tarjeta. Al agendar puedes
        guardar un método de pago para futuros cobros; puedes
        eliminarlo cuando quieras desde tu perfil.
      </p>

      <h2>5. Cartilla de vacunación</h2>
      <p>
        Para los servicios donde hay contacto con otros perros
        (grooming, day care, autolavado compartido) se requiere
        que la cartilla de vacunación esté vigente. Si al momento
        del servicio no puedes acreditarla, podemos rechazar la
        atención sin reembolso.
      </p>

      <h2>6. Responsabilidad</h2>
      <p>
        Doggo Mundo hace todo lo razonable para brindar un
        servicio seguro y profesional. Sin embargo, no somos
        responsables por daños que resulten de condiciones
        médicas preexistentes no declaradas, comportamiento
        agresivo no advertido, o incumplimiento de tus
        obligaciones bajo estos Términos.
      </p>

      <h2>7. Modificaciones</h2>
      <p>
        Podemos actualizar estos Términos con aviso previo. Los
        cambios materiales requerirán tu aceptación explícita
        antes de que puedas seguir usando la plataforma.
      </p>

      <h2>8. Ley aplicable</h2>
      <p>
        Estos Términos se rigen por las leyes de los Estados
        Unidos Mexicanos. Cualquier disputa se resolverá en los
        tribunales competentes de la Ciudad de México, salvo que
        la ley disponga otra cosa.
      </p>

      <h2>9. Contacto</h2>
      <p>
        Para cualquier duda sobre estos Términos escríbenos a{" "}
        <a href="mailto:hola@doggomundo.com.mx">hola@doggomundo.com.mx</a>.
      </p>
    </LegalPageLayout>
  );
}
