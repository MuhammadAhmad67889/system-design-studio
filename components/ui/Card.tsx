import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

/* Plain card shell: raised surface, 1.5px border, soft corners. */
export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl border-[1.5px] border-line bg-surface ${className}`}>
      {children}
    </div>
  );
}
