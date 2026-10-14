import { useEffect, useState } from "react";
import type { IsoDate } from "../../domain/types";

/** How often to check whether the date has changed, in milliseconds. */
const CHECK_INTERVAL_MS = 60_000;

/**
 * Returns today's date and keeps it current. Re-renders the component only when the date actually changes,
 * so a dashboard left open overnight rolls over to the new day.
 */
export function useToday(today: () => IsoDate): IsoDate {
    const [current, setCurrent] = useState<IsoDate>(today);

    useEffect(() => {
        // Only re-renders at midnight.
        const id = window.setInterval(() => setCurrent(today()), CHECK_INTERVAL_MS);
        return () => window.clearInterval(id);
    }, [today]);

    return current;
}