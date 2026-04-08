// To swap to ViaCEP or another provider, edit only this file.

export interface CepResult {
  cep: string;
  street: string;       // logradouro
  neighborhood: string; // bairro
  city: string;         // cidade
  state: string;        // estado (UF)
}

/**
 * Look up a Brazilian CEP via BrasilAPI.
 * Throws if not found (HTTP 404) or network error.
 */
export async function lookupCep(rawCep: string): Promise<CepResult> {
  const digits = rawCep.replace(/\D/g, '');
  if (digits.length !== 8) throw new Error('CEP deve ter 8 dígitos');

  const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${digits}`);
  if (!res.ok) throw new Error('CEP não encontrado');

  const data = await res.json() as {
    cep: string;
    state: string;
    city: string;
    neighborhood: string;
    street: string;
  };

  return {
    cep: data.cep,
    street: data.street ?? '',
    neighborhood: data.neighborhood ?? '',
    city: data.city ?? '',
    state: data.state ?? '',
  };
}
