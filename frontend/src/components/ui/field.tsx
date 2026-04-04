import type { ReactNode } from "react";

interface FieldProps {
  label?: string;
  error?: string | null;
  touched?: boolean;
  children: ReactNode;
  className?: string;
  helpText?: string;
}

export function Field({
  label,
  error,
  touched,
  children,
  className = "",
  helpText,
}: FieldProps) {
  const isInvalid = touched && error;

  return (
    <label className={`field ${className}`}>
      {label && <span>{label}</span>}
      {children}
      {(isInvalid || helpText) && (
        <small className={isInvalid ? "text-red-500!" : ""}>
          {isInvalid ? error : helpText}
        </small>
      )}
    </label>
  );
}
