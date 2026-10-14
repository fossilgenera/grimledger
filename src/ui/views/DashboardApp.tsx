import { IndexStore } from "../../data/index/IndexStore";
import { useIndex } from "../hooks/useIndex";

interface DashboardAppProps {
    store: IndexStore;
}

/** Placeholder for live counts. */
export function DashboardApp({ store }: DashboardAppProps) {
    const index = useIndex(store);
    const skipped = 
        index.clients.skipped.length + 
        index.projects.skipped.length + 
        index.tasks.skipped.length;

    return (
        <div className="grimledger-dashboard">
            <h2>Grimledger</h2>
            <ul>
                <li>Clients: {index.clients.items.length}</li>
                <li>Projects:  {index.projects.items.length}</li>
                <li>Tasks: {index.tasks.items.length}</li>
                <li>Skipped notes: {skipped}</li>
            </ul>
        </div>
    );
}