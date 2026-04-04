"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

export interface SelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | null;
  touched?: boolean;
  className?: string;
  placeholder?: string;
}

export function Select({
  options,
  value,
  onChange,
  onBlur,
  error,
  touched,
  className = "",
  placeholder = "Select an option",
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isInvalid = touched && error;
  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          onBlur={onBlur}
          className={cn(
            "flex w-full items-center justify-between gap-2 text-left transition-all rounded-[18px] border border-(--line-strong) bg-white px-4 py-[0.95rem]",
            isInvalid && "border-red-500! ring-red-500/10 shadow-red-100!",
            isOpen ? "ring-4 ring-black/8 border-black!" : "hover:border-(--line-strong)!",
            className
          )}
        >
          <span className={!selectedOption ? "text-(--muted)" : "text-(--ink)"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-(--muted) transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          className="glass-panel z-50 min-w-(--radix-popover-trigger-width) max-h-60 overflow-auto rounded-2xl p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 focus:outline-none"
        >
          <div className="flex flex-col gap-0.5">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`flex w-full items-center px-4 py-2.5 text-sm font-medium transition-all rounded-xl text-left ${
                  option.value === value
                    ? "bg-black text-white shadow-lg shadow-black/10"
                    : "text-(--ink) hover:bg-black/5 hover:translate-x-1"
                }`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
