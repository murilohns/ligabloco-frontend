import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PhoneInput } from '@/components/PhoneInput';
import { isValidPhoneNumber } from 'react-phone-number-input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { apiClient } from '../lib/axios';

const API_URL = import.meta.env.VITE_API_URL ?? '';

const schema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || isValidPhoneNumber(v), 'Número de celular inválido'),
});

type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke preview URL on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

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

  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side pre-validation
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!acceptedTypes.includes(file.type)) {
      toast.error('Formato não aceito. Use JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem acima de 5MB. Reduza antes de enviar.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setIsUploadingAvatar(true);

    const fd = new FormData();
    fd.append('avatar', file);

    try {
      await apiClient.patch('/users/me', fd);
      URL.revokeObjectURL(previewUrl);
      setAvatarPreview(null);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Foto atualizada');
    } catch (err: unknown) {
      URL.revokeObjectURL(previewUrl);
      setAvatarPreview(null);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message ?? 'Não foi possível atualizar a foto. Tente novamente.');
    } finally {
      setIsUploadingAvatar(false);
      // Reset input so re-selecting the same file triggers onChange
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

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
      <h1 className="text-[20px] font-semibold mb-6 text-foreground">Meu Perfil</h1>

      <Card className="glass shadow-sm">
        <CardContent className="pt-6">
          {/* Avatar upload block */}
          <TooltipProvider>
            <div className="flex flex-col items-center mb-6">
              <div className="relative inline-block">
                <Avatar className="h-20 w-20">
                  {(avatarPreview || profile?.avatar_url) ? (
                    <AvatarImage
                      src={avatarPreview ?? `${API_URL}${profile.avatar_url}`}
                      alt={profile?.name ?? 'Avatar'}
                    />
                  ) : null}
                  <AvatarFallback>
                    {profile?.name
                      ? profile.name.split(' ').map((s: string) => s[0]).slice(0, 2).join('').toUpperCase()
                      : '?'}
                  </AvatarFallback>
                </Avatar>
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
                <Tooltip>
                  <TooltipTrigger
                    disabled={isUploadingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Atualizar foto"
                  >
                    <Camera className="h-5 w-5" />
                  </TooltipTrigger>
                  <TooltipContent>Atualizar foto</TooltipContent>
                </Tooltip>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarSelect}
              />
            </div>
          </TooltipProvider>

          {serverError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {profile?.email && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-mail</label>
                  <Input value={profile.email} disabled className="bg-muted" />
                </div>
              )}
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
              {!profile?.isAdmin && (
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular (opcional)</FormLabel>
                      <FormControl>
                        <PhoneInput value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
        </CardContent>
      </Card>
    </div>
  );
}
