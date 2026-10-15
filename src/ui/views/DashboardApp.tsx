import type { IndexStore } from "../../data/index/IndexStore";
import type { IsoDate } from "../../domain/types";
import {
  activeProjectsByClient,
  currentFocusProjects,
} from "../../queries/projectOverview";
import { hasNoTasks, taskSections } from "../../queries/taskSections";
import { useIndex } from "../hooks/useIndex";
import { useToday } from "../hooks/useToday";
import { ActiveProjectsSection } from "./ActiveProjectsSection";
import { CurrentFocusSection } from "./CurrentFocusSection";
import { TaskSection } from "./TaskSection";

interface DashboardAppProps {
  store: IndexStore;
  today: () => IsoDate;
}

/**
 * Section order (decision M4e-2): current focus, overdue, due today, blocked,
 * upcoming, active projects by client.
 * The counts at the bottom stay until the skipped-notes indicator in 4f.
 */
export function DashboardApp({ store, today }: DashboardAppProps) {
  const index = useIndex(store);
  const date = useToday(today);

  const projects = index.projects.items;
  const tasks = index.tasks.items;
  const focus = currentFocusProjects(projects, tasks);
  const groups = activeProjectsByClient(projects, tasks);
  const sections = taskSections(tasks, projects, date);
  const skipped =
    index.clients.skipped.length +
    index.projects.skipped.length +
    index.tasks.skipped.length;

  return (
    <div className="grimledger-dashboard">
      <h2>Grimledger</h2>
      <p className="grimledger-date">{date}</p>

      <CurrentFocusSection rows={focus} />

      {hasNoTasks(sections) && (
        <p className="grimledger-empty">Nothing needs attention.</p>
      )}
      <TaskSection title="Overdue" rows={sections.overdue} today={date} />
      <TaskSection title="Due today" rows={sections.dueToday} today={date} />
      <TaskSection title="Blocked" rows={sections.blocked} today={date} />
      <TaskSection title="Upcoming" rows={sections.upcoming} today={date} />

      <ActiveProjectsSection groups={groups} />

      <p className="grimledger-footnote">
        Clients {index.clients.items.length}, projects {index.projects.items.length},
        tasks {index.tasks.items.length}, skipped notes {skipped}
      </p>
    </div>
  );
}