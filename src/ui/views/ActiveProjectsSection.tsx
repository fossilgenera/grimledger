import type { ClientGroup } from "../../queries/projectOverview";
import { NoteLink } from "./NoteLink";
import { ProjectRow } from "./ProjectRow";

interface ActiveProjectsSectionProps {
    groups: readonly ClientGroup[];
    onOpen: (path: string) => void;
}

/** Active projects, one block per client. Never hidden: shows an invitation when empty. */
export function ActiveProjectsSection({ groups, onOpen }: ActiveProjectsSectionProps) {
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
                        <h4>
                            <NoteLink
                                path={group.client.path}
                                text={group.client.name}
                                onOpen={onOpen}
                            />
                        </h4>
                        <ul className="grimledger-list">
                            {group.projects.map((overview) => (
                                <ProjectRow
                                    key={overview.project.path}
                                    overview={overview}
                                    onOpen={onOpen}
                                />
                            ))}
                        </ul>
                    </div>
                ))
            )

            }
        </section>
    );
}