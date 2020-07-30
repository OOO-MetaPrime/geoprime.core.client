/**
 * Базовый URL.
 * Например: /app/, /
 */
export const base = process.env.BASE

// Базовый путь без завершающего /
const strippedBase = process.env.BASE.replace(/\/$/, '')

export function url (relativeUrl) {
  return `${strippedBase}${relativeUrl}`
}
