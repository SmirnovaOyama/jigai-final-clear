import type { ReactNode } from 'react';

interface ToastProps {
  visible: boolean;
  children: ReactNode;
}

export function Toast({ visible, children }: ToastProps) {
  return (
    <div className={`toast${visible ? ' toast--visible' : ''}`} role="status" aria-live="polite">
      {children}
    </div>
  );
}
