// frontend/src/pages/MyServicesPage.tsx
import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Pencil, Trash2, RotateCcw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceCard } from '@/components/services/ServiceCard';
import { ServiceFormDialog } from '@/components/services/ServiceFormDialog';
import {
  listMyServices,
  createService,
  updateService,
  softDeleteService,
  reactivateService,
  type Service,
} from '@/lib/services.api';
import type { ServiceFormValues } from '@/components/services/ServiceForm';

export default function MyServicesPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isNewOpen = searchParams.get('new') === '1';
  const editId = searchParams.get('edit');

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['my-services', { includeInactive: true }],
    queryFn: () => listMyServices(),
  });

  const active = services.filter((s) => s.is_active);
  const inactive = services.filter((s) => !s.is_active);
  const editingService: Service | undefined = editId ? services.find((s) => s.id === editId) : undefined;

  const createMutation = useMutation({
    mutationFn: (values: ServiceFormValues) =>
      createService({
        name: values.name,
        description: values.description,
        pricing_type: values.pricing_type,
        price: values.price,
        category: values.category,
        images: values.newFiles,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço publicado');
      setSearchParams((prev) => {
        prev.delete('new');
        return prev;
      });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Algo deu errado. Tente novamente.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ServiceFormValues }) =>
      updateService(id, {
        name: values.name,
        description: values.description,
        pricing_type: values.pricing_type,
        price: values.price,
        category: values.category,
        newImages: values.newFiles,
        keepImages: values.keepUrls,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço atualizado');
      setSearchParams((prev) => {
        prev.delete('edit');
        return prev;
      });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string; statusCode?: number } } };
      if (e.response?.data?.statusCode === 403) {
        toast.error('Só é possível editar seus próprios serviços.');
      } else {
        toast.error(e.response?.data?.message ?? 'Algo deu errado. Tente novamente.');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => softDeleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço removido');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Algo deu errado. Tente novamente.');
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => reactivateService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço reativado');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Algo deu errado. Tente novamente.');
    },
  });

  function openNew() {
    setSearchParams((prev) => {
      prev.set('new', '1');
      return prev;
    });
  }

  function openEdit(id: string) {
    setSearchParams((prev) => {
      prev.set('edit', id);
      return prev;
    });
  }

  const handleCreateSubmit = useCallback(
    async (values: ServiceFormValues) => {
      await createMutation.mutateAsync(values);
    },
    [createMutation],
  );

  const handleUpdateSubmit = useCallback(
    async (values: ServiceFormValues) => {
      if (!editId) return;
      await updateMutation.mutateAsync({ id: editId, values });
    },
    [editId, updateMutation],
  );

  function handleDeleteConfirm() {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-[28px] font-semibold">Meus serviços</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie os serviços que você oferece neste condomínio</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasNoServicesAtAll = services.length === 0;

  function activeActions(service: Service) {
    return (
      <>
        <button
          className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors sm:gap-2"
          aria-label="Editar serviço"
          onClick={() => openEdit(service.id)}
        >
          <Pencil className="h-4 w-4" />
          <span className="hidden sm:inline">Editar</span>
        </button>
        <button
          className="flex items-center gap-1 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors sm:gap-2"
          aria-label="Remover serviço"
          onClick={() => setDeletingId(service.id)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Remover</span>
        </button>
      </>
    );
  }

  function inactiveActions(service: Service) {
    return (
      <button
        className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors sm:gap-2"
        aria-label="Reativar serviço"
        onClick={() => reactivateMutation.mutate(service.id)}
        disabled={reactivateMutation.isPending}
      >
        <RotateCcw className="h-4 w-4" />
        <span className="hidden sm:inline">Reativar serviço</span>
      </button>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-[28px] font-semibold">Meus serviços</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os serviços que você oferece neste condomínio</p>
        </div>
        <Button onClick={openNew} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          + Novo serviço
        </Button>
      </div>

      {hasNoServicesAtAll ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <h2 className="text-xl font-semibold">Você ainda não oferece serviços</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Publique seu primeiro serviço e divulgue para os vizinhos.
          </p>
          <Button onClick={openNew}>+ Criar primeiro serviço</Button>
        </div>
      ) : (
        <Tabs defaultValue="ativos">
          <TabsList>
            <TabsTrigger value="ativos">Ativos ({active.length})</TabsTrigger>
            <TabsTrigger value="inativos">Inativos ({inactive.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="ativos" className="mt-4">
            {active.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <h2 className="text-lg font-semibold">Nenhum serviço ativo</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Seus serviços removidos aparecem na aba &ldquo;Inativos&rdquo;. Você pode reativá-los a qualquer momento.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {active.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    actions={activeActions(service)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inativos" className="mt-4">
            {inactive.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Nenhum serviço inativo.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {inactive.map((service) => (
                  <div key={service.id} className="relative opacity-60 saturate-75">
                    <Badge
                      variant="destructive"
                      className="absolute top-2 left-2 z-10"
                    >
                      Inativo
                    </Badge>
                    <ServiceCard
                      service={service}
                      actions={inactiveActions(service)}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <ServiceFormDialog
        open={isNewOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSearchParams((prev) => {
              prev.delete('new');
              return prev;
            });
          }
        }}
        mode="create"
        onSubmit={handleCreateSubmit}
      />

      <ServiceFormDialog
        open={!!editId}
        onOpenChange={(open) => {
          if (!open) {
            setSearchParams((prev) => {
              prev.delete('edit');
              return prev;
            });
          }
        }}
        mode="edit"
        initial={editingService}
        onSubmit={handleUpdateSubmit}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover este serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              O serviço será ocultado da vitrine. Você pode reativá-lo depois em &ldquo;Meus serviços&rdquo;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteConfirm}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
