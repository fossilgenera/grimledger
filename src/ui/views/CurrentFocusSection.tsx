import { ProjectOverview } from "../../queries/projectOverview";
import { ProjectRow } from "./ProjectRow";

interface CurrentFocusSectionProps {
    rows: readonly ProjectOverview[];
}

/** Projects marked as current focus. Never hidden: shows an invitation when empty. */
export function CurrentFocusSection({ rows }: CurrentFocusSectionProps) {
    return (
        <section className="grimledger-section">
            <h3>Current Focus</h3>
            {rows.length === 0 ? (
                <p className="grimledger-empty">
                    No current focus projects. Set current_focus to true in a project's properties.
                </p>    
            ) : (
                <ul className="grimledger-list">
                    {rows.map((overview) => (
                        <ProjectRow
                            key={overview.project.path}
                            overview={overview}
                            context={overview.project.client.name}
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}