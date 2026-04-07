import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/axios';
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

// ─── Zod schema ────────────────────────────────────────────────────────────

const condominiumSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  address: z.string().min(1, 'Endereço é obrigatório'),
  access_code: z.string().min(1, 'Código de acesso é obrigatório').max(50),
});

type CondominiumFormValues = z.infer<typeof condominiumSchema>;

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
  defaultValues?: CondominiumFormValues;
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
  const form = useForm<CondominiumFormValues>({
    resolver: zodResolver(condominiumSchema),
    defaultValues: defaultValues ?? { name: '', address: '', access_code: '' },
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
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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

            {!isLoading &&
              condominiums.map((condo) => (
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
                address: editingCondo.address,
                access_code: editingCondo.access_code,
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
