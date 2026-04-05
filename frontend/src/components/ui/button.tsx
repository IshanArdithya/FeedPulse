import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "danger" | "text" | "text-danger";
  size?: "default" | "sm" | "icon";
  asChild?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "default",
  asChild = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";
  
  const baseStyle = "inline-flex items-center justify-center font-bold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "button-primary",
    secondary: "button-secondary",
    tertiary: "button-tertiary",
    danger: "bg-red-500 hover:bg-red-600 text-white rounded-full border-none shadow-sm",
    text: "text-(--muted-strong) hover:text-(--ink) bg-transparent border-none uppercase tracking-wider",
    "text-danger": "text-red-500 hover:text-red-700 bg-transparent border-none uppercase tracking-wider",
  };

  const sizes = {
    default: "py-3! px-6! rounded-full text-base!",
    sm: "py-1.5! px-4! rounded-xl text-xs!",
    icon: "p-2! rounded-full",
  };

  const finalClassName = `${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <Component
      className={finalClassName.trim()}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </Component>
  );
}
