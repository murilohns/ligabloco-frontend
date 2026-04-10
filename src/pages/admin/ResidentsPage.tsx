import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Search } from 'lucide-react';
import { apiClient } from '@/lib/axios';
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
import { PhoneInput } from '@/components/PhoneInput';
import { isValidPhoneNumber, formatPhoneNumberIntl } from 'react-phone-number-input';

// ─── Types ─────────────────────────────────────────────────────────────────

interface ResidentUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
}

interface UserCondominium {
  id: string;
  role: string;
  is_active: boolean;
  user: ResidentUser;
}

// ─── Zod schemas ────────────────────────────────────────────────────────────

const createResidentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional().refine((v) => !v || isValidPhoneNumber(v), 'Número de celular inválido'),
});

type CreateResidentValues = z.infer<typeof createResidentSchema>;

const editResidentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().optional().refine((v) => !v || isValidPhoneNumber(v), 'Número de celular inválido'),
  role: z.enum(['RESIDENT', 'CONDO_ADMIN', 'CONDO_WRITE', 'CONDO_READ']).optional(),
});

type EditResidentValues = z.infer<typeof editResidentSchema>;

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
          <TableCell>
            <div className="animate-pulse bg-muted rounded h-4 w-full" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ─── Role badge ─────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  if (role === 'CONDO_ADMIN') return <Badge className="bg-primary text-primary-foreground">Admin</Badge>;
  if (role === 'CONDO_WRITE') return <Badge className="bg-blue-600 text-white">Admin (Escrita)</Badge>;
  if (role === 'CONDO_READ') return <Badge className="bg-slate-500 text-white">Admin (Leitura)</Badge>;
  return <Badge className="bg-muted text-muted-foreground">Morador</Badge>;
}

// ─── Create form ────────────────────────────────────────────────────────────

interface CreateFormProps {
  onSubmit: (data: CreateResidentValues) => Promise<void>;
  serverError: string | null;
}

function CreateResidentForm({ onSubmit, serverError }: CreateFormProps) {
  const form = useForm<CreateResidentValues>({
    resolver: zodResolver(createResidentSchema),
    defaultValues: { name: '', email: '', phone: '' },
  });

  const { isSubmitting } = form.formState;

  return (
    <>
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
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
                <FormLabel>Celular (opcional)</FormLabel>
                <FormControl>
                  <PhoneInput value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cadastrando…
              </>
            ) : (
              'Cadastrar morador'
            )}
          </Button>
        </form>
      </Form>
    </>
  );
}

// ─── Edit form ──────────────────────────────────────────────────────────────

interface EditFormProps {
  defaultValues: EditResidentValues;
  onSubmit: (data: EditResidentValues) => Promise<void>;
  serverError: string | null;
  canManageRoles: boolean;
}

