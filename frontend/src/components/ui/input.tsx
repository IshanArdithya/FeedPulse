import { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | null;
  touched?: boolean;
  showCounter?: boolean;
  value?: string;
  maxLength?: number;
  limit?: number;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, touched, showCounter, value, maxLength, limit, className = "", ...props }, ref) => {
    const isInvalid = touched && error;
    const currentLength = String(value ?? "").length;
    const displayLimit = limit ?? maxLength;

    return (
      <div className="relative">
        <input
          {...props}
          value={value}
          maxLength={maxLength}
          ref={ref}
          className={`${isInvalid ? "border-red-500! ring-red-500/10 shadow-red-100!" : ""} ${showCounter ? "pr-12!" : ""} ${className}`}
        />
        {showCounter && displayLimit && currentLength >= displayLimit * 0.9 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold tracking-tight text-(--muted) pointer-events-none bg-white px-1">
            {displayLimit - currentLength}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
