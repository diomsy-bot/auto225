"use client";

import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/form";

export function SubmitButton({ children, className = "btn-primary", pendingLabel = "Envoi en cours…" }: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p role="status" className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
        {state.message}
      </p>
    );
  }
  return null;
}

type FieldProps = {
  name: string;
  label: string;
  state?: FormState;
  hint?: string;
  required?: boolean;
  className?: string;
} & (
  | ({ as?: "input" } & React.InputHTMLAttributes<HTMLInputElement>)
  | ({ as: "textarea" } & React.TextareaHTMLAttributes<HTMLTextAreaElement>)
  | ({ as: "select"; options: { value: string; label: string }[]; placeholder?: string } & React.SelectHTMLAttributes<HTMLSelectElement>)
);

export function Field(props: FieldProps) {
  const { name, label, state, hint, required, className, ...rest } = props;
  const error = state?.fieldErrors?.[name];
  const id = `f-${name}`;
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  const previous = state?.values?.[name];
  const common = { id, name, required, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy };

  let control: React.ReactNode;
  if (rest.as === "textarea") {
    const { as: _as, ...attrs } = rest;
    void _as;
    control = <textarea {...common} rows={4} className="input" defaultValue={previous ?? (attrs.defaultValue as string | undefined)} {...attrs} />;
  } else if (rest.as === "select") {
    const { as: _as, options, placeholder, ...attrs } = rest;
    void _as;
    control = (
      <select {...common} className="input" defaultValue={previous ?? (attrs.defaultValue as string | undefined) ?? ""} {...attrs}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  } else {
    const { as: _as, ...attrs } = rest;
    void _as;
    const isCheckable = attrs.type === "checkbox" || attrs.type === "radio" || attrs.type === "file" || attrs.type === "password" || attrs.value !== undefined;
    control = (
      <input
        {...common}
        className="input"
        {...attrs}
        defaultValue={isCheckable ? undefined : (previous ?? (attrs.defaultValue as string | undefined))}
      />
    );
  }

  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="text-orange-cta" aria-hidden="true"> *</span>}
      </label>
      {control}
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}

export function Checkbox({ name, label, defaultChecked, hint }: { name: string; label: React.ReactNode; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-5 w-5 shrink-0 accent-brand-green" />
      <span>
        {label}
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}
