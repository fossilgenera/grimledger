import type { IndexStore } from "../../data/index/IndexStore";
import type { IsoDate } from "../../domain/types";
import {
  activeProjectsByClient,
  currentFocusProjects,
} from "../../queries/projectOverview";
import { hasNoTasks, taskSections } from "../../queries/taskSections";
import { todaySummary } from "../../queries/todaySummary";
import { useIndex } from "../hooks/useIndex";
import { useToday } from "../hooks/useToday";
import { ActiveProjectsSection } from "./ActiveProjectsSection";
import { CurrentFocusSection } from "./CurrentFocusSection";
import { describeBlocked } from "./describeBlocked";
import { collectSkipped } from "./skippedNotes";
import { SkippedNotesList } from "./SkippedNotesList";
import { TaskSection } from "./TaskSection";
import { TodaySection } from "./TodaySection";

interface DashboardAppProps {
  store: IndexStore;
  today: () => IsoDate;
  /** Opens the note at this vault path. Supplied by the Obsidian side. */
  openNote: (path: string) => void;
  /** Creates (if needed) and opens today's daily note. */
  openToday: () => void;
}

export function DashboardApp({
  store,
  today,
  openNote,
  openToday,
}: DashboardAppProps) {
  const index = useIndex(store);
  const date = useToday(today);

  const projects = index.projects.items;
  const tasks = index.tasks.items;
  const focus = currentFocusProjects(projects, tasks);
  const groups = activeProjectsByClient(projects, tasks);
  const sections = taskSections(tasks, projects, date);
  const skipped = collectSkipped(index);
  const summary = todaySummary(
    index.dailyNotes.items,
    index.workSessions.items,
    tasks,
    date,
  );

  return (
    <div className="grimledger-dashboard">
      <h2>Grimledger</h2>
      <p className="grimledger-date">{date}</p>

      <TodaySection
        summary={summary}
        onOpenToday={openToday}
        onOpen={openNote}
      />

      <CurrentFocusSection rows={focus} onOpen={openNote} />

      {hasNoTasks(sections) && (
        <p className="grimledger-empty">Nothing needs attention.</p>
      )}
      <TaskSection
        title="Overdue"
        rows={sections.overdue}
        today={date}
        onOpen={openNote}
      />
      <TaskSection
        title="Due today"
        rows={sections.dueToday}
        today={date}
        onOpen={openNote}
      />
      <TaskSection
        title="Blocked"
        rows={sections.blocked}
        today={date}
        onOpen={openNote}
        detail={(task) => describeBlocked(task, date)}
      />
      <TaskSection
        title="Upcoming"
        rows={sections.upcoming}
        today={date}
        onOpen={openNote}
      />

      <ActiveProjectsSection groups={groups} onOpen={openNote} />

      <SkippedNotesList entries={skipped} onOpen={openNote} />
    </div>
  );
}
