import type { IsoDate } from "../../domain/types";
import type { TaskRow } from "../../queries/taskSections";
import { describeDue } from "./describeDue";
import { NoteLink } from "./NoteLink";

interface TaskSectionProps {
    title: string;
    rows: readonly TaskRow[];
    today: IsoDate;
    onOpen: (path: string) => void;
}

/** One titled list of tasks. Draws nothing when there are no rows. */
export function TaskSection({ title, rows, today, onOpen }: TaskSectionProps) {
    if (rows.length == 0) return null;

    return (
        <section className="grimledger-section">
            <h3>
                {title} ({rows.length})
            </h3>
            <ul className = "grimledger-list">
                {rows.map(({ task, context }) => (
                    <li key={task.path} className="grimledger-row">
                        <div className = "grimledger-row-main">
                            <span className="grimledger-row-name">
                                <NoteLink path={task.path} text={task.name} onOpen={onOpen} />
                            </span>
                            <span className="grimledger-row-context">{context}</span>
                        </div>
                        <div className="grimldger-row-side">
                            <span className="grimledger-priority">{task.priority}</span>
                            <span className="grimledger-due">{describeDue(task.due, today)}</span>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}