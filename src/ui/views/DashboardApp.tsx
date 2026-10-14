import type { IndexStore } from "../../data/index/IndexStore";
import type { IsoDate } from "../../domain/types";
import { hasNoTasks, taskSections } from "../../queries/taskSections";
import { useIndex } from "../hooks/useIndex";
import { useToday } from "../hooks/useToday";
import { TaskSection } from "./TaskSection";

interface DashboardAppProps {
    store: IndexStore;
    today: () => IsoDate;
}

/** Placeholder for live counts. */
export function DashboardApp({ store, today }: DashboardAppProps) {
    const index = useIndex(store);
    const date = useToday(today);
    const sections = taskSections(index.tasks.items, index.projects.items, date);
    const skipped = 
        index.clients.skipped.length + 
        index.projects.skipped.length + 
        index.tasks.skipped.length;

    return (
        <div className="grimledger-dashboard">
            <h2>Grimledger</h2>
            <p className="grimledger-date">{date}</p>

            {hasNoTasks(sections) && (
                <p className="grimledger-empty">Nothing needs attention.</p>
            )}

            <TaskSection title="Overdue" rows={sections.overdue} today={date} />
            <TaskSection title="Due today" rows={sections.dueToday} today={date} />
            <TaskSection title="Blocked" rows={sections.blocked} today={date}/>
            <TaskSection title="Upcoming" rows={sections.upcoming} today={date}/>

            <p className="grimledger-footnote">
                Clients {index.clients.items.length}, projects {index.projects.items.length},
                tasks {index.tasks.items.length}, skipped notes {skipped}
            </p>
        </div>
    );
}