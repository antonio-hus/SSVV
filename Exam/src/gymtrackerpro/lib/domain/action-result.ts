/**
 * Represents the result of an action.
 *
 * @template T Type of the successful result data.
 *
 * - `success: true` -> contains `data`
 * - `success: false` -> contains error `message` and optional field `errors`
 */
export type ActionResult<T> =
    | { success: true; data: T }
    | { success: false; message: string; errors?: Record<string, string[]> }