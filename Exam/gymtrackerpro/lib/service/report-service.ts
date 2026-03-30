import {ExerciseStats, Report, SessionDetail, SessionExerciseDetail} from '@/lib/domain/report';
import {WorkoutSessionRepositoryInterface} from '@/lib/repository/workout-session-repository-interface';
import {UserRepositoryInterface} from '@/lib/repository/user-repository-interface';
import {ReportServiceInterface} from '@/lib/service/report-service-interface';

/**
 * Implementation of {@link ReportServiceInterface} providing member progress reports.
 */
export class ReportService implements ReportServiceInterface {
    private static instance: ReportService;
    private readonly workoutSessionRepository: WorkoutSessionRepositoryInterface;
    private readonly userRepository: UserRepositoryInterface;

    private constructor(
        workoutSessionRepository: WorkoutSessionRepositoryInterface,
        userRepository: UserRepositoryInterface,
    ) {
        this.workoutSessionRepository = workoutSessionRepository;
        this.userRepository = userRepository;
    }

    /**
     * Returns the singleton instance, creating it with the given repositories on first call.
     *
     * @param workoutSessionRepository - The workout session repository used to fetch session data.
     * @param userRepository - The user repository used to resolve member details.
     */
    static getInstance(
        workoutSessionRepository: WorkoutSessionRepositoryInterface,
        userRepository: UserRepositoryInterface,
    ): ReportService {
        if (!ReportService.instance) {
            ReportService.instance = new ReportService(workoutSessionRepository, userRepository);
        }
        return ReportService.instance;
    }

    /** @inheritdoc */
    async getMemberProgressReport(memberId: string, startDate: Date, endDate: Date): Promise<Report> {
        const member = await this.userRepository.findMemberById(memberId);
        const {items: sessions} = await this.workoutSessionRepository.findAll({memberId, startDate, endDate});

        const exerciseStatsMap = new Map<string, ExerciseStats>();
        const exerciseSessionSets = new Map<string, Set<string>>();

        const sessionDetails: SessionDetail[] = sessions.map((session) => {
            const exerciseDetails: SessionExerciseDetail[] = session.exercises.map((entry) => {
                const weight = Number(entry.weight);
                const volume = entry.sets * entry.reps * weight;

                if (!exerciseStatsMap.has(entry.exerciseId)) {
                    exerciseStatsMap.set(entry.exerciseId, {
                        exerciseId: entry.exerciseId,
                        exerciseName: entry.exercise.name,
                        muscleGroup: entry.exercise.muscleGroup,
                        totalSets: 0,
                        totalReps: 0,
                        totalVolume: 0,
                        sessionCount: 0,
                    });
                    exerciseSessionSets.set(entry.exerciseId, new Set());
                }

                const stats = exerciseStatsMap.get(entry.exerciseId)!;
                stats.totalSets += entry.sets;
                stats.totalReps += entry.reps;
                stats.totalVolume += volume;
                exerciseSessionSets.get(entry.exerciseId)!.add(session.id);

                return {exerciseId: entry.exerciseId, exerciseName: entry.exercise.name, sets: entry.sets, reps: entry.reps, weight, volume};
            });

            const totalVolume = exerciseDetails.reduce((sum, e) => sum + e.volume, 0);

            return {
                sessionId: session.id,
                date: session.date,
                durationMinutes: session.duration,
                notes: session.notes,
                exercises: exerciseDetails,
                totalVolume,
            };
        });

        for (const [exerciseId, sessionIdSet] of exerciseSessionSets) {
            exerciseStatsMap.get(exerciseId)!.sessionCount = sessionIdSet.size;
        }

        const exerciseBreakdown = Array.from(exerciseStatsMap.values()).sort(
            (a, b) => b.totalVolume - a.totalVolume,
        );

        const totalVolume = sessionDetails.reduce((sum, s) => sum + s.totalVolume, 0);
        const averageSessionDuration =
            sessions.length > 0
                ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length
                : 0;

        return {
            memberId,
            memberName: member.user.fullName,
            startDate,
            endDate,
            totalSessions: sessions.length,
            totalVolume,
            averageSessionDuration,
            exerciseBreakdown,
            sessionDetails,
        };
    }
}
