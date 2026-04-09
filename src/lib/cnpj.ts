// To swap to another CNPJ provider, edit only this file.

export interface CnpjResult {
  document: string;      // 14-char unmasked uppercase
  name: string;          // nome_fantasia || razao_social
  street: string;        // logradouro
  number: string;        // numero
  neighborhood: string;  // bairro
  city: string;          // municipio
  state: string;         // uf (2 chars)
  complement: string;    // complemento (empty string if absent)
}

/**
 * Strip CNPJ mask chars and uppercase. Does NOT remove letters
 * (CNPJ is now alphanumeric per the 2026 Brazilian format change).
 */
export function unmaskDocument(raw: string): string {
  return raw.replace(/[.\-\/\s]/g, '').toUpperCase();
}

/** Visual mask: XX.XXX.XXX/XXXX-XX applied to an unmasked value (letters allowed). */
export function maskDocument(unmasked: string): string {
  const v = unmasked.slice(0, 14);
  if (v.length <= 2) return v;
  if (v.length <= 5) return `${v.slice(0, 2)}.${v.slice(2)}`;
  if (v.length <= 8) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5)}`;
  if (v.length <= 12) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8)}`;
  return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12, 14)}`;
}

/** Validate: exactly 14 chars, only A-Z and 0-9. */
export function isValidDocument(unmasked: string): boolean {
  return /^[A-Z0-9]{14}$/.test(unmasked);
}

/**
 * Look up a Brazilian CNPJ via BrasilAPI.
 * Throws on 404 or network error — callers should catch and fail silently per D-05.
 */
export async function lookupCnpj(rawDocument: string): Promise<CnpjResult> {
  const unmasked = unmaskDocument(rawDocument);
  if (!isValidDocument(unmasked)) throw new Error('CNPJ inválido');

  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${unmasked}`);
  if (!res.ok) throw new Error('CNPJ não encontrado');

  const data = (await res.json()) as {
    razao_social?: string;
    nome_fantasia?: string;
    logradouro?: string;
    numero?: string;
    bairro?: string;
    municipio?: string;
    uf?: string;
    complemento?: string;
    cep?: string;
  };

  return {
    document: unmasked,
    name: (data.nome_fantasia?.trim() || data.razao_social?.trim() || ''),
    street: (data.logradouro?.trim() || ''),
    number: (data.numero?.trim() || ''),
    neighborhood: (data.bairro?.trim() || ''),
    city: (data.municipio?.trim() || ''),
    state: (data.uf?.trim() || ''),
    complement: (data.complemento?.trim() || ''),
  };
}
