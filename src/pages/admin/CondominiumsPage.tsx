import { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { unmaskDocument, maskDocument, isValidDocument, lookupCnpj } from '@/lib/cnpj';
import { MaskedDocumentInput } from '@/components/MaskedDocumentInput';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Condominium {
  id: string;
  name: string;
  document: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  is_active: boolean;
}

// ─── Create schema ─────────────────────────────────────────────────────────

const createCondominiumSchema = z.object({
  document: z
    .string()
    .refine(isValidDocument, { message: 'Documento invalido — informe os 14 caracteres' }),
  name: z.string().min(3, 'Nome obrigatorio'),
  street: z.string().min(1, 'Rua obrigatoria'),
  number: z.string().min(1, 'Numero obrigatorio'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Bairro obrigatorio'),
  city: z.string().min(1, 'Cidade obrigatoria'),
  state: z.string().length(2, 'UF deve ter 2 caracteres'),
});

type CreateCondominiumValues = z.infer<typeof createCondominiumSchema>;

// ─── Skeleton rows ─────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="animate-pulse bg-muted rounded h-4 w-full" />
          </TableCell>
          <TableCell>
            <div className="animate-pulse bg-muted rounded h-4 w-full" />
          </TableCell>
          <TableCell>
            <div className="animate-pulse bg-muted rounded h-4 w-full" />
          </TableCell>
          <TableCell>
            <div className="animate-pulse bg-muted rounded h-4 w-full" />
          </TableCell>
          <TableCell>
            <div className="animate-pulse bg-muted rounded h-4 w-full" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ─── Create form ───────────────────────────────────────────────────────────

interface CreateFormProps {
  onSubmit: (data: CreateCondominiumValues) => Promise<void>;
  serverError: string | null;
}

function CreateCondominiumForm({ onSubmit, serverError }: CreateFormProps) {
  const form = useForm<CreateCondominiumValues>({
    resolver: zodResolver(createCondominiumSchema),
    defaultValues: { document: '', name: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' },
  });

  const { isSubmitting } = form.formState;
  const liveRegionRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* sr-only live region for BrasilAPI prefill announcements (D-05 + a11y) */}
      <div ref={liveRegionRef} className="sr-only" aria-live="polite" />
      {serverError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="document"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ</FormLabel>
                <FormControl>
                  <MaskedDocumentInput
                    id="document"
                    name="document"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlurValidate={(err) => {
                      if (err) form.setError('document', { message: err });
                      else form.clearErrors('document');
                    }}
                    onComplete={async (unmasked) => {
                      // D-05: silent prefill; failures swallow so the user can type manually
                      try {
                        const result = await lookupCnpj(unmasked);
                        if (result.name) form.setValue('name', result.name, { shouldValidate: true });
                        if (result.street) form.setValue('street', result.street, { shouldValidate: true });
                        if (result.number) form.setValue('number', result.number, { shouldValidate: true });
                        if (result.neighborhood) form.setValue('neighborhood', result.neighborhood, { shouldValidate: true });
                        if (result.city) form.setValue('city', result.city, { shouldValidate: true });
                        if (result.state) form.setValue('state', result.state, { shouldValidate: true });
                        if (result.complement) form.setValue('complement', result.complement, { shouldValidate: true });
                        if (liveRegionRef.current) {
                          liveRegionRef.current.textContent =
                            'Dados preenchidos automaticamente';
                        }
                      } catch {
                        // Silent per D-05 — user types manually
                      }
                    }}
                    aria-describedby="document-helper document-error"
                  />
                </FormControl>
                <p id="document-helper" className="text-sm text-muted-foreground">
                  CNPJ pode conter letras e números.
                </p>
                <FormMessage id="document-error" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do condomínio</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
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
          <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando…
              </>
            ) : (
              'Criar condomínio'
            )}
          </Button>
        </form>
      </Form>
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function CondominiumsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const updateToken = useAuthStore((s) => s.updateToken);
  const currentUser = useAuthStore((s) => s.user);
  const activeCondominiumId = useAuthStore((s) => s.activeCondominiumId);
  const isImpersonating = !!activeCondominiumId;
  const canWrite = currentUser?.adminRole === 'SUPER_ADMIN';

  const [searchQuery, setSearchQuery] = useState('');

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createServerError, setCreateServerError] = useState<string | null>(null);

  // ─── Data fetching ──────────────────────────────────────────────────────

  const { data: condominiums = [], isLoading } = useQuery<Condominium[]>({
    queryKey: ['admin-condominiums'],
    queryFn: () => apiClient.get('/admin/condominiums').then((r) => r.data),
  });

  // ─── Defense in depth: only render for super-admin (T-BAC-01) ──────────

  if (currentUser && currentUser.adminRole === null) {
    return null;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['admin-condominiums'] });
  }

  // ─── Create handler ──────────────────────────────────────────────────────

  async function handleCreate(data: CreateCondominiumValues) {
    setCreateServerError(null);
    try {
      await apiClient.post('/admin/condominiums', data);
      setCreateOpen(false);
      invalidate();
      toast('Condomínio criado com sucesso');
    } catch (err) {
      const axiosErr = err as {
        response?: { status?: number; data?: { message?: string | string[] } };
      };
      const status = axiosErr?.response?.status;
      const rawMessage = axiosErr?.response?.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(' ').toLowerCase()
        : (rawMessage ?? '').toString().toLowerCase();
      if (status === 409) {
        const msg = 'Já existe um condomínio com este CNPJ.';
        setCreateServerError(msg);
        toast.error(msg);
      } else {
        setCreateServerError(
          'Não foi possível salvar. Revise os campos e tente novamente.',
        );
      }
    }
  }

  // ─── Impersonation handler (D-14) ────────────────────────────────────────

  async function handleImpersonate(condominiumId: string, condominiumName: string) {
    const loadingId = toast.loading('Entrando no condomínio…');
    try {
      const { data } = await apiClient.post<{ accessToken: string }>(
        '/auth/switch-tenant',
        { condominiumId },
      );
      updateToken(data.accessToken, condominiumId, condominiumName);
      queryClient.clear(); // CRITICAL: wipe stale tenant-scoped cache
      toast.success(`Agora você está visualizando ${condominiumName}`, { id: loadingId });
      navigate('/admin/residents');
    } catch (err) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      const msg = (axiosErr?.response?.data?.message ?? '').toLowerCase();
      if (msg.includes('inativo') || msg.includes('inactive')) {
        toast.error('Condomínio desativado.', { id: loadingId });
      } else {
        toast.error('Não foi possível entrar no condomínio. Tente novamente.', {
          id: loadingId,
        });
      }
    }
  }


  // ─── Derived state ────────────────────────────────────────────────────────

  const filteredCondominiums = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return condominiums;
    const qUnmasked = unmaskDocument(searchQuery).toLowerCase();
    return condominiums.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.document ?? '').toLowerCase().includes(qUnmasked),
    );
  }, [condominiums, searchQuery]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[20px] font-semibold font-heading">Condomínios</h1>
        {canWrite && (
          <Button
            onClick={() => {
              setCreateServerError(null);
              setCreateOpen(true);
            }}
          >
            Novo condomínio
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar por nome ou CNPJ"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          aria-label="Buscar condomínio por nome ou CNPJ"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-muted-foreground">Nome</TableHead>
              <TableHead className="text-muted-foreground">CNPJ</TableHead>
              <TableHead className="text-muted-foreground">Endereço</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <SkeletonRows />}

            {!isLoading && condominiums.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <p className="font-semibold text-base">Nenhum condomínio cadastrado</p>
                  <p className="text-[14px] text-muted-foreground mt-1">
                    Cadastre o primeiro condomínio para começar a gerenciar moradores.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      setCreateServerError(null);
                      setCreateOpen(true);
                    }}
                  >
                    Novo condomínio
                  </Button>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              condominiums.length > 0 &&
              filteredCondominiums.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <p className="text-[14px] text-muted-foreground">
                      Nenhum condomínio encontrado. Ajuste a busca ou cadastre um novo.
                    </p>
                  </TableCell>
                </TableRow>
              )}

            {!isLoading &&
              filteredCondominiums.map((condo) => (
                <TableRow
                  key={condo.id}
                  role={condo.is_active ? "button" : undefined}
                  tabIndex={condo.is_active ? 0 : undefined}
                  aria-label={condo.is_active ? `Entrar no condominio ${condo.name}` : undefined}
                  className={`${condo.is_active ? 'cursor-pointer hover:bg-primary/5' : 'opacity-50 cursor-not-allowed'}`}
                  onClick={() => condo.is_active && handleImpersonate(condo.id, condo.name)}
                  onKeyDown={(e) => {
                    if (condo.is_active && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleImpersonate(condo.id, condo.name);
                    }
                  }}
                >
                  <TableCell className="text-base">{condo.name}</TableCell>
                  <TableCell className="text-[14px] text-muted-foreground font-mono">
                    {condo.document ? maskDocument(condo.document) : '—'}
                  </TableCell>
                  <TableCell className="text-[14px] text-muted-foreground">
                    {[condo.street, condo.number].filter(Boolean).join(', ')}
                    {condo.neighborhood ? ` — ${condo.neighborhood}` : ''}
                    {condo.city ? `, ${condo.city}` : ''}
                    {condo.state ? `/${condo.state}` : ''}
                  </TableCell>
                  <TableCell>
                    {condo.is_active ? (
                      <Badge className="bg-accent text-white">Ativo</Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isImpersonating && condo.id !== activeCondominiumId}
                        title={isImpersonating && condo.id !== activeCondominiumId ? 'Saia da visualização para editar outro condomínio' : undefined}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/condominiums/${condo.id}`);
                        }}
                      >
                        Editar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) setCreateOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo condomínio</DialogTitle>
          </DialogHeader>
          <CreateCondominiumForm onSubmit={handleCreate} serverError={createServerError} />
        </DialogContent>
      </Dialog>

    </div>
  );
}
