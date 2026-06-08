import React from 'react';

interface Props {
  icon: React.ElementType;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon, title, description, children }: Props) {
  const Icon = icon;
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="flex items-center justify-center w-20 h-20 bg-secondary rounded-2xl rotate-[-2deg] mb-2">
        <Icon className="h-9 w-9 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-[220px]">{description}</p>
      )}
      {children && <div>{children}</div>}
    </div>
  );
}
