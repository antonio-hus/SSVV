import {prisma} from '@/lib/database';
import {UserRepository} from '@/lib/repository/user-repository';
import {ExerciseRepository} from '@/lib/repository/exercise-repository';
import {WorkoutSessionRepository} from '@/lib/repository/workout-session-repository';
import {AuthService} from '@/lib/service/auth-service';
import {UserService} from '@/lib/service/user-service';
import {ExerciseService} from '@/lib/service/exercise-service';
import {WorkoutSessionService} from '@/lib/service/workout-session-service';
import {ReportService} from '@/lib/service/report-service';

export const userRepository = UserRepository.getInstance(prisma);
export const exerciseRepository = ExerciseRepository.getInstance(prisma);
export const workoutSessionRepository = WorkoutSessionRepository.getInstance(prisma);

export const authService = AuthService.getInstance(userRepository);
export const userService = UserService.getInstance(userRepository);
export const exerciseService = ExerciseService.getInstance(exerciseRepository);
export const workoutSessionService = WorkoutSessionService.getInstance(workoutSessionRepository);
export const reportService = ReportService.getInstance(workoutSessionRepository, userRepository);
