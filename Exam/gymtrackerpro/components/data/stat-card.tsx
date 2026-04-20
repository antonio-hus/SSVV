import {Card, CardContent} from '@/components/ui/card';

type StatCardProps = {
    title: string;
    value: string | number;
    description?: string;
}

/**
 * Displays a metric card with a label, primary value, and optional description.
 * Follows Apple-style stats presentation: small uppercase label, large value.
 *
 * @param title - Label describing the metric.
 * @param value - Main value to highlight.
 * @param description - Optional secondary text for context.
 * @returns A styled metric card.
 */
export const StatCard = ({title, value, description}: StatCardProps) => {
    return (
        <Card>
            <CardContent className="px-5 pt-5 pb-5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
                <div className="text-[28px] font-semibold tracking-tight leading-none">{value}</div>
                {description && <p className="text-xs text-muted-foreground mt-1.5">{description}</p>}
            </CardContent>
        </Card>
    );
}
