import {prisma} from '@/lib/database';
import {UserRepository} from '@/lib/repository/user-repository';
import {ExerciseRepository} from '@/lib/repository/exercise-repository';
import {WorkoutSessionRepository} from '@/lib/repository/workout-session-repository';
import {AuthService} from '@/lib/service/auth-service';
import {UserService} from '@/lib/service/user-service';
import {ExerciseService} from '@/lib/service/exercise-service';
import {WorkoutSessionService} from '@/lib/service/workout-session-service';
import {ReportService} from '@/lib/service/report-service';
import {AuthController} from '@/lib/controller/auth-controller';
import {UserController} from '@/lib/controller/user-controller';
import {ExerciseController} from '@/lib/controller/exercise-controller';
import {WorkoutSessionController} from '@/lib/controller/workout-session-controller';
import {ReportController} from '@/lib/controller/report-controller';

/**
 * Shared user repository instance wired to the application database client.
 */
const userRepository = UserRepository.getInstance(prisma);

/**
 * Shared exercise repository instance wired to the application database client.
 */
const exerciseRepository = ExerciseRepository.getInstance(prisma);

/**
 * Shared workout session repository instance wired to the application database client.
 */
const workoutSessionRepository = WorkoutSessionRepository.getInstance(prisma);

/**
 * Shared authentication service instance backed by the user repository.
 */
const authService = AuthService.getInstance(userRepository);

/**
 * Shared user service instance backed by the user repository.
 */
const userService = UserService.getInstance(userRepository);

/**
 * Shared exercise service instance backed by the exercise repository.
 */
const exerciseService = ExerciseService.getInstance(exerciseRepository);

/**
 * Shared workout session service instance backed by the workout session repository.
 */
const workoutSessionService = WorkoutSessionService.getInstance(workoutSessionRepository);

/**
 * Shared report service instance backed by the workout session and user repositories.
 */
const reportService = ReportService.getInstance(workoutSessionRepository, userRepository);

/**
 * Ready-to-use authentication controller.
 * Handles login and logout server actions.
 */
export const authController = AuthController.getInstance(authService);

/**
 * Ready-to-use user controller.
 * Handles member and admin management server actions.
 */
export const userController = UserController.getInstance(userService);

/**
 * Ready-to-use exercise controller.
 * Handles exercise catalogue server actions.
 */
export const exerciseController = ExerciseController.getInstance(exerciseService);

/**
 * Ready-to-use workout session controller.
 * Handles workout session CRUD server actions.
 */
export const workoutSessionController = WorkoutSessionController.getInstance(workoutSessionService);

/**
 * Ready-to-use report controller.
 * Handles member progress report server actions.
 */
export const reportController = ReportController.getInstance(reportService);
