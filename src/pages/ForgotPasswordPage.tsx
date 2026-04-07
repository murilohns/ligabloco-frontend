import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { apiClient } from '../lib/axios';

const schema = z.object({
  email: z.string().email('Informe um e-mail válido'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const { formState: { isSubmitting } } = form;

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await apiClient.post('/auth/forgot-password', { email: values.email });
      setSuccess(true);
    } catch {
      setServerError('Algo deu errado. Tente novamente em alguns instantes.');
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branded panel — hidden on mobile */}
      <div className="hidden md:flex md:w-2/5 bg-primary flex-col justify-center items-center p-12">
        <span className="text-primary-foreground font-bold text-3xl tracking-tight">Liga Bloco</span>
        <p className="text-primary-foreground/70 text-sm mt-3 text-center max-w-xs">
          O marketplace do seu condomínio
        </p>
      </div>
      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile-only logo */}
        <span className="md:hidden text-primary font-bold text-2xl mb-8">Liga Bloco</span>

        <p className="text-[28px] font-semibold text-center">Redefinir senha</p>
        <p className="text-base text-muted-foreground text-center mt-2">
          Informe seu e-mail e enviaremos um link de redefinição
        </p>

        <Card className="w-full max-w-sm mt-6">
          <CardContent className="py-12 px-8">
            {success ? (
              <p className="text-center text-base">Link enviado! Verifique sua caixa de entrada.</p>
            ) : (
              <>
                {serverError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{serverError}</AlertDescription>
                  </Alert>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="seu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando…
                        </>
                      ) : (
                        'Enviar link de redefinição'
                      )}
                    </Button>
                  </form>
                </Form>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-[14px] text-center mt-4">
          <Link to="/login" className="underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}
