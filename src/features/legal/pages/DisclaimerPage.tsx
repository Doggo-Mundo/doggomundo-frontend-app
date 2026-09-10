import { LegalPageLayout } from "@/features/legal/components/LegalPageLayout";

/**
 * F-G.2: placeholder de Disclaimer. Foco en el punto crítico:
 * Doggo Mundo NO sustituye la consulta veterinaria profesional.
 * El usuario debe entender los límites del servicio antes de
 * agendar. Copy operativo, no legal.
 */
export function DisclaimerPage() {
  return (
    <LegalPageLayout
      title="Disclaimer"
      version="1.0"
      effectiveDate="2026-09-09"
    >
      <h2>Alcance del servicio</h2>
      <p>
        Doggo Mundo ofrece servicios de bienestar y cuidado
        (autolavado, grooming, day care, retail, experiencias) para
        mascotas sanas. Nuestro personal está entrenado en manejo
        canino responsable, pero no somos, en la mayoría de las
        unidades, un consultorio veterinario.
      </p>

      <h2>No sustituye consejo veterinario</h2>
      <p>
        Nada de lo que veas dentro de la plataforma — recordatorios,
        recomendaciones de alimento, sugerencias de servicios — es
        consejo veterinario profesional. Si tu mascota presenta
        cualquier signo clínico (vómito, letargo, cojera, cambios de
        conducta, etc.) consulta con un médico veterinario. Doggo
        Mundo cuenta con veterinaria partner dentro de la plataforma
        y puedes agendar una consulta ahí; el servicio se rige por
        estos términos pero la relación clínica es directa entre tú
        y el médico veterinario.
      </p>

      <h2>Condiciones para agendar</h2>
      <p>
        Al reservar un servicio confirmas que:
      </p>
      <ul>
        <li>
          Tu mascota está en condiciones generales de salud
          adecuadas para el servicio (sin fiebre, sin sospecha de
          enfermedad infectocontagiosa, sin heridas expuestas).
        </li>
        <li>
          Tu mascota cuenta con la vacunación vigente que
          corresponde al servicio.
        </li>
        <li>
          Nos has informado por adelantado cualquier condición
          médica, alergia, medicación o comportamiento agresivo
          conocido.
        </li>
      </ul>
      <p>
        Si al llegar al servicio detectamos que alguna de estas
        condiciones no se cumple, podemos negar la atención sin
        reembolso, priorizando la seguridad de tu mascota y del
        resto de perros presentes.
      </p>

      <h2>Emergencias</h2>
      <p>
        Si ocurre una emergencia veterinaria durante un servicio,
        contactamos primero al medio que hayas registrado y, si no
        respondes en el tiempo adecuado, autorizas a Doggo Mundo a
        trasladar a tu mascota a la veterinaria más cercana o
        habitual. Los costos del traslado y la atención de emergencia
        corren por cuenta del owner.
      </p>

      <h2>Fotografías y contenido</h2>
      <p>
        En algunas unidades (Doggo Foto, experiencias) tomamos
        fotos y video como parte del servicio. Salvo que nos digas
        lo contrario por escrito, podemos usar imágenes de tu
        mascota en material de la marca — nunca imágenes tuyas ni
        datos identificables del owner.
      </p>
    </LegalPageLayout>
  );
}
