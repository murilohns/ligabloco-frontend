import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { hardDeleteProduct } from '@/lib/products.api';

interface HardDeleteProductDialogProps {
  productId: string | null;
  productName: string;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function HardDeleteProductDialog({
  productId,
  productName,
  onOpenChange,
  onSuccess,
}: HardDeleteProductDialogProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: (params: { id: string; reason: string }) =>
      hardDeleteProduct(params.id, params.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto excluído permanentemente');
      handleClose();
      onSuccess?.();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Erro ao excluir produto');
    },
  });

  function handleClose() {
    setReason('');
    onOpenChange(false);
  }

  function handleConfirm() {
    if (!productId || reason.trim().length < 10) return;
    mutation.mutate({ id: productId, reason: reason.trim() });
  }

  const isValid = reason.trim().length >= 10;

  return (
    <AlertDialog open={!!productId} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir produto permanentemente?</AlertDialogTitle>
          <AlertDialogDescription>
            O produto <strong>{productName}</strong> sera removido permanentemente do sistema.
            Esta acao nao pode ser desfeita. As imagens tambem serao apagadas.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="hard-delete-reason">Motivo da exclusao (min. 10 caracteres)</Label>
          <Textarea
            id="hard-delete-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Descreva o motivo da exclusao..."
            maxLength={500}
            rows={3}
          />
          <p className="text-xs text-muted-foreground text-right">
            {reason.length}/500
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || mutation.isPending}
          >
            {mutation.isPending ? 'Excluindo...' : 'Excluir permanentemente'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
