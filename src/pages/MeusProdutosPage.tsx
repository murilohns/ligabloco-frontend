import { useCallback } from 'react';
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
import { ProductCard } from '@/components/products/ProductCard';
import { ProductFormDialog } from '@/components/products/ProductFormDialog';
import {
  listMyProducts,
  createProduct,
  updateProduct,
  softDeleteProduct,
  reactivateProduct,
  type Product,
} from '@/lib/products.api';
import type { ProductFormValues } from '@/components/products/ProductForm';
import { useState } from 'react';

// ─── Component ────────────────────────────────────────────────────────────────

export default function MeusProdutosPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // URL-driven dialog state
  const isNewOpen = searchParams.get('new') === '1';
  const editId = searchParams.get('edit');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['my-products', { includeInactive: true }],
    queryFn: () => listMyProducts(),
  });

  const active = products.filter((p) => p.is_active);
  const inactive = products.filter((p) => !p.is_active);
  const editingProduct: Product | undefined = editId ? products.find((p) => p.id === editId) : undefined;

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (values: ProductFormValues) =>
      createProduct({
        name: values.name,
        description: values.description,
        price: values.price,
        category: values.category,
        images: values.newFiles,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Anúncio publicado');
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
    mutationFn: ({ id, values }: { id: string; values: ProductFormValues }) =>
      updateProduct(id, {
        name: values.name,
        description: values.description,
        price: values.price,
        category: values.category,
        newImages: values.newFiles,
        keepImages: values.keepUrls,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Anúncio atualizado');
      setSearchParams((prev) => {
        prev.delete('edit');
        return prev;
      });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string; statusCode?: number } } };
      if (e.response?.data?.statusCode === 403) {
        toast.error('Só é possível editar seus próprios anúncios.');
      } else {
        toast.error(e.response?.data?.message ?? 'Algo deu errado. Tente novamente.');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => softDeleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Anúncio removido');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Algo deu errado. Tente novamente.');
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => reactivateProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Anúncio reativado');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Algo deu errado. Tente novamente.');
    },
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────

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
    async (values: ProductFormValues) => {
      await createMutation.mutateAsync(values);
    },
    [createMutation],
  );

  const handleUpdateSubmit = useCallback(
    async (values: ProductFormValues) => {
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

  // ─── Skeleton ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-[28px] font-semibold">Meus anúncios</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie os produtos que você publicou neste condomínio</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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

  // ─── Empty state (no products ever) ──────────────────────────────────────────

  const hasNoProductsAtAll = products.length === 0;

  // ─── Action rows ─────────────────────────────────────────────────────────────

  function activeActions(product: Product) {
    return (
      <>
        <button
          className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors sm:gap-2"
          aria-label="Editar anúncio"
          onClick={() => openEdit(product.id)}
        >
          <Pencil className="h-4 w-4" />
          <span className="hidden sm:inline">Editar</span>
        </button>
        <button
          className="flex items-center gap-1 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors sm:gap-2"
          aria-label="Remover anúncio"
          onClick={() => setDeletingId(product.id)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Remover</span>
        </button>
      </>
    );
  }

  function inactiveActions(product: Product) {
    return (
      <button
        className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors sm:gap-2"
        aria-label="Reativar anúncio"
        onClick={() => reactivateMutation.mutate(product.id)}
        disabled={reactivateMutation.isPending}
      >
        <RotateCcw className="h-4 w-4" />
        <span className="hidden sm:inline">Reativar anúncio</span>
      </button>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-[28px] font-semibold">Meus anúncios</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os produtos que você publicou neste condomínio</p>
        </div>
        <Button onClick={openNew} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          + Novo anúncio
        </Button>
      </div>

      {/* Empty state — no products at all */}
      {hasNoProductsAtAll ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <h2 className="text-xl font-semibold">Você ainda não tem anúncios</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Publique seu primeiro anúncio e ofereça para os vizinhos.
          </p>
          <Button onClick={openNew}>+ Criar primeiro anúncio</Button>
        </div>
      ) : (
        <Tabs defaultValue="ativos">
          <TabsList>
            <TabsTrigger value="ativos">Ativos ({active.length})</TabsTrigger>
            <TabsTrigger value="inativos">Inativos ({inactive.length})</TabsTrigger>
          </TabsList>

          {/* Ativos tab */}
          <TabsContent value="ativos" className="mt-4">
            {active.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <h2 className="text-lg font-semibold">Nenhum anúncio ativo</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Seus anúncios removidos aparecem na aba &ldquo;Inativos&rdquo;. Você pode reativá-los a qualquer momento.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {active.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    actions={activeActions(product)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Inativos tab */}
          <TabsContent value="inativos" className="mt-4">
            {inactive.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Nenhum anúncio inativo.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {inactive.map((product) => (
                  <div key={product.id} className="relative opacity-60 saturate-75">
                    <Badge
                      variant="destructive"
                      className="absolute top-2 left-2 z-10"
                    >
                      Inativo
                    </Badge>
                    <ProductCard
                      key={product.id}
                      product={product}
                      actions={inactiveActions(product)}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Create dialog */}
      <ProductFormDialog
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

      {/* Edit dialog */}
      <ProductFormDialog
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
        initial={editingProduct}
        onSubmit={handleUpdateSubmit}
      />

      {/* Delete confirmation AlertDialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover este anúncio?</AlertDialogTitle>
            <AlertDialogDescription>
              O anúncio será ocultado do browse. Você pode reativá-lo depois em &ldquo;Meus anúncios&rdquo;.
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
