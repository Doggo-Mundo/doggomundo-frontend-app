import { LegalPageLayout } from "@/features/legal/components/LegalPageLayout";

/**
 * F-G.2: placeholder de Aviso de privacidad. Estructurado según
 * los apartados que exige la LFPDPPP MX (identidad del responsable,
 * datos que se recaban, finalidades, transferencias, derechos ARCO,
 * mecanismo para ejercerlos). El copy es operativo, NO revisado
 * por abogado — sirve para el flujo de dev y staging mientras
 * llega la versión final del despacho.
 */
export function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Aviso de privacidad"
      version="1.0"
      effectiveDate="2026-09-09"
    >
      <h2>Responsable del tratamiento</h2>
      <p>
        Doggo Mundo, S.A.P.I. de C.V. ("Doggo Mundo"), con domicilio
        en la Ciudad de México, es responsable del tratamiento de
        tus datos personales. Para cualquier duda relacionada con
        privacidad escribe a{" "}
        <a href="mailto:privacidad@doggomundo.com.mx">
          privacidad@doggomundo.com.mx
        </a>
        .
      </p>

      <h2>Datos personales que recabamos</h2>
      <ul>
        <li>
          <strong>Identificación y contacto:</strong> nombre,
          apellido, correo electrónico, teléfono.
        </li>
        <li>
          <strong>De tu mascota:</strong> nombre, raza, fecha de
          nacimiento, comida habitual, cartilla de vacunación,
          historial clínico y notas de servicio.
        </li>
        <li>
          <strong>Transaccionales:</strong> historial de reservas y
          compras. El detalle del método de pago (número de tarjeta,
          CVV) lo procesa Stripe; Doggo Mundo no lo almacena.
        </li>
        <li>
          <strong>Técnicos:</strong> dirección IP, user-agent y
          sello de tiempo de cada aceptación de los términos legales
          — como evidencia de consentimiento.
        </li>
      </ul>

      <h2>Finalidades</h2>
      <p><strong>Primarias</strong> (indispensables para el servicio):</p>
      <ul>
        <li>Crear y mantener tu cuenta.</li>
        <li>Agendar, cobrar y ejecutar los servicios que reserves.</li>
        <li>Mantener el expediente clínico de tu mascota.</li>
        <li>Contactarte por temas operativos (confirmaciones, cambios de agenda, incidencias).</li>
      </ul>
      <p><strong>Secundarias</strong> (opcionales, puedes negarte sin afectar el servicio):</p>
      <ul>
        <li>Enviarte promociones y comunicaciones de marketing.</li>
        <li>Realizar encuestas de satisfacción.</li>
      </ul>

      <h2>Transferencias</h2>
      <p>
        Tus datos se comparten con: (i) partners operativos que
        prestan servicios dentro de Doggo Mundo (grooming,
        veterinaria, foto) exclusivamente para atender tu reserva;
        (ii) proveedores tecnológicos (procesador de pagos, hosting,
        correo transaccional) bajo obligaciones equivalentes a este
        Aviso; (iii) autoridades cuando la ley lo requiera.
        Ninguna transferencia se hace con fines de mercadotecnia sin
        tu consentimiento explícito.
      </p>

      <h2>Derechos ARCO</h2>
      <p>
        Tienes derecho a Acceder, Rectificar, Cancelar u Oponerte
        (ARCO) al tratamiento de tus datos, así como a revocar el
        consentimiento otorgado. Para ejercerlos, envía una
        solicitud a{" "}
        <a href="mailto:privacidad@doggomundo.com.mx">
          privacidad@doggomundo.com.mx
        </a>{" "}
        indicando tu identidad, los datos sobre los que ejerces el
        derecho y el medio de contacto para responderte. Tenemos
        20 días hábiles para responder.
      </p>

      <h2>Retención</h2>
      <p>
        Conservamos los datos mientras tu cuenta esté activa y por
        el plazo adicional que exijan las obligaciones fiscales,
        contables y de defensa legal. El expediente clínico de tu
        mascota se conserva por al menos 5 años tras la última
        consulta, como establece la práctica veterinaria.
      </p>

      <h2>Cambios al aviso</h2>
      <p>
        Cualquier cambio material a este Aviso se te notificará y
        requerirá tu aceptación explícita antes de seguir usando la
        plataforma. La versión y fecha vigentes aparecen al inicio
        de este documento.
      </p>
    </LegalPageLayout>
  );
}
