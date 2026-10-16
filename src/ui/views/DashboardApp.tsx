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
import { collectSkipped } from "./skippedNotes";
import { SkippedNotesList } from "./SkippedNotesList";
import { TaskSection } from "./TaskSection";

interface DashboardAppProps {
  store: IndexStore;
  today: () => IsoDate;
  /** Opens the note at this vault path. Supplied by the Obsidian side. */
  openNote: (path: string) => void;
}

export function DashboardApp({ store, today, openNote }: DashboardAppProps) {
  const index = useIndex(store);
  const date = useToday(today);

  const projects = index.projects.items;
  const tasks = index.tasks.items;
  const focus = currentFocusProjects(projects, tasks);
  const groups = activeProjectsByClient(projects, tasks);
  const sections = taskSections(tasks, projects, date);
  const skipped = collectSkipped(index);

  return (
    <div className="grimledger-dashboard">
      <h2>Grimledger</h2>
      <p className="grimledger-date">{date}</p>

      <CurrentFocusSection rows={focus} onOpen={openNote} />

      {hasNoTasks(sections) && (
        <p className="grimledger-empty">Nothing needs attention.</p>
      )}
      <TaskSection title="Overdue" rows={sections.overdue} today={date} onOpen={openNote} />
      <TaskSection title="Due today" rows={sections.dueToday} today={date} onOpen={openNote} />
      <TaskSection title="Blocked" rows={sections.blocked} today={date} onOpen={openNote} />
      <TaskSection title="Upcoming" rows={sections.upcoming} today={date} onOpen={openNote} />

      <ActiveProjectsSection groups={groups} onOpen={openNote} />

      <SkippedNotesList entries={skipped} onOpen={openNote} />
    </div>
  );
}