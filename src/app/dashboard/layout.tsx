import { DashboardHeader } from "./DashboardHeader";

const hairline = "border-[0.5px] border-[var(--spatialx-border)]";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-dvh min-h-0 flex-col bg-[var(--spatialx-bg)] text-[var(--spatialx-text)]">
            <header
                className={`z-50 shrink-0 border-b ${hairline} bg-[var(--spatialx-bg)]/95 backdrop-blur-sm`}
            >
                <DashboardHeader />
            </header>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
                {children}
            </div>
        </div>
    );
}
