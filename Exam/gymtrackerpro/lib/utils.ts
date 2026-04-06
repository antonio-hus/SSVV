import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind CSS class names, resolving conflicts via `tailwind-merge`
 * and handling conditional classes via `clsx`.
 *
 * @param inputs - Any number of class values (strings, arrays, objects).
 * @returns A single merged class string with conflicting Tailwind classes resolved.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Escapes special characters in a string so it can be safely used as a literal
 * value inside a Prisma `contains`, `startsWith`, or `endsWith` filter.
 *
 * In SQL LIKE/ILIKE patterns, three characters carry special meaning:
 *   - `%`  matches any sequence of characters
 *   - `_`  matches any single character
 *   - `\`  is the escape character itself
 *
 * @param value - The raw search string from user input.
 * @returns The escaped string, safe for use in Prisma string-filter operators.
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
}
