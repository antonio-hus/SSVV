/**
 * Regular expression to validate ISO 8601 date strings in `YYYY-MM-DD` format.
 *
 * Constraints:
 * - Year: 4 digits
 * - Month: 2 digits (01–12 not strictly enforced)
 * - Day: 2 digits (01–31 not strictly enforced)
 *
 * Notes:
 * - This regex validates format only, not actual calendar correctness
 *   (e.g., "2025-02-30" will pass)
 */
export const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Regular expression to validate E.164 international phone numbers.
 *
 * Constraints:
 * - Must start with an optional "+" sign
 * - First digit (after optional "+") must be 1–9
 * - Total digits: 2 to 15 (excluding "+")
 *
 * Notes:
 * - No spaces, dashes, or formatting characters allowed
 * - Intended for normalized phone numbers only
 */
export const e164PhoneRegex = /^\+?[1-9]\d{1,14}$/;

/**
 * Regular expression for validating email addresses (simplified).
 *
 * Constraints:
 * - Must contain a single "@" symbol
 * - Must have non-empty local part and domain
 * - Domain must include at least one dot
 * - No whitespace allowed
 *
 * Notes:
 * - This is a simplified approximation of RFC 5321 / RFC 5322
 * - Does not cover all valid edge cases (e.g., quoted local parts)
 */
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;