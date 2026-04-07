import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { useAuthStore } from '../store/auth.store';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Informe sua senha'),
});

type FormValues = z.infer<typeof schema>;

interface LoginResponse {
  accessToken: string;
  user: { id: string; name: string; email: string };
  condominiumId: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const { formState: { isSubmitting } } = form;

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', {
        email: values.email,
        password: values.password,
      });
      useAuthStore.getState().setAuth(data.accessToken, data.user, data.condominiumId);
      navigate('/switch-tenant', { replace: true });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setServerError('E-mail ou senha incorretos. Verifique e tente novamente.');
      } else {
        setServerError('Algo deu errado. Tente novamente em alguns instantes.');
      }
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branded panel — hidden on mobile */}
      <div className="hidden md:flex md:w-2/5 flex-col justify-center items-center p-12"
        style={{ background: 'linear-gradient(160deg, oklch(0.50 0.26 280) 0%, oklch(0.36 0.22 270) 60%, oklch(0.28 0.18 260) 100%)' }}>
        <span className="text-primary-foreground font-bold text-3xl tracking-tight">Liga Bloco</span>
        <p className="text-primary-foreground/70 text-sm mt-3 text-center max-w-xs">
          O marketplace do seu condomínio
        </p>
      </div>
      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile-only logo */}
        <span className="md:hidden text-primary font-bold text-2xl mb-8">Liga Bloco</span>

        <p className="text-[28px] font-semibold text-center">Bem-vindo de volta</p>
        <p className="text-base text-muted-foreground text-center mt-2">
          Entre com seu e-mail e senha para acessar o condomínio
        </p>

        <Card className="w-full max-w-sm mt-6 glass shadow-lg">
          <CardContent className="py-12 px-8">
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

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando…
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-[14px] text-center mt-4">
          <Link to="/forgot-password" className="underline">
            Esqueceu sua senha?
          </Link>
        </p>
      </div>
    </div>
  );
}
