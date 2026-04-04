/**
 * Base application error with consistent naming.
 */
export class AppError extends Error {
    constructor(message: string) {
        super(message)
        this.name = this.constructor.name
    }
}

/**
 * Thrown when a requested resource cannot be found.
 */
export class NotFoundError extends AppError {
}

/**
 * Thrown when an operation conflicts with current state (e.g. duplicate).
 */
export class ConflictError extends AppError {
}

/**
 * Thrown when a user is not authorized to perform an action.
 */
export class AuthorizationError extends AppError {
}

/**
 * Thrown when a session requires exercises but none are provided.
 */
export class WorkoutSessionRequiresExercisesError extends AppError {
}

/**
 * Thrown when a transaction fails or cannot be completed.
 */
export class TransactionError extends AppError {
}