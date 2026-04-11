import { useEffect, useState } from 'react';
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
import { ProductForm, type ProductFormValues } from './ProductForm';
import type { Product } from '@/lib/products.api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Product;
  mode: 'create' | 'edit';
  onSubmit: (values: ProductFormValues) => Promise<void>;
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

export function ProductFormDialog({ open, onOpenChange, initial, mode, onSubmit }: Props) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const title = mode === 'create' ? 'Novo anúncio' : 'Editar anúncio';
  const submitLabel = mode === 'create' ? 'Publicar anúncio' : 'Salvar alterações';

  function handleCancel() {
    onOpenChange(false);
  }

  async function handleSubmit(values: ProductFormValues) {
    await onSubmit(values);
    // Parent is responsible for closing the dialog after success
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <ProductForm
            initial={initial}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel={submitLabel}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <ProductForm
            initial={initial}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel={submitLabel}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
