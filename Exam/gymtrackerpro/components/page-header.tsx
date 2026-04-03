import React from "react";

type PageHeaderProps = {
    title: string;
    description?: string;
    children?: React.ReactNode;
}

/**
 * Renders a page header with a title, optional description, and right-aligned actions.
 *
 * @param title - Main heading text.
 * @param description - Optional supporting text displayed below the title.
 * @param children - Optional action elements rendered on the right.
 * @returns A styled page header component.
 */
export const PageHeader = ({title, description, children}: PageHeaderProps) => {
    return (
        <div className="flex items-start justify-between mb-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
            </div>
            {children && <div className="flex items-center gap-2">{children}</div>}
        </div>
    );
}