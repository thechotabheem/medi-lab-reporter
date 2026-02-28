/**
 * Sanitize text input to prevent XSS and layout-breaking content in PDFs
 */
export function sanitizeTextInput(input: string, maxLength = 500): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove control characters (keep \n, \r, \t)
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize a name field (no special characters except hyphens, periods, spaces)
 */
export function sanitizeName(input: string, maxLength = 100): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s.\-']/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize clinical notes (allow more characters but limit length)
 */
export function sanitizeClinicalNotes(input: string): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove control chars
    .trim()
    .slice(0, 2000);
}
