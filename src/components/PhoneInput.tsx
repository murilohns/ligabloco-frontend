import { forwardRef, useRef, useState, useMemo } from 'react';
import PhoneNumberInput, { type Value, type Country } from 'react-phone-number-input';
import { getExampleNumber } from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';
import 'react-phone-number-input/style.css';

function getNationalMaxLength(country: Country): number {
  try {
    const example = getExampleNumber(country, examples as Parameters<typeof getExampleNumber>[1]);
    if (!example) return 15;
    // formatInternational() gives e.g. "+55 11 91234-5678" — includes country code shown in input
    return example.formatInternational().length;
  } catch {
    return 15;
  }
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  disabled?: boolean;
}

export function PhoneInput({ value, onChange, onBlur, name, disabled }: PhoneInputProps) {
  const [country, setCountry] = useState<Country>('BR');

  // Store maxLength in a ref so InnerInput can read it without recreating the component
  const maxLengthRef = useRef(getNationalMaxLength('BR'));
  maxLengthRef.current = getNationalMaxLength(country);

  // Create InnerInput once — it reads maxLength from the ref at render time
  const InnerInput = useMemo(
    () =>
      forwardRef<HTMLInputElement, React.ComponentProps<'input'>>((props, ref) => (
        <input ref={ref} {...props} maxLength={maxLengthRef.current} />
      )),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <PhoneNumberInput
      defaultCountry="BR"
      value={(value as Value) || undefined}
      onChange={(v) => onChange(v ?? '')}
      onCountryChange={(c) => setCountry(c ?? 'BR')}
      onBlur={onBlur}
      name={name}
      disabled={disabled}
      international
      countryCallingCodeEditable={false}
      inputComponent={InnerInput}
      className="phone-input"
    />
  );
}
