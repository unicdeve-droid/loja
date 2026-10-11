/**
 * Converte um texto em slug URL-friendly.
 * Ex: "Ar e Ventilação" → "ar-e-ventilacao"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Formata um número como moeda BRL.
 * Ex: 1299.9 → "R$ 1.299,90"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata um CEP com hífen.
 * Ex: "87013060" → "87013-060"
 */
export function formatCEP(cep: string): string {
  return cep.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2')
}

/**
 * Retorna apenas os dígitos de uma string.
 */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Verifica se um ADMIN tem a role correta.
 */
export function isAdmin(role?: string): boolean {
  return role === 'ADMIN'
}
