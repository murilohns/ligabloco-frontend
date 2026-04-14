// frontend/src/components/services/ServiceForm.tsx
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
import { ImageUploader } from '../products/ImageUploader';
import {
  SERVICE_CATEGORY_ORDER,
  SERVICE_CATEGORY_LABELS,
  PRICING_TYPE_LABELS,
  type ServiceCategory,
  type PricingType,
} from '@/lib/service-categories';
import type { Service } from '@/lib/services.api';

const PRICING_TYPE_ORDER: PricingType[] = ['FIXED', 'PER_HOUR', 'NEGOTIABLE'];

const serviceSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Informe um nome de pelo menos 3 caracteres')
      .max(100, 'Máximo de 100 caracteres'),
    description: z
      .string()
      .trim()
      .min(10, 'Descrição muito curta')
      .max(2000, 'Máximo de 2000 caracteres'),
    pricing_type: z.enum(PRICING_TYPE_ORDER as [PricingType, ...PricingType[]]),
    price: z
      .number({ message: 'Informe um preço válido' })
      .positive('Informe um preço válido')
      .max(999999.99, 'Preço muito alto')
      .optional(),
    category: z.enum(SERVICE_CATEGORY_ORDER as [ServiceCategory, ...ServiceCategory[]]),
  })
  .refine(
    (data) => {
      if (data.pricing_type === 'NEGOTIABLE') return true;
      return data.price != null && data.price > 0;
    },
    { message: 'Preço é obrigatório para este tipo', path: ['price'] },
  );

type SchemaValues = z.infer<typeof serviceSchema>;

export interface ServiceFormValues {
  name: string;
  description: string;
  pricing_type: PricingType;
  price?: number;
  category: ServiceCategory;
  newFiles: File[];
  keepUrls: string[];
}

export interface ServiceFormHandle {
  handleCancel: () => void;
}

interface Props {
  initial?: Service;
  onSubmit: (values: ServiceFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}

function centsToDisplay(cents: number): string {
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  const reaisStr = reais.toLocaleString('pt-BR');
  return `${reaisStr},${String(centavos).padStart(2, '0')}`;
}

function centsToFloat(cents: number): number {
  return cents / 100;
}

export const ServiceForm = forwardRef<ServiceFormHandle, Props>(
  function ServiceForm({ initial, onSubmit, onCancel, submitLabel }, ref) {
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [keepUrls, setKeepUrls] = useState<string[]>(initial?.image_urls ?? []);
    const [imagesDirty, setImagesDirty] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [priceCents, setPriceCents] = useState(initial?.price ? Math.round(initial.price * 100) : 0);

    const form = useForm<SchemaValues>({
      resolver: zodResolver(serviceSchema),
      defaultValues: {
        name: initial?.name ?? '',
        description: initial?.description ?? '',
        pricing_type: initial?.pricing_type ?? undefined,
        price: initial?.price ?? undefined,
        category: initial?.category ?? undefined,
      },
    });

    const pricingType = form.watch('pricing_type');
    const showPrice = pricingType && pricingType !== 'NEGOTIABLE';

    function handleImageChange(state: { newFiles: File[]; keepUrls: string[] }) {
      setNewFiles(state.newFiles);
      setKeepUrls(state.keepUrls);
      setImagesDirty(true);
    }

    async function handleSubmit(schemaValues: SchemaValues) {
      if (newFiles.length + keepUrls.length < 1) {
        setImageError('Adicione pelo menos uma imagem ao serviço.');
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
          axiosErr.response?.data?.message ?? 'Não foi possível publicar o serviço. Tente novamente.',
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
              <label className="text-sm font-medium">Fotos do serviço</label>
              <ImageUploader
                existingUrls={initial?.image_urls}
                onChange={handleImageChange}
                maxTotal={5}
                disabled={form.formState.isSubmitting}
              />
              {imageError && <p className="text-sm text-destructive">{imageError}</p>}
            </div>

            {/* 2. Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do serviço</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Montagem de móveis planejados" disabled={form.formState.isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 3. Category */}
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
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SERVICE_CATEGORY_ORDER.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {SERVICE_CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 4. Pricing Type */}
            <FormField
              control={form.control}
              name="pricing_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de preço</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      if (v === 'NEGOTIABLE') {
                        form.setValue('price', undefined);
                        setPriceCents(0);
                      }
                    }}
                    defaultValue={field.value}
                    disabled={form.formState.isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Como cobra pelo serviço?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRICING_TYPE_ORDER.map((pt) => (
                        <SelectItem key={pt} value={pt}>
                          {PRICING_TYPE_LABELS[pt]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 5. Price (conditional) */}
            {showPrice && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {pricingType === 'PER_HOUR' ? 'Preço por hora (R$)' : 'Preço (R$)'}
                    </FormLabel>
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
            )}

            {/* 6. Description */}
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
                      placeholder="Descreva o serviço, experiência, disponibilidade, etc."
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

        <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
              <AlertDialogDescription>
                As alterações neste serviço não foram salvas.
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
  },
);
