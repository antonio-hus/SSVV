/**
 * Regex to validate ISO date string in YYYY-MM-DD format
 */
export const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Regex for E.164 phone numbers
 */
export const e164PhoneRegex = /^\+?[1-9]\d{1,14}$/;

/**
 * Regex for RFC 5321 compatible emails (simplified)
 */
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;