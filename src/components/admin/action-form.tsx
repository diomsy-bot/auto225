"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/form";
import type { FormState } from "@/lib/form";

/** Formulaire d'administration générique : affiche le message de retour de l'action. */
export function ActionForm({ action, children, className }: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className={className}>
      {children}
      <div className="mt-3"><FormMessage state={state} /></div>
    </form>
  );
}
