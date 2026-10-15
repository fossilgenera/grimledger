import { ProjectOverview } from "../../queries/projectOverview";
import { describeRemaining } from "./describeRemaining";

interface ProjectRowProps {
    overview: ProjectOverview;
    /** A second line under the name, such as the client. Leave out when the surroundings already say it. */
    context?: string;
}

/** One project: name, optional context line, priority and tasks remaining. */
export function ProjectRow({ overview, context }: ProjectRowProps) {
    const { project, tasksRemaining } = overview;

    return (
        <li className="grimledger-row">
            <div className="grimledger-row-main">
                <span className="grimledger-row-name">{project.name}</span>
                {context !== undefined && (
                    <span className="grimledger-row-context">{context}</span>
                )}
            </div>
            <div className="grimledger-row-side">
                <span className="grimledger-priority">{project.priority}</span>
                <span className="grimledger-remaining">
                    {describeRemaining(tasksRemaining)}
                </span>
            </div>
        </li>
    );
}