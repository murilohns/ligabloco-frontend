import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MaskedDocumentInput } from '@/components/MaskedDocumentInput';
import { isValidDocument, maskDocument, lookupCnpj } from '@/lib/cnpj';

interface CondominiumDetail {
  id: string;
  name: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  document: string;
  access_code: string;
  is_active: boolean;
}

const editSchema = z.object({
  name: z.string().min(3, 'Nome obrigatorio'),
  street: z.string().min(1, 'Rua obrigatoria'),
  number: z.string().min(1, 'Numero obrigatorio'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Bairro obrigatorio'),
  city: z.string().min(1, 'Cidade obrigatoria'),
  state: z.string().length(2, 'UF deve ter 2 caracteres'),
  document: z
    .string()
    .refine(isValidDocument, { message: 'Documento invalido — informe os 14 caracteres' }),
  access_code: z.string().min(3, 'Codigo de acesso obrigatorio'),
});
type EditFormValues = z.infer<typeof editSchema>;

export default function CondominiumInfoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // D-20: Zona de perigo and edit mode gated on TRUE super-admin, regardless of impersonation.
  const isSuperAdmin = user?.isSuperAdmin === true;

  const {
    data: condo,
    isLoading,
    isError,
  } = useQuery<CondominiumDetail>({
    queryKey: ['admin-condominium', id],
    queryFn: async () => {
      const { data } = await apiClient.get<CondominiumDetail>(`/admin/condominiums/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', document: '', access_code: '' },
  });

  useEffect(() => {
    if (condo) {
      form.reset({
        name: condo.name,
        street: condo.street,
        number: condo.number,
        complement: condo.complement ?? '',
        neighborhood: condo.neighborhood,
        city: condo.city,
        state: condo.state,
        document: condo.document,
        access_code: condo.access_code,
      });
    }
  }, [condo, form]);

  useEffect(() => {
    // A11y: move focus to h1 on mount so screen readers orient to the new page.
    headingRef.current?.focus();
  }, []);

  const updateMutation = useMutation({
    mutationFn: async (values: EditFormValues) => {
      const { data } = await apiClient.patch<CondominiumDetail>(
        `/admin/condominiums/${id}`,
        values,
      );
      return data;
    },
    onSuccess: () => {
      toast.success('Condomínio atualizado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['admin-condominium', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-condominiums'] });
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        toast.error('Já existe um condomínio com este CNPJ.');
      } else {
        toast.error('Não foi possível salvar. Revise os campos e tente novamente.');
      }
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.patch(`/admin/condominiums/${id}/deactivate`);
      return data;
    },
    onSuccess: () => {
      toast.success('Condominio desativado');
      queryClient.invalidateQueries({ queryKey: ['admin-condominium', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-condominiums'] });
    },
    onError: () => toast.error('Nao foi possivel desativar. Tente novamente.'),
  });

  const reactivateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.patch(`/admin/condominiums/${id}/reactivate`);
      return data;
    },
    onSuccess: () => {
      toast.success('Condominio reativado');
      queryClient.invalidateQueries({ queryKey: ['admin-condominium', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-condominiums'] });
    },
    onError: () => toast.error('Nao foi possivel reativar. Tente novamente.'),
  });

  if (isLoading) return <div className="p-6">Carregando…</div>;
  if (isError || !condo) return <div className="p-6">Condomínio não encontrado.</div>;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Voltar"
          onClick={() => navigate('/admin/condominiums')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-semibold font-heading outline-none"
        >
          Informações do condomínio
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Dados do condomínio</CardTitle>
          {!isSuperAdmin && (
            <CardDescription>
              Apenas visualização. Para alterações, contate o administrador da plataforma.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {isSuperAdmin ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}
                className="flex flex-col gap-4"
              >
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
                  name="document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <MaskedDocumentInput
                          value={field.value}
                          onChange={field.onChange}
                          onBlurValidate={(err) =>
                            err
                              ? form.setError('document', { message: err })
                              : form.clearErrors('document')
                          }
                          onComplete={async (unmasked) => {
                            try {
                              const r = await lookupCnpj(unmasked);
                              if (r.name) form.setValue('name', r.name, { shouldValidate: true });
                              if (r.street) form.setValue('street', r.street, { shouldValidate: true });
                              if (r.number) form.setValue('number', r.number, { shouldValidate: true });
                              if (r.neighborhood) form.setValue('neighborhood', r.neighborhood, { shouldValidate: true });
                              if (r.city) form.setValue('city', r.city, { shouldValidate: true });
                              if (r.state) form.setValue('state', r.state, { shouldValidate: true });
                              if (r.complement) form.setValue('complement', r.complement, { shouldValidate: true });
                            } catch {
                              /* silent per D-05 */
                            }
                          }}
                          aria-describedby="document-helper"
                        />
                      </FormControl>
                      <p id="document-helper" className="text-sm text-muted-foreground">
                        Informe os 14 caracteres do CNPJ (letras e números).
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-4">
                  <FormField control={form.control} name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rua</FormLabel>
                        <FormControl><Input {...field} placeholder="Ex: Rua das Flores" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numero</FormLabel>
                          <FormControl><Input {...field} placeholder="100" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    <FormField control={form.control} name="complement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complemento</FormLabel>
                          <FormControl><Input {...field} placeholder="Bloco A, Apt 101" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                  </div>
                  <FormField control={form.control} name="neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  <div className="grid grid-cols-[1fr_80px] gap-4">
                    <FormField control={form.control} name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    <FormField control={form.control} name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UF</FormLabel>
                          <FormControl><Input {...field} maxLength={2} placeholder="SP" className="uppercase" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="access_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de acesso</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={condo.is_active ? 'default' : 'secondary'}>
                    {condo.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate('/admin/condominiums')}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Salvando alterações…' : 'Salvar alterações'}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            // D-19: condo-admin read-only <dl> label/value pairs.
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Nome</dt>
                <dd className="text-sm">{condo.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">CNPJ</dt>
                <dd className="text-sm">{maskDocument(condo.document)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Endereco</dt>
                <dd className="text-sm">
                  {[condo.street, condo.number].filter(Boolean).join(', ')}
                  {condo.complement ? ` (${condo.complement})` : ''}
                  {condo.neighborhood ? ` — ${condo.neighborhood}` : ''}
                  {condo.city ? `, ${condo.city}` : ''}
                  {condo.state ? `/${condo.state}` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Código de acesso</dt>
                <dd className="text-sm">{condo.access_code}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant={condo.is_active ? 'default' : 'secondary'}>
                    {condo.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      {/* D-20: Zona de perigo — SUPER_ADMIN ONLY, regardless of impersonation state */}
      {isSuperAdmin && (
        <>
          <Separator className="my-8" />
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
                <CardTitle className="font-heading">Zona de perigo</CardTitle>
              </div>
              <CardDescription>
                {condo.is_active
                  ? 'Desativar o condominio impede novos acessos de todos os moradores. A acao pode ser revertida.'
                  : 'Este condominio esta desativado. Reativar permitira que os moradores acessem novamente.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end">
              {condo.is_active ? (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="destructive"
                        disabled={deactivateMutation.isPending}
                      >
                        Desativar condominio
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Desativar {condo.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Os moradores perderao acesso ate o condominio ser reativado. Nenhum
                        dado sera apagado.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deactivateMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Desativar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button
                  onClick={() => reactivateMutation.mutate()}
                  disabled={reactivateMutation.isPending}
                >
                  {reactivateMutation.isPending ? 'Reativando...' : 'Reativar condominio'}
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
