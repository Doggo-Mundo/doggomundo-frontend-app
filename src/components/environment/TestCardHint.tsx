import { isStripeTestMode } from "@/lib/environment";

interface Props {
  /** Para tests; por default se lee de la llave de Stripe. */
  testMode?: boolean;
}

/** Junto al formulario de tarjeta, solo con llave de Stripe de prueba
 *  (`pk_test_…`): es justo cuando las tarjetas de prueba funcionan y una
 *  real no se cobraría. */
export function TestCardHint({ testMode = isStripeTestMode() }: Props) {
  if (!testMode) return null;
  return (
    <p className="rounded-md border border-ink/20 bg-sun/30 px-3 py-2 text-xs text-primary">
      <strong>Modo de prueba:</strong> usa la tarjeta{" "}
      <span className="font-mono">4242 4242 4242 4242</span>, cualquier fecha futura y
      cualquier CVC. No uses una tarjeta real.
    </p>
  );
}
