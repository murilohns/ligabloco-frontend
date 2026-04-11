import { useEffect, useRef, useState, useCallback } from 'react';
import { ImageOff, X, ChevronUp, ChevronDown } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface UploadedItem {
  newFiles: File[];
  keepUrls: string[];
}

interface Props {
  existingUrls?: string[];
  onChange: (state: UploadedItem) => void;
  maxTotal?: number;
  disabled?: boolean;
}

export function ImageUploader({ existingUrls = [], onChange, maxTotal = 5, disabled = false }: Props) {
  const [keepUrls, setKeepUrls] = useState<string[]>(existingUrls);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Map<File, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync existingUrls on mount only (or when initial prop changes on edit)
  useEffect(() => {
    setKeepUrls(existingUrls);
    setNewFiles([]);
    setPreviews(new Map());
    setError(null);
    onChange({ newFiles: [], keepUrls: existingUrls });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingUrls.join(',')]);

  // Cleanup all object URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notify = useCallback(
    (nextKeepUrls: string[], nextNewFiles: File[]) => {
      onChange({ newFiles: nextNewFiles, keepUrls: nextKeepUrls });
    },
    [onChange],
  );

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    setError(null);

    const newlyValid: File[] = [];

    for (const file of Array.from(fileList)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Formato não aceito. Use JPEG, PNG ou WebP.');
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('Imagem acima de 5MB. Reduza antes de enviar.');
        continue;
      }
      const total = keepUrls.length + newFiles.length + newlyValid.length;
      if (total >= maxTotal) {
        setError(`Máximo de ${maxTotal} imagens por anúncio.`);
        break;
      }
      newlyValid.push(file);
    }

    if (newlyValid.length === 0) return;

    const nextPreviews = new Map(previews);
    for (const f of newlyValid) {
      nextPreviews.set(f, URL.createObjectURL(f));
    }
    const nextNewFiles = [...newFiles, ...newlyValid];

    setPreviews(nextPreviews);
    setNewFiles(nextNewFiles);
    notify(keepUrls, nextNewFiles);

    // Reset input so selecting the same file again triggers onChange
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeExistingUrl(url: string) {
    const next = keepUrls.filter((u) => u !== url);
    setKeepUrls(next);
    notify(next, newFiles);
  }

  function removeNewFile(file: File) {
    const previewUrl = previews.get(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const nextPreviews = new Map(previews);
    nextPreviews.delete(file);
    setPreviews(nextPreviews);
    const nextNewFiles = newFiles.filter((f) => f !== file);
    setNewFiles(nextNewFiles);
    notify(keepUrls, nextNewFiles);
  }

  function moveExistingUrl(index: number, direction: 'up' | 'down') {
    const next = [...keepUrls];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setKeepUrls(next);
    notify(next, newFiles);
  }

  function moveNewFile(index: number, direction: 'up' | 'down') {
    const next = [...newFiles];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    const prevMap = new Map(previews);
    [next[index], next[target]] = [next[target], next[index]];
    setNewFiles(next);
    // Previews map is keyed by File object identity — no need to swap in the map
    notify(keepUrls, next);
    // Keep previews map in sync order (Map doesn't need reordering since we look up by File ref)
    void prevMap; // suppress lint
  }

  const totalCount = keepUrls.length + newFiles.length;

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <label
        aria-label="Selecionar imagens do produto"
        className={[
          'flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed h-40 cursor-pointer transition-colors',
          disabled || totalCount >= maxTotal
            ? 'border-muted-foreground/20 cursor-not-allowed opacity-50'
            : 'border-muted-foreground/40 hover:border-primary/60 hover:bg-muted/30',
        ].join(' ')}
      >
        <span className="text-sm text-muted-foreground text-center px-4">
          {totalCount >= maxTotal
            ? `Limite de ${maxTotal} imagens atingido`
            : 'Clique ou arraste imagens (JPEG, PNG, WebP · máx 5MB cada)'}
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={disabled || totalCount >= maxTotal}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {/* Inline error */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Thumbnails row */}
      {totalCount > 0 && (
        <div className="flex flex-wrap gap-3">
          {/* Existing (kept) URLs */}
          {keepUrls.map((url, i) => {
            const globalIndex = i; // first slot in display order
            const isPrincipal = globalIndex === 0;
            return (
              <div key={url} className="relative w-20 h-20 shrink-0">
                <img
                  src={`${API_URL}${url}`}
                  alt={`Imagem ${globalIndex + 1}`}
                  className="w-full h-full object-cover rounded-md border"
                />
                {isPrincipal && (
                  <span className="absolute bottom-0 left-0 right-0 text-[9px] font-semibold text-center bg-primary/80 text-primary-foreground rounded-b-md py-px">
                    Principal
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`Remover imagem ${globalIndex + 1}`}
                  onClick={() => removeExistingUrl(url)}
                  className="absolute top-0.5 right-0.5 bg-background/80 rounded-full h-5 w-5 flex items-center justify-center text-foreground hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
                {/* Reorder arrows (desktop only) */}
                <div className="absolute left-0.5 top-0.5 hidden sm:flex flex-col gap-0.5">
                  {i > 0 && (
                    <button
                      type="button"
                      aria-label="Mover para cima"
                      onClick={() => moveExistingUrl(i, 'up')}
                      className="bg-background/80 rounded-sm h-4 w-4 flex items-center justify-center hover:bg-muted"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                  )}
                  {i < keepUrls.length - 1 && (
                    <button
                      type="button"
                      aria-label="Mover para baixo"
                      onClick={() => moveExistingUrl(i, 'down')}
                      className="bg-background/80 rounded-sm h-4 w-4 flex items-center justify-center hover:bg-muted"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* New files */}
          {newFiles.map((file, i) => {
            const globalIndex = keepUrls.length + i;
            const isPrincipal = globalIndex === 0;
            const previewUrl = previews.get(file) ?? '';
            return (
              <div key={previewUrl} className="relative w-20 h-20 shrink-0">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={`Imagem ${globalIndex + 1}`}
                    className="w-full h-full object-cover rounded-md border"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted rounded-md border">
                    <ImageOff className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                {isPrincipal && (
                  <span className="absolute bottom-0 left-0 right-0 text-[9px] font-semibold text-center bg-primary/80 text-primary-foreground rounded-b-md py-px">
                    Principal
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`Remover imagem ${globalIndex + 1}`}
                  onClick={() => removeNewFile(file)}
                  className="absolute top-0.5 right-0.5 bg-background/80 rounded-full h-5 w-5 flex items-center justify-center text-foreground hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
                {/* Reorder arrows among new files (desktop only) */}
                <div className="absolute left-0.5 top-0.5 hidden sm:flex flex-col gap-0.5">
                  {i > 0 && (
                    <button
                      type="button"
                      aria-label="Mover para cima"
                      onClick={() => moveNewFile(i, 'up')}
                      className="bg-background/80 rounded-sm h-4 w-4 flex items-center justify-center hover:bg-muted"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                  )}
                  {i < newFiles.length - 1 && (
                    <button
                      type="button"
                      aria-label="Mover para baixo"
                      onClick={() => moveNewFile(i, 'down')}
                      className="bg-background/80 rounded-sm h-4 w-4 flex items-center justify-center hover:bg-muted"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
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
