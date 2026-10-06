"use client";

import { startTransition, useActionState } from "react";
import { FormMessage } from "@/components/ui/form";
import type { FormState } from "@/lib/form";

/**
 * Formulaire d'administration générique : affiche le message de retour de l'action.
 * Le bouton cliqué (name/value) est transmis, ce qui permet plusieurs actions par formulaire.
 */
export function ActionForm({ action, children, className }: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        event.preventDefault();
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const data = new FormData(event.currentTarget, submitter);
        startTransition(() => formAction(data));
      }}
      className={className}
      aria-busy={pending}
    >
      {children}
      <div className="mt-3"><FormMessage state={state} /></div>
    </form>
  );
}
