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
  phone: z.string().optional(),
});

type CreateResidentValues = z.infer<typeof createResidentSchema>;

const editResidentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().optional(),
  role: z.enum(['RESIDENT', 'CONDO_ADMIN']),
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
                <FormLabel>Telefone (opcional)</FormLabel>
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
}

function EditResidentForm({ defaultValues, onSubmit, serverError }: EditFormProps) {
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
                <FormLabel>Telefone (opcional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Papel</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o papel" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="RESIDENT">Morador</SelectItem>
                    <SelectItem value="CONDO_ADMIN">Administrador</SelectItem>
                  </SelectContent>
                </Select>
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
              'Salvar alterações'
            )}
          </Button>
        </form>
      </Form>
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function ResidentsPage() {
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [editServerError, setEditServerError] = useState<string | null>(null);

  // ─── Data fetching ────────────────────────────────────────────────────────

  const { data: residents = [], isLoading } = useQuery<UserCondominium[]>({
    queryKey: ['admin-residents'],
    queryFn: () => apiClient.get('/admin/residents').then((r) => r.data),
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['admin-residents'] });
  }

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
    } catch {
      setServerError('Algo deu errado. Tente novamente em alguns instantes.');
    }
  }

  // ─── Edit handler ─────────────────────────────────────────────────────────

  async function handleEdit(data: EditResidentValues) {
    setEditServerError(null);
    try {
      await apiClient.patch(`/admin/residents/${editingId}`, data);
      setEditingId(null);
      invalidate();
      toast('Alterações salvas com sucesso');
    } catch {
      setEditServerError('Algo deu errado. Tente novamente em alguns instantes.');
    }
  }

  // ─── Remove handler ───────────────────────────────────────────────────────

  async function handleRemove() {
    try {
      await apiClient.patch(`/admin/residents/${removingId}/remove`);
      setRemovingId(null);
      invalidate();
      toast('Morador removido do condomínio');
    } catch {
      toast('Algo deu errado. Tente novamente em alguns instantes.');
    }
  }

  // ─── Derived state ────────────────────────────────────────────────────────

  const editingResident = residents.find((r) => r.id === editingId);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[20px] font-semibold font-heading">Moradores</h1>
        <Button
          onClick={() => {
            setServerError(null);
            setCreateOpen(true);
          }}
        >
          Cadastrar morador
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-muted-foreground">Nome</TableHead>
              <TableHead className="text-muted-foreground">E-mail</TableHead>
              <TableHead className="text-muted-foreground">Telefone</TableHead>
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

            {!isLoading &&
              residents.map((resident) => (
                <TableRow key={resident.id}>
                  <TableCell className="text-base">{resident.user.name}</TableCell>
                  <TableCell className="text-[14px] text-muted-foreground">
                    {resident.user.email}
                  </TableCell>
                  <TableCell className="text-[14px] text-muted-foreground">
                    {resident.user.phone ?? '—'}
                  </TableCell>
                  <TableCell>
                    {resident.role === 'CONDO_ADMIN' ? (
                      <Badge className="bg-primary text-primary-foreground">Admin</Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground">Morador</Badge>
                    )}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setRemovingId(resident.id)}
                      >
                        Remover
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
                role: editingResident.role as 'RESIDENT' | 'CONDO_ADMIN',
              }}
              onSubmit={handleEdit}
              serverError={editServerError}
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
