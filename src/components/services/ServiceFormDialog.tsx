// frontend/src/components/services/ServiceFormDialog.tsx
import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ServiceForm, type ServiceFormHandle, type ServiceFormValues } from './ServiceForm';
import type { Service } from '@/lib/services.api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Service;
  mode: 'create' | 'edit';
  onSubmit: (values: ServiceFormValues) => Promise<void>;
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);

    function handler(e: MediaQueryListEvent) {
      setMatches(e.matches);
    }

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function ServiceFormDialog({ open, onOpenChange, initial, mode, onSubmit }: Props) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const formRef = useRef<ServiceFormHandle>(null);

  const title = mode === 'create' ? 'Novo serviço' : 'Editar serviço';
  const submitLabel = mode === 'create' ? 'Publicar serviço' : 'Salvar alterações';

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      formRef.current?.handleCancel();
    } else {
      onOpenChange(true);
    }
  }

  async function handleSubmit(values: ServiceFormValues) {
    await onSubmit(values);
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <ServiceForm
            ref={formRef}
            initial={initial}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            submitLabel={submitLabel}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <ServiceForm
            ref={formRef}
            initial={initial}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            submitLabel={submitLabel}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
