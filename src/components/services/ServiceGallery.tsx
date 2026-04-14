// frontend/src/components/services/ServiceGallery.tsx
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ImageOff } from 'lucide-react';
import { uploadUrl } from '@/lib/uploads';

interface Props {
  imageUrls: string[];
  serviceName: string;
}

export function ServiceGallery({ imageUrls, serviceName }: Props) {
  if (imageUrls.length === 0) {
    return (
      <div className="aspect-[4/3] w-full bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        <ImageOff className="h-16 w-16" aria-hidden />
      </div>
    );
  }

  return (
    <Carousel className="w-full">
      <CarouselContent>
        {imageUrls.map((url, i) => (
          <CarouselItem key={url}>
            <div className="aspect-[4/3] w-full bg-muted rounded-lg overflow-hidden">
              <img
                src={uploadUrl(url)}
                alt={i === 0 ? serviceName : `${serviceName} — foto ${i + 1}`}
                className="w-full h-full object-contain"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {imageUrls.length > 1 && (
        <>
          <CarouselPrevious />
          <CarouselNext />
        </>
      )}
    </Carousel>
  );
}
