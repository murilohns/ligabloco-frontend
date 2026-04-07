import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { apiClient } from '../lib/axios';

const schema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  phone: z
    .union([
      z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Formato inválido. Use (XX) XXXXX-XXXX'),
      z.literal(''),
    ])
    .optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.get('/users/me').then((r) => r.data),
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '' },
  });

  // Pre-populate when profile loads
  useEffect(() => {
    if (profile) {
      form.reset({ name: profile.name, phone: profile.phone ?? '' });
    }
  }, [profile, form]);

  async function onSubmit(data: FormData) {
    setServerError(null);
    try {
      await apiClient.patch('/users/me', {
        name: data.name,
        phone: data.phone || undefined,
      });
      toast('Alterações salvas com sucesso');
    } catch {
      setServerError('Algo deu errado. Tente novamente em alguns instantes.');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Carregando perfil...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[480px]">
      <h1 className="text-[20px] font-semibold mb-6">Meu Perfil</h1>

      {serverError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone (opcional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="(XX) XXXXX-XXXX" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full mt-2"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando…
              </>
            ) : (
              'Salvar alterações'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
