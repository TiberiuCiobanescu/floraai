/** Comparison-only normalization. Never use this value to replace user input. */
export function normalizeText(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").trim();
}

export function textEquals(left: string, right: string): boolean {
  return normalizeText(left) === normalizeText(right);
}

export function textIncludes(value: string, query: string): boolean {
  return normalizeText(value).includes(normalizeText(query));
}
