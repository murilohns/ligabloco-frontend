import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Search } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { lookupCep } from '@/lib/cep';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  address: string;
  access_code: string;
  is_active: boolean;
}

interface Member {
  id: string;
  name: string;
  email: string;
}

// ─── External API schema (unchanged — what the backend expects) ─────────────

const condominiumApiSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  address: z.string().min(1, 'Endereço é obrigatório'),
  access_code: z.string().min(1, 'Código de acesso é obrigatório').max(50),
});

type CondominiumFormValues = z.infer<typeof condominiumApiSchema>;

// ─── Internal form schema (structured address fields) ──────────────────────

const condominiumFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cep: z.string().min(9, 'CEP inválido').max(9),
  logradouro: z.string().min(1, 'Rua é obrigatória'),
  numero: z.string().min(1, 'Número é obrigatório'),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().min(2, 'Estado é obrigatório').max(2),
  access_code: z.string().min(1, 'Código de acesso é obrigatório').max(50),
});

type InternalFormValues = z.infer<typeof condominiumFormSchema>;

// ─── Address parser (best-effort for edit pre-fill) ────────────────────────

function parseAddress(address: string): Partial<InternalFormValues> {
  // Expected composed format: "Rua X, 123 — Bairro, Cidade - SP, CEP 01310-100"
  const cepMatch = address.match(/CEP\s([\d]{5}-[\d]{3})/);
  const cep = cepMatch?.[1] ?? '';

  const stateMatch = address.match(/,\s*([A-Z]{2}),\s*CEP/);
  const estado = stateMatch?.[1] ?? '';

  // Split on " — " to get "logradouro, numero" and "bairro, cidade - estado, CEP xxx"
  const parts = address.split(' — ');
  let logradouro = '';
  let numero = '';
  let bairro = '';
  let cidade = '';

  if (parts.length >= 2) {
    const leftPart = parts[0]; // "Rua X, 123"
    const rightPart = parts[1]; // "Bairro, Cidade - SP, CEP 01310-100"

    const lastCommaIdx = leftPart.lastIndexOf(', ');
    if (lastCommaIdx !== -1) {
      logradouro = leftPart.slice(0, lastCommaIdx);
      numero = leftPart.slice(lastCommaIdx + 2);
    } else {
      logradouro = leftPart;
    }

    const rightBeforeCep = rightPart.replace(/,\s*CEP.*$/, '').replace(/\s*-\s*[A-Z]{2}$/, '');
    const rightParts = rightBeforeCep.split(', ');
    if (rightParts.length >= 2) {
      bairro = rightParts[0];
      cidade = rightParts[1];
    } else {
      bairro = rightBeforeCep;
    }
  } else {
    // Fallback: put entire address in logradouro
    logradouro = address;
  }

  return { cep, logradouro, numero, bairro, cidade, estado };
}

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

// ─── Condominium form (shared by create and edit) ──────────────────────────

interface CondominiumFormProps {
  defaultValues?: Partial<InternalFormValues>;
  onSubmit: (data: CondominiumFormValues) => Promise<void>;
  serverError: string | null;
  submitLabel: string;
}

