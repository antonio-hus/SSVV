import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';

type StatCardProps = {
    title: string;
    value: string | number;
    description?: string;
}

/**
 * Displays a compact card with a title, primary value, and optional description.
 *
 * @param title - Label describing the metric.
 * @param value - Main value to highlight (string or number).
 * @param description - Optional secondary text for additional context.
 * @returns A styled metric card component.
 */
export const StatCard = ({title, value, description}: StatCardProps) => {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </CardContent>
        </Card>
    );
}
