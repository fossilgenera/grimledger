import { IsoDate } from "../../domain/types";
import { TaskRow } from "../../queries/taskSections";
import { describeDue } from "./describeDue";

interface TaskSectionProps {
    title: string;
    rows: readonly TaskRow[];
    today: IsoDate;
}

/** One titled list of tasks. Draws nothing when there are no rows. */
export function TaskSection({ title, rows, today }: TaskSectionProps) {
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
                            <span className="grimledger-row-name">{task.name}</span>
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