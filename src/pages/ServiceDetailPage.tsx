// frontend/src/pages/ServiceDetailPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, MessageCircle } from 'lucide-react';
import { HardDeleteServiceDialog } from '@/components/services/HardDeleteServiceDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ServiceGallery } from '@/components/services/ServiceGallery';
import { ServicePriceDisplay } from '@/components/services/ServicePriceDisplay';
import { getService } from '@/lib/services.api';
import { SERVICE_CATEGORY_LABELS } from '@/lib/service-categories';
import { useAuthStore } from '@/store/auth.store';

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);

  const [showHardDelete, setShowHardDelete] = useState(false);

  const {
    data: service,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['services', id],
    queryFn: () => getService(id!),
    enabled: !!id,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3">
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          </div>
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="font-heading text-xl font-semibold">Serviço não encontrado</h2>
        <Button onClick={() => navigate('/services')}>Voltar aos serviços</Button>
      </div>
    );
  }

  const isOwner = service.provider.id === currentUser?.id;
  const isSuperAdmin = currentUser?.adminRole === 'SUPER_ADMIN';
  const initials = service.provider.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  function handleWhatsApp() {
    if (!service?.provider.phone) return;
    const phone = service.provider.phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá! Vi seu serviço "${service.name}" no Liga Bloco e gostaria de mais informações.`);
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  }

  return (
    <>
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3">
            <ServiceGallery imageUrls={service.image_urls} serviceName={service.name} />
          </div>
          <div className="md:col-span-2 space-y-4">
            <Badge>{SERVICE_CATEGORY_LABELS[service.category]}</Badge>
            <h1 className="font-heading text-3xl font-semibold leading-tight">{service.name}</h1>
            <ServicePriceDisplay pricingType={service.pricing_type} price={service.price} variant="detail" />
            <div className="flex items-center gap-3 pt-2 border-t">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="font-heading text-xl font-semibold">{service.provider.name}</span>
            </div>
            {service.description && (
              <p className="text-sm whitespace-pre-wrap text-foreground/90">{service.description}</p>
            )}
            <div className="pt-4 space-y-2">
              {service.provider.phone ? (
                <Button className="w-full" onClick={handleWhatsApp}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chamar no WhatsApp
                </Button>
              ) : (
                <Button className="w-full" disabled>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Telefone não cadastrado
                </Button>
              )}
              {isOwner && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/services/mine?edit=${service.id}`)}
                >
                  Editar
                </Button>
              )}
              {isSuperAdmin && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowHardDelete(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir serviço
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      {service && (
        <HardDeleteServiceDialog
          serviceId={showHardDelete ? service.id : null}
          serviceName={service.name}
          onOpenChange={(open) => {
            if (!open) setShowHardDelete(false);
          }}
          onSuccess={() => navigate('/services')}
        />
      )}
    </>
  );
}
