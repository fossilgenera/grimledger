import { EMPTY_INDEX, IndexSnapshot } from "./buildIndex";

export type IndexListener = (snapshot: IndexSnapshot) => void;

/** One subscription. A wrapper object so the same function can subscribe twice. */
interface Subscription {
    listener: IndexListener;
}

/** 
 * Holds the latest index snapshot and tells subscribers when it is replaced.
 * Snapshots are replaced as a whole, never edited, so anyone holding an older
 * snapshot is never affected.
 */
export class IndexStore {
    private current: IndexSnapshot = EMPTY_INDEX;
    private readonly subscriptions = new Set<Subscription>();

    get snapshot(): IndexSnapshot {
        return this.current;
    }

    /** Replaces the snapshot, then notifies every active subscriber. */
    replace(next: IndexSnapshot): void {
        this.current = next;

        let failed = false;
        let firstError: unknown;

        // Iterate a copy so listeners can subscribe or unsubscribe safely.
        for (const subscription of [...this.subscriptions]) {
            // Skip one that was unsubscribed by an earlier listener in this loop.
            if (!this.subscriptions.has(subscription)) continue;
            try {
                subscription.listener(next);
            } catch (error) {
                if (!failed) {
                    failed = true;
                    firstError = error;
                }
            }
        }

        if (failed) throw firstError;
    }

    /** Returns a function that removes this subscription. Calling it again does nothing. */
    subscribe(listener: IndexListener): () => void {
        const subscription: Subscription = { listener };
        this.subscriptions.add(subscription);
        return () => {
            this.subscriptions.delete(subscription);
        }
    }
}