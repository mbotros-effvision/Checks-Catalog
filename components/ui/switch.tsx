'use client';

import { cn } from '@/lib/utils';

// Minimal accessible toggle (role=switch). Styled with the app's tokens.
export function Switch({
  checked,
  onCheckedChange,
  title,
  'aria-label': ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  title?: string;
  'aria-label'?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      title={title}
      onClick={() => onCheckedChange(!checked)}
      className={cn('sw', checked && 'sw-on')}
    >
      <span className="sw-knob" />
    </button>
  );
}
