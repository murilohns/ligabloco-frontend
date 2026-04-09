import * as React from 'react';
import { Input } from '@/components/ui/input';
import { maskDocument, unmaskDocument, isValidDocument } from '@/lib/cnpj';

export interface MaskedDocumentInputProps {
  /** Unmasked 14-char value held by parent form (controlled). */
  value: string;
  /** Parent receives the UNMASKED uppercase value on every change. */
  onChange: (unmasked: string) => void;
  /** Called on blur with either null (valid / empty) or an error message. */
  onBlurValidate?: (error: string | null) => void;
  /** Called when the user finishes typing a valid 14-char document (for BrasilAPI lookup trigger). */
  onComplete?: (unmasked: string) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

export function MaskedDocumentInput({
  value,
  onChange,
  onBlurValidate,
  onComplete,
  id,
  name,
  placeholder = '00.000.000/0000-00',
  disabled,
  ...ariaProps
}: MaskedDocumentInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const unmasked = unmaskDocument(e.target.value);
    // Keep only [A-Z0-9] — reject accents, emoji, whitespace inside the value
    const cleaned = unmasked.replace(/[^A-Z0-9]/g, '').slice(0, 14);
    onChange(cleaned.toUpperCase());
    if (cleaned.length === 14 && isValidDocument(cleaned)) {
      onComplete?.(cleaned);
    }
  };

  const handleBlur = () => {
    if (!onBlurValidate) return;
    if (value.length === 0) {
      onBlurValidate(null);
      return;
    }
    if (value.length < 14) {
      onBlurValidate('Documento inválido — informe os 14 caracteres');
      return;
    }
    if (!isValidDocument(value)) {
      onBlurValidate('CNPJ pode conter apenas letras e números');
      return;
    }
    onBlurValidate(null);
  };

  return (
    <Input
      id={id}
      name={name}
      type="text"
      inputMode="text"
      autoComplete="off"
      placeholder={placeholder}
      value={maskDocument(value)}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      maxLength={18}
      {...ariaProps}
    />
  );
}
