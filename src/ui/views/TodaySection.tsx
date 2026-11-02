import { formatDuration } from "../../domain/rules/duration";
import type { TodaySummary } from "../../queries/todaySummary";
import { NoteLink } from "./NoteLink";

interface TodaySectionProps {
  summary: TodaySummary;
  onOpenToday: () => void;
  onOpen: (path: string) => void;
}

/** The first dashboard section: start or open today's note, and what happened today. */
export function TodaySection({
  summary,
  onOpenToday,
  onOpen,
}: TodaySectionProps) {
  return (
    <section className="grimledger-section">
      <h3>Today</h3>
      <button type="button" className="mod-cta" onClick={onOpenToday}>
        {summary.hasDailyNote ? "Open today's note" : "Start today's note"}
      </button>

      {summary.time.length > 0 && (
        <>
          <h4 className="grimledger-subheading">
            Time logged: {formatDuration(summary.totalMinutes)}
          </h4>
          <ul className="grimledger-list">
            {summary.time.map(({ task, minutes }) => (
              <li key={task.path} className="grimledger-row">
                <div className="grimledger-row-main">
                  <NoteLink path={task.path} text={task.name} onOpen={onOpen} />
                </div>
                <div className="grimledger-row-side">
                  <span className="grimledger-due">
                    {formatDuration(minutes)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {summary.completed.length > 0 && (
        <>
          <h4 className="grimledger-subheading">
            Completed today ({summary.completed.length})
          </h4>
          <ul className="grimledger-list">
            {summary.completed.map((task) => (
              <li key={task.path} className="grimledger-row">
                <div className="grimledger-row-main">
                  <NoteLink path={task.path} text={task.name} onOpen={onOpen} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