function CondominiumForm({
  defaultValues,
  onSubmit,
  serverError,
  submitLabel,
}: CondominiumFormProps) {
  const form = useForm<InternalFormValues>({
    resolver: zodResolver(condominiumFormSchema),
    defaultValues: {
      name: '',
      cep: '',
      logradouro: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      access_code: '',
      ...defaultValues,
    },
  });

  const { isSubmitting } = form.formState;

  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const cepValue = form.watch('cep');

  useEffect(() => {
    const digits = cepValue?.replace(/\D/g, '') ?? '';
    if (digits.length !== 8) {
      setCepError(null);
      return;
    }

    let cancelled = false;
    setCepLoading(true);
    setCepError(null);

    lookupCep(digits)
      .then((result) => {
        if (cancelled) return;
        form.setValue('logradouro', result.street, { shouldValidate: true });
        form.setValue('bairro', result.neighborhood, { shouldValidate: true });
        form.setValue('cidade', result.city, { shouldValidate: true });
        form.setValue('estado', result.state, { shouldValidate: true });
      })
      .catch(() => {
        if (cancelled) return;
        setCepError('CEP não encontrado. Preencha o endereço manualmente.');
      })
      .finally(() => {
        if (!cancelled) setCepLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cepValue, form]);

  async function handleInternalSubmit(data: InternalFormValues) {
    const address = `${data.logradouro}, ${data.numero} — ${data.bairro}, ${data.cidade} - ${data.estado}, CEP ${data.cep}`;
    await onSubmit({ name: data.name, address, access_code: data.access_code });
  }

  return (
    <>
      {serverError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleInternalSubmit)} className="space-y-4">
          {/* Nome */}
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

          {/* Address section */}
          <p className="text-sm font-medium text-muted-foreground mt-2 mb-1">Endereço</p>

          {/* CEP */}
          <FormField
            control={form.control}
            name="cep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      placeholder="00000-000"
                      maxLength={9}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 8);
                        const masked =
                          raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw;
                        field.onChange(masked);
                      }}
                    />
                    {cepLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </FormControl>
                <FormMessage />
                {cepError && !cepLoading && (
                  <p className="text-sm text-muted-foreground mt-1">{cepError}</p>
                )}
              </FormItem>
            )}
          />

          {/* Rua + Número */}
          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="logradouro"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Rua / Logradouro</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numero"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Bairro */}
          <FormField
            control={form.control}
            name="bairro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cidade + Estado */}
          <div className="grid grid-cols-4 gap-3">
            <FormField
              control={form.control}
              name="cidade"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={2} placeholder="UF" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Código de acesso */}
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

          <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando…
              </>
            ) : (
              submitLabel
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

  const [search, setSearch] = useState('');

  // Dialog/AlertDialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  // Inline server error for create/edit dialogs
  const [createServerError, setCreateServerError] = useState<string | null>(null);
  const [editServerError, setEditServerError] = useState<string | null>(null);

  // Assign-admin: selected user
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // ─── Data fetching ──────────────────────────────────────────────────────

  const { data: condominiums = [], isLoading } = useQuery<Condominium[]>({
    queryKey: ['admin-condominiums'],
    queryFn: () => apiClient.get('/admin/condominiums').then((r) => r.data),
  });

  const { data: members = [], isLoading: membersLoading } = useQuery<Member[]>({
    queryKey: ['condo-members', assigningId],
    queryFn: () =>
      apiClient.get(`/admin/condominiums/${assigningId}/members`).then((r) => r.data),
    enabled: !!assigningId,
  });

  // ─── Helpers ────────────────────────────────────────────────────────────

  function resolveServerError(err: unknown): string {
    const axiosErr = err as { response?: { status?: number } };
    if (axiosErr?.response?.status === 409) {
      return 'Este código de acesso já está em uso. Escolha outro.';
    }
    return 'Algo deu errado. Tente novamente em alguns instantes.';
  }

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['admin-condominiums'] });
  }

  // ─── Create handler ──────────────────────────────────────────────────────

  async function handleCreate(data: CondominiumFormValues) {
    setCreateServerError(null);
    try {
      await apiClient.post('/admin/condominiums', data);
      setCreateOpen(false);
      invalidate();
      toast('Condomínio criado com sucesso');
    } catch (err) {
      setCreateServerError(resolveServerError(err));
    }
  }

  // ─── Edit handler ────────────────────────────────────────────────────────

  async function handleEdit(data: CondominiumFormValues) {
    setEditServerError(null);
    try {
      await apiClient.patch(`/admin/condominiums/${editingId}`, data);
      setEditingId(null);
      invalidate();
      toast('Alterações salvas com sucesso');
    } catch (err) {
      setEditServerError(resolveServerError(err));
    }
  }

  // ─── Deactivate handler ──────────────────────────────────────────────────

  async function handleDeactivate() {
    try {
      await apiClient.patch(`/admin/condominiums/${deactivatingId}/deactivate`);
      setDeactivatingId(null);
      invalidate();
      toast('Condomínio desativado');
    } catch {
      toast('Algo deu errado. Tente novamente em alguns instantes.');
    }
  }

  // ─── Assign admin handler ─────────────────────────────────────────────────

  async function handleAssignAdmin() {
    if (!selectedUserId) return;
    try {
      await apiClient.patch(`/admin/condominiums/${assigningId}/assign-admin`, {
        userId: selectedUserId,
      });
      setAssigningId(null);
      setSelectedUserId(null);
      invalidate();
      toast('Administrador designado com sucesso');
    } catch {
      toast('Algo deu errado. Tente novamente em alguns instantes.');
    }
  }

  // ─── Derived state ────────────────────────────────────────────────────────

  const filtered = condominiums.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q) || c.access_code.toLowerCase().includes(q);
  });

  const editingCondo = condominiums.find((c) => c.id === editingId);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[20px] font-semibold font-heading">Condomínios</h1>
        <Button onClick={() => { setCreateServerError(null); setCreateOpen(true); }}>
          Criar condomínio
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar por nome, endereço ou código…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-muted-foreground">Nome</TableHead>
              <TableHead className="text-muted-foreground">Endereço</TableHead>
              <TableHead className="text-muted-foreground">Código de acesso</TableHead>
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
                    Crie o primeiro condomínio para começar a usar a plataforma.
                  </p>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && condominiums.length > 0 && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <p className="text-[14px] text-muted-foreground">Nenhum condomínio encontrado para "{search}"</p>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              filtered.map((condo) => (
                <TableRow key={condo.id}>
                  <TableCell className="text-base">{condo.name}</TableCell>
                  <TableCell className="text-[14px] text-muted-foreground">
                    {condo.address}
                  </TableCell>
                  <TableCell className="text-[14px] text-muted-foreground">
                    {condo.access_code}
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
                        onClick={() => {
                          setEditServerError(null);
                          setEditingId(condo.id);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUserId(null);
                          setAssigningId(condo.id);
                        }}
                      >
                        Designar admin
                      </Button>
                      {condo.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setDeactivatingId(condo.id)}
                        >
                          Desativar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) setCreateOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar condomínio</DialogTitle>
          </DialogHeader>
          <CondominiumForm
            onSubmit={handleCreate}
            serverError={createServerError}
            submitLabel="Criar condomínio"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingId}
        onOpenChange={(open) => { if (!open) setEditingId(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar condomínio</DialogTitle>
          </DialogHeader>
          {editingCondo && (
            <CondominiumForm
              key={editingId}
              defaultValues={{
                name: editingCondo.name,
                access_code: editingCondo.access_code,
                ...parseAddress(editingCondo.address),
              }}
              onSubmit={handleEdit}
              serverError={editServerError}
              submitLabel="Salvar alterações"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Admin Dialog */}
      <Dialog
        open={!!assigningId}
        onOpenChange={(open) => { if (!open) { setAssigningId(null); setSelectedUserId(null); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Designar administrador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {membersLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando moradores...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Morador</label>
                <Select
                  value={selectedUserId ?? undefined}
                  onValueChange={(value) => setSelectedUserId(value as string)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um morador" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} — {member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              className="w-full"
              disabled={!selectedUserId}
              onClick={handleAssignAdmin}
            >
              Confirmar designação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deactivate AlertDialog */}
      <AlertDialog
        open={!!deactivatingId}
        onOpenChange={(open) => { if (!open) setDeactivatingId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar condomínio?</AlertDialogTitle>
            <AlertDialogDescription>
              O condomínio ficará inativo. Os moradores não serão afetados e a ação pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeactivatingId(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeactivate}>
              Desativar condomínio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
