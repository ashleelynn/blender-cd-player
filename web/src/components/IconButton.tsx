import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = {
  icon: ReactNode;
  /** read by screen readers and shown as a tooltip; never rendered as text */
  label: string;
  variant?: "primary" | "secondary";
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

/** Round icon-only button (Figma: Button, Content=Icon). */
export function IconButton({ icon, label, variant = "secondary", className = "", ...rest }: Props) {
  return (
    <button type="button" aria-label={label} title={label} className={`icon-btn icon-btn--${variant} ${className}`} {...rest}>
      {icon}
    </button>
  );
}
