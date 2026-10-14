import { useCallback, useSyncExternalStore } from "react";
import type { IndexSnapshot } from "../../data/index/buildIndex";
import type { IndexStore } from "../../data/index/IndexStore";

/**
 * Returns the current index snapshot and re-renders the component whenever the 
 * store replaces it. React unsubscribes automatically when the component unmounts.
 */
export function useIndex(store: IndexStore): IndexSnapshot {
    // Stable function - does not resubscribe on every render.
    const subscribe = useCallback(
        (onChange: () => void) => store.subscribe(onChange),
        [store],
    );
    return useSyncExternalStore(subscribe, () => store.snapshot);
}