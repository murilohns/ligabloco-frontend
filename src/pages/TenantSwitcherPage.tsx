import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '../lib/axios';
import { useAuthStore } from '../store/auth.store';

interface Condominium {
  id: string;
  name: string;
  address: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
}

export default function TenantSwitcherPage() {
  const { activeCondominiumId, updateToken } = useAuthStore();
  const [switching, setSwitching] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const { data: condominiums = [], isLoading } = useQuery<Condominium[]>({
    queryKey: ['condominiums'],
    queryFn: () => apiClient.get('/users/me/condominiums').then((r) => r.data),
  });

  async function handleSwitch(condominiumId: string) {
    setSwitching(condominiumId);
    setSwitchError(null);
    try {
      const { data } = await apiClient.post('/auth/switch-tenant', { condominiumId });
      updateToken(data.accessToken, condominiumId);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr?.response?.status === 403) {
        setSwitchError('Você não tem acesso a este condomínio.');
      } else {
        setSwitchError('Algo deu errado. Tente novamente em alguns instantes.');
      }
    } finally {
      setSwitching(null);
    }
  }

  return (
    <div>
      <h1 className="text-[20px] font-semibold mb-6">Meus Condomínios</h1>

      {switchError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{switchError}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Carregando...</span>
        </div>
      )}

      {!isLoading && condominiums.length <= 1 && (
        <p className="text-base text-muted-foreground">
          Nenhum condomínio encontrado. Contate o administrador.
        </p>
      )}

      {!isLoading && condominiums.length > 1 && (
        <div className="flex flex-col gap-2">
          {condominiums.map((condo) => {
            const isActive = condo.id === activeCondominiumId;
            return (
              <div
                key={condo.id}
                className={`flex items-center justify-between rounded border px-4 py-2 transition-colors ${
                  isActive
                    ? 'border-2 border-foreground'
                    : 'hover:bg-neutral-100'
                }`}
              >
                <div>
                  <p className="text-base font-semibold">{condo.name}</p>
                  <p className="text-[14px] text-muted-foreground">{condo.address}</p>
                </div>
                <div className="ml-4 shrink-0">
                  {isActive ? (
                    <Badge className="bg-foreground text-background hover:bg-foreground">
                      Ativo
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={switching === condo.id}
                      onClick={() => handleSwitch(condo.id)}
                    >
                      {switching === condo.id ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Trocando…
                        </>
                      ) : (
                        'Entrar'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
