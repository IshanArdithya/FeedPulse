import { forwardRef } from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | null;
  touched?: boolean;
  showCounter?: boolean;
  value?: string;
  maxLength?: number;
  limit?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, touched, showCounter, value, maxLength, limit, className = "", ...props }, ref) => {
    const isInvalid = touched && error;
    const currentLength = String(value ?? "").length;
    const displayLimit = limit ?? maxLength;

    return (
      <div className="relative">
        <textarea
          {...props}
          value={value}
          maxLength={maxLength}
          ref={ref}
          className={`${isInvalid ? "border-red-500! ring-red-500/10 shadow-red-100!" : ""} resize-none pr-12! ${className}`}
        />
        {showCounter && displayLimit && (
           <span className="absolute right-3 bottom-3 text-[10px] font-bold tracking-tight text-(--muted) pointer-events-none text-xs! bg-white px-1">
            {displayLimit - currentLength}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
