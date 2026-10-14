import type { IndexStore } from "../../data/index/IndexStore";
import type { IsoDate } from "../../domain/types";
import { useIndex } from "../hooks/useIndex";
import { useToday } from "../hooks/useToday";

interface DashboardAppProps {
    store: IndexStore;
    today: () => IsoDate;
}

/** Placeholder for live counts. */
export function DashboardApp({ store, today }: DashboardAppProps) {
    const index = useIndex(store);
    const date = useToday(today);
    const skipped = 
        index.clients.skipped.length + 
        index.projects.skipped.length + 
        index.tasks.skipped.length;

    return (
        <div className="grimledger-dashboard">
            <h2>Grimledger</h2>
            <p>Today: {date}</p>
            <ul>
                <li>Clients: {index.clients.items.length}</li>
                <li>Projects:  {index.projects.items.length}</li>
                <li>Tasks: {index.tasks.items.length}</li>
                <li>Skipped notes: {skipped}</li>
            </ul>
        </div>
    );
}