"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type ConfirmSubmitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className" | "type"> & {
  children: ReactNode;
  className?: string;
  message: string;
};

export function ConfirmSubmitButton({
  children,
  className,
  message,
  ...buttonProps
}: ConfirmSubmitButtonProps) {
  return (
    <button
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      type="submit"
      {...buttonProps}
    >
      {children}
    </button>
  );
}
