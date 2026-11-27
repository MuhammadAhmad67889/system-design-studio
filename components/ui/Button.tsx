import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  href?: string;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-leaf text-ink border-ink shadow-offset hover:bg-leaf-deep',
  secondary: 'bg-surface text-ink border-line hover:border-ink',
  ghost: 'bg-transparent text-ink border-transparent hover:bg-surface',
};

/*
 * The one button for the whole app. A link-styled button is the same
 * component with an href, so hover and focus stay consistent.
 */
export function Button({
  variant = 'primary',
  href,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-xl border-[1.5px] px-4 py-2.5 font-display text-sm font-bold transition-colors ${variantClasses[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
