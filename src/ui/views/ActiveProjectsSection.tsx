import { ClientGroup } from "../../queries/projectOverview";
import { ProjectRow } from "./ProjectRow";

interface ActiveProjectsSectionProps {
    groups: readonly ClientGroup[];
}

/** Active projects, one block per client. Never hidden: shows an invitation when empty. */
export function ActiveProjectsSection({ groups }: ActiveProjectsSectionProps) {
    return (
        <section className="grimledger-section">
            <h3>Active Projects</h3>
            {groups.length === 0 ? (
                <p className="grimledger-empty">
                    No active projects. Use the Create project command.
                </p>
            ) : (
                groups.map((group) => (
                    <div key={group.client.path} className="grimledger-client">
                        <h4>{group.client.name}</h4>
                        <ul className="grimledger-list">
                            {group.projects.map((overview) => (
                                <ProjectRow key={overview.project.path} overview={overview} />
                            ))}
                        </ul>
                    </div>
                ))
            )

            }
        </section>
    );
}