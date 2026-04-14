import { forwardRef, useImperativeHandle, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageUploader } from './ImageUploader';
import { CATEGORY_ORDER, CATEGORY_LABELS, type Category } from '@/lib/categories';
import type { Product } from '@/lib/products.api';

// ─── Schema ──────────────────────────────────────────────────────────────────

const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Informe um nome de pelo menos 3 caracteres')
    .max(200, 'Máximo de 200 caracteres'),
  description: z
    .string()
    .trim()
    .min(10, 'Descrição muito curta')
    .max(2000, 'Máximo de 2000 caracteres'),
  price: z
    .number({ message: 'Informe um preço válido' })
    .positive('Informe um preço válido')
    .max(999999.99, 'Preço muito alto'),
  category: z.enum(CATEGORY_ORDER as [Category, ...Category[]]),
});

type SchemaValues = z.infer<typeof productSchema>;

// ─── Exported types ───────────────────────────────────────────────────────────

export interface ProductFormValues {
  name: string;
  description: string;
  price: number;
  category: Category;
  newFiles: File[];
  keepUrls: string[];
}

export interface ProductFormHandle {
  handleCancel: () => void;
}

interface Props {
  initial?: Product;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}

// Format cents integer to BRL display string (e.g. 12550 → "125,50")
function centsToDisplay(cents: number): string {
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  const reaisStr = reais.toLocaleString('pt-BR');
  return `${reaisStr},${String(centavos).padStart(2, '0')}`;
}

// Convert cents integer to float (e.g. 12550 → 125.50)
function centsToFloat(cents: number): number {
  return cents / 100;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ProductForm = forwardRef<ProductFormHandle, Props>(
  function ProductForm({ initial, onSubmit, onCancel, submitLabel }, ref) {
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [keepUrls, setKeepUrls] = useState<string[]>(initial?.image_urls ?? []);
  const [imagesDirty, setImagesDirty] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [priceCents, setPriceCents] = useState(initial ? Math.round(initial.price * 100) : 0);

  const form = useForm<SchemaValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      price: initial?.price ?? undefined,
      category: initial?.category ?? undefined,
    },
  });

  function handleImageChange(state: { newFiles: File[]; keepUrls: string[] }) {
    setNewFiles(state.newFiles);
    setKeepUrls(state.keepUrls);
    setImagesDirty(true);
  }

  async function handleSubmit(schemaValues: SchemaValues) {
    // Validate that at least 1 image is present
    if (newFiles.length + keepUrls.length < 1) {
      setImageError('Adicione pelo menos uma imagem ao anúncio.');
      return;
    }
    setImageError(null);
    setServerError(null);

    try {
      await onSubmit({
        ...schemaValues,
        newFiles,
        keepUrls,
      });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setServerError(
        axiosErr.response?.data?.message ?? 'Não foi possível publicar o anúncio. Tente novamente.',
      );
    }
  }

  function handleCancel() {
    if (form.formState.isDirty || imagesDirty) {
      setDiscardOpen(true);
    } else {
      onCancel();
    }
  }

  useImperativeHandle(ref, () => ({
    handleCancel,
  }));

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {/* 1. Images */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fotos do anúncio</label>
            <ImageUploader
              existingUrls={initial?.image_urls}
              onChange={handleImageChange}
              maxTotal={5}
              disabled={form.formState.isSubmitting}
            />
            {imageError && <p className="text-sm text-destructive">{imageError}</p>}
          </div>

          {/* 2. Nome */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do anúncio</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Mesa de escritório" disabled={form.formState.isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 3. Categoria */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={form.formState.isSubmitting}
                  items={CATEGORY_ORDER.map((cat) => ({ value: cat, label: CATEGORY_LABELS[cat] }))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORY_ORDER.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 4. Preço */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço (R$)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
                      R$
                    </span>
                    <Input
                      inputMode="numeric"
                      className="pl-9"
                      value={centsToDisplay(priceCents)}
                      disabled={form.formState.isSubmitting}
                      onChange={(e) => {
                        // Strip everything except digits
                        const digits = e.target.value.replace(/\D/g, '');
                        const newCents = Math.min(parseInt(digits || '0', 10), 99999999);
                        setPriceCents(newCents);
                        const floatVal = centsToFloat(newCents);
                        field.onChange(floatVal > 0 ? floatVal : undefined);
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 5. Descrição */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={4}
                    placeholder="Descreva o produto, estado de conservação, etc."
                    disabled={form.formState.isSubmitting}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground text-right">{(field.value ?? '').length}/2000</p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={form.formState.isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="flex-1"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {initial ? 'Salvando...' : 'Publicando...'}
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Discard confirmation */}
      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              As alterações neste anúncio não foram salvas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDiscardOpen(false)}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setDiscardOpen(false);
                onCancel();
              }}
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