function EditResidentForm({ defaultValues, onSubmit, serverError, canManageRoles }: EditFormProps) {
  const form = useForm<EditResidentValues>({
    resolver: zodResolver(editResidentSchema),
    defaultValues,
  });

  const { isSubmitting } = form.formState;

  return (
    <>
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
                <FormLabel>Celular (opcional)</FormLabel>
                <FormControl>
                  <PhoneInput value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {canManageRoles && (
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Papel</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o papel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="RESIDENT">Morador</SelectItem>
                      <SelectItem value="CONDO_WRITE">Admin (Escrita)</SelectItem>
                      <SelectItem value="CONDO_READ">Admin (Leitura)</SelectItem>
                      <SelectItem value="CONDO_ADMIN">Administrador Completo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
            {isSubmitting ? (
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
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function ResidentsPage() {
  const queryClient = useQueryClient();
  const { activeCondominiumName, activeCondominiumId, accessToken, user } = useAuthStore();
  // D-14: canWrite = platform admin (any non-null adminRole except READ_ONLY_ADMIN) OR condo write-capable role
  const canWrite =
    (user?.adminRole !== null && user?.adminRole !== 'READ_ONLY_ADMIN') ||
    user?.condoRole === 'CONDO_ADMIN' ||
    user?.condoRole === 'CONDO_WRITE';

  // D-15: canManageRoles = only CONDO_ADMIN or SUPER_ADMIN can change roles (READ_ONLY_ADMIN excluded)
  const canManageRoles =
    user?.adminRole === 'SUPER_ADMIN' ||
    user?.condoRole === 'CONDO_ADMIN';

  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [editServerError, setEditServerError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // ─── Data fetching ────────────────────────────────────────────────────────

  const { data: residents = [], isLoading } = useQuery<UserCondominium[]>({
    queryKey: ['admin-residents', activeCondominiumId],
    queryFn: () => apiClient.get('/admin/residents').then((r) => r.data),
    enabled: !!accessToken && !!activeCondominiumId,
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['admin-residents'] });
  }

  // ─── Search + pagination ──────────────────────────────────────────────────

  const filtered = residents.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.user.name.toLowerCase().includes(q) || r.user.email.toLowerCase().includes(q);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const effectivePage = Math.min(page, totalPages);
  const paginated = filtered.slice((effectivePage - 1) * PAGE_SIZE, effectivePage * PAGE_SIZE);

  // ─── Create handler ───────────────────────────────────────────────────────

  async function handleCreate(data: CreateResidentValues) {
    setServerError(null);
    try {
      const response = await apiClient.post<{ alreadyExisted: boolean }>('/admin/residents', data);
      setCreateOpen(false);
      invalidate();
      if (response.data.alreadyExisted) {
        toast('Este e-mail já tinha uma conta — nenhum e-mail de ativação foi enviado.');
      } else {
        toast('Morador cadastrado com sucesso');
      }
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setServerError(status === 403
        ? 'Você não tem permissão para executar essa ação.'
        : 'Algo deu errado. Tente novamente em alguns instantes.');
    }
  }

  // ─── Edit handler ─────────────────────────────────────────────────────────

  async function handleEdit(data: EditResidentValues) {
    setEditServerError(null);
    try {
      const payload = canManageRoles ? data : { name: data.name, phone: data.phone };
      await apiClient.patch(`/admin/residents/${editingId}`, payload);
      setEditingId(null);
      invalidate();
      toast('Alterações salvas com sucesso');
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setEditServerError(status === 403
        ? 'Você não tem permissão para executar essa ação.'
        : 'Algo deu errado. Tente novamente em alguns instantes.');
    }
  }

  // ─── Promote/demote handler ───────────────────────────────────────────────

  async function handlePromote(ucId: string, newRole: 'RESIDENT' | 'CONDO_ADMIN') {
    try {
      await apiClient.patch(`/admin/residents/${ucId}`, { role: newRole });
      invalidate();
      toast(newRole === 'CONDO_ADMIN' ? 'Morador promovido a administrador' : 'Papel de administrador revogado');
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      toast.error(status === 403
        ? 'Você não tem permissão para executar essa ação.'
        : 'Algo deu errado. Tente novamente em alguns instantes.');
    }
  }

  // ─── Remove handler ───────────────────────────────────────────────────────

  async function handleRemove() {
    try {
      await apiClient.patch(`/admin/residents/${removingId}/remove`);
      setRemovingId(null);
      invalidate();
      toast('Morador removido do condomínio');
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      toast.error(status === 403
        ? 'Você não tem permissão para executar essa ação.'
        : 'Algo deu errado. Tente novamente em alguns instantes.');
    }
  }

  // ─── Derived state ────────────────────────────────────────────────────────

  const editingResident = residents.find((r) => r.id === editingId);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-[20px] font-semibold font-heading">Moradores</h1>
        {canWrite && (
          <Button
            onClick={() => {
              setServerError(null);
              setCreateOpen(true);
            }}
          >
            Cadastrar morador
          </Button>
        )}
      </div>
      {activeCondominiumName && (
        <p className="text-[13px] text-muted-foreground mb-5">
          Condomínio: <span className="font-medium">{activeCondominiumName}</span>
        </p>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar por nome ou e-mail…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-muted-foreground">Nome</TableHead>
              <TableHead className="text-muted-foreground">E-mail</TableHead>
              <TableHead className="text-muted-foreground">Celular</TableHead>
              <TableHead className="text-muted-foreground">Papel</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <SkeletonRows />}

            {!isLoading && residents.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <p className="font-semibold text-base">Nenhum morador cadastrado</p>
                  <p className="text-[14px] text-muted-foreground mt-1">
                    Cadastre o primeiro morador deste condomínio.
                  </p>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && residents.length > 0 && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <p className="text-[14px] text-muted-foreground">Nenhum morador encontrado para "{search}"</p>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              paginated.map((resident) => (
                <TableRow key={resident.id}>
                  <TableCell className="text-base">{resident.user.name}</TableCell>
                  <TableCell className="text-[14px] text-muted-foreground">
                    {resident.user.email}
                  </TableCell>
                  <TableCell className="text-[14px] text-muted-foreground">
                    {resident.user.phone ? (formatPhoneNumberIntl(resident.user.phone) || resident.user.phone) : '—'}
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={resident.role} />
                  </TableCell>
                  <TableCell>
                    {resident.is_active ? (
                      <Badge className="bg-accent text-white">Ativo</Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-end">
                      {(canWrite && canManageRoles) && resident.role === 'CONDO_ADMIN' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                          onClick={() => handlePromote(resident.id, 'RESIDENT')}
                        >
                          Revogar Admin
                        </Button>
                      )}
                      {canWrite && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditServerError(null);
                            setEditingId(resident.id);
                          }}
                        >
                          Editar
                        </Button>
                      )}
                      {canWrite && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setRemovingId(resident.id)}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-[13px] text-muted-foreground">
            {filtered.length} morador{filtered.length !== 1 ? 'es' : ''} — página {effectivePage} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={effectivePage <= 1}
              onClick={() => setPage(effectivePage - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={effectivePage >= totalPages}
              onClick={() => setPage(effectivePage + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) setCreateOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar morador</DialogTitle>
          </DialogHeader>
          <CreateResidentForm onSubmit={handleCreate} serverError={serverError} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingId}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar morador</DialogTitle>
          </DialogHeader>
          {editingResident && (
            <EditResidentForm
              key={editingId}
              defaultValues={{
                name: editingResident.user.name,
                phone: editingResident.user.phone ?? '',
                role: editingResident.role as 'RESIDENT' | 'CONDO_ADMIN' | 'CONDO_WRITE' | 'CONDO_READ',
              }}
              onSubmit={handleEdit}
              serverError={editServerError}
              canManageRoles={canManageRoles}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Remove AlertDialog */}
      <AlertDialog
        open={!!removingId}
        onOpenChange={(open) => {
          if (!open) setRemovingId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover morador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o morador deste condomínio. Ele perderá o acesso, mas poderá ser
              reativado pelo administrador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemovingId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleRemove}>
              Remover morador
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
